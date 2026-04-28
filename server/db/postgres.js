// This file sets up the database connection
// We use PostgreSQL (pg) as our database
// All database credentials come from environment variables in the .env file

import pg from 'pg'

// Pull the Client class out of the pg package
const { Client } = pg

// Create a new database client using our connection settings
const client = new Client({
  // Railway provides a full connection string through DATABASE_URL
  connectionString: process.env.DATABASE_URL,
  // Keep SSL enabled for hosted Postgres instances
  ssl: { rejectUnauthorized: false }
})

// Connect to the database when the server starts
client.connect()

// This is the function we use everywhere to run database queries
// text = the SQL string, values = the array of values to insert safely
export const query = async (text, values) => {
    try {
        // Record the start time so we can measure how long the query takes
        const now = new Date()
        console.log("query to be executed:", text)

        // Run the actual query
        const res = await client.query(text, values)

        // Record the end time and print how long it took
        const now2 = new Date()
        console.log(`it took ${now2-now}ms to run`)

        return res
    } catch (err) {
        console.error("Problem executing query")
        console.error(err)
        throw err
    }
}

/*
HOW TO USE
    query(qs).then(data) => {res.json(data.rows)}
*/
