import React, { useCallback, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import ChatWindow from './ChatWindow';

const RealtorChat = () => {
  const [conversations, setConversations] = React.useState([]);
  const [openChats, setOpenChats] = React.useState({});
  const socketRef = React.useRef(null);
  const messageHandlersRef = React.useRef([]);

  // Connect socket and fetch conversations on mount
  useEffect(() => {
    socketRef.current = io("http://localhost:5373", {
      auth: { token: localStorage.getItem('token') }
    });

    const fetchConversations = async () => {
      try {
        const response = await fetch('http://localhost:5373/conversations', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await response.json();
        setConversations(data);

        // Automatically open unread conversations
        const unreadChats = data.reduce((acc, convo) => {
          if (convo.unread > 0) acc[convo.property] = true;
          return acc;
        }, {});
        setOpenChats(unreadChats);
      } catch (err) {
        console.error('Error fetching conversations:', err);
      }
    };

    fetchConversations();

    // Clean up on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Set up socket event listeners centrally
  useEffect(() => {
    if (!socketRef.current) return;

    // Handle new messages at the parent level
    const handleNewMessage = (message) => {
      console.log('New message received:', message);
      
      // Update conversations if needed
      setConversations(prev => {
        // Find the conversation this message belongs to
        const conversationIndex = prev.findIndex(
          convo => convo.property.toString() === message.property.toString()
        );
        
        if (conversationIndex >= 0) {
          const newConversations = [...prev];
          const conversation = { ...newConversations[conversationIndex] };
          
          // Update last message - make sure fromUser is properly initialized
          // This prevents the error when fromUser is undefined
          conversation.lastMessage = {
            ...message,
            fromUser: message.fromUser || [] // Ensure fromUser is at least an empty array
          };
          
          // Update unread count if the chat isn't open
          if (!openChats[message.property] && message.from !== 'self') {
            conversation.unread = (conversation.unread || 0) + 1;
          }
          
          newConversations[conversationIndex] = conversation;
          return newConversations;
        }
        
        return prev;
      });
      
      // Notify all registered message handlers
      messageHandlersRef.current.forEach(handler => handler(message));
    };

    socketRef.current.on('newMessage', handleNewMessage);
    socketRef.current.on('messageDelivered', handleNewMessage);

    return () => {
      socketRef.current.off('newMessage', handleNewMessage);
      socketRef.current.off('messageDelivered', handleNewMessage);
    };
  }, [openChats]);

  // Register message handlers from child components
  const registerMessageHandler = useCallback((handler) => {
    messageHandlersRef.current.push(handler);
    return () => {
      messageHandlersRef.current = messageHandlersRef.current.filter(h => h !== handler);
    };
  }, []);

  const toggleChat = (propertyId) => {
    setOpenChats(prev => ({
      ...prev,
      [propertyId]: !prev[propertyId]
    }));
  };

  const updateUnreadCount = useCallback((propertyId, count) => {
    setConversations(prev => {
      const newConversations = [...prev];
      const convoIndex = newConversations.findIndex(c => c.property.toString() === propertyId.toString());
      if (convoIndex !== -1) {
        newConversations[convoIndex] = {
          ...newConversations[convoIndex],
          unread: count
        };
      }
      return newConversations;
    });
  }, []);

  // Helper function to safely get recipient name
  const getRecipientName = (convo) => {
    // Check if lastMessage and fromUser exist and have data
    if (convo.lastMessage?.fromUser && Array.isArray(convo.lastMessage.fromUser) && convo.lastMessage.fromUser[0]) {
      return convo.lastMessage.fromUser[0].firstName;
    }
    
    // Fallback to client ID if available, or default
    return convo.client ? `Client-${convo.client.toString().slice(-4)}` : 'Client';
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-row-reverse flex-wrap-reverse gap-2 items-end">
      {conversations.map(convo => (
        <ChatWindow
          key={convo.property}
          isOpen={!!openChats[convo.property]}
          onToggle={() => toggleChat(convo.property)}
          recipient={{
            id: convo.client,
            name: getRecipientName(convo),
            avatar: convo.lastMessage?.fromUser?.[0]?.profilePicture || null
          }}
          property={convo.property}
          propertyTitle={convo.propertyTitle || `Property ${convo.property}`}
          unread={convo.unread}
          setUnread={(count) => updateUnreadCount(convo.property, count)}
          lastMessage={convo.lastMessage?.content}
          socket={socketRef.current}
          onMessageReceived={registerMessageHandler}
        />
      ))}
    </div>
  );
};

export default RealtorChat;