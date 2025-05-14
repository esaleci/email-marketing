"use server"

import { executeQuery } from "@/lib/db"
import { verifySession } from "@/lib/auth"
import Papa from "papaparse"
import { revalidatePath } from "next/cache"

export async function importRecipients(formData: FormData) {
  const user = await verifySession()

  if (!user) {
    return { error: "Unauthorized" }
  }

  const file = formData.get("file") as File

  if (!file) {
    return { error: "No file provided" }
  }

  try {
    const text = await file.text()

    const { data, errors } = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
    })

    if (errors.length > 0) {
      return { error: "Error parsing CSV file" }
    }

    if (data.length === 0) {
      return { error: "No data found in CSV file" }
    }

    // Validate required fields
    for (const row of data) {
      if (!row.email) {
        return { error: "Email is required for all recipients" }
      }
    }

    // Insert recipients
    let inserted = 0
    let skipped = 0

    for (const row of data) {
      try {
        await executeQuery(
          `INSERT INTO recipients (user_id, email, name, company, phone, status)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (user_id, email) DO UPDATE
           SET name = EXCLUDED.name,
               company = EXCLUDED.company,
               phone = EXCLUDED.phone,
               updated_at = CURRENT_TIMESTAMP`,
          [user.id, row.email, row.name || null, row.company || null, row.phone || null, "Active"],
        )
        inserted++
      } catch (error) {
        console.error("Error inserting recipient:", error)
        skipped++
      }
    }

    revalidatePath("/dashboard/recipients")

    return {
      success: true,
      message: `Imported ${inserted} recipients. Skipped ${skipped} recipients.`,
    }
  } catch (error) {
    console.error("Error importing recipients:", error)
    return { error: "An error occurred while importing recipients" }
  }
}

export async function getRecipients(page = 1, limit = 10) {
  const user = await verifySession()

  if (!user) {
    return { error: "Unauthorized" }
  }

  try {
    const offset = (page - 1) * limit

    const recipients = await executeQuery(
      `SELECT * FROM recipients
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [user.id, limit, offset],
    )

    const countResult = await executeQuery(`SELECT COUNT(*) as total FROM recipients WHERE user_id = $1`, [user.id])

    const total = Number.parseInt(countResult[0].total)

    return {
      recipients,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit,
      },
    }
  } catch (error) {
    console.error("Error fetching recipients:", error)
    return { error: "An error occurred while fetching recipients" }
  }
}
