import { NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"
import { createSession } from "@/lib/auth"
import { cookies } from "next/headers"

export async function POST() {
  try {
    console.log("Demo login attempt")

    // 1. First, verify the demo user exists
    const userResult = await executeQuery("SELECT * FROM users WHERE email = $1", ["demo@example.com"])

    if (userResult.length === 0) {
      console.log("Demo user not found, creating it")

      try {
        // Create the demo user if it doesn't exist
        // Using a pre-hashed password for "password123" with bcryptjs
        await executeQuery("INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id", [
          "Demo User",
          "demo@example.com",
          "$2a$10$JqHARRrwm3pwGLc.I9sCi.5gGbGYXxI1XYpFUHBYpKGFOXlX9VR0q", // Hashed "password123"
        ])

        console.log("Demo user created successfully")
      } catch (createError) {
        console.error("Error creating demo user:", createError)
        return NextResponse.json(
          {
            success: false,
            message: "Failed to create demo user",
            error: createError instanceof Error ? createError.message : "Unknown error",
          },
          { status: 500 },
        )
      }

      // Get the newly created user
      const newUserResult = await executeQuery("SELECT * FROM users WHERE email = $1", ["demo@example.com"])

      if (newUserResult.length === 0) {
        throw new Error("Failed to create demo user")
      }

      // Create session for the new user
      await createSession(newUserResult[0].id)

      console.log("Demo user created and logged in")
      return NextResponse.json({ success: true, message: "Demo user created and logged in" })
    }

    // 2. Create a session for the existing demo user
    const user = userResult[0]

    try {
      // Create a JWT token
      const token = await createSession(user.id)

      // Set the cookie directly as a fallback
      cookies().set("session_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
      })

      console.log("Demo user logged in successfully")
      return NextResponse.json({
        success: true,
        message: "Demo user logged in successfully",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      })
    } catch (sessionError) {
      console.error("Error creating session:", sessionError)
      return NextResponse.json(
        {
          success: false,
          message: "Failed to create session",
          error: sessionError instanceof Error ? sessionError.message : "Unknown error",
        },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error("Demo login error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "An error occurred during demo login",
        error: error.message,
      },
      { status: 500 },
    )
  }
}
