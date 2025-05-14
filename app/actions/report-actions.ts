"use server"
import { executeQuery } from "@/lib/db"
import { verifySession } from "@/lib/auth"

interface ReportFilters {
  startDate: string
  endDate: string
  senderEmail: string
  reportType: string
}

export async function getReportData(filters: ReportFilters) {
  const user = await verifySession()

  if (!user) {
    return { error: "Unauthorized" }
  }

  try {
    // Convert dates to proper format if they exist
    const startDate = filters.startDate
      ? new Date(filters.startDate)
      : new Date(new Date().setDate(new Date().getDate() - 30))

    const endDate = filters.endDate ? new Date(filters.endDate) : new Date()

    // Add one day to end date to include the entire end date in the range
    const adjustedEndDate = new Date(endDate)
    adjustedEndDate.setDate(adjustedEndDate.getDate() + 1)

    console.log("Date range:", {
      startDate: startDate.toISOString(),
      endDate: adjustedEndDate.toISOString(),
      senderEmail: filters.senderEmail,
    })

    // Get summary metrics
    let summaryQuery = `
      SELECT 
        COUNT(cr.id) as total_sent,
        ROUND(SUM(CASE WHEN cr.opened_at IS NOT NULL THEN 1 ELSE 0 END)::numeric / NULLIF(COUNT(cr.id), 0) * 100, 1) as open_rate,
        ROUND(SUM(CASE WHEN cr.clicked_at IS NOT NULL THEN 1 ELSE 0 END)::numeric / NULLIF(COUNT(cr.id), 0) * 100, 1) as click_rate,
        ROUND(SUM(CASE WHEN cr.status = 'Bounced' THEN 1 ELSE 0 END)::numeric / NULLIF(COUNT(cr.id), 0) * 100, 1) as bounce_rate
      FROM campaign_recipients cr
      JOIN campaigns c ON cr.campaign_id = c.id
      LEFT JOIN sender_accounts sa ON cr.sender_id = sa.id
      WHERE c.user_id = $1
    `

    const summaryParams = [user.id]
    let paramIndex = 2

    // Add date filters
    summaryQuery += ` AND cr.sent_at >= $${paramIndex}`
    summaryParams.push(startDate)
    paramIndex++

    summaryQuery += ` AND cr.sent_at < $${paramIndex}`
    summaryParams.push(adjustedEndDate)
    paramIndex++

    // Add sender filter if specified
    if (filters.senderEmail !== "all") {
      summaryQuery += ` AND sa.email = $${paramIndex}`
      summaryParams.push(filters.senderEmail)
      paramIndex++
    }

    console.log("Summary query:", summaryQuery)
    console.log("Summary params:", summaryParams)

    const summaryResult = await executeQuery(summaryQuery, summaryParams)
    console.log("Summary result:", summaryResult)

    const summary =
      summaryResult.length > 0
        ? summaryResult[0]
        : {
            total_sent: 0,
            open_rate: 0,
            click_rate: 0,
            bounce_rate: 0,
          }

    // Get overview data (monthly breakdown)
    let overviewQuery = `
      SELECT 
        TO_CHAR(DATE_TRUNC('month', cr.sent_at), 'Mon') as name,
        COUNT(cr.id) as sent,
        SUM(CASE WHEN cr.opened_at IS NOT NULL THEN 1 ELSE 0 END) as opened,
        SUM(CASE WHEN cr.clicked_at IS NOT NULL THEN 1 ELSE 0 END) as clicked
      FROM campaign_recipients cr
      JOIN campaigns c ON cr.campaign_id = c.id
      LEFT JOIN sender_accounts sa ON cr.sender_id = sa.id
      WHERE c.user_id = $1
    `

    const overviewParams = [user.id]
    paramIndex = 2

    // Add date filters
    overviewQuery += ` AND cr.sent_at >= $${paramIndex}`
    overviewParams.push(startDate)
    paramIndex++

    overviewQuery += ` AND cr.sent_at < $${paramIndex}`
    overviewParams.push(adjustedEndDate)
    paramIndex++

    // Add sender filter if specified
    if (filters.senderEmail !== "all") {
      overviewQuery += ` AND sa.email = $${paramIndex}`
      overviewParams.push(filters.senderEmail)
      paramIndex++
    }

    overviewQuery += ` GROUP BY DATE_TRUNC('month', cr.sent_at) ORDER BY DATE_TRUNC('month', cr.sent_at)`

    console.log("Overview query:", overviewQuery)
    console.log("Overview params:", overviewParams)

    const overviewResult = await executeQuery(overviewQuery, overviewParams)
    console.log("Overview result:", overviewResult)

    // Get open rates data (weekly breakdown)
    let openRatesQuery = `
      SELECT 
        TO_CHAR(DATE_TRUNC('week', cr.sent_at), 'MM/DD') as date,
        ROUND(SUM(CASE WHEN cr.opened_at IS NOT NULL THEN 1 ELSE 0 END)::numeric / NULLIF(COUNT(cr.id), 0) * 100, 1) as rate
      FROM campaign_recipients cr
      JOIN campaigns c ON cr.campaign_id = c.id
      LEFT JOIN sender_accounts sa ON cr.sender_id = sa.id
      WHERE c.user_id = $1
    `

    const openRatesParams = [user.id]
    paramIndex = 2

    // Add date filters
    openRatesQuery += ` AND cr.sent_at >= $${paramIndex}`
    openRatesParams.push(startDate)
    paramIndex++

    openRatesQuery += ` AND cr.sent_at < $${paramIndex}`
    openRatesParams.push(adjustedEndDate)
    paramIndex++

    // Add sender filter if specified
    if (filters.senderEmail !== "all") {
      openRatesQuery += ` AND sa.email = $${paramIndex}`
      openRatesParams.push(filters.senderEmail)
      paramIndex++
    }

    openRatesQuery += ` GROUP BY DATE_TRUNC('week', cr.sent_at) ORDER BY DATE_TRUNC('week', cr.sent_at)`

    const openRatesResult = await executeQuery(openRatesQuery, openRatesParams)

    // Get click rates data (weekly breakdown)
    let clickRatesQuery = `
      SELECT 
        TO_CHAR(DATE_TRUNC('week', cr.sent_at), 'MM/DD') as date,
        ROUND(SUM(CASE WHEN cr.clicked_at IS NOT NULL THEN 1 ELSE 0 END)::numeric / NULLIF(COUNT(cr.id), 0) * 100, 1) as rate
      FROM campaign_recipients cr
      JOIN campaigns c ON cr.campaign_id = c.id
      LEFT JOIN sender_accounts sa ON cr.sender_id = sa.id
      WHERE c.user_id = $1
    `

    const clickRatesParams = [user.id]
    paramIndex = 2

    // Add date filters
    clickRatesQuery += ` AND cr.sent_at >= $${paramIndex}`
    clickRatesParams.push(startDate)
    paramIndex++

    clickRatesQuery += ` AND cr.sent_at < $${paramIndex}`
    clickRatesParams.push(adjustedEndDate)
    paramIndex++

    // Add sender filter if specified
    if (filters.senderEmail !== "all") {
      clickRatesQuery += ` AND sa.email = $${paramIndex}`
      clickRatesParams.push(filters.senderEmail)
      paramIndex++
    }

    clickRatesQuery += ` GROUP BY DATE_TRUNC('week', cr.sent_at) ORDER BY DATE_TRUNC('week', cr.sent_at)`

    const clickRatesResult = await executeQuery(clickRatesQuery, clickRatesParams)

    // Get delivery status by campaign
    let deliveryStatusQuery = `
      SELECT 
        c.name,
        ROUND(SUM(CASE WHEN cr.status = 'Sent' OR cr.status = 'Opened' OR cr.status = 'Clicked' THEN 1 ELSE 0 END)::numeric / NULLIF(COUNT(cr.id), 0) * 100, 1) as delivered,
        ROUND(SUM(CASE WHEN cr.status = 'Bounced' THEN 1 ELSE 0 END)::numeric / NULLIF(COUNT(cr.id), 0) * 100, 1) as bounced
      FROM campaign_recipients cr
      JOIN campaigns c ON cr.campaign_id = c.id
      LEFT JOIN sender_accounts sa ON cr.sender_id = sa.id
      WHERE c.user_id = $1
    `

    const deliveryStatusParams = [user.id]
    paramIndex = 2

    // Add date filters
    deliveryStatusQuery += ` AND cr.sent_at >= $${paramIndex}`
    deliveryStatusParams.push(startDate)
    paramIndex++

    deliveryStatusQuery += ` AND cr.sent_at < $${paramIndex}`
    deliveryStatusParams.push(adjustedEndDate)
    paramIndex++

    // Add sender filter if specified
    if (filters.senderEmail !== "all") {
      deliveryStatusQuery += ` AND sa.email = $${paramIndex}`
      deliveryStatusParams.push(filters.senderEmail)
      paramIndex++
    }

    deliveryStatusQuery += ` GROUP BY c.id, c.name ORDER BY c.name`

    const deliveryStatusResult = await executeQuery(deliveryStatusQuery, deliveryStatusParams)

    // Get pie chart data for open rates
    let openRatesPieQuery = `
      SELECT 
        'Opened' as name,
        ROUND(SUM(CASE WHEN cr.opened_at IS NOT NULL THEN 1 ELSE 0 END)::numeric / NULLIF(COUNT(cr.id), 0) * 100, 1) as value
      FROM campaign_recipients cr
      JOIN campaigns c ON cr.campaign_id = c.id
      LEFT JOIN sender_accounts sa ON cr.sender_id = sa.id
      WHERE c.user_id = $1
    `

    const openRatesPieParams = [user.id]
    paramIndex = 2

    // Add date filters
    openRatesPieQuery += ` AND cr.sent_at >= $${paramIndex}`
    openRatesPieParams.push(startDate)
    paramIndex++

    openRatesPieQuery += ` AND cr.sent_at < $${paramIndex}`
    openRatesPieParams.push(adjustedEndDate)
    paramIndex++

    // Add sender filter if specified
    if (filters.senderEmail !== "all") {
      openRatesPieQuery += ` AND sa.email = $${paramIndex}`
      openRatesPieParams.push(filters.senderEmail)
      paramIndex++
    }

    const openRatesPieResult = await executeQuery(openRatesPieQuery, openRatesPieParams)

    let openRatesPieData = []
    if (openRatesPieResult.length > 0) {
      const openedValue = openRatesPieResult[0].value || 0
      openRatesPieData = [
        { name: "Opened", value: openedValue },
        { name: "Not Opened", value: 100 - openedValue },
      ]
    } else {
      openRatesPieData = [
        { name: "Opened", value: 0 },
        { name: "Not Opened", value: 100 },
      ]
    }

    // Get pie chart data for click rates
    let clickRatesPieQuery = `
      SELECT 
        SUM(CASE WHEN cr.clicked_at IS NOT NULL THEN 1 ELSE 0 END) as clicked,
        SUM(CASE WHEN cr.opened_at IS NOT NULL AND cr.clicked_at IS NULL THEN 1 ELSE 0 END) as opened_not_clicked,
        SUM(CASE WHEN cr.opened_at IS NULL THEN 1 ELSE 0 END) as not_opened,
        COUNT(cr.id) as total
      FROM campaign_recipients cr
      JOIN campaigns c ON cr.campaign_id = c.id
      LEFT JOIN sender_accounts sa ON cr.sender_id = sa.id
      WHERE c.user_id = $1
    `

    const clickRatesPieParams = [user.id]
    paramIndex = 2

    // Add date filters
    clickRatesPieQuery += ` AND cr.sent_at >= $${paramIndex}`
    clickRatesPieParams.push(startDate)
    paramIndex++

    clickRatesPieQuery += ` AND cr.sent_at < $${paramIndex}`
    clickRatesPieParams.push(adjustedEndDate)
    paramIndex++

    // Add sender filter if specified
    if (filters.senderEmail !== "all") {
      clickRatesPieQuery += ` AND sa.email = $${paramIndex}`
      clickRatesPieParams.push(filters.senderEmail)
      paramIndex++
    }

    const clickRatesPieResult = await executeQuery(clickRatesPieQuery, clickRatesPieParams)

    let clickRatesPieData = []
    if (clickRatesPieResult.length > 0 && clickRatesPieResult[0].total > 0) {
      const total = Number.parseFloat(clickRatesPieResult[0].total) || 0
      const clicked = Number.parseFloat(clickRatesPieResult[0].clicked) || 0
      const openedNotClicked = Number.parseFloat(clickRatesPieResult[0].opened_not_clicked) || 0
      const notOpened = Number.parseFloat(clickRatesPieResult[0].not_opened) || 0

      clickRatesPieData = [
        { name: "Clicked", value: Number.parseFloat(((clicked / total) * 100).toFixed(1)) },
        { name: "Opened but not clicked", value: Number.parseFloat(((openedNotClicked / total) * 100).toFixed(1)) },
        { name: "Not opened", value: Number.parseFloat(((notOpened / total) * 100).toFixed(1)) },
      ]
    } else {
      clickRatesPieData = [
        { name: "Clicked", value: 0 },
        { name: "Opened but not clicked", value: 0 },
        { name: "Not opened", value: 100 },
      ]
    }

    // Get pie chart data for delivery status
    let deliveryPieQuery = `
      SELECT 
        SUM(CASE WHEN cr.status = 'Bounced' THEN 1 ELSE 0 END) as bounced,
        COUNT(cr.id) as total
      FROM campaign_recipients cr
      JOIN campaigns c ON cr.campaign_id = c.id
      LEFT JOIN sender_accounts sa ON cr.sender_id = sa.id
      WHERE c.user_id = $1
    `

    const deliveryPieParams = [user.id]
    paramIndex = 2

    // Add date filters
    deliveryPieQuery += ` AND cr.sent_at >= $${paramIndex}`
    deliveryPieParams.push(startDate)
    paramIndex++

    deliveryPieQuery += ` AND cr.sent_at < $${paramIndex}`
    deliveryPieParams.push(adjustedEndDate)
    paramIndex++

    // Add sender filter if specified
    if (filters.senderEmail !== "all") {
      deliveryPieQuery += ` AND sa.email = $${paramIndex}`
      deliveryPieParams.push(filters.senderEmail)
      paramIndex++
    }

    const deliveryPieResult = await executeQuery(deliveryPieQuery, deliveryPieParams)

    let deliveryPieData = []
    if (deliveryPieResult.length > 0 && deliveryPieResult[0].total > 0) {
      const total = Number.parseFloat(deliveryPieResult[0].total) || 0
      const bounced = Number.parseFloat(deliveryPieResult[0].bounced) || 0
      const delivered = total - bounced

      deliveryPieData = [
        { name: "Delivered", value: Number.parseFloat(((delivered / total) * 100).toFixed(1)) },
        { name: "Bounced", value: Number.parseFloat(((bounced / total) * 100).toFixed(1)) },
      ]
    } else {
      deliveryPieData = [
        { name: "Delivered", value: 100 },
        { name: "Bounced", value: 0 },
      ]
    }

    // Return all the data
    return {
      overview: overviewResult,
      openRates: openRatesResult,
      clickRates: clickRatesResult,
      deliveryStatus: deliveryStatusResult,
      openRatesPie: openRatesPieData,
      clickRatesPie: clickRatesPieData,
      deliveryPie: deliveryPieData,
      summary: {
        totalSent: Number.parseInt(summary.total_sent) || 0,
        openRate: Number.parseFloat(summary.open_rate) || 0,
        clickRate: Number.parseFloat(summary.click_rate) || 0,
        bounceRate: Number.parseFloat(summary.bounce_rate) || 0,
      },
    }
  } catch (error) {
    console.error("Error fetching report data:", error)
    return { error: "An error occurred while fetching report data" }
  }
}

// Get all sender accounts for the filter dropdown
export async function getSenderAccounts() {
  const user = await verifySession()

  if (!user) {
    return { error: "Unauthorized" }
  }

  try {
    const query = `
      SELECT id, email, name
      FROM sender_accounts
      WHERE user_id = $1
      ORDER BY name
    `

    const result = await executeQuery(query, [user.id])
    return { senders: result }
  } catch (error) {
    console.error("Error fetching sender accounts:", error)
    return { error: "An error occurred while fetching sender accounts" }
  }
}
