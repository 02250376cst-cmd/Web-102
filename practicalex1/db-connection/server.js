const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

//create postgreSQL connection pool - ADJUST YOUR CREDENTIALS AS NEEDED 
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'student_records',
  password: 'proko@23',
  port: 5432,
});

// test database connection on startup
pool.connect()
    .then(client => {
        console.log('Connected to PostgreSQL database!');
        client.release();
    })
    .catch(err => {
        console.error('postgreSQL connection error:', err);
    });

// root endpoint
app.get('/', (req, res) => {
  res.send('Student Records API is running (PostgreSQL)');
});

// GET api: fetch all students
app.get('/api/students', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM students');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching students:', err);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// POST api = add new student
app.post('/api/students', async (req, res) => {
  const { name, email, course, enrollment_date } = req.body;
  
  //validate input
  if (!name || !email || !course || !enrollment_date) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO students (name, email, course, enrollment_date) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, email, course, enrollment_date]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding student:', err);

    //handle duplicate email error    
    if (err.code === '23505') { // postgreSQL unique violation error code
      return res.status(409).json({ error: 'Email already exists' });
    }

    res.status(500).json({ error: 'Failed to add student' });
  }
});

// Start server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
