"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { getCampaignById, startCampaign, pauseCampaign } from "@/app/actions/campaign-actions"
import { Progress } from "@/components/ui/progress"

export default function CampaignDetailsPage({ params }: { params: { id: string } }) {
  const [campaign, setCampaign] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const campaignId = Number.parseInt(params.id)

  useEffect(() => {
    loadCampaign()
  }, [])

  async function loadCampaign() {
    setIsLoading(true)
    const result = await getCampaignById(campaignId)

    if ("error" in result) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
      router.push("/dashboard/campaigns")
    } else {
      setCampaign(result.campaign)
    }

    setIsLoading(false)
  }

  async function handleStartCampaign() {
    setIsProcessing(true)

    try {
      const result = await startCampaign(campaignId)

      if ("error" in result) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Campaign started",
          description: "The campaign has been started successfully.",
        })

        loadCampaign()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while starting the campaign.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  async function handlePauseCampaign() {
    setIsProcessing(true)

    try {
      const result = await pauseCampaign(campaignId)

      if ("error" in result) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Campaign paused",
          description: "The campaign has been paused successfully.",
        })

        loadCampaign()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while pausing the campaign.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
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

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Campaign Details</h2>
        </div>
        <div className="flex justify-center py-8">
          <p>Loading campaign...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Campaign Details</h2>
        <Button variant="outline" onClick={() => router.push("/dashboard/campaigns")}>
          Back to Campaigns
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{campaign.name}</CardTitle>
              <CardDescription>Template: {campaign.template_name}</CardDescription>
            </div>
            <div>{getStatusBadge(campaign.status)}</div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Campaign Details</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-muted-foreground">Status:</div>
                <div>{campaign.status}</div>
                <div className="text-muted-foreground">Template:</div>
                <div>{campaign.template_name}</div>
                <div className="text-muted-foreground">Subject:</div>
                <div>{campaign.template_subject}</div>
                <div className="text-muted-foreground">Scheduled Date:</div>
                <div>
                  {campaign.scheduled_date ? new Date(campaign.scheduled_date).toLocaleString() : "Not scheduled"}
                </div>
                <div className="text-muted-foreground">Created:</div>
                <div>{new Date(campaign.created_at).toLocaleString()}</div>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Campaign Statistics</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-muted-foreground">Total Recipients:</div>
                <div>{campaign.total_recipients.toLocaleString()}</div>
                <div className="text-muted-foreground">Emails Sent:</div>
                <div>{campaign.sent_count.toLocaleString()}</div>
                <div className="text-muted-foreground">Emails Opened:</div>
                <div>{campaign.opened_count.toLocaleString()}</div>
                <div className="text-muted-foreground">Links Clicked:</div>
                <div>{campaign.clicked_count.toLocaleString()}</div>
                <div className="text-muted-foreground">Open Rate:</div>
                <div>
                  {campaign.sent_count > 0
                    ? `${((campaign.opened_count / campaign.sent_count) * 100).toFixed(2)}%`
                    : "0%"}
                </div>
                <div className="text-muted-foreground">Click Rate:</div>
                <div>
                  {campaign.opened_count > 0
                    ? `${((campaign.clicked_count / campaign.opened_count) * 100).toFixed(2)}%`
                    : "0%"}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Sending Progress</h3>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>
                  {campaign.sent_count} / {campaign.total_recipients} emails sent
                </span>
                <span>
                  {campaign.total_recipients > 0
                    ? `${Math.round((campaign.sent_count / campaign.total_recipients) * 100)}%`
                    : "0%"}
                </span>
              </div>
              <Progress
                value={campaign.total_recipients > 0 ? (campaign.sent_count / campaign.total_recipients) * 100 : 0}
                className="h-2"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div>
            {campaign.status === "Draft" && (
              <Button variant="outline" asChild>
                <a href={`/dashboard/campaigns/${campaign.id}/edit`}>Edit Campaign</a>
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {(campaign.status === "Draft" || campaign.status === "Scheduled") && (
              <Button onClick={handleStartCampaign} disabled={isProcessing}>
                {isProcessing ? "Processing..." : "Start Campaign"}
              </Button>
            )}
            {campaign.status === "Sending" && (
              <Button onClick={handlePauseCampaign} disabled={isProcessing}>
                {isProcessing ? "Processing..." : "Pause Campaign"}
              </Button>
            )}
            {campaign.status === "Paused" && (
              <Button onClick={handleStartCampaign} disabled={isProcessing}>
                {isProcessing ? "Processing..." : "Resume Campaign"}
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
