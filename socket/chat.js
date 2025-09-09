// --- Dynamic room management with pairing ---
const MAX_USERS_PER_ROOM = 6;
let rooms = {};       // { roomName: [socketId1, socketId2, ...] }
let waitingUsers = {}; // { roomName: [socket1, socket2, ...] }

function joinRoom(socket, requestedRoom) {
    if (!rooms[requestedRoom]) rooms[requestedRoom] = [];
    rooms[requestedRoom].push(socket.id);
    socket.join(requestedRoom);
    return requestedRoom;
}

function leaveRoom(socket, roomName) {
    if (!rooms[roomName]) return;
    rooms[roomName] = rooms[roomName].filter(id => id !== socket.id);
    socket.leave(roomName);
    if (rooms[roomName].length === 0) delete rooms[roomName];
}

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log('⚡ New client connected:', socket.id);

        let currentRoom = null;
        let partner = null; // keep track of who I'm paired with
        let pairRoom = null;

        // --- Public Room Join ---
        socket.on('joinRoom', ({ username, requestedRoom }) => {
            const room = joinRoom(socket, requestedRoom);
            currentRoom = room;

            // resolve username from socket (handshake/JWT) or provided one
            socket.username = socket.username || username || 'Guest';

            // notify all (only one event, no duplicate)
            io.to(room).emit("userJoined", { username: socket.username, id: socket.id });

            // Pairing system
            if (!waitingUsers[room]) waitingUsers[room] = [];

            // Add to waiting queue
            waitingUsers[room].push({ socket, username: socket.username });

            // If at least 2 users are waiting → make a pair
            if (waitingUsers[room].length >= 2) {
                const user1 = waitingUsers[room].shift();
                const user2 = waitingUsers[room].shift();

                pairRoom = `${room}-pair-${user1.socket.id}-${user2.socket.id}`;
                user1.socket.join(pairRoom);
                user2.socket.join(pairRoom);
                // Persist pair room on both sockets so their handlers can access it
                user1.socket.pairRoom = pairRoom;
                user2.socket.pairRoom = pairRoom;
                // Save partner info on both sockets for later use
                user1.socket.partner = user2.socket.id;
                user2.socket.partner = user1.socket.id;

                // Save partner info in this handler (backward compatibility)
                if (user1.socket.id === socket.id) {
                    partner = user2.socket.id;
                }
                if (user2.socket.id === socket.id) {
                    partner = user1.socket.id;
                }

                // Notify both
                user1.socket.emit("message", { from: "system", text: `You are now chatting with @${user2.username}` });
                user2.socket.emit("message", { from: "system", text: `You are now chatting with @${user1.username}` });
            }
        });

        // --- Chat Message (only between pairs) ---
        socket.on('chatMessage', ({ from, text }) => {
            const room = socket.pairRoom || pairRoom;
            if (!room) return;
            const safeFrom = socket.username || from || 'User';
            // emit to both in pair room, but exclude sender to avoid double display on client
            socket.to(room).emit('message', { from: safeFrom, text });
        });

        // --- DM (Direct Message) ---
        socket.on('join-dm', (username) => {
            // Always use provided username string as room key, but do not trust as identity
            socket.join(`dm-${username}`);
            socket.username = socket.username || username; // set only if not set earlier by auth
            console.log(`${username} joined DM room: dm-${username}`);
        });

        socket.on('send-dm', (msg) => {
            // Normalize payload; use socket.username as the source of truth
            const payload = {
              from: socket.username,
              to: msg.receiverUsername || msg.to,
              text: msg.message,
              timestamp: Date.now()
            };
            if (payload.to) io.to(`dm-${payload.to}`).emit('receive-dm', payload);
            if (payload.from) io.to(`dm-${payload.from}`).emit('receive-dm', payload);
        });

        // --- WebRTC Signaling ---
        socket.on('send-signal', ({ signal, roomName }) => {
            socket.to(roomName).emit('user-joined', { from: socket.id, signal });
        });

        socket.on('return-signal', ({ signal, to }) => {
            io.to(to).emit('receive-return-signal', { from: socket.id, signal });
        });

        // --- Disconnect ---
        socket.on('disconnect', () => {
            console.log('❌ Client disconnected:', socket.id);

            if (currentRoom) {
                leaveRoom(socket, currentRoom);

                // Remove from waiting queue if still waiting
                if (waitingUsers[currentRoom]) {
                    waitingUsers[currentRoom] = waitingUsers[currentRoom].filter(u => u.socket.id !== socket.id);
                }

                // Inform partner if paired
                if (partner) {
                    io.to(partner).emit("message", { from: "system", text: "Your partner has left the chat." });
                }

                socket.to(currentRoom).emit('message', { from: 'system', text: 'A user left the room.' });
            }
        });
    });
};
