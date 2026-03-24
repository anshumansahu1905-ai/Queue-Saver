const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'src', '.env') });

const http = require('http');
const { Server } = require('socket.io');

const app = require('./src/app');
const ConnectDB = require('./src/config/db');

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});

app.set('io', io);

io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    socket.on('join_shop', (shopId) => {
        socket.join(`shop_${shopId}`);
        console.log(`[Socket] ${socket.id} joined shop room: shop_${shopId}`);
    });

    socket.on('join_entry', (entryId) => {
        socket.join(`entry_${entryId}`);
        console.log(`[Socket] ${socket.id} joined entry room: entry_${entryId}`);
    });

    socket.on('disconnect', () => {
        console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
});

ConnectDB();

server.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`✅ Socket.IO ready`);
});
