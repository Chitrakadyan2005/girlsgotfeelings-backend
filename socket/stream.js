const MAX_GROUP = 6;
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

// roomState: { [roomId]: { groups: [ [socketId, ...], ... ], userMap: { socketId: { username, groupIndex } }, hostId: string|null } }
const roomState = {};

function ensureRoom(roomId) {
  if (!roomState[roomId]) {
    roomState[roomId] = { groups: [], userMap: {}, hostId: null };
  }
  return roomState[roomId];
}

function pickGroupForJoin(roomObj) {
  // try to find a non-full group
  for (let i = 0; i < roomObj.groups.length; i++) {
    if (roomObj.groups[i].length < MAX_GROUP) return i;
  }
  // else create a new one
  roomObj.groups.push([]);
  return roomObj.groups.length - 1;
}

function removeFromGroup(roomObj, socketId) {
  const info = roomObj.userMap[socketId];
  if (!info) return null;
  const { groupIndex } = info;
  const group = roomObj.groups[groupIndex];
  if (!group) return null;

  // remove
  roomObj.groups[groupIndex] = group.filter((id) => id !== socketId);
  delete roomObj.userMap[socketId];

  // optional: cleanup empty trailing groups (not required)
  return groupIndex;
}

module.exports = (io) => {
  io.on("connection", (socket) => {
    let roomId = null;

    // Try to get username from handshake auth token (per-tab socket auth)
    let handshakeUsername = 'Guest';
    const auth = socket.handshake?.auth || {};
    if (auth.token) {
      try {
        const d = jwt.verify(auth.token, JWT_SECRET);
        if (d?.username) handshakeUsername = d.username;
      } catch (e) {
        console.warn('JWT verify failed in handshake:', e.message);
      }
    }

    socket.on("join-room", ({ roomId: rid, username, token }) => {
      roomId = rid;
      const roomObj = ensureRoom(roomId);

      // Resolve username from JWT if provided (payload token wins, else handshake, else username, else Guest)
      let resolvedUsername = handshakeUsername || username || 'Guest';
      if (token) {
        try {
          const decoded = jwt.verify(token, JWT_SECRET);
          if (decoded && decoded.username) resolvedUsername = decoded.username;
        } catch (e) {
          console.warn('JWT verify failed in join-room:', e.message);
        }
      }

      // choose a subgroup (max size 6)
      const gIndex = pickGroupForJoin(roomObj);
      if (!roomObj.groups[gIndex]) roomObj.groups[gIndex] = [];
      roomObj.groups[gIndex].push(socket.id);
      roomObj.userMap[socket.id] = { username: resolvedUsername, groupIndex: gIndex };

      // join socket.io room for subgroup (so emits are isolated to up to 6)
      const subgroupRoom = `${roomId}::${gIndex}`;
      socket.join(subgroupRoom);

      console.log(`User ${resolvedUsername} (${socket.id}) joined room ${roomId}, group ${gIndex}`);

      // set host if not set yet
      if (!roomObj.hostId) {
        roomObj.hostId = socket.id;
        io.to(subgroupRoom).emit("host-updated", { hostId: socket.id, username: resolvedUsername });
      }

      // send existing peers in this subgroup to the newcomer (with usernames)
      const peers = roomObj.groups[gIndex].filter((id) => id !== socket.id);
      const peerDetails = peers.map(id => ({ userId: id, username: roomObj.userMap[id]?.username || 'User' }));
      io.to(socket.id).emit("group-peers", { peers, peerDetails, hostId: roomObj.hostId, self: { userId: socket.id, username: resolvedUsername } });

      // notify others in subgroup
      socket.to(subgroupRoom).emit("user-joined", {
        userId: socket.id,
        username: resolvedUsername,
      });
    });

    // Handle leaving room explicitly
    socket.on("leave-room", ({ roomId: rid, username }) => {
      if (!rid) return;
      const roomObj = roomState[rid];
      if (!roomObj) return;

      const u = roomObj.userMap[socket.id];
      if (!u) return;

      const subgroupRoom = `${rid}::${u.groupIndex}`;
      console.log(`User ${username} (${socket.id}) left room ${rid}`);
      
      // notify subgroup
      socket.to(subgroupRoom).emit("user-left", { userId: socket.id, username: u.username });
      socket.leave(subgroupRoom);

      const wasHost = roomObj.hostId === socket.id;
      removeFromGroup(roomObj, socket.id);

      if (wasHost) {
        // announce host left and ask for continuation
        const remaining = roomObj.groups[u.groupIndex] || [];
        // Notify everyone in subgroup; clients will display a prompt
        io.to(subgroupRoom).emit("host-left", {
          previousHostId: socket.id,
          candidates: remaining
            .filter(id => id !== socket.id)
            .map(id => ({ userId: id, username: roomObj.userMap[id]?.username || 'User' }))
        });
      }
    });

    // signaling: forward to target only
    socket.on("signal", ({ to, signal }) => {
      if (!to) return;
      io.to(to).emit("signal", { from: socket.id, signal });
    });

    // subgroup chat
    socket.on("stream-chat", ({ roomId, text }) => {
      const roomObj = roomState[roomId];
      if (!roomObj) return;
      const u = roomObj.userMap[socket.id];
      if (!u) return;
      const subgroupRoom = `${roomId}::${u.groupIndex}`;
      // Always trust server username mapping; include sender socket id
      io.to(subgroupRoom).emit("stream-message", { userId: socket.id, from: u.username, text, timestamp: Date.now(), hostId: roomObj.hostId });
    });

    // host reassignment: request + set
    socket.on("host-continue", ({ roomId }) => {
      const roomObj = roomState[roomId];
      if (!roomObj) return;
      const u = roomObj.userMap[socket.id];
      if (!u) return;
      const subgroupRoom = `${roomId}::${u.groupIndex}`;
      io.to(subgroupRoom).emit("host-continue-accepted", { by: socket.id });
    });

    socket.on("host-set", ({ roomId, newHostId }) => {
      const roomObj = roomState[roomId];
      if (!roomObj) return;
      const u = roomObj.userMap[socket.id];
      if (!u) return;
      const subgroupRoom = `${roomId}::${u.groupIndex}`;
      // only allow setting host to a valid member in same subgroup
      const isValid = roomObj.groups[u.groupIndex]?.includes(newHostId);
      if (!isValid) return;
      roomObj.hostId = newHostId;
      const newHostName = roomObj.userMap[newHostId]?.username || 'User';
      io.to(subgroupRoom).emit("host-updated", { hostId: newHostId, username: newHostName });
    });

    // Tab synchronization
    socket.on("tab-change", ({ roomId, activeTab, data }) => {
      const roomObj = roomState[roomId];
      if (!roomObj) return;
      const u = roomObj.userMap[socket.id];
      if (!u) return;
      const subgroupRoom = `${roomId}::${u.groupIndex}`;
      socket.to(subgroupRoom).emit("tab-changed", { 
        userId: socket.id, 
        activeTab, 
        data,
        username: u.username 
      });
    });

    // Game state synchronization
    socket.on("game-state", ({ roomId, gameType, gameState }) => {
      const roomObj = roomState[roomId];
      if (!roomObj) return;
      const u = roomObj.userMap[socket.id];
      if (!u) return;
      const subgroupRoom = `${roomId}::${u.groupIndex}`;
      socket.to(subgroupRoom).emit("game-state-update", { 
        userId: socket.id, 
        gameType, 
        gameState,
        username: u.username 
      });
    });

    // Spotify synchronization
    socket.on("spotify-state", ({ roomId, isPlaying, track, position }) => {
      const roomObj = roomState[roomId];
      if (!roomObj) return;
      const u = roomObj.userMap[socket.id];
      if (!u) return;
      const subgroupRoom = `${roomId}::${u.groupIndex}`;
      socket.to(subgroupRoom).emit("spotify-state-update", { 
        userId: socket.id, 
        isPlaying, 
        track, 
        position,
        username: u.username 
      });
    });

    // Camera/Mic state synchronization
    socket.on("media-state", ({ roomId, cameraOn, micOn }) => {
      const roomObj = roomState[roomId];
      if (!roomObj) return;
      const u = roomObj.userMap[socket.id];
      if (!u) return;
      const subgroupRoom = `${roomId}::${u.groupIndex}`;
      socket.to(subgroupRoom).emit("media-state-update", { 
        userId: socket.id, 
        cameraOn, 
        micOn,
        username: u.username 
      });
    });

    // Screen sharing state
    socket.on("screen-share-state", ({ roomId, isSharing }) => {
      const roomObj = roomState[roomId];
      if (!roomObj) return;
      const u = roomObj.userMap[socket.id];
      if (!u) return;
      const subgroupRoom = `${roomId}::${u.groupIndex}`;
      socket.to(subgroupRoom).emit("screen-share-update", { 
        userId: socket.id, 
        isSharing,
        username: u.username 
      });
    });

    socket.on("disconnect", () => {
      if (!roomId) return;
      const roomObj = roomState[roomId];
      if (!roomObj) return;

      const u = roomObj.userMap[socket.id];
      if (!u) return;

      const subgroupRoom = `${roomId}::${u.groupIndex}`;
      // notify subgroup
      socket.to(subgroupRoom).emit("user-left", { userId: socket.id, username: u.username });

      const wasHost = roomObj.hostId === socket.id;
      removeFromGroup(roomObj, socket.id);

      if (wasHost) {
        const remaining = roomObj.groups[u.groupIndex] || [];
        io.to(subgroupRoom).emit("host-left", {
          previousHostId: socket.id,
          candidates: remaining
            .filter(id => id !== socket.id)
            .map(id => ({ userId: id, username: roomObj.userMap[id]?.username || 'User' }))
        });
      }
    });
  });
};
