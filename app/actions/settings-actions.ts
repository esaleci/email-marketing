"use server"

import { executeQuery } from "@/lib/db"
import { verifySession } from "@/lib/auth"
import { revalidatePath } from "next/cache"

// Define the settings interface
interface UserSettings {
  theme?: string
  defaultSenderName?: string
  defaultSenderEmail?: string
  emailSignature?: string
  dailySendingLimit?: string
  addUnsubscribeLink?: boolean
  gdprCompliance?: boolean
  emailTrackingEnabled?: boolean
  linkTrackingEnabled?: boolean
  sendingSchedule?: string
}

export async function getUserSettings(userId?: number) {
  // If userId is not provided, get it from the session
  if (!userId) {
    const user = await verifySession()
    if (!user) {
      return null
    }
    userId = user.id
  }

  try {
    // Check if settings exist for this user
    const result = await executeQuery(`SELECT * FROM user_settings WHERE user_id = $1`, [userId])

    if (result.length === 0) {
      // Return default settings if none exist
      return {
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
      }
    }

    // Parse JSON settings
    const settings = result[0].settings
    return settings
  } catch (error) {
    console.error("Error fetching user settings:", error)
    return null
  }
}

export async function updateUserSettings(formData: FormData) {
  const user = await verifySession()

  if (!user) {
    return { error: "Unauthorized" }
  }

  try {
    // Create settings object from form data
    const settings: UserSettings = {
      theme: formData.get("theme") as string,
      defaultSenderName: formData.get("defaultSenderName") as string,
      defaultSenderEmail: formData.get("defaultSenderEmail") as string,
      emailSignature: formData.get("emailSignature") as string,
      dailySendingLimit: formData.get("dailySendingLimit") as string,
      addUnsubscribeLink: formData.get("addUnsubscribeLink") === "on" || formData.get("addUnsubscribeLink") === "true",
      gdprCompliance: formData.get("gdprCompliance") === "on" || formData.get("gdprCompliance") === "true",
      emailTrackingEnabled:
        formData.get("emailTrackingEnabled") === "on" || formData.get("emailTrackingEnabled") === "true",
      linkTrackingEnabled:
        formData.get("linkTrackingEnabled") === "on" || formData.get("linkTrackingEnabled") === "true",
      sendingSchedule: formData.get("sendingSchedule") as string,
    }

    // Check if settings exist for this user
    const checkResult = await executeQuery(`SELECT 1 FROM user_settings WHERE user_id = $1`, [user.id])

    if (checkResult.length === 0) {
      // Insert new settings
      await executeQuery(`INSERT INTO user_settings (user_id, settings) VALUES ($1, $2)`, [user.id, settings])
    } else {
      // Update existing settings
      await executeQuery(`UPDATE user_settings SET settings = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2`, [
        settings,
        user.id,
      ])
    }

    revalidatePath("/dashboard/settings")

    return { success: true }
  } catch (error) {
    console.error("Error updating user settings:", error)
    return { error: "An error occurred while updating settings" }
  }
}
