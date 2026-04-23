// Import required modules
const express = require('express');
const http = require('http');
const WebSocket = require('ws');

// Create an Express application
const app = express();

// Create an HTTP server using the Express app
const server = http.createServer(app);

// Create a WebSocket server by passing the HTTP server
// Note: We're using port 3001 to avoid conflicts with Next.js on 3000
const wss = new WebSocket.Server({ server });

// Store connected clients
const clients = new Set();

// Counter for user IDs
let userIdCounter = 1;

// Handle new WebSocket connections
wss.on('connection', (ws) => {
    // Assign a unique user ID and name
    const userId = userIdCounter++;
    const userName = `User ${userId}`;

    console.log(`New connection: ${userName}`);

    // Store user data with the connection
    ws.userData = { id: userId, name: userName };
    clients.add(ws);

    // Send welcome message to the new client
    ws.send(JSON.stringify({
        type: 'system',
        message: `Welcome to the chat, ${userName}!`,
        users: Array.from(clients).map(client => client.userData.name)
    }));

    // Announce new user to all other clients
    broadcastMessage({
        type: 'system',
        message: `${userName} has joined the chat.`,
        users: Array.from(clients).map(client => client.userData.name)
    }, ws);

    // Handle incoming messages
    ws.on('message', (message) => {
        try {
            // Parse the JSON message
            const data = JSON.parse(message);

            console.log(`${userName}: ${data.message}`);

            // Broadcast the message to all clients
            broadcastMessage({
                type: 'chat',
                userId: userId,
                userName: userName,
                message: data.message,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    });

    // Handle client disconnection
    ws.on('close', () => {
        console.log(`${userName} disconnected`);

        // Remove client from the set
        clients.delete(ws);

        // Announce user departure
        broadcastMessage({
            type: 'system',
            message: `${userName} has left the chat.`,
            users: Array.from(clients).map(client => client.userData.name)
        });
    });
});

// Function to broadcast messages to all clients
function broadcastMessage(message, excludeClient = null) {
    const messageString = JSON.stringify(message);

    clients.forEach((client) => {
        // Only send to open connections, excluding the specified client
        if (client.readyState === WebSocket.OPEN && client !== excludeClient) {
            client.send(messageString);
        }
    });
}

// Start the server
const PORT = 3001; // Different from Next.js port
server.listen(PORT, () => {
    console.log(`WebSocket server running on ws://localhost:${PORT}`);
});

// server.listen(PORT, '0.0.0.0', () => {
//     console.log(`WebSocket server running on port ${PORT}`);
// });