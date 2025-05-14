import { NextResponse } from "next/server"
import { getUserByEmail, comparePasswords } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        {
          status: "error",
          message: "Email and password are required",
        },
        { status: 400 },
      )
    }

    // Get user
    const user = await getUserByEmail(email)

    if (!user) {
      return NextResponse.json(
        {
          status: "error",
          message: "User not found",
          debug: { email },
        },
        { status: 404 },
      )
    }

    // Check password
    const isPasswordValid = await comparePasswords(password, user.password_hash)

    return NextResponse.json({
      status: "success",
      userExists: true,
      passwordValid: isPasswordValid,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    })
  } catch (error: any) {
    console.error("Login test failed:", error)
    return NextResponse.json(
      {
        status: "error",
        message: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
