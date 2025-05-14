"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/hooks/use-toast"
import { updateUserSettings, getUserSettings } from "@/app/actions/settings-actions"
import { Moon, Sun, Monitor, Mail, Shield, Fingerprint, Clock, Palette } from "lucide-react"

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [settings, setSettings] = useState({
    theme: "system",
    defaultSenderName: "",
    defaultSenderEmail: "",
    emailSignature: "",
    dailySendingLimit: "500",
    addUnsubscribeLink: true,
    gdprCompliance: true,
    emailTrackingEnabled: true,
    linkTrackingEnabled: true,
    sendingSchedule: "anytime",
  })
  const { toast } = useToast()

  useEffect(() => {
    loadSettings()
  }, [])

  useEffect(() => {
    if (theme) {
      setSettings((prev) => ({ ...prev, theme }))
    }
  }, [theme])

  async function loadSettings() {
    setIsLoading(true)
    try {
      const userSettings = await getUserSettings()
      if (userSettings) {
        setSettings((prev) => ({ ...prev, ...userSettings }))
        // Apply the saved theme
        if (userSettings.theme) {
          setTheme(userSettings.theme)
        }
      }
    } catch (error) {
      console.error("Error loading settings:", error)
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSubmit(formData: FormData) {
    setIsSaving(true)
    try {
      const result = await updateUserSettings(formData)

      if ("error" in result) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Settings saved",
          description: "Your settings have been updated successfully",
        })

        // Apply the theme if it was changed
        const newTheme = formData.get("theme") as string
        if (newTheme && newTheme !== theme) {
          setTheme(newTheme)
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while saving settings",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setSettings((prev) => ({ ...prev, [name]: value }))
  }

  const handleSwitchChange = (name: string, checked: boolean) => {
    setSettings((prev) => ({ ...prev, [name]: checked }))
  }

  const handleRadioChange = (name: string, value: string) => {
    setSettings((prev) => ({ ...prev, [name]: value }))
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        </div>
        <div className="flex justify-center py-8">
          <p>Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
      </div>

      <Tabs defaultValue="appearance" className="space-y-4">
        <TabsList className="grid grid-cols-3 md:grid-cols-5">
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette size={16} />
            <span className="hidden md:inline">Appearance</span>
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail size={16} />
            <span className="hidden md:inline">Email</span>
          </TabsTrigger>
          <TabsTrigger value="compliance" className="flex items-center gap-2">
            <Shield size={16} />
            <span className="hidden md:inline">Compliance</span>
          </TabsTrigger>
          <TabsTrigger value="tracking" className="flex items-center gap-2">
            <Fingerprint size={16} />
            <span className="hidden md:inline">Tracking</span>
          </TabsTrigger>
          <TabsTrigger value="scheduling" className="flex items-center gap-2">
            <Clock size={16} />
            <span className="hidden md:inline">Scheduling</span>
          </TabsTrigger>
        </TabsList>

        <form action={handleSubmit}>
          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize the appearance of your dashboard</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex flex-col items-center gap-2">
                      <div
                        className={`flex h-16 w-16 items-center justify-center rounded-md border-2 ${
                          settings.theme === "light" ? "border-primary" : "border-muted"
                        } bg-background p-2 hover:border-primary`}
                        onClick={() => handleRadioChange("theme", "light")}
                      >
                        <Sun className="h-8 w-8" />
                        <input
                          type="radio"
                          name="theme"
                          value="light"
                          checked={settings.theme === "light"}
                          onChange={() => {}}
                          className="sr-only"
                        />
                      </div>
                      <span className="text-sm">Light</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <div
                        className={`flex h-16 w-16 items-center justify-center rounded-md border-2 ${
                          settings.theme === "dark" ? "border-primary" : "border-muted"
                        } bg-background p-2 hover:border-primary`}
                        onClick={() => handleRadioChange("theme", "dark")}
                      >
                        <Moon className="h-8 w-8" />
                        <input
                          type="radio"
                          name="theme"
                          value="dark"
                          checked={settings.theme === "dark"}
                          onChange={() => {}}
                          className="sr-only"
                        />
                      </div>
                      <span className="text-sm">Dark</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <div
                        className={`flex h-16 w-16 items-center justify-center rounded-md border-2 ${
                          settings.theme === "system" ? "border-primary" : "border-muted"
                        } bg-background p-2 hover:border-primary`}
                        onClick={() => handleRadioChange("theme", "system")}
                      >
                        <Monitor className="h-8 w-8" />
                        <input
                          type="radio"
                          name="theme"
                          value="system"
                          checked={settings.theme === "system"}
                          onChange={() => {}}
                          className="sr-only"
                        />
                      </div>
                      <span className="text-sm">System</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email">
            <Card>
              <CardHeader>
                <CardTitle>Email Settings</CardTitle>
                <CardDescription>Configure your default email settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="defaultSenderName">Default Sender Name</Label>
                  <Input
                    id="defaultSenderName"
                    name="defaultSenderName"
                    value={settings.defaultSenderName}
                    onChange={handleInputChange}
                    placeholder="Your Name or Company Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultSenderEmail">Default Sender Email</Label>
                  <Input
                    id="defaultSenderEmail"
                    name="defaultSenderEmail"
                    type="email"
                    value={settings.defaultSenderEmail}
                    onChange={handleInputChange}
                    placeholder="email@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emailSignature">Email Signature</Label>
                  <Textarea
                    id="emailSignature"
                    name="emailSignature"
                    value={settings.emailSignature}
                    onChange={handleInputChange}
                    placeholder="Your email signature"
                    className="min-h-[100px]"
                  />
                  <p className="text-sm text-muted-foreground">
                    This signature will be automatically added to all your emails.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dailySendingLimit">Daily Sending Limit</Label>
                  <Input
                    id="dailySendingLimit"
                    name="dailySendingLimit"
                    type="number"
                    value={settings.dailySendingLimit}
                    onChange={handleInputChange}
                    min="1"
                    max="10000"
                  />
                  <p className="text-sm text-muted-foreground">
                    Maximum number of emails to send per day across all campaigns.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="compliance">
            <Card>
              <CardHeader>
                <CardTitle>Compliance Settings</CardTitle>
                <CardDescription>Configure settings to ensure email compliance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between space-x-2">
                  <div className="space-y-0.5">
                    <Label htmlFor="addUnsubscribeLink">Add Unsubscribe Link</Label>
                    <p className="text-sm text-muted-foreground">Automatically add an unsubscribe link to all emails</p>
                  </div>
                  <Switch
                    id="addUnsubscribeLink"
                    name="addUnsubscribeLink"
                    checked={settings.addUnsubscribeLink}
                    onCheckedChange={(checked) => handleSwitchChange("addUnsubscribeLink", checked)}
                  />
                </div>
                <div className="flex items-center justify-between space-x-2">
                  <div className="space-y-0.5">
                    <Label htmlFor="gdprCompliance">GDPR Compliance</Label>
                    <p className="text-sm text-muted-foreground">Include GDPR compliance information in emails</p>
                  </div>
                  <Switch
                    id="gdprCompliance"
                    name="gdprCompliance"
                    checked={settings.gdprCompliance}
                    onCheckedChange={(checked) => handleSwitchChange("gdprCompliance", checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tracking">
            <Card>
              <CardHeader>
                <CardTitle>Tracking Settings</CardTitle>
                <CardDescription>Configure email tracking options</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between space-x-2">
                  <div className="space-y-0.5">
                    <Label htmlFor="emailTrackingEnabled">Email Open Tracking</Label>
                    <p className="text-sm text-muted-foreground">Track when recipients open your emails</p>
                  </div>
                  <Switch
                    id="emailTrackingEnabled"
                    name="emailTrackingEnabled"
                    checked={settings.emailTrackingEnabled}
                    onCheckedChange={(checked) => handleSwitchChange("emailTrackingEnabled", checked)}
                  />
                </div>
                <div className="flex items-center justify-between space-x-2">
                  <div className="space-y-0.5">
                    <Label htmlFor="linkTrackingEnabled">Link Click Tracking</Label>
                    <p className="text-sm text-muted-foreground">Track when recipients click links in your emails</p>
                  </div>
                  <Switch
                    id="linkTrackingEnabled"
                    name="linkTrackingEnabled"
                    checked={settings.linkTrackingEnabled}
                    onCheckedChange={(checked) => handleSwitchChange("linkTrackingEnabled", checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scheduling">
            <Card>
              <CardHeader>
                <CardTitle>Scheduling Settings</CardTitle>
                <CardDescription>Configure when emails are sent</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Default Sending Schedule</Label>
                  <RadioGroup
                    value={settings.sendingSchedule}
                    onValueChange={(value) => handleRadioChange("sendingSchedule", value)}
                    name="sendingSchedule"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="anytime" id="anytime" />
                      <Label htmlFor="anytime">Send emails anytime</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="business-hours" id="business-hours" />
                      <Label htmlFor="business-hours">Send only during business hours (9 AM - 5 PM)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="weekdays" id="weekdays" />
                      <Label htmlFor="weekdays">Send only on weekdays</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="optimal" id="optimal" />
                      <Label htmlFor="optimal">Use optimal timing based on recipient activity</Label>
                    </div>
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <div className="mt-4 flex justify-end">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </form>
      </Tabs>
    </div>
  )
}
