import { executeQuery } from "@/lib/db"

export default async function TestUserPage() {
  let error = null
  let user = null

  try {
    const result = await executeQuery("SELECT * FROM users WHERE email = $1", ["demo@example.com"])
    user = result[0]
  } catch (err: any) {
    error = err.message
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test User</h1>

      {error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p className="font-bold">Error:</p>
          <p>{error}</p>
        </div>
      ) : user ? (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          <p className="font-bold">User found:</p>
          <pre className="mt-2 bg-gray-100 p-2 rounded overflow-auto">
            {JSON.stringify(
              {
                id: user.id,
                name: user.name,
                email: user.email,
                password_hash_prefix: user.password_hash?.substring(0, 10) + "...",
                created_at: user.created_at,
              },
              null,
              2,
            )}
          </pre>
        </div>
      ) : (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <p>No user found with email: demo@example.com</p>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-2">Debugging Steps:</h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Check if the user exists in the database</li>
          <li>Verify the password hash is correct</li>
          <li>Check the JWT_SECRET environment variable</li>
          <li>
            Try the direct API login endpoint: <code className="bg-gray-100 p-1 rounded">/api/login</code>
          </li>
          <li>Check server logs for errors</li>
        </ol>
      </div>
    </div>
  )
}
