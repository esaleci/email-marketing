"use server"

import { getUserByEmail, comparePasswords, createSession, clearSession } from "@/lib/auth"
import { createUser } from "@/lib/auth"
import { redirect } from "next/navigation"

export async function login(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  console.log("Login attempt:", { email }) // Log login attempt

  if (!email || !password) {
    console.log("Missing email or password")
    return { error: "Email and password are required" }
  }

  try {
    console.log("Fetching user from database...")
    const user = await getUserByEmail(email)

    if (!user) {
      console.log("User not found:", email)
      return { error: "Invalid email or password" }
    }

    console.log("User found, comparing passwords...")
    const isPasswordValid = await comparePasswords(password, user.password_hash)

    if (!isPasswordValid) {
      console.log("Invalid password for user:", email)
      return { error: "Invalid email or password" }
    }

    console.log("Password valid, creating session...")
    await createSession(user.id)

    console.log("Login successful for user:", email)
    return { success: true }
  } catch (error) {
    console.error("Login error:", error)
    return { error: "An error occurred during login" }
  }
}

export async function register(formData: FormData) {
  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const confirmPassword = formData.get("confirmPassword") as string

  if (!name || !email || !password || !confirmPassword) {
    return { error: "All fields are required" }
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match" }
  }

  try {
    const result = await createUser(name, email, password)
    return { success: true }
  } catch (error: any) {
    if (error.message === "Email already exists") {
      return { error: "Email already exists" }
    }
    console.error("Registration error:", error)
    return { error: "An error occurred during registration" }
  }
}

export async function logout() {
  clearSession()
  redirect("/login")
}
