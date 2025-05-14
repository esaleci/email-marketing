"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function DemoLoginPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("Preparing to log in...")
  const [timeoutOccurred, setTimeoutOccurred] = useState(false)
  const router = useRouter()

  useEffect(() => {
    let redirectTimer: NodeJS.Timeout
    let timeoutTimer: NodeJS.Timeout

    const loginDemo = async () => {
      try {
        setStatus("loading")
        setMessage("Logging in as demo user...")

        // Set a timeout to detect if the process hangs
        timeoutTimer = setTimeout(() => {
          setTimeoutOccurred(true)
          setMessage("Login is taking longer than expected. You can try manual redirection.")
        }, 5000)

        // Call our special demo login endpoint
        const response = await fetch("/api/demo-login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        })

        const data = await response.json()

        // Clear the timeout since we got a response
        clearTimeout(timeoutTimer)

        if (!response.ok) {
          throw new Error(data.message || "Login failed")
        }

        setStatus("success")
        setMessage("Login successful! Redirecting to dashboard...")

        // Redirect to dashboard after a short delay
        redirectTimer = setTimeout(() => {
          window.location.href = "/dashboard" // Use direct window location as a fallback
        }, 1500)
      } catch (error: any) {
        clearTimeout(timeoutTimer)
        console.error("Demo login error:", error)
        setStatus("error")
        setMessage(`Login failed: ${error.message}`)
      }
    }

    // Start the login process
    loginDemo()

    // Cleanup timers on unmount
    return () => {
      clearTimeout(redirectTimer)
      clearTimeout(timeoutTimer)
    }
  }, [])

  // Function to handle manual redirection
  const handleManualRedirect = () => {
    window.location.href = "/dashboard"
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Demo Login</CardTitle>
          <CardDescription>Automatically logging in as demo@example.com</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-4 py-8">
          <div
            className={`h-8 w-8 rounded-full border-2 border-b-transparent ${
              status === "loading" ? "animate-spin border-primary" : ""
            } ${status === "success" ? "border-green-500" : ""} ${status === "error" ? "border-red-500" : ""}`}
          />
          <p className="text-center">{message}</p>

          {status === "error" && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                There was an error logging in. Please try again or use the manual login.
              </AlertDescription>
            </Alert>
          )}

          {timeoutOccurred && (
            <Alert variant="warning" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                The login process is taking longer than expected. This might be due to network issues or server load.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex justify-center gap-4">
          {status === "error" && (
            <Button onClick={() => window.location.reload()} variant="outline">
              Try Again
            </Button>
          )}

          {(status === "success" || timeoutOccurred) && (
            <Button onClick={handleManualRedirect} variant="default">
              Go to Dashboard
            </Button>
          )}

          {(status === "error" || timeoutOccurred) && (
            <Button onClick={() => router.push("/login")} variant="outline">
              Regular Login
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
