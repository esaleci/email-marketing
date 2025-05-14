import { hash, compare } from "bcrypt"
import { executeQuery } from "./db"
import { cookies } from "next/headers"
import { SignJWT, jwtVerify } from "jose"
import { nanoid } from "nanoid"

// Secret key for JWT
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "fallback_secret_key_for_development_only")

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 10)
}

export async function comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
  try {
    console.log("Comparing password with hash...")
    // Log the first few characters of the hash for debugging
    console.log("Hash prefix:", hashedPassword.substring(0, 10) + "...")

    if (!password || !hashedPassword) {
      console.error("Missing password or hash:", {
        passwordProvided: !!password,
        hashProvided: !!hashedPassword,
      })
      return false
    }

    const result = await compare(password, hashedPassword)
    console.log("Password comparison result:", result)
    return result
  } catch (error) {
    console.error("Password comparison error:", error)
    return false // Return false instead of throwing to prevent crashes
  }
}

// Update the createUser function
export async function createUser(name: string, email: string, password: string) {
  const hashedPassword = await hashPassword(password)

  try {
    const result = await executeQuery(
      "INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id",
      [name, email, hashedPassword],
    )

    return result[0]
  } catch (error: any) {
    if (error.message.includes("duplicate key")) {
      throw new Error("Email already exists")
    }
    throw error
  }
}

// Update the getUserByEmail function
export async function getUserByEmail(email: string) {
  try {
    console.log("Getting user by email:", email)
    const result = await executeQuery("SELECT * FROM users WHERE email = $1", [email])
    console.log("User found:", !!result[0])
    return result[0] || null
  } catch (error) {
    console.error("Error getting user by email:", error)
    throw error
  }
}

// Update the getUserById function
export async function getUserById(id: number) {
  try {
    const result = await executeQuery("SELECT id, name, email, created_at FROM users WHERE id = $1", [id])
    return result[0] || null
  } catch (error) {
    console.error("Error getting user by ID:", error)
    return null
  }
}

// Create a session token
export async function createSession(userId: number) {
  try {
    console.log("Creating session for user ID:", userId)
    const token = await new SignJWT({ userId })
      .setProtectedHeader({ alg: "HS256" })
      .setJti(nanoid())
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(JWT_SECRET)

    cookies().set("session_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    })

    console.log("Session created successfully")
    return token
  } catch (error) {
    console.error("Error creating session:", error)
    throw error
  }
}

// Verify session token
export async function verifySession() {
  try {
    const token = cookies().get("session_token")?.value

    if (!token) {
      return null
    }

    const { payload } = await jwtVerify(token, JWT_SECRET)
    const user = await getUserById(payload.userId as number)
    return user
  } catch (error) {
    console.error("Session verification error:", error)
    return null
  }
}

// Clear session
export function clearSession() {
  cookies().delete("session_token")
}
