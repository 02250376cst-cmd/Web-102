const express = require('express');
const cors = require('cors');
const prisma = require('./prisma');

const app = express();
const port = 5100; // using a different port from the original app

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/students', async (req, res) => {
  try {
    // using prisma to fetch all students
    const students = await prisma.students.findMany();
    res.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/students/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    //using prisma to fetch a student by id
    const student = await prisma.students.findUnique({ 
        where: { id } 
    });
    
    if (!student) {
        return res.status(404).json({ error: 'Student not found' });
    }

    res.json(student);
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
// Create new student
app.post('/students', async (req, res) => {
  try {
    const { name, email, course, enrollment_date } = req.body;

    // using prisma to create a new student
    const newStudent = await prisma.students.create({
      data: {
        name,
        email,
        course,
        enrollment_date: new Date(enrollment_date),
      },
    });

    res.status(201).json(newStudent);
  } catch (error) {
    console.error('Error creating student:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Graceful shutdown prisma when the app terminates
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit();
});

//start the server
app.listen(port, () => {
  console.log(`Prisma server running on http://localhost:${port}`);
});
