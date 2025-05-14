import nodemailer from "nodemailer"
import { getPool } from "./db"
import { getUserSettings } from "@/app/actions/settings-actions"

// Interface for email data
interface EmailData {
  to: string
  subject: string
  html: string
  from?: string
}

// Interface for sender account
interface SenderAccount {
  id: number
  email: string
  name: string
  smtp_host: string
  smtp_port: number
  smtp_username: string
  smtp_password: string
  daily_limit: number
  daily_sent: number
}

// Get available sender account based on rotation rules
export async function getAvailableSender(userId: number): Promise<SenderAccount | null> {
  const pool = getPool()

  // Get sender with the lowest daily usage compared to its limit
  const result = await pool.query(
    `
    SELECT * FROM sender_accounts
    WHERE user_id = $1
    AND status = 'Active'
    AND daily_sent < daily_limit
    ORDER BY (daily_sent::float / daily_limit) ASC
    LIMIT 1
  `,
    [userId],
  )

  if (result.rows.length === 0) {
    return null
  }

  return result.rows[0] as SenderAccount
}

// Send an email using a specific sender account
export async function sendEmail(emailData: EmailData, sender: SenderAccount, userId: number): Promise<boolean> {
  try {
    // Create a transporter
    const transporter = nodemailer.createTransport({
      host: sender.smtp_host,
      port: sender.smtp_port,
      secure: sender.smtp_port === 465,
      auth: {
        user: sender.smtp_username,
        pass: sender.smtp_password,
      },
    })

    // Set the from address if not provided
    if (!emailData.from) {
      emailData.from = `"${sender.name}" <${sender.email}>`
    }

    // Get user settings
    const userSettings = await getUserSettings(userId)

    // Apply user settings if available
    if (userSettings) {
      // Add email signature if configured
      if (userSettings.emailSignature) {
        emailData.html = `${emailData.html}<div style="margin-top: 20px; border-top: 1px solid #eee; padding-top: 10px;">${userSettings.emailSignature}</div>`
      }

      // Add unsubscribe link if enabled in settings
      if (userSettings.addUnsubscribeLink !== false) {
        const unsubscribeFooter = `
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
            <p>This email was sent to ${emailData.to}. If you no longer wish to receive these emails, you can 
            <a href="https://example.com/unsubscribe?email=${encodeURIComponent(emailData.to)}">unsubscribe</a>.</p>
          </div>
        `
        emailData.html = `${emailData.html}${unsubscribeFooter}`
      }

      // Add GDPR compliance information if enabled
      if (userSettings.gdprCompliance) {
        const gdprFooter = `
          <div style="margin-top: 10px; font-size: 11px; color: #888;">
            <p>Your data is processed in accordance with our privacy policy. We respect your privacy and are committed to protecting your personal data.</p>
          </div>
        `
        emailData.html = `${emailData.html}${gdprFooter}`
      }
    } else {
      // Default compliance footer if no settings
      const complianceFooter = `
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
          <p>This email was sent to ${emailData.to}. If you no longer wish to receive these emails, you can 
          <a href="https://example.com/unsubscribe?email=${encodeURIComponent(emailData.to)}">unsubscribe</a>.</p>
          <p>© 2023 Your Company. All rights reserved.</p>
        </div>
      `
      emailData.html = `${emailData.html}${complianceFooter}`
    }

    // Send the email
    await transporter.sendMail(emailData)

    // Update the sender's daily sent count
    const pool = getPool()
    await pool.query(
      `
      UPDATE sender_accounts
      SET daily_sent = daily_sent + 1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `,
      [sender.id],
    )

    return true
  } catch (error) {
    console.error("Error sending email:", error)
    return false
  }
}

// Process a campaign
export async function processCampaign(campaignId: number): Promise<void> {
  const pool = getPool()

  // Get campaign details
  const campaignResult = await pool.query(
    `
    SELECT c.*, u.id as user_id
    FROM campaigns c
    JOIN users u ON c.user_id = u.id
    WHERE c.id = $1
  `,
    [campaignId],
  )

  if (campaignResult.rows.length === 0) {
    throw new Error("Campaign not found")
  }

  const campaign = campaignResult.rows[0]
  const userId = campaign.user_id

  // Get user settings
  const userSettings = await getUserSettings(userId)

  // Update campaign status to Sending
  await pool.query(
    `
    UPDATE campaigns
    SET status = 'Sending',
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
  `,
    [campaignId],
  )

  // Get template
  const templateResult = await pool.query(
    `
    SELECT * FROM templates
    WHERE id = $1
  `,
    [campaign.template_id],
  )

  if (templateResult.rows.length === 0) {
    throw new Error("Template not found")
  }

  const template = templateResult.rows[0]

  // Get recipients for this campaign that haven't been processed yet
  const recipientsResult = await pool.query(
    `
    SELECT r.*
    FROM recipients r
    LEFT JOIN campaign_recipients cr ON r.id = cr.recipient_id AND cr.campaign_id = $1
    WHERE r.user_id = $2
    AND r.status = 'Active'
    AND cr.id IS NULL
    LIMIT 100
  `,
    [campaignId, campaign.user_id],
  )

  const recipients = recipientsResult.rows

  // Check if we should respect sending schedule from settings
  let shouldSendNow = true
  if (userSettings && userSettings.sendingSchedule) {
    const now = new Date()
    const currentHour = now.getHours()
    const currentDay = now.getDay() // 0 = Sunday, 6 = Saturday

    if (userSettings.sendingSchedule === "business-hours" && (currentHour < 9 || currentHour >= 17)) {
      shouldSendNow = false
    } else if (userSettings.sendingSchedule === "weekdays" && (currentDay === 0 || currentDay === 6)) {
      shouldSendNow = false
    }
  }

  if (!shouldSendNow) {
    // Log that we're respecting sending schedule
    await pool.query(
      `
      INSERT INTO email_logs (campaign_id, status, message)
      VALUES ($1, 'Scheduled', 'Campaign processing paused due to sending schedule settings')
    `,
      [campaignId],
    )
    return
  }

  // Process each recipient
  for (const recipient of recipients) {
    // Get an available sender
    const sender = await getAvailableSender(campaign.user_id)

    if (!sender) {
      // Log that we've run out of senders
      await pool.query(
        `
        INSERT INTO email_logs (campaign_id, recipient_id, status, message)
        VALUES ($1, $2, 'Failed', 'No available sender accounts')
      `,
        [campaignId, recipient.id],
      )

      continue
    }

    // Check if this recipient has received an email in the last week
    const lastWeekResult = await pool.query(
      `
      SELECT 1
      FROM campaign_recipients cr
      WHERE cr.recipient_id = $1
      AND cr.sent_at > NOW() - INTERVAL '7 days'
      LIMIT 1
    `,
      [recipient.id],
    )

    if (lastWeekResult.rows.length > 0) {
      // Skip this recipient due to frequency cap
      await pool.query(
        `
        INSERT INTO email_logs (campaign_id, recipient_id, sender_id, status, message)
        VALUES ($1, $2, $3, 'Skipped', 'Frequency cap: already received email within 7 days')
      `,
        [campaignId, recipient.id, sender.id],
      )

      continue
    }

    // Create campaign_recipient record
    await pool.query(
      `
      INSERT INTO campaign_recipients (campaign_id, recipient_id, sender_id, status)
      VALUES ($1, $2, $3, 'Sending')
    `,
      [campaignId, recipient.id, sender.id],
    )

    // Send the email
    const emailData: EmailData = {
      to: recipient.email,
      subject: template.subject,
      html: template.content,
    }

    const success = await sendEmail(emailData, sender, userId)

    if (success) {
      // Update campaign_recipient record
      await pool.query(
        `
        UPDATE campaign_recipients
        SET status = 'Sent',
            sent_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE campaign_id = $1 AND recipient_id = $2
      `,
        [campaignId, recipient.id],
      )

      // Update recipient last_sent
      await pool.query(
        `
        UPDATE recipients
        SET last_sent = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `,
        [recipient.id],
      )

      // Update campaign sent count
      await pool.query(
        `
        UPDATE campaigns
        SET sent_count = sent_count + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `,
        [campaignId],
      )

      // Log success
      await pool.query(
        `
        INSERT INTO email_logs (campaign_id, recipient_id, sender_id, status, message)
        VALUES ($1, $2, $3, 'Sent', 'Email sent successfully')
      `,
        [campaignId, recipient.id, sender.id],
      )
    } else {
      // Update campaign_recipient record
      await pool.query(
        `
        UPDATE campaign_recipients
        SET status = 'Failed',
            updated_at = CURRENT_TIMESTAMP
        WHERE campaign_id = $1 AND recipient_id = $2
      `,
        [campaignId, recipient.id],
      )

      // Log failure
      await pool.query(
        `
        INSERT INTO email_logs (campaign_id, recipient_id, sender_id, status, message)
        VALUES ($1, $2, $3, 'Failed', 'Failed to send email')
      `,
        [campaignId, recipient.id, sender.id],
      )
    }
  }

  // Check if all recipients have been processed
  const pendingResult = await pool.query(
    `
    SELECT COUNT(*) as count
    FROM recipients r
    LEFT JOIN campaign_recipients cr ON r.id = cr.recipient_id AND cr.campaign_id = $1
    WHERE r.user_id = $2
    AND r.status = 'Active'
    AND cr.id IS NULL
  `,
    [campaignId, campaign.user_id],
  )

  const pendingCount = Number.parseInt(pendingResult.rows[0].count)

  if (pendingCount === 0) {
    // Update campaign status to Completed
    await pool.query(
      `
      UPDATE campaigns
      SET status = 'Completed',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `,
      [campaignId],
    )
  }
}
