import { NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"

export async function GET() {
  try {
    console.log("Setting up database tables...")

    // Create users table
    await executeQuery(
      `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `,
      [],
    )

    // Create sender_accounts table
    await executeQuery(
      `
      CREATE TABLE IF NOT EXISTS sender_accounts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        smtp_host VARCHAR(255),
        smtp_port INTEGER,
        smtp_username VARCHAR(255),
        smtp_password VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `,
      [],
    )

    // Create recipients table
    await executeQuery(
      `
      CREATE TABLE IF NOT EXISTS recipients (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        email VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, email)
      )
    `,
      [],
    )

    // Create templates table
    await executeQuery(
      `
      CREATE TABLE IF NOT EXISTS templates (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        name VARCHAR(255) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `,
      [],
    )

    // Create campaigns table
    await executeQuery(
      `
      CREATE TABLE IF NOT EXISTS campaigns (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        name VARCHAR(255) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        template_id INTEGER REFERENCES templates(id),
        sender_id INTEGER REFERENCES sender_accounts(id),
        status VARCHAR(50) DEFAULT 'draft',
        scheduled_for TIMESTAMP,
        sent_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `,
      [],
    )

    // Create campaign_recipients table
    await executeQuery(
      `
      CREATE TABLE IF NOT EXISTS campaign_recipients (
        id SERIAL PRIMARY KEY,
        campaign_id INTEGER REFERENCES campaigns(id),
        recipient_id INTEGER REFERENCES recipients(id),
        status VARCHAR(50) DEFAULT 'pending',
        sent_at TIMESTAMP,
        opened_at TIMESTAMP,
        clicked_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `,
      [],
    )

    // Create user_settings table
    await executeQuery(
      `
      CREATE TABLE IF NOT EXISTS user_settings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) UNIQUE,
        theme VARCHAR(50) DEFAULT 'light',
        email_notifications BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `,
      [],
    )

    // Create demo user if it doesn't exist
    const userResult = await executeQuery("SELECT * FROM users WHERE email = $1", ["demo@example.com"])

    if (userResult.length === 0) {
      await executeQuery("INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id", [
        "Demo User",
        "demo@example.com",
        "$2a$10$JqHARRrwm3pwGLc.I9sCi.5gGbGYXxI1XYpFUHBYpKGFOXlX9VR0q", // Hashed "password123" with bcryptjs
      ])

      console.log("Demo user created")
    }

    return NextResponse.json({
      success: true,
      message: "Database setup completed successfully",
    })
  } catch (error: any) {
    console.error("Database setup error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "An error occurred during database setup",
        error: error.message,
      },
      { status: 500 },
    )
  }
}
