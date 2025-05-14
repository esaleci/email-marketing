"use server"

import { executeQuery } from "@/lib/db"
import { verifySession } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function addSenderAccount(formData: FormData) {
  const user = await verifySession()

  if (!user) {
    return { error: "Unauthorized" }
  }

  const email = formData.get("email") as string
  const name = formData.get("name") as string
  const dailyLimit = Number.parseInt(formData.get("dailyLimit") as string)
  const smtpHost = formData.get("smtpHost") as string
  const smtpPort = Number.parseInt(formData.get("smtpPort") as string)
  const smtpUsername = formData.get("smtpUsername") as string
  const smtpPassword = formData.get("smtpPassword") as string

  if (!email || !name || !dailyLimit || !smtpHost || !smtpPort || !smtpUsername || !smtpPassword) {
    return { error: "All fields are required" }
  }

  try {
    await executeQuery(
      `INSERT INTO sender_accounts 
       (user_id, email, name, daily_limit, smtp_host, smtp_port, smtp_username, smtp_password)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [user.id, email, name, dailyLimit, smtpHost, smtpPort, smtpUsername, smtpPassword],
    )

    revalidatePath("/dashboard/senders")

    return { success: true }
  } catch (error) {
    console.error("Error adding sender account:", error)
    return { error: "An error occurred while adding the sender account" }
  }
}

export async function getSenderAccounts() {
  const user = await verifySession()

  if (!user) {
    return { error: "Unauthorized" }
  }

  try {
    const senders = await executeQuery(
      `SELECT * FROM sender_accounts
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [user.id],
    )

    return { senders }
  } catch (error) {
    console.error("Error fetching sender accounts:", error)
    return { error: "An error occurred while fetching sender accounts" }
  }
}

export async function updateSenderStatus(id: number, status: string) {
  const user = await verifySession()

  if (!user) {
    return { error: "Unauthorized" }
  }

  try {
    await executeQuery(
      `UPDATE sender_accounts
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND user_id = $3`,
      [status, id, user.id],
    )

    revalidatePath("/dashboard/senders")

    return { success: true }
  } catch (error) {
    console.error("Error updating sender status:", error)
    return { error: "An error occurred while updating the sender status" }
  }
}
