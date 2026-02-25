const pool = require("../config/db");
const Profile = require("../models/Profile");
const Chat = require("../models/dm");
const { moderateText } = require("../moderation/moderationRules");
const { handleUserModeration } = require("../moderation/userModerationStore");

const MAX_USERS_PER_ROOM = 6;
let rooms = {};
let waitingUsers = {};

function joinRoom(socket, requestedRoom) {
  if (!rooms[requestedRoom]) rooms[requestedRoom] = [];
  rooms[requestedRoom].push(socket.id);
  socket.join(requestedRoom);
  return requestedRoom;
}

function leaveRoom(socket, roomName) {
  if (!rooms[roomName]) return;
  rooms[roomName] = rooms[roomName].filter((id) => id !== socket.id);
  socket.leave(roomName);
  if (rooms[roomName].length === 0) delete rooms[roomName];
}

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("⚡ New client connected:", socket.id);
    let currentRoom = null;

    socket.on("joinRoom", ({ username, requestedRoom }) => {
      const room = joinRoom(socket, requestedRoom);
      currentRoom = room;

      socket.username = socket.username || username || "Guest";

      io.to(room).emit("userJoined", {
        username: socket.username,
        id: socket.id,
      });
    });

    socket.on("chatMessage", ({ from, text }) => {
      if (!currentRoom) return;

      const username = socket.username || from || "User";

      const result = moderateText(text);

      if (!result.allowed) {
        return;
      }

      io.to(currentRoom).emit("message", {
        from: username,
        text,
      });
    });

    socket.on("send-dm", async ({ receiverId, message }) => {
      const senderId = socket.userId;
      if (!senderId || !receiverId) return;
      //Permission check (SAME as REST)
      const { rows } = await pool.query(
        "SELECT dm_permission FROM users WHERE id=$1",
        [receiverId],
      );

      let allowed = false;
      const permission = rows[0].dm_permission;

      if (permission === "everyone") allowed = true;
      if (permission === "following") {
        allowed = await Profile.isFollowing(senderId, receiverId);
      }
      if (permission === "mutual") {
        allowed =
          (await Profile.isFollowing(senderId, receiverId)) &&
          (await Profile.isFollowing(receiverId, senderId));
      }

      if (!allowed) {
        socket.emit("dm-error", {
          requestRequired: true,
          receiverId,
        });
        return;
      }
      //Moderation
      const result = moderateText(message);
      if (!result.allowed) {
        await handleUserModeration(senderId, result);
        return;
      }
      //Save in DB
      const saved = await Chat.sendMessage(senderId, receiverId, message);
      //Emit
      io.to(`dm:${receiverId}`).emit("receive-dm", saved);
      io.to(`dm:${senderId}`).emit("receive-dm", saved);
    });

    socket.on("send-signal", ({ signal, roomName }) => {
      socket.to(roomName).emit("user-joined", { from: socket.id, signal });
    });

    socket.on("return-signal", ({ signal, to }) => {
      io.to(to).emit("receive-return-signal", { from: socket.id, signal });
    });

    socket.on("disconnect", () => {
      console.log("❌ Client disconnected:", socket.id);

      if (currentRoom) {
        leaveRoom(socket, currentRoom);

        if (waitingUsers[currentRoom]) {
          waitingUsers[currentRoom] = waitingUsers[currentRoom].filter(
            (u) => u.socket.id !== socket.id,
          );
        }

        socket
          .to(currentRoom)
          .emit("message", { from: "system", text: "A user left the room." });
      }
    });
  });
};
