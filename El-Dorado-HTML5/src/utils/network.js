import { io } from "socket.io-client";

// Connect to the Socket.io server
// Adjust URL if hosting remotely (e.g., "https://your-server.com")
// const SERVER_URL = "http://localhost:10000";
const SERVER_URL = "https://peerjs.manh9011.io.vn"; // Production URL

export const NetworkSystem = {
    socket: null,
    roomId: null,
    onMessageCallback: null,
    onStatusCallback: null,

    init(roomId = null) {
        // Ensure cleanup on tab close
        if (!this.unloadHandler) {
            this.unloadHandler = () => this.disconnect();
            window.addEventListener('beforeunload', this.unloadHandler);
        }

        return new Promise((resolve, reject) => {
            if (this.socket && this.socket.connected) {
                // Already connected to server, just join room
                this.joinRoom(roomId, resolve, reject);
            } else {
                // Connect to server first
                this.socket = io(SERVER_URL);

                this.socket.on("connect", () => {
                    console.log("Connected to Socket.io Server:", this.socket.id);
                    if (this.onStatusCallback) this.onStatusCallback('Connected to Server');

                    this.setupGlobalHandlers();

                    if (roomId) {
                        this.joinRoom(roomId, resolve, reject);
                    } else {
                        resolve(this.socket.id);
                    }
                });

                this.socket.on("connect_error", (err) => {
                    console.error("Socket Connection Error:", err);
                    if (this.onStatusCallback) this.onStatusCallback('Connection Error');
                    reject(err);
                });
            }
        });
    },

    joinRoom(roomId, resolve, reject) {
        if (!roomId) {
            resolve(this.socket.id); // Just connected, no room
            return;
        }

        this.socket.emit("join_room", roomId, (response) => {
            if (response.success) {
                this.roomId = roomId;
                // If count is 1, I am the only one, so I am Host.
                this.isHost = (response.count === 1);
                console.log(`Joined Room ${roomId}. Count: ${response.count}. Am I Host? ${this.isHost}`);

                if (this.onStatusCallback) this.onStatusCallback(`Joined Room ${roomId}`);
                resolve(this.socket.id);
            } else {
                console.error("Join Room Failed:", response.msg);
                if (this.onStatusCallback) this.onStatusCallback(`Error: ${response.msg}`);
                reject(response.msg);
            }
        });
    },

    setupGlobalHandlers() {
        this.socket.on("game_event", (data) => {
            // Received game data from opponent
            if (this.onMessageCallback) this.onMessageCallback(data);
        });

        this.socket.on("player_joined", (id) => {
            if (this.onStatusCallback) this.onStatusCallback('Opponent Joined');
            // Auto-trigger handshake if needed
        });

        this.socket.on("player_left", (id) => {
            if (this.onStatusCallback) this.onStatusCallback('Disconnected');
            // You might want to notify Game State here directly if needed
        });
    },

    // Legacy 'connect' for compatibility with existing code flow
    // In Socket.io, we are already connected via room.
    connect(targetId) {
        return new Promise((resolve) => {
            // We don't need to "connect" to a peer manually.
            // If we are in the same room, we can talk.
            // Just verify we have a room.
            if (this.roomId) {
                resolve();
            } else {
                // Should not happen if flow is correct
                resolve();
            }
        });
    },

    send(data) {
        if (this.socket && this.socket.connected && this.roomId) {
            // Wrap data with meta info for Server Relay
            // We flatten 'type' and 'payload' into the object sent
            // But server expects { roomId, ...data }
            this.socket.emit("game_event", { roomId: this.roomId, ...data });
        }
    },

    onMessage(cb) { this.onMessageCallback = cb; },
    onStatus(cb) { this.onStatusCallback = cb; },

    async checkRoomStatus(roomId) {
        return new Promise((resolve) => {
            // Use a temporary socket request if not connected, or main socket
            // For lobby, we usually assume we are connected to server but not in a room.

            if (!this.socket || !this.socket.connected) {
                // If completely disconnected, quick connect (optimization needed for prod)
                // ideally lobby connects once.
                const tempSocket = io(SERVER_URL);
                tempSocket.on("connect", () => {
                    tempSocket.emit("check_room", roomId, (count) => {
                        tempSocket.disconnect();
                        resolve(count);
                    });
                });
                tempSocket.on("connect_error", () => resolve(0));
            } else {
                this.socket.emit("check_room", roomId, (count) => {
                    resolve(count);
                });
            }
        });
    },

    disconnect() {
        if (this.roomId) {
            this.socket.emit("leave_room", this.roomId);
            this.roomId = null;
        }
        // Ideally keep socket open for Lobby, but if 'disconnect' requested:
        // this.socket.disconnect();
    }
};
