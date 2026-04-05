const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

const width = 15;
const height = 15;

// Global state to store the latest maze structure
let currentMazeData = [];

// Initialize the grid with a simple outer wall bounding box
for (let z = 0; z < height; z++) {
    let row = [];
    for (let x = 0; x < width; x++) {
        if (z === 0 || z === height - 1 || x === 0 || x === width - 1) row.push(1);
        else row.push(0);
    }
    currentMazeData.push(row);
}

console.log("WebSocket Server running on ws://localhost:8080");

wss.on('connection', (ws) => {
    console.log("Client connected.");
    
    // Immediately send the current world state to newly connected clients
    ws.send(JSON.stringify({ type: 'maze_update', data: currentMazeData }));

    ws.on('message', (message) => {
        try {
            const msg = JSON.parse(message);
            
            // Handle incoming layout updates from the editor
            if (msg.type === 'maze_update') {
                currentMazeData = msg.data;
                console.log("Received new maze data. Broadcasting to players...");
                
                // Broadcast the new layout to all clients except the sender
                wss.clients.forEach((client) => {
                    if (client !== ws && client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({ type: 'maze_update', data: currentMazeData }));
                    }
                });
            }
        } catch (e) {
            console.error("Message parse error:", e);
        }
    });

    ws.on('close', () => console.log("Client disconnected."));
});
