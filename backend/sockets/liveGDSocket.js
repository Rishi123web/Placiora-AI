const MAX_LIVE_GD_MEMBERS = 5

const liveGDRooms = new Map()

const makeKey = ({ userId = "", email = "", socketId = "" }) =>
  userId || email || socketId

const getRoom = (roomId) => {
  if (!liveGDRooms.has(roomId)) {
    liveGDRooms.set(roomId, {
      users: [],
      pending: [],
      hostSocketId: "",
      hostUserId: "",
      meetingStatus: "waiting"
    })
  }

  return liveGDRooms.get(roomId)
}

const publicUser = (user) => ({
  socketId: user.socketId,
  userId: user.userId,
  name: user.name,
  email: user.email,
  role: user.role,
  isHost: user.isHost,
  micReady: user.micReady,
  cameraReady: user.cameraReady,
  micOn: user.micOn,
  cameraOn: user.cameraOn,
  approved: user.approved,
  status: user.status,
  joinedAt: user.joinedAt
})

const emitRoomState = (io, roomId) => {
  const room = getRoom(roomId)
  const users = room.users.map(publicUser)
  const humanUsers = users.filter((u) => u.role !== "AI Participant")

  io.to(roomId).emit("live-gd-users-updated", users)
  io.to(roomId).emit("live-gd-pending-updated", room.pending)

  io.to(roomId).emit("live-gd-room-state", {
    users,
    pending: room.pending,
    participants: users,
    pendingParticipants: room.pending,
    hostSocketId: room.hostSocketId,
    hostUserId: room.hostUserId,
    meetingStatus: room.meetingStatus,
    humanCount: humanUsers.length,
    maxMembers: MAX_LIVE_GD_MEMBERS,
    aiCount: Math.max(0, MAX_LIVE_GD_MEMBERS - humanUsers.length)
  })

  if (room.hostSocketId) {
    io.to(room.hostSocketId).emit("live-gd-pending-updated", room.pending)
  }
}

const setupLiveGDSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("Live GD socket connected:", socket.id)

    const hostJoinHandler = (payload = {}) => {
      const { roomId, userId = "", name = "Host", email = "" } = payload

      if (!roomId) {
        socket.emit("live-gd-error", { message: "Room ID is required." })
        return
      }

      socket.join(roomId)

      const room = getRoom(roomId)
      room.hostSocketId = socket.id
      room.hostUserId = userId || room.hostUserId

      const host = {
        socketId: socket.id,
        userId,
        name,
        email,
        role: "Host",
        isHost: true,
        micReady: true,
        cameraReady: true,
        micOn: true,
        cameraOn: true,
        approved: true,
        status: "approved",
        joinedAt: new Date()
      }

      room.users = room.users.filter((u) => makeKey(u) !== makeKey(host))
      room.users.unshift(host)

      liveGDRooms.set(roomId, room)

      socket.to(roomId).emit("live-gd-user-joined", publicUser(host))
      socket.emit("live-gd-existing-users", room.users.map(publicUser))

      emitRoomState(io, roomId)
    }

    socket.on("live-gd-host-join", hostJoinHandler)
    socket.on("live-gd-host-room", hostJoinHandler)

    socket.on("live-gd-request-join", (payload = {}) => {
      const {
        roomId,
        userId = "",
        name = "Participant",
        email = "",
        meetingCode = ""
      } = payload

      if (!roomId) {
        socket.emit("live-gd-error", { message: "Room ID is required." })
        return
      }

      const room = getRoom(roomId)

      const alreadyAdmitted = room.users.some(
        (u) =>
          u.socketId === socket.id ||
          (userId && u.userId === userId) ||
          (email && u.email === email)
      )

      if (alreadyAdmitted) {
        socket.join(roomId)

        socket.emit("live-gd-admitted", {
          roomId,
          users: room.users.map(publicUser)
        })

        socket.emit("live-gd-existing-users", room.users.map(publicUser))

        emitRoomState(io, roomId)
        return
      }

      const humanUsers = room.users.filter((u) => u.role !== "AI Participant")

      if (humanUsers.length >= MAX_LIVE_GD_MEMBERS) {
        socket.emit("live-gd-room-full", {
          message: "This GD meeting already has 5 real members."
        })
        return
      }

      const request = {
        socketId: socket.id,
        userId,
        name,
        email,
        meetingCode,
        role: "Participant",
        approved: false,
        status: "pending",
        requestedAt: new Date()
      }

      room.pending = room.pending.filter((item) => makeKey(item) !== makeKey(request))
      room.pending.push(request)

      liveGDRooms.set(roomId, room)

      socket.join(`waiting-${roomId}`)

      socket.emit("live-gd-waiting-room", {
        roomId,
        message: "Join request sent. Waiting for host approval."
      })

      socket.emit("live-gd-waiting-approval", {
        roomId,
        message: "Join request sent. Waiting for host approval."
      })

      if (room.hostSocketId) {
        io.to(room.hostSocketId).emit("live-gd-join-request", request)
      }

      emitRoomState(io, roomId)
    })

    const admitHandler = (payload = {}) => {
      const { roomId, socketId = "", userId = "", email = "" } = payload

      if (!roomId) return

      const room = getRoom(roomId)

      const request = room.pending.find((item) => {
        if (socketId && item.socketId === socketId) return true
        if (userId && item.userId === userId) return true
        if (email && item.email === email) return true
        return false
      })

      if (!request) return

      const humanUsers = room.users.filter((u) => u.role !== "AI Participant")

      if (humanUsers.length >= MAX_LIVE_GD_MEMBERS) {
        io.to(request.socketId).emit("live-gd-room-full", {
          message: "This GD meeting already has 5 real members."
        })
        return
      }

      const approvedUser = {
        socketId: request.socketId,
        userId: request.userId,
        name: request.name,
        email: request.email,
        role: "Participant",
        isHost: false,
        micReady: true,
        cameraReady: true,
        micOn: true,
        cameraOn: true,
        approved: true,
        status: "approved",
        joinedAt: new Date()
      }

      room.pending = room.pending.filter((item) => makeKey(item) !== makeKey(request))
      room.users = room.users.filter((u) => makeKey(u) !== makeKey(approvedUser))
      room.users.push(approvedUser)

      liveGDRooms.set(roomId, room)

      const admittedSocket = io.sockets.sockets.get(request.socketId)

      if (admittedSocket) {
        admittedSocket.join(roomId)
      }

      io.to(request.socketId).emit("live-gd-admitted", {
        roomId,
        users: room.users.map(publicUser),
        message: "Host approved your request."
      })

      io.to(request.socketId).emit("live-gd-existing-users", room.users.map(publicUser))

      socket.to(roomId).emit("live-gd-user-joined", publicUser(approvedUser))

      io.to(roomId).emit("live-gd-system-message", {
        speaker: "system",
        name: "System",
        role: "System",
        message: `${request.name} joined the GD meeting.`,
        createdAt: new Date()
      })

      emitRoomState(io, roomId)
    }

    socket.on("live-gd-admit-user", admitHandler)
    socket.on("live-gd-approve-user", admitHandler)

    socket.on("live-gd-reject-user", (payload = {}) => {
      const { roomId, socketId = "", userId = "", email = "" } = payload

      if (!roomId) return

      const room = getRoom(roomId)

      const request = room.pending.find((item) => {
        if (socketId && item.socketId === socketId) return true
        if (userId && item.userId === userId) return true
        if (email && item.email === email) return true
        return false
      })

      if (request) {
        io.to(request.socketId).emit("live-gd-rejected", {
          message: "Host rejected your request."
        })
      }

      room.pending = room.pending.filter((item) => {
        if (socketId && item.socketId === socketId) return false
        if (userId && item.userId === userId) return false
        if (email && item.email === email) return false
        return true
      })

      liveGDRooms.set(roomId, room)
      emitRoomState(io, roomId)
    })

    socket.on("live-gd-join-room", (payload = {}) => {
      const {
        roomId,
        userId = "",
        name = "Participant",
        email = "",
        role = "Participant"
      } = payload

      if (!roomId) {
        socket.emit("live-gd-error", { message: "Room ID is required." })
        return
      }

      socket.join(roomId)

      const room = getRoom(roomId)

      const userData = {
        socketId: socket.id,
        userId,
        name,
        email,
        role,
        isHost: role === "Host",
        micReady: true,
        cameraReady: true,
        micOn: true,
        cameraOn: true,
        approved: true,
        status: "approved",
        joinedAt: new Date()
      }

      room.users = room.users.filter((u) => makeKey(u) !== makeKey(userData))
      room.users.push(userData)

      liveGDRooms.set(roomId, room)

      socket.to(roomId).emit("live-gd-user-joined", publicUser(userData))
      socket.emit("live-gd-existing-users", room.users.map(publicUser))

      emitRoomState(io, roomId)
    })

    socket.on("live-gd-device-ready", (payload = {}) => {
      const {
        roomId,
        micReady = false,
        cameraReady = false,
        micOn = true,
        cameraOn = true
      } = payload

      if (!roomId || !liveGDRooms.has(roomId)) return

      const room = getRoom(roomId)

      room.users = room.users.map((user) =>
        user.socketId === socket.id
          ? {
              ...user,
              micReady,
              cameraReady,
              micOn,
              cameraOn
            }
          : user
      )

      liveGDRooms.set(roomId, room)

      socket.to(roomId).emit("live-gd-device-state", {
        socketId: socket.id,
        micReady,
        cameraReady,
        micOn,
        cameraOn
      })

      emitRoomState(io, roomId)
    })

    socket.on("live-gd-webrtc-offer", ({ to, offer, roomId }) => {
      if (!to || !offer) return

      io.to(to).emit("live-gd-webrtc-offer", {
        from: socket.id,
        offer,
        roomId
      })
    })

    socket.on("live-gd-webrtc-answer", ({ to, answer, roomId }) => {
      if (!to || !answer) return

      io.to(to).emit("live-gd-webrtc-answer", {
        from: socket.id,
        answer,
        roomId
      })
    })

    socket.on("live-gd-webrtc-ice-candidate", ({ to, candidate, roomId }) => {
      if (!to || !candidate) return

      io.to(to).emit("live-gd-webrtc-ice-candidate", {
        from: socket.id,
        candidate,
        roomId
      })
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
        const leavingUser = room.users.find((user) => user.socketId === socket.id)

        room.users = room.users.filter((user) => user.socketId !== socket.id)
        room.pending = room.pending.filter((user) => user.socketId !== socket.id)

        if (room.hostSocketId === socket.id) {
          const nextHost = room.users[0]

          if (nextHost) {
            room.hostSocketId = nextHost.socketId
            room.hostUserId = nextHost.userId
            room.users = room.users.map((user) =>
              user.socketId === nextHost.socketId
                ? { ...user, role: "Host", isHost: true }
                : user
            )

            io.to(nextHost.socketId).emit("live-gd-host-transferred", {
              message: "You are now the meeting host."
            })
          } else {
            room.hostSocketId = ""
            room.hostUserId = ""
          }
        }

        socket.to(roomId).emit("live-gd-user-left", {
          socketId: socket.id
        })

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