// Import the built-in HTTP module
const http = require('http');

// A sample array to store student data
const students = [
    { id: 1, name: "Karma", age: 22 },
    { id: 2, name: "Pema", age: 24 }
];

// Create an HTTP server
const server = http.createServer((req, res) => {
    // Default response header
    res.setHeader('Content-Type', 'application/json');

    // Homepage route
    if (req.method === 'GET' && req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Welcome to our API');
    }

    // Get all students
    else if (req.method === 'GET' && req.url === '/students') {
        res.writeHead(200);
        res.end(JSON.stringify(students));
    }

    // Get single student by ID
    else if (req.method === 'GET' && req.url.startsWith('/students/')) {
        const id = parseInt(req.url.split('/')[2]); // Extract ID from URL
        const student = students.find(s => s.id === id);

        if (student) {
            res.writeHead(200);
            res.end(JSON.stringify(student));
        } else {
            res.writeHead(404);
            res.end(JSON.stringify({ error: "Student not found" }));
        }
    }

    // Fallback route
    else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: "Route not found" }));
    }
});

// Start the server
server.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
