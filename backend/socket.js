const { Server } = require("socket.io");
const Message = require("./models/Message"); 
const User = require("./models/User");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const configureSocket = (httpServer) => {
  console.log("Configuring Socket.io...");
  const io = new Server(httpServer, {
    cors: {
      origin: "http://localhost:5173", // Add your client origin
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error("Authentication error: Missing token"));
      
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Convert string ID to ObjectId if necessary
      const userId = typeof decoded.id === 'string' 
        ? new mongoose.Types.ObjectId(decoded.id) 
        : decoded.id;
      
      const user = await User.findById(userId);
      
      if (!user) return next(new Error("User not found"));
      
      // Store user info in socket
      socket.user = {
        _id: user._id,
        id: user._id.toString(), // Store as string too for consistency
        role: user.role || 'client' // Ensure we have role info
      };
      
      console.log(`User authenticated on socket: ${socket.id}, UserId: ${socket.user.id}`);
      next();
    } catch (err) {
      console.error("Socket authentication error:", err);
      next(new Error("Authentication failed: " + err.message));
    }
  });

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id} - User ID: ${socket.user.id}`);

    // Join user's personal room using string ID
    const userRoom = socket.user.id.toString();
    socket.join(userRoom);
    console.log(`User ${socket.user.id} joined room: ${userRoom}`);

    // Handle message events
    socket.on("sendMessage", async (message) => {
      try {
        console.log("Received sendMessage event:", message);
        
        // Ensure we have a valid recipient
        if (!message.to) {
          socket.emit("messageError", { 
            error: "Invalid recipient", 
            tempId: message.tempId 
          });
          return;
        }
        
        // Convert IDs to mongoose ObjectIds if they're strings
        const fromId = socket.user._id;
        const toId = typeof message.to === 'string' 
          ? new mongoose.Types.ObjectId(message.to) 
          : message.to;
        
        const propertyId = typeof message.propertyId === 'string' 
          ? new mongoose.Types.ObjectId(message.propertyId) 
          : message.propertyId;
        
        // Create new message document
        const newMessage = new Message({
          from: fromId,
          to: toId,
          content: message.content,
          property: propertyId, // Use consistent field name
          createdAt: new Date()
        });
        
        // Save to database
        await newMessage.save();
        console.log("New message saved:", newMessage._id);
        
        // Get populated message with user details if needed
        const populatedMessage = await Message.findById(newMessage._id)
          .populate('from', 'firstName lastName profilePicture')
          .populate('to', 'firstName lastName profilePicture');

        // Convert document to a plain object
        const messageToSend = populatedMessage.toObject();
        
        // Add both property and propertyId fields for backward compatibility
        messageToSend.propertyId = messageToSend.property;
        
        // Emit to recipient's room
        const recipientRoom = toId.toString();
        console.log(`Emitting message to recipient in room: ${recipientRoom}`);
        io.to(recipientRoom).emit("newMessage", messageToSend);
        
        // Emit back to sender for confirmation with tempId for tracking
        messageToSend.tempId = message.tempId;
        socket.emit("messageDelivered", messageToSend);
        
        console.log("Message event processing complete");
      } catch (err) {
        console.error("Error processing message:", err);
        socket.emit("messageError", { 
          error: err.message, 
          tempId: message.tempId 
        });
      }
    });

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });

  io.on("connection_error", (err) => {
    console.log(`Connection error: ${err.message}`);
  });

  return io;
};

module.exports = configureSocket;