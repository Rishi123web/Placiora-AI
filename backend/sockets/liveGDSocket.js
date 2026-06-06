const MAX_LIVE_GD_MEMBERS = 5

const liveGDRooms = new Map()

const setupLiveGDSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("Live GD socket connected:", socket.id)

    socket.on("live-gd-join-room", (payload = {}) => {
      const {
        roomId,
        userId = "",
        name = "Participant",
        email = "",
        role = "Participant"
      } = payload

      if (!roomId) {
        socket.emit("live-gd-error", {
          message: "Room ID is required."
        })
        return
      }

      if (!liveGDRooms.has(roomId)) {
        liveGDRooms.set(roomId, [])
      }

      const currentUsers = liveGDRooms.get(roomId)

      const alreadyInRoom = currentUsers.some(
        (user) =>
          user.socketId === socket.id ||
          (userId && user.userId === userId) ||
          (email && user.email === email)
      )

      if (!alreadyInRoom && currentUsers.length >= MAX_LIVE_GD_MEMBERS) {
        socket.emit("live-gd-room-full", {
          message: "This GD room already has 5 members."
        })
        return
      }

      socket.join(roomId)

      const filteredUsers = currentUsers.filter(
        (user) =>
          user.socketId !== socket.id &&
          (!userId || user.userId !== userId) &&
          (!email || user.email !== email)
      )

      const userData = {
        socketId: socket.id,
        userId,
        name,
        email,
        role,
        micReady: false,
        cameraReady: false,
        joinedAt: new Date()
      }

      filteredUsers.push(userData)
      liveGDRooms.set(roomId, filteredUsers)

      io.to(roomId).emit("live-gd-users-updated", filteredUsers)

      socket.to(roomId).emit("live-gd-system-message", {
        speaker: "system",
        name: "System",
        role: "System",
        message: `${name} joined the GD meeting.`,
        createdAt: new Date()
      })
    })

    socket.on("live-gd-device-ready", (payload = {}) => {
      const { roomId, micReady = false, cameraReady = false } = payload

      if (!roomId || !liveGDRooms.has(roomId)) return

      const updatedUsers = liveGDRooms.get(roomId).map((user) =>
        user.socketId === socket.id
          ? {
              ...user,
              micReady,
              cameraReady
            }
          : user
      )

      liveGDRooms.set(roomId, updatedUsers)
      io.to(roomId).emit("live-gd-users-updated", updatedUsers)
    })

    socket.on("live-gd-send-message", (payload = {}) => {
      const {
        roomId,
        message = "",
        name = "Participant",
        userId = "",
        role = "Participant"
      } = payload

      if (!roomId || !message.trim()) return

      io.to(roomId).emit("live-gd-new-message", {
        speaker: "user",
        userId,
        name,
        role,
        message: message.trim(),
        createdAt: new Date()
      })
    })

    socket.on("live-gd-ai-message", (payload = {}) => {
      const {
        roomId,
        message = "",
        name = "AI Participant",
        role = "AI Participant",
        personality = "Balanced"
      } = payload

      if (!roomId || !message.trim()) return

      io.to(roomId).emit("live-gd-new-message", {
        speaker: "ai",
        name,
        role,
        personality,
        message: message.trim(),
        createdAt: new Date()
      })
    })

    socket.on("live-gd-ai-messages", (payload = {}) => {
      const { roomId, replies = [] } = payload

      if (!roomId || !Array.isArray(replies)) return

      replies.forEach((reply, index) => {
        setTimeout(() => {
          io.to(roomId).emit("live-gd-new-message", {
            speaker: "ai",
            name: reply.name || "AI Participant",
            role: reply.role || "AI Participant",
            personality: reply.personality || "Balanced",
            message: reply.message || "",
            createdAt: new Date()
          })
        }, index * 1200)
      })
    })

    socket.on("live-gd-started", (payload = {}) => {
      const { roomId } = payload

      if (!roomId) return

      io.to(roomId).emit("live-gd-started", {
        message: "The live GD round has started.",
        createdAt: new Date()
      })
    })

    socket.on("live-gd-round-ended", (payload = {}) => {
      const { roomId } = payload

      if (!roomId) return

      io.to(roomId).emit("live-gd-ended", {
        message: "The live GD round has ended.",
        createdAt: new Date()
      })
    })

    socket.on("disconnect", () => {
      console.log("Live GD socket disconnected:", socket.id)

      for (const [roomId, users] of liveGDRooms.entries()) {
        const leavingUser = users.find((user) => user.socketId === socket.id)

        const updatedUsers = users.filter(
          (user) => user.socketId !== socket.id
        )

        if (updatedUsers.length === 0) {
          liveGDRooms.delete(roomId)
        } else {
          liveGDRooms.set(roomId, updatedUsers)
          io.to(roomId).emit("live-gd-users-updated", updatedUsers)
        }

        if (leavingUser) {
          socket.to(roomId).emit("live-gd-system-message", {
            speaker: "system",
            name: "System",
            role: "System",
            message: `${leavingUser.name} left the GD meeting.`,
            createdAt: new Date()
          })
        }
      }
    })
  })
}

export default setupLiveGDSocket