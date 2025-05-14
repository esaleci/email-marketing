"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { createCampaign, getCampaigns } from "@/app/actions/campaign-actions"
import { getTemplates as fetchTemplates } from "@/app/actions/template-actions"
import { useRouter } from "next/navigation"

export default function CampaignsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [templates, setTemplates] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    loadCampaigns()
    loadTemplates()
  }, [])

  async function loadCampaigns() {
    setIsLoading(true)
    const result = await getCampaigns()

    if ("error" in result) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    } else {
      setCampaigns(result.campaigns)
    }

    setIsLoading(false)
  }

  async function loadTemplates() {
    const result = await fetchTemplates()

    if ("error" in result) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    } else {
      setTemplates(result.templates)
    }
  }

  async function handleSubmit(formData: FormData) {
    setIsCreating(true)

    try {
      const result = await createCampaign(formData)

      if ("error" in result) {
        toast({
          title: "Failed to create campaign",
          description: result.error,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Campaign created",
          description: "The campaign has been created successfully.",
        })

        setIsDialogOpen(false)
        loadCampaigns()

        // Redirect to campaign details
        router.push(`/dashboard/campaigns/${result.campaignId}`)
      }
    } catch (error) {
      toast({
        title: "Failed to create campaign",
        description: "There was a problem creating the campaign.",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Scheduled":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Scheduled
          </Badge>
        )
      case "Sending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            Sending
          </Badge>
        )
      case "Active":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Active
          </Badge>
        )
      case "Completed":
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            Completed
          </Badge>
        )
      case "Draft":
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            Draft
          </Badge>
        )
      case "Paused":
        return (
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
            Paused
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Email Campaigns</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Create Campaign</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form action={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Create Email Campaign</DialogTitle>
                <DialogDescription>Set up a new email campaign to send to your recipients.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Campaign Name
                  </Label>
                  <Input id="name" name="name" className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="template" className="text-right">
                    Email Template
                  </Label>
                  <Select name="template" required>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select a template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id.toString()}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="recipientList" className="text-right">
                    Recipient List
                  </Label>
                  <Select name="recipientList" defaultValue="all">
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select a recipient list" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Subscribers</SelectItem>
                      <SelectItem value="active">Active Users</SelectItem>
                      <SelectItem value="new">New Subscribers</SelectItem>
                      <SelectItem value="inactive">Inactive Users</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="scheduledDate" className="text-right">
                    Schedule Date
                  </Label>
                  <Input id="scheduledDate" name="scheduledDate" type="datetime-local" className="col-span-3" />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? "Creating..." : "Create Campaign"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Campaigns</CardTitle>
          <CardDescription>View and manage your email campaigns</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <p>Loading campaigns...</p>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="flex justify-center py-8">
              <p>No campaigns found. Create a campaign to get started.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign Name</TableHead>
                    <TableHead>Template</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Recipients</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead>Opened</TableHead>
                    <TableHead>Clicked</TableHead>
                    <TableHead>Scheduled Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((campaign) => (
                    <TableRow key={campaign.id}>
                      <TableCell className="font-medium">{campaign.name}</TableCell>
                      <TableCell>{campaign.template_name}</TableCell>
                      <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                      <TableCell>{campaign.total_recipients.toLocaleString()}</TableCell>
                      <TableCell>{campaign.sent_count.toLocaleString()}</TableCell>
                      <TableCell>{campaign.opened_count.toLocaleString()}</TableCell>
                      <TableCell>{campaign.clicked_count.toLocaleString()}</TableCell>
                      <TableCell>
                        {campaign.scheduled_date ? new Date(campaign.scheduled_date).toLocaleString() : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <a href={`/dashboard/campaigns/${campaign.id}`}>View</a>
                        </Button>
                        {campaign.status === "Draft" && (
                          <Button variant="ghost" size="sm" asChild>
                            <a href={`/dashboard/campaigns/${campaign.id}/edit`}>Edit</a>
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
