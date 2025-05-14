"use server"

import { executeQuery } from "@/lib/db"
import { verifySession } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function createTemplate(formData: FormData) {
  const user = await verifySession()

  if (!user) {
    return { error: "Unauthorized" }
  }

  const name = formData.get("name") as string
  const subject = formData.get("subject") as string
  const content = formData.get("content") as string

  if (!name || !subject || !content) {
    return { error: "All fields are required" }
  }

  try {
    await executeQuery(
      `INSERT INTO templates (user_id, name, subject, content)
       VALUES ($1, $2, $3, $4)`,
      [user.id, name, subject, content],
    )

    revalidatePath("/dashboard/templates")

    return { success: true }
  } catch (error) {
    console.error("Error creating template:", error)
    return { error: "An error occurred while creating the template" }
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

export async function getTemplateById(id: number) {
  const user = await verifySession()

  if (!user) {
    return { error: "Unauthorized" }
  }

  try {
    const result = await executeQuery(
      `SELECT * FROM templates
       WHERE id = $1 AND user_id = $2`,
      [id, user.id],
    )

    if (result.length === 0) {
      return { error: "Template not found" }
    }

    return { template: result[0] }
  } catch (error) {
    console.error("Error fetching template:", error)
    return { error: "An error occurred while fetching the template" }
  }
}

export async function updateTemplate(id: number, formData: FormData) {
  const user = await verifySession()

  if (!user) {
    return { error: "Unauthorized" }
  }

  const name = formData.get("name") as string
  const subject = formData.get("subject") as string
  const content = formData.get("content") as string

  if (!name || !subject || !content) {
    return { error: "All fields are required" }
  }

  try {
    const result = await executeQuery(
      `UPDATE templates
       SET name = $1, subject = $2, content = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 AND user_id = $5
       RETURNING *`,
      [name, subject, content, id, user.id],
    )

    if (result.length === 0) {
      return { error: "Template not found" }
    }

    revalidatePath("/dashboard/templates")

    return { success: true, template: result[0] }
  } catch (error) {
    console.error("Error updating template:", error)
    return { error: "An error occurred while updating the template" }
  }
}
