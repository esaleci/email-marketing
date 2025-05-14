import { NextResponse } from "next/server"
import { getUserByEmail, comparePasswords, createSession } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    console.log("API login attempt:", { email })

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Email and password are required",
        },
        { status: 400 },
      )
    }

    // Get user
    const user = await getUserByEmail(email)

    if (!user) {
      console.log("API: User not found:", email)
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password",
        },
        { status: 401 },
      )
    }

    // Check password
    const isPasswordValid = await comparePasswords(password, user.password_hash)

    if (!isPasswordValid) {
      console.log("API: Invalid password for user:", email)
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password",
        },
        { status: 401 },
      )
    }

    // Create session
    await createSession(user.id)

    console.log("API: Login successful for user:", email)
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    })
  } catch (error: any) {
    console.error("API login error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "An error occurred during login",
        error: error.message,
      },
      { status: 500 },
    )
  }
}
