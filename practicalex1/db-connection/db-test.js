const { Pool } = require('pg');

// Create a connection pool - ADJUST YOUR CREDENTIALS AS NEEDED
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'student_records',
  password: 'proko@23',
  port: 5432,
});

// Test the connection and run a query
async function testConnection() {
    let client;

    try {
        //get a client from the pool 
        client = await pool.connect();
        console.log('Connected to PostgreSQL database!');

        // Run a simple query
        const result = await client.query('SELECT * FROM students');

        //print the results
        console.log('students in database:');
        console.table(result.rows);

        // count rows
        console.log(`Total students: ${result.rowCount}`);
    } catch (err) {
        console.error('database connection error:', err);
    } finally {
        // release the client back to the pool
        if (client) client.release();

        // close the pool
        await pool.end();
        console.log('connection pool closed');
    }
}

// Run the test
testConnection();