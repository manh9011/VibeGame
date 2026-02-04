const { Server } = require("socket.io");

const io = new Server(10000, {
    cors: {
        origin: "*", // Allow all connections
        methods: ["GET", "POST"]
    }
});

const MAX_PLAYERS = 2;
const rooms = {}; // { roomId: [socketId1, socketId2] }

console.log("Socket.io Server running on port 10000...");

io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    // --- ROOM MANAGEMENT ---

    socket.on("check_room", (roomId, callback) => {
        const count = rooms[roomId] ? rooms[roomId].length : 0;
        callback(count);
    });

    socket.on("join_room", (roomId, callback) => {
        if (!rooms[roomId]) rooms[roomId] = [];

        if (rooms[roomId].length >= MAX_PLAYERS) {
            callback({ success: false, msg: "Room is full" });
            return;
        }

        rooms[roomId].push(socket.id);
        socket.join(roomId);

        console.log(`Socket ${socket.id} joined room ${roomId}. Count: ${rooms[roomId].length}`);

        // Notify others in room
        socket.to(roomId).emit("player_joined", socket.id);

        callback({ success: true, count: rooms[roomId].length });
    });

    socket.on("leave_room", (roomId) => {
        leaveRoom(socket, roomId);
    });

    // --- GAMEPLAY RELAY ---

    socket.on("game_event", (data) => {
        // Relay event to everyone else in the room
        // data should contain { roomId, type, payload }
        if (data.roomId) {
            socket.to(data.roomId).emit("game_event", data);
        }
    });

    // --- DISCONNECT ---

    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
        // Find which room they were in and clean up
        for (const [roomId, players] of Object.entries(rooms)) {
            if (players.includes(socket.id)) {
                leaveRoom(socket, roomId);
                break; // Assuming 1 room per user
            }
        }
    });

    function leaveRoom(socket, roomId) {
        if (!rooms[roomId]) return;

        rooms[roomId] = rooms[roomId].filter(id => id !== socket.id);
        socket.leave(roomId);
        console.log(`Socket ${socket.id} left room ${roomId}. Count: ${rooms[roomId].length}`);

        // Notify remaining player
        socket.to(roomId).emit("player_left", socket.id);

        // Cleanup empty room
        if (rooms[roomId].length === 0) {
            delete rooms[roomId];
        }
    }
});