"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { createTemplate, getTemplates } from "@/app/actions/template-actions"

export default function TemplatesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [templates, setTemplates] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadTemplates()
  }, [])

  async function loadTemplates() {
    setIsLoading(true)
    const result = await getTemplates()

    if ("error" in result) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    } else {
      setTemplates(result.templates)
    }

    setIsLoading(false)
  }

  async function handleSubmit(formData: FormData) {
    try {
      const result = await createTemplate(formData)

      if ("error" in result) {
        toast({
          title: "Failed to create template",
          description: result.error,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Template created",
          description: "The email template has been created successfully.",
        })

        setIsDialogOpen(false)
        loadTemplates()
      }
    } catch (error) {
      toast({
        title: "Failed to create template",
        description: "There was a problem creating the template.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Email Templates</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Create Template</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <form action={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Create Email Template</DialogTitle>
                <DialogDescription>Create a new email template for your campaigns.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Template Name
                  </Label>
                  <Input id="name" name="name" className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="subject" className="text-right">
                    Email Subject
                  </Label>
                  <Input id="subject" name="subject" className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="content" className="text-right pt-2">
                    Email Content
                  </Label>
                  <Textarea
                    id="content"
                    name="content"
                    className="col-span-3 min-h-[200px]"
                    placeholder="Enter your email content here. You can use HTML for formatting."
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Create Template</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Templates</TabsTrigger>
          <TabsTrigger value="recent">Recently Used</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <p>Loading templates...</p>
            </div>
          ) : templates.length === 0 ? (
            <div className="flex justify-center py-8">
              <p>No templates found. Create a template to get started.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {templates.map((template) => (
                <Card key={template.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription className="line-clamp-1">Subject: {template.subject}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="text-xs text-muted-foreground">
                      Last modified: {new Date(template.updated_at).toLocaleDateString()}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between pt-2">
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/dashboard/templates/${template.id}`}>Edit</a>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/dashboard/templates/${template.id}/preview`}>Preview</a>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <p>Loading templates...</p>
            </div>
          ) : templates.length === 0 ? (
            <div className="flex justify-center py-8">
              <p>No templates found. Create a template to get started.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {templates.slice(0, 3).map((template) => (
                <Card key={template.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription className="line-clamp-1">Subject: {template.subject}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="text-xs text-muted-foreground">
                      Last modified: {new Date(template.updated_at).toLocaleDateString()}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between pt-2">
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/dashboard/templates/${template.id}`}>Edit</a>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/dashboard/templates/${template.id}/preview`}>Preview</a>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
