const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const mongoose = require('mongoose');
const typeDefs = require('./graphql/typeDefs');
const resolvers = require('./graphql/resolvers');
const { graphqlUploadExpress } = require('graphql-upload');
const Message = require('./models/Message');
require('dotenv').config();
const path = require('path');
const cors = require("cors");
const http = require('http');
const authMiddleware = require('./auth');
const io = require('./socket');

const app = express();
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));
const PORT = process.env.PORT || 5000;



// Add the graphql-upload middleware
app.use(graphqlUploadExpress({ maxFileSize: 10000000, maxFiles: 10 }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Get message history
app.get('/messages', authMiddleware , async (req, res) => {
  const messages = await Message.find({
    $or: [
      { from: req.user.id, to: req.query.recipient },
      { from: req.query.recipient, to: req.user.id }
    ],
    property: req.query.property
  }).sort('createdAt');

  res.json(messages);
});

// Get realtor conversations
app.get('/conversations', authMiddleware, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id); // Convert to ObjectId

    const conversations = await Message.aggregate([
      { 
        $match: { 
          $or: [
            { to: userId },
            { from: userId }
          ]
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'from',
          foreignField: '_id',
          as: 'fromUser'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'to',
          foreignField: '_id',
          as: 'toUser'
        }
      },
      {
        $lookup: {
          from: 'properties',
          localField: 'property',
          foreignField: '_id',
          as: 'propertyInfo'
        }
      },
      { 
        $addFields: {
          otherParty: {
            $cond: [
              { $eq: ["$from", userId] },
              "$to",
              "$from"
            ]
          },
          propertyTitle: { $arrayElemAt: ["$propertyInfo.title", 0] }
        }
      },
      { 
        $group: { 
          _id: {
            property: "$property",
            otherParty: "$otherParty"
          },
          lastMessage: { $last: "$$ROOT" },
          unread: { 
            $sum: { 
              $cond: [
                { 
                  $and: [
                    { $eq: ["$to", userId] },
                    { $eq: ["$read", false] }
                  ]
                }, 
                1, 
                0
              ] 
            } 
          },
          propertyTitle: { $first: "$propertyTitle" }
        }
      },
      {
        $project: {
          _id: 0,
          property: "$_id.property",
          propertyTitle: 1,
          client: "$_id.otherParty",
          lastMessage: 1,
          unread: 1
        }
      }
    ]);

    console.log('Conversations:', conversations);
    res.json(conversations);
  } catch (err) {
    console.error('Error fetching conversations:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/messages/read', authMiddleware, async (req, res) => {
  try {
    await Message.updateMany(
      { _id: { $in: req.body.messageIds } },
      { $set: { read: true } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Error updating read status' });
  }
});


const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => ({ req }),
});

server.start().then(() => {
  server.applyMiddleware({ app });

  mongoose
    .connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => {
      console.log('MongoDB Connected');
      
      // Create HTTP server
      const httpServer = http.createServer(app);

      httpServer.on('error', (error) => {
        console.error('Server error:', error);
      });
      
      
      // Initialize Socket.io
      const io = require('./socket')(httpServer);
      
      // Start server
      httpServer.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`GraphQL endpoint: ${server.graphqlPath}`);
        console.log(`WebSocket endpoint: ws://localhost:${PORT}`);
      });
    })
    .catch((err) => console.error(err));
});
