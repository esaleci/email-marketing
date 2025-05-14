"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function DirectDashboardPage() {
  const [message, setMessage] = useState("Checking login status...")
  const router = useRouter()

  useEffect(() => {
    // Check if we have a session cookie
    const hasCookie = document.cookie.includes("session_token")

    if (hasCookie) {
      setMessage("Session found! Redirecting to dashboard...")
      // Redirect to dashboard
      window.location.href = "/dashboard"
    } else {
      setMessage("No active session found. Please log in first.")
    }
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Dashboard Access</CardTitle>
          <CardDescription>Checking your login status</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-4 py-8">
          <p className="text-center">{message}</p>
        </CardContent>
        <CardFooter className="flex justify-center gap-4">
          <Button onClick={() => router.push("/demo-login")} variant="default">
            Login as Demo User
          </Button>
          <Button onClick={() => router.push("/login")} variant="outline">
            Regular Login
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
