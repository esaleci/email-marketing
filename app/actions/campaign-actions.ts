"use server"

import { executeQuery } from "@/lib/db"
import { verifySession } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function createCampaign(formData: FormData) {
  const user = await verifySession()

  if (!user) {
    return { error: "Unauthorized" }
  }

  const name = formData.get("name") as string
  const templateId = Number.parseInt(formData.get("template") as string)
  const recipientList = formData.get("recipientList") as string
  const scheduledDate = formData.get("scheduledDate") as string

  if (!name || !templateId || !recipientList) {
    return { error: "Name, template, and recipient list are required" }
  }

  try {
    // Get count of recipients
    let recipientCount = 0
    let recipientQuery = ""

    if (recipientList === "all") {
      recipientQuery = "SELECT COUNT(*) as count FROM recipients WHERE user_id = $1 AND status = $2"
      const countResult = await executeQuery(recipientQuery, [user.id, "Active"])
      recipientCount = Number.parseInt(countResult[0].count)
    } else {
      // For other recipient lists, you could implement more complex filtering
      recipientQuery = "SELECT COUNT(*) as count FROM recipients WHERE user_id = $1 AND status = $2"
      const countResult = await executeQuery(recipientQuery, [user.id, "Active"])
      recipientCount = Number.parseInt(countResult[0].count)
    }

    // Create campaign
    const result = await executeQuery(
      `INSERT INTO campaigns 
       (user_id, name, template_id, status, scheduled_date, total_recipients)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [
        user.id,
        name,
        templateId,
        scheduledDate ? "Scheduled" : "Draft",
        scheduledDate ? new Date(scheduledDate) : null,
        recipientCount,
      ],
    )

    const campaignId = result[0].id

    revalidatePath("/dashboard/campaigns")

    return { success: true, campaignId }
  } catch (error) {
    console.error("Error creating campaign:", error)
    return { error: "An error occurred while creating the campaign" }
  }
}

export async function getCampaigns() {
  const user = await verifySession()

  if (!user) {
    return { error: "Unauthorized" }
  }

  try {
    const campaigns = await executeQuery(
      `SELECT c.*, t.name as template_name
       FROM campaigns c
       LEFT JOIN templates t ON c.template_id = t.id
       WHERE c.user_id = $1
       ORDER BY c.created_at DESC`,
      [user.id],
    )

    return { campaigns }
  } catch (error) {
    console.error("Error fetching campaigns:", error)
    return { error: "An error occurred while fetching campaigns" }
  }
}

export async function getCampaignById(id: number) {
  const user = await verifySession()

  if (!user) {
    return { error: "Unauthorized" }
  }

  try {
    const result = await executeQuery(
      `SELECT c.*, t.name as template_name, t.subject as template_subject
       FROM campaigns c
       LEFT JOIN templates t ON c.template_id = t.id
       WHERE c.id = $1 AND c.user_id = $2`,
      [id, user.id],
    )

    if (result.length === 0) {
      return { error: "Campaign not found" }
    }

    return { campaign: result[0] }
  } catch (error) {
    console.error("Error fetching campaign:", error)
    return { error: "An error occurred while fetching the campaign" }
  }
}

export async function startCampaign(id: number) {
  const user = await verifySession()

  if (!user) {
    return { error: "Unauthorized" }
  }

  try {
    // Check if campaign exists and belongs to user
    const campaignResult = await executeQuery(`SELECT * FROM campaigns WHERE id = $1 AND user_id = $2`, [id, user.id])

    if (campaignResult.length === 0) {
      return { error: "Campaign not found" }
    }

    const campaign = campaignResult[0]

    // Check if campaign can be started
    if (campaign.status !== "Draft" && campaign.status !== "Scheduled") {
      return { error: "Campaign cannot be started" }
    }

    // Update campaign status
    await executeQuery(
      `UPDATE campaigns
       SET status = 'Sending', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [id],
    )

    revalidatePath("/dashboard/campaigns")
    revalidatePath(`/dashboard/campaigns/${id}`)

    return { success: true }
  } catch (error) {
    console.error("Error starting campaign:", error)
    return { error: "An error occurred while starting the campaign" }
  }
}

export async function pauseCampaign(id: number) {
  const user = await verifySession()

  if (!user) {
    return { error: "Unauthorized" }
  }

  try {
    // Check if campaign exists and belongs to user
    const campaignResult = await executeQuery(`SELECT * FROM campaigns WHERE id = $1 AND user_id = $2`, [id, user.id])

    if (campaignResult.length === 0) {
      return { error: "Campaign not found" }
    }

    const campaign = campaignResult[0]

    // Check if campaign can be paused
    if (campaign.status !== "Sending") {
      return { error: "Campaign cannot be paused" }
    }

    // Update campaign status
    await executeQuery(
      `UPDATE campaigns
       SET status = 'Paused', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [id],
    )

    revalidatePath("/dashboard/campaigns")
    revalidatePath(`/dashboard/campaigns/${id}`)

    return { success: true }
  } catch (error) {
    console.error("Error pausing campaign:", error)
    return { error: "An error occurred while pausing the campaign" }
  }
}

export async function getTemplates() {
  const user = await verifySession()

  if (!user) {
    return { error: "Unauthorized" }
  }

  try {
    const templates = await executeQuery(
      `SELECT * FROM templates
         WHERE user_id = $1
         ORDER BY created_at DESC`,
      [user.id],
    )

    return { templates }
  } catch (error) {
    console.error("Error fetching templates:", error)
    return { error: "An error occurred while fetching templates" }
  }
}
