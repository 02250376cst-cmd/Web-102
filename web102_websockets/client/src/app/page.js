"use client"

import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';

export default function Home() {
  // Simple state variables
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [inputMessage, setInputMessage] = useState('');

  // WebSocket reference
  const socket = useRef(null);
  const messagesEndRef = useRef(null);

  // Connect to WebSocket when the component mounts
  useEffect(() => {
    // Create WebSocket connection
    const ws = new WebSocket('ws://localhost:3001');
    socket.current = ws;

    // Event: connection opened
    ws.onopen = () => {
      console.log('Connected to WebSocket server');
      setConnected(true);
    };

    // Event: message received
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Message received:', data);

      // Add message to array
      setMessages(prevMessages => [...prevMessages, data]);

      // Update users list if provided
      if (data.users) {
        setUsers(data.users);
      }
    };

    // Event: connection closed
    ws.onclose = () => {
      console.log('Disconnected from WebSocket server');
      setConnected(false);
      setUsers([]);
    };

    // Event: connection error
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    // Clean up the WebSocket connection when the component unmounts
    return () => {
      ws.close();
    };
  }, []); // Empty dependency array means this effect runs once on mount

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle sending a message
  const handleSendMessage = (e) => {
    e.preventDefault();

    // Don't send empty messages
    if (!inputMessage.trim()) return;

    // Make sure socket is connected
    if (socket.current && socket.current.readyState === WebSocket.OPEN) {
      // Send message as JSON
      socket.current.send(JSON.stringify({ message: inputMessage }));
      // Clear input field
      setInputMessage('');
    } else {
      alert('Not connected to the server');
    }
  };

  // Format timestamp for display
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div>
      <Head>
        <title>WebSocket Chat</title>
        <meta name="description" content="Simple WebSocket chat application" />
      </Head>

      <div className="chat-container">
        {/* Chat header */}
        <div className="chat-header">
          <h2>WebSocket Chat</h2>
          <div className={`status-indicator ${connected ? 'connected' : ''}`}>
            {connected ? 'Connected' : 'Disconnected'}
          </div>
        </div>

        {/* Chat body */}
        <div className="chat-body">
          {/* Users panel */}
          <div className="users-panel">
            <h3>Online Users</h3>
            <ul className="users-list">
              {users.map((user, index) => (
                <li key={index}>{user}</li>
              ))}
            </ul>
          </div>

          {/* Messages panel */}
          <div className="messages-panel">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`message ${msg.type === 'system'
                    ? 'system'
                    : msg.userId === 'currentUser' ? 'user' : 'other'
                  }`}
              >
                {msg.type === 'system' ? (
                  <div className="content">{msg.message}</div>
                ) : (
                  <>
                    <div>
                      <span className="author">{msg.userName}</span>
                      <span className="time">{formatTime(msg.timestamp)}</span>
                    </div>
                    <div className="content">{msg.message}</div>
                  </>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Chat input */}
        <form className="chat-input" onSubmit={handleSendMessage}>
          <input
            type="text"
            placeholder="Type a message..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={!connected}
          />
          <button type="submit" disabled={!connected}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
}