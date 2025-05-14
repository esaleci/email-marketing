"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Progress } from "@/components/ui/progress"
import { addSenderAccount, getSenderAccounts, updateSenderStatus } from "@/app/actions/sender-actions"

export default function SendersPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [senders, setSenders] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadSenderAccounts()
  }, [])

  async function loadSenderAccounts() {
    setIsLoading(true)
    const result = await getSenderAccounts()

    if ("error" in result) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    } else {
      setSenders(result.senders)
    }

    setIsLoading(false)
  }

  async function handleSubmit(formData: FormData) {
    try {
      const result = await addSenderAccount(formData)

      if ("error" in result) {
        toast({
          title: "Failed to add sender",
          description: result.error,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Sender added",
          description: "The sender account has been added successfully.",
        })

        setIsDialogOpen(false)
        loadSenderAccounts()
      }
    } catch (error) {
      toast({
        title: "Failed to add sender",
        description: "There was a problem adding the sender.",
        variant: "destructive",
      })
    }
  }

  async function handleStatusChange(id: number, status: string) {
    try {
      const result = await updateSenderStatus(id, status)

      if ("error" in result) {
        toast({
          title: "Failed to update status",
          description: result.error,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Status updated",
          description: "The sender status has been updated successfully.",
        })

        loadSenderAccounts()
      }
    } catch (error) {
      toast({
        title: "Failed to update status",
        description: "There was a problem updating the status.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Sender Accounts</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Add Sender</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form action={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Add Sender Account</DialogTitle>
                <DialogDescription>Add a new email sender account to your rotation pool.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">
                    Email
                  </Label>
                  <Input id="email" name="email" type="email" className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input id="name" name="name" className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="dailyLimit" className="text-right">
                    Daily Limit
                  </Label>
                  <Input
                    id="dailyLimit"
                    name="dailyLimit"
                    type="number"
                    defaultValue="100"
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="smtpHost" className="text-right">
                    SMTP Host
                  </Label>
                  <Input id="smtpHost" name="smtpHost" className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="smtpPort" className="text-right">
                    SMTP Port
                  </Label>
                  <Input
                    id="smtpPort"
                    name="smtpPort"
                    type="number"
                    defaultValue="587"
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="smtpUsername" className="text-right">
                    SMTP Username
                  </Label>
                  <Input id="smtpUsername" name="smtpUsername" className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="smtpPassword" className="text-right">
                    SMTP Password
                  </Label>
                  <Input id="smtpPassword" name="smtpPassword" type="password" className="col-span-3" required />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Add Sender</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sender Accounts</CardTitle>
          <CardDescription>Manage your sender accounts and their daily limits</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <p>Loading sender accounts...</p>
            </div>
          ) : senders.length === 0 ? (
            <div className="flex justify-center py-8">
              <p>No sender accounts found. Add a sender account to get started.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Daily Usage</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {senders.map((sender) => (
                    <TableRow key={sender.id}>
                      <TableCell className="font-medium">{sender.email}</TableCell>
                      <TableCell>{sender.name}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between text-xs">
                            <span>
                              {sender.daily_sent} / {sender.daily_limit}
                            </span>
                            <span>{Math.round((sender.daily_sent / sender.daily_limit) * 100)}%</span>
                          </div>
                          <Progress value={(sender.daily_sent / sender.daily_limit) * 100} className="h-2" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            sender.status === "Active"
                              ? "bg-green-100 text-green-800"
                              : sender.status === "Inactive"
                                ? "bg-gray-100 text-gray-800"
                                : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {sender.status}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                        {sender.status === "Active" ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500"
                            onClick={() => handleStatusChange(sender.id, "Inactive")}
                          >
                            Disable
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-green-500"
                            onClick={() => handleStatusChange(sender.id, "Active")}
                          >
                            Enable
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
