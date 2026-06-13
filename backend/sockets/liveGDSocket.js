const MAX_LIVE_GD_MEMBERS = 5

const liveGDRooms = new Map()

const getRoom = (roomId) => {
  if (!liveGDRooms.has(roomId)) {
    liveGDRooms.set(roomId, {
      users: [],
      pending: [],
      hostSocketId: null,
      hostUserId: "",
      meetingStatus: "waiting"
    })
  }

  return liveGDRooms.get(roomId)
}

const getAiCount = (humanCount) => {
  return Math.max(0, MAX_LIVE_GD_MEMBERS - Number(humanCount || 0))
}

const emitRoomState = (io, roomId) => {
  const room = getRoom(roomId)

  io.to(roomId).emit("live-gd-users-updated", room.users)

  io.to(roomId).emit("live-gd-room-state", {
    users: room.users,
    pending: room.pending,
    hostSocketId: room.hostSocketId,
    hostUserId: room.hostUserId,
    meetingStatus: room.meetingStatus,
    humanCount: room.users.length,
    maxMembers: MAX_LIVE_GD_MEMBERS,
    aiCount: getAiCount(room.users.length)
  })

  if (room.hostSocketId) {
    io.to(room.hostSocketId).emit("live-gd-pending-updated", room.pending)
  }
}

const setupLiveGDSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("Live GD socket connected:", socket.id)

    socket.on("live-gd-host-join", (payload = {}) => {
      const {
        roomId,
        userId = "",
        name = "Host",
        email = "",
        role = "Host"
      } = payload

      if (!roomId) {
        socket.emit("live-gd-error", {
          message: "Room ID is required."
        })
        return
      }

      const room = getRoom(roomId)

      socket.join(roomId)

      room.hostSocketId = socket.id
      room.hostUserId = userId || room.hostUserId

      const filteredUsers = room.users.filter(
        (user) =>
          user.socketId !== socket.id &&
          (!userId || user.userId !== userId) &&
          (!email || user.email !== email)
      )

      filteredUsers.unshift({
        socketId: socket.id,
        userId,
        name,
        email,
        role,
        isHost: true,
        micReady: false,
        cameraReady: false,
        joinedAt: new Date()
      })

      room.users = filteredUsers.slice(0, MAX_LIVE_GD_MEMBERS)

      liveGDRooms.set(roomId, room)

      emitRoomState(io, roomId)

      io.to(roomId).emit("live-gd-system-message", {
        speaker: "system",
        name: "System",
        role: "System",
        message: `${name} is the meeting host.`,
        createdAt: new Date()
      })
    })

    socket.on("live-gd-request-join", (payload = {}) => {
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

      const room = getRoom(roomId)

      if (room.users.length >= MAX_LIVE_GD_MEMBERS) {
        socket.emit("live-gd-room-full", {
          message: "This GD room already has 5 members."
        })
        return
      }

      const alreadyAdmitted = room.users.some(
        (user) =>
          user.socketId === socket.id ||
          (userId && user.userId === userId) ||
          (email && user.email === email)
      )

      if (alreadyAdmitted) {
        socket.join(roomId)

        socket.emit("live-gd-admitted", {
          roomId,
          users: room.users
        })

        emitRoomState(io, roomId)
        return
      }

      const alreadyPending = room.pending.some(
        (user) =>
          user.socketId === socket.id ||
          (userId && user.userId === userId) ||
          (email && user.email === email)
      )

      if (!alreadyPending) {
        room.pending.push({
          socketId: socket.id,
          userId,
          name,
          email,
          role,
          requestedAt: new Date()
        })
      }

      liveGDRooms.set(roomId, room)

      socket.emit("live-gd-waiting-room", {
        message: "Waiting for host approval.",
        roomId
      })

      if (room.hostSocketId) {
        io.to(room.hostSocketId).emit("live-gd-join-request", {
          socketId: socket.id,
          userId,
          name,
          email,
          role,
          requestedAt: new Date()
        })
      }

      emitRoomState(io, roomId)
    })

    socket.on("live-gd-admit-user", (payload = {}) => {
      const { roomId, socketId } = payload

      if (!roomId || !socketId) return

      const room = getRoom(roomId)

      if (room.hostSocketId !== socket.id) {
        socket.emit("live-gd-error", {
          message: "Only the host can admit users."
        })
        return
      }

      if (room.users.length >= MAX_LIVE_GD_MEMBERS) {
        io.to(socketId).emit("live-gd-room-full", {
          message: "This GD room already has 5 members."
        })
        return
      }

      const pendingUser = room.pending.find(
        (user) => user.socketId === socketId
      )

      if (!pendingUser) return

      room.pending = room.pending.filter((user) => user.socketId !== socketId)

      const admittedUser = {
        ...pendingUser,
        isHost: false,
        micReady: false,
        cameraReady: false,
        joinedAt: new Date()
      }

      room.users.push(admittedUser)

      const admittedSocket = io.sockets.sockets.get(socketId)

      if (admittedSocket) {
        admittedSocket.join(roomId)
      }

      liveGDRooms.set(roomId, room)

      io.to(socketId).emit("live-gd-admitted", {
        roomId,
        users: room.users
      })

      io.to(roomId).emit("live-gd-system-message", {
        speaker: "system",
        name: "System",
        role: "System",
        message: `${admittedUser.name} joined the GD meeting.`,
        createdAt: new Date()
      })

      emitRoomState(io, roomId)
    })

    socket.on("live-gd-reject-user", (payload = {}) => {
      const { roomId, socketId } = payload

      if (!roomId || !socketId) return

      const room = getRoom(roomId)

      if (room.hostSocketId !== socket.id) {
        socket.emit("live-gd-error", {
          message: "Only the host can reject users."
        })
        return
      }

      room.pending = room.pending.filter((user) => user.socketId !== socketId)

      liveGDRooms.set(roomId, room)

      io.to(socketId).emit("live-gd-rejected", {
        message: "Host rejected your request to join this GD meeting."
      })

      emitRoomState(io, roomId)
    })

    socket.on("live-gd-device-ready", (payload = {}) => {
      const { roomId, micReady = false, cameraReady = false } = payload

      if (!roomId || !liveGDRooms.has(roomId)) return

      const room = getRoom(roomId)

      room.users = room.users.map((user) =>
        user.socketId === socket.id
          ? {
              ...user,
              micReady,
              cameraReady
            }
          : user
      )

      liveGDRooms.set(roomId, room)
      emitRoomState(io, roomId)
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

    socket.on("live-gd-started", (payload = {}) => {
      const { roomId } = payload

      if (!roomId) return

      const room = getRoom(roomId)

      room.meetingStatus = "live"

      liveGDRooms.set(roomId, room)

      io.to(roomId).emit("live-gd-started", {
        message: "The live GD round has started.",
        createdAt: new Date()
      })

      emitRoomState(io, roomId)
    })

    socket.on("live-gd-round-ended", (payload = {}) => {
      const { roomId } = payload

      if (!roomId) return

      const room = getRoom(roomId)

      room.meetingStatus = "ended"

      liveGDRooms.set(roomId, room)

      io.to(roomId).emit("live-gd-ended", {
        message: "The live GD round has ended.",
        createdAt: new Date()
      })

      emitRoomState(io, roomId)
    })

    socket.on("disconnect", () => {
      console.log("Live GD socket disconnected:", socket.id)

      for (const [roomId, room] of liveGDRooms.entries()) {
        const leavingUser = room.users.find(
          (user) => user.socketId === socket.id
        )

        room.users = room.users.filter((user) => user.socketId !== socket.id)

        room.pending = room.pending.filter(
          (user) => user.socketId !== socket.id
        )

        if (room.hostSocketId === socket.id) {
          const nextHost = room.users.find(
            (user) => user.socketId !== socket.id
          )

          if (nextHost) {
            room.hostSocketId = nextHost.socketId
            room.hostUserId = nextHost.userId

            room.users = room.users.map((user) =>
              user.socketId === nextHost.socketId
                ? {
                    ...user,
                    role: "Host",
                    isHost: true
                  }
                : user
            )

            io.to(nextHost.socketId).emit("live-gd-host-transferred", {
              message: "You are now the meeting host."
            })
          } else {
            room.hostSocketId = null
            room.hostUserId = ""
          }
        }

        if (room.users.length === 0 && room.pending.length === 0) {
          liveGDRooms.delete(roomId)
        } else {
          liveGDRooms.set(roomId, room)
          emitRoomState(io, roomId)
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