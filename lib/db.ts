import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import { Pool } from "@neondatabase/serverless"

// Create a SQL client with the connection string
const sql = neon(process.env.DATABASE_URL!)

// Create a drizzle client
export const db = drizzle(sql)

// Helper function to execute raw SQL queries
export async function executeQuery(query: string, params: any[] = []) {
  try {
    console.log("Executing query:", query.substring(0, 100) + "...")
    console.log("With params:", params)

    // Use the query method instead of calling sql directly
    const result = await sql(query, params)
    console.log("Query result:", result.length > 0 ? "Data returned" : "No data")
    return result
  } catch (error) {
    console.error("Database query error:", error)
    throw error
  }
}

// Initialize the connection pool
let pool: Pool

export function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL

    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable is not set")
    }

    pool = new Pool({ connectionString })
  }

  return pool
}

// Initialize the database schema
export async function initializeDatabase() {
  const pool = getPool()

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS sender_accounts (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      email VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      smtp_host VARCHAR(255) NOT NULL,
      smtp_port INTEGER NOT NULL,
      smtp_username VARCHAR(255) NOT NULL,
      smtp_password VARCHAR(255) NOT NULL,
      daily_limit INTEGER NOT NULL DEFAULT 100,
      daily_sent INTEGER NOT NULL DEFAULT 0,
      status VARCHAR(50) NOT NULL DEFAULT 'Active',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS recipients (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      email VARCHAR(255) NOT NULL,
      name VARCHAR(255),
      company VARCHAR(255),
      phone VARCHAR(50),
      status VARCHAR(50) NOT NULL DEFAULT 'Active',
      last_sent TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, email)
    );
    
    CREATE TABLE IF NOT EXISTS templates (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      name VARCHAR(255) NOT NULL,
      subject VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS campaigns (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      name VARCHAR(255) NOT NULL,
      template_id INTEGER REFERENCES templates(id),
      status VARCHAR(50) NOT NULL DEFAULT 'Draft',
      scheduled_date TIMESTAMP WITH TIME ZONE,
      total_recipients INTEGER NOT NULL DEFAULT 0,
      sent_count INTEGER NOT NULL DEFAULT 0,
      opened_count INTEGER NOT NULL DEFAULT 0,
      clicked_count INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS campaign_recipients (
      id SERIAL PRIMARY KEY,
      campaign_id INTEGER REFERENCES campaigns(id),
      recipient_id INTEGER REFERENCES recipients(id),
      sender_id INTEGER REFERENCES sender_accounts(id),
      status VARCHAR(50) NOT NULL DEFAULT 'Pending',
      sent_at TIMESTAMP WITH TIME ZONE,
      opened_at TIMESTAMP WITH TIME ZONE,
      clicked_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(campaign_id, recipient_id)
    );
    
    CREATE TABLE IF NOT EXISTS email_logs (
      id SERIAL PRIMARY KEY,
      campaign_id INTEGER REFERENCES campaigns(id),
      recipient_id INTEGER REFERENCES recipients(id),
      sender_id INTEGER REFERENCES sender_accounts(id),
      status VARCHAR(50) NOT NULL,
      message TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `)

  console.log("Database schema initialized")
}
