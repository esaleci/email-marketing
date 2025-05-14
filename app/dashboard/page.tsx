"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Overview } from "@/components/dashboard/overview"
import { RecentEmails } from "@/components/dashboard/recent-emails"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { CalendarIcon, Download, Filter, RefreshCw } from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { getReportData, getSenderAccounts } from "@/app/actions/report-actions"

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalSent: 0,
    openRate: 0,
    clickRate: 0,
    activeSenders: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [startDate, setStartDate] = useState<Date | undefined>(new Date(new Date().setDate(new Date().getDate() - 30)))
  const [endDate, setEndDate] = useState<Date | undefined>(new Date())
  const [senderEmail, setSenderEmail] = useState<string>("all")
  const [reportType, setReportType] = useState<string>("overview")
  const [isReportLoading, setIsReportLoading] = useState(false)
  const [senders, setSenders] = useState<any[]>([])
  const [reportData, setReportData] = useState<any>({
    overview: [],
    openRates: [],
    clickRates: [],
    deliveryStatus: [],
    openRatesPie: [],
    clickRatesPie: [],
    deliveryPie: [],
    summary: {
      totalSent: 0,
      openRate: 0,
      clickRate: 0,
      bounceRate: 0,
    },
  })
  const { toast } = useToast()

  // Colors for charts
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"]

  useEffect(() => {
    loadDashboardStats()
    loadSenders()
    loadReportData()
  }, [])

  async function loadDashboardStats() {
    setIsLoading(true)

    try {
      // In a real app, this would be an API call to get dashboard stats
      // For demo purposes, we'll use mock data
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setStats({
        totalSent: 45231,
        openRate: 24.8,
        clickRate: 12.5,
        activeSenders: 87,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load dashboard statistics",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function loadSenders() {
    try {
      const result = await getSenderAccounts()
      if ("error" in result) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      } else {
        setSenders(result.senders || [])
      }
    } catch (error) {
      console.error("Error loading senders:", error)
      toast({
        title: "Error",
        description: "Failed to load sender accounts",
        variant: "destructive",
      })
    }
  }

  async function loadReportData() {
    setIsReportLoading(true)
    try {
      const data = await getReportData({
        startDate: startDate?.toISOString() || "",
        endDate: endDate?.toISOString() || "",
        senderEmail,
        reportType,
      })

      if ("error" in data) {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        })
      } else {
        setReportData(data)
      }
    } catch (error) {
      console.error("Error loading report data:", error)
      toast({
        title: "Error",
        description: "Failed to load report data",
        variant: "destructive",
      })
    } finally {
      setIsReportLoading(false)
    }
  }

  function handleApplyFilters() {
    loadReportData()
  }

  function handleExportCSV() {
    // Implementation for exporting data as CSV
    const csvData = []

    // Add headers based on report type
    if (reportType === "overview") {
      csvData.push(["Month", "Emails Sent", "Emails Opened", "Links Clicked"])
      reportData.overview.forEach((item: any) => {
        csvData.push([item.name, item.sent, item.opened, item.clicked])
      })
    } else if (reportType === "openRates") {
      csvData.push(["Week", "Open Rate (%)"])
      reportData.openRates.forEach((item: any) => {
        csvData.push([item.date, item.rate])
      })
    } else if (reportType === "clickRates") {
      csvData.push(["Week", "Click Rate (%)"])
      reportData.clickRates.forEach((item: any) => {
        csvData.push([item.date, item.rate])
      })
    } else if (reportType === "deliveryStatus") {
      csvData.push(["Campaign", "Delivered (%)", "Bounced (%)"])
      reportData.deliveryStatus.forEach((item: any) => {
        csvData.push([item.name, item.delivered, item.bounced])
      })
    }

    // Convert to CSV string
    const csvString = csvData.map((row) => row.join(",")).join("\n")

    // Create download link
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `${reportType}-report.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Export Complete",
      description: "Your report has been downloaded as a CSV file",
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Emails Sent</CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground"
                >
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalSent.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">+20.1% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.openRate}%</div>
                <p className="text-xs text-muted-foreground">+1.2% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground"
                >
                  <rect width="20" height="14" x="2" y="5" rx="2" />
                  <path d="M2 10h20" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.clickRate}%</div>
                <p className="text-xs text-muted-foreground">+2.1% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Senders</CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground"
                >
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeSenders}</div>
                <p className="text-xs text-muted-foreground">+5 from last month</p>
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Overview</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <Overview />
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Recent Emails</CardTitle>
                <CardDescription>Last 10 emails sent from your account</CardDescription>
              </CardHeader>
              <CardContent>
                <RecentEmails />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analytics</CardTitle>
              <CardDescription>Detailed analytics for your email campaigns</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] flex items-center justify-center">
              <p className="text-muted-foreground">Analytics content will appear here</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="reports" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">Reports & Analytics</h2>
            <Button onClick={handleExportCSV} className="flex items-center gap-2">
              <Download size={16} />
              Export CSV
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Report Filters</CardTitle>
              <CardDescription>Filter your report data by date range and sender</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 md:flex-row">
                <div className="flex flex-col gap-2 md:w-1/4">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !startDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex flex-col gap-2 md:w-1/4">
                  <Label htmlFor="endDate">End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !endDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex flex-col gap-2 md:w-1/4">
                  <Label htmlFor="senderEmail">Sender Email</Label>
                  <Select value={senderEmail} onValueChange={setSenderEmail}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a sender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Senders</SelectItem>
                      {senders.map((sender) => (
                        <SelectItem key={sender.id} value={sender.email}>
                          {sender.name} ({sender.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end md:w-1/4">
                  <Button
                    onClick={handleApplyFilters}
                    className="w-full flex items-center gap-2"
                    disabled={isReportLoading}
                  >
                    {isReportLoading ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <Filter size={16} />
                        Apply Filters
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="overview" value={reportType} onValueChange={setReportType} className="space-y-4">
            <TabsList className="grid grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="openRates">Open Rates</TabsTrigger>
              <TabsTrigger value="clickRates">Click Rates</TabsTrigger>
              <TabsTrigger value="deliveryStatus">Delivery Status</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <Card>
                <CardHeader>
                  <CardTitle>Campaign Performance Overview</CardTitle>
                  <CardDescription>Summary of all email campaigns in the selected period</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardDescription>Total Sent</CardDescription>
                        <CardTitle className="text-3xl">{reportData.summary.totalSent.toLocaleString()}</CardTitle>
                      </CardHeader>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardDescription>Open Rate</CardDescription>
                        <CardTitle className="text-3xl">{reportData.summary.openRate}%</CardTitle>
                      </CardHeader>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardDescription>Click Rate</CardDescription>
                        <CardTitle className="text-3xl">{reportData.summary.clickRate}%</CardTitle>
                      </CardHeader>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardDescription>Bounce Rate</CardDescription>
                        <CardTitle className="text-3xl">{reportData.summary.bounceRate}%</CardTitle>
                      </CardHeader>
                    </Card>
                  </div>

                  <div className="mt-6 h-[400px]">
                    {reportData.overview.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={reportData.overview} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="sent" fill="#8884d8" name="Emails Sent" />
                          <Bar dataKey="opened" fill="#82ca9d" name="Emails Opened" />
                          <Bar dataKey="clicked" fill="#ffc658" name="Links Clicked" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <p className="text-muted-foreground">No data available for the selected period</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="openRates">
              <Card>
                <CardHeader>
                  <CardTitle>Email Open Rates</CardTitle>
                  <CardDescription>Open rates over time and by campaign</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="h-[400px]">
                      {reportData.openRates.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={reportData.openRates} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip formatter={(value) => [`${value}%`, "Open Rate"]} />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="rate"
                              stroke="#8884d8"
                              name="Open Rate %"
                              activeDot={{ r: 8 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <p className="text-muted-foreground">No data available for the selected period</p>
                        </div>
                      )}
                    </div>
                    <div className="h-[400px]">
                      {reportData.openRatesPie.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={reportData.openRatesPie}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                              outerRadius={150}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {reportData.openRatesPie.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => [`${value}%`, "Percentage"]} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <p className="text-muted-foreground">No data available for the selected period</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="clickRates">
              <Card>
                <CardHeader>
                  <CardTitle>Link Click Rates</CardTitle>
                  <CardDescription>Click rates over time and by campaign</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="h-[400px]">
                      {reportData.clickRates.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={reportData.clickRates} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip formatter={(value) => [`${value}%`, "Click Rate"]} />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="rate"
                              stroke="#82ca9d"
                              name="Click Rate %"
                              activeDot={{ r: 8 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <p className="text-muted-foreground">No data available for the selected period</p>
                        </div>
                      )}
                    </div>
                    <div className="h-[400px]">
                      {reportData.clickRatesPie.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={reportData.clickRatesPie}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                              outerRadius={150}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {reportData.clickRatesPie.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => [`${value}%`, "Percentage"]} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <p className="text-muted-foreground">No data available for the selected period</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="deliveryStatus">
              <Card>
                <CardHeader>
                  <CardTitle>Email Delivery Status</CardTitle>
                  <CardDescription>Breakdown of email delivery status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="h-[400px]">
                      {reportData.deliveryPie.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={reportData.deliveryPie}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                              outerRadius={150}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {reportData.deliveryPie.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => [`${value}%`, "Percentage"]} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <p className="text-muted-foreground">No data available for the selected period</p>
                        </div>
                      )}
                    </div>
                    <div className="h-[400px]">
                      {reportData.deliveryStatus.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={reportData.deliveryStatus}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            layout="vertical"
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" domain={[0, 100]} />
                            <YAxis dataKey="name" type="category" />
                            <Tooltip formatter={(value) => [`${value}%`, "Percentage"]} />
                            <Legend />
                            <Bar dataKey="delivered" stackId="a" fill="#82ca9d" name="Delivered %" />
                            <Bar dataKey="bounced" stackId="a" fill="#ff8042" name="Bounced %" />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <p className="text-muted-foreground">No data available for the selected period</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  )
}
