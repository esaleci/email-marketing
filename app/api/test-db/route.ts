import { NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"

export async function GET() {
  try {
    // Test database connection
    const result = await executeQuery("SELECT 1 as test")

    // Test user retrieval
    const users = await executeQuery("SELECT id, email, name FROM users LIMIT 5")

    return NextResponse.json({
      status: "success",
      dbTest: result,
      users: users.map((user) => ({ id: user.id, email: user.email, name: user.name })),
    })
  } catch (error: any) {
    console.error("Database test failed:", error)
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
