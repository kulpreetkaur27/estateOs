import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { FaComment, FaTimes, FaMinus } from 'react-icons/fa';

const Chat = ({ recipient, propertyId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [unread, setUnread] = useState(0);
  const socketRef = useRef(null);
  const containerRef = useRef(null); // container for messages
  const tempIdRef = useRef(0);
  const currentUserId = useRef(null); // Store current user ID

  // Connect to Socket.io and fetch user data
  useEffect(() => {
    // Get current user ID from token
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // Extract user ID from JWT if possible (basic extraction)
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        const payload = JSON.parse(jsonPayload);
        currentUserId.current = payload.id;
      } catch (error) {
        console.error("Error extracting user ID from token:", error);
      }
    }

    // Connect to Socket.io
    socketRef.current = io("http://localhost:5373", {
      auth: { token: localStorage.getItem('token') }
    });

    // Load message history on initial load
    const fetchMessages = async () => {
      try {
        const response = await fetch(
          `http://localhost:5373/messages?recipient=${recipient.id}&property=${propertyId}`,
          {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          }
        );
        const data = await response.json();
        setMessages(data);
      } catch (err) {
        console.error('Error fetching messages:', err);
      }
    };

    fetchMessages();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [recipient.id, propertyId]);

  // Set up socket event listeners
  useEffect(() => {
    if (!socketRef.current) return;

    // Debug connection state
    socketRef.current.on('connect', () => {
      console.log('Socket connected successfully');
    });

    socketRef.current.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    socketRef.current.on('error', (error) => {
      console.error('Socket error:', error);
    });

    // Message handlers with improved logging and error handling
    const handleNewMessage = (message) => {
      console.log('New message received in client:', message);
      
      // Normalize property references
      const messagePropertyId = message.property?.toString() || message.propertyId?.toString();
      const currentPropertyId = propertyId?.toString();
      
      // Debug the IDs to verify matching
      console.log('Message property ID:', messagePropertyId);
      console.log('Current property ID:', currentPropertyId);
      console.log('Message from:', message.from, 'to:', message.to);
      console.log('Current user ID:', currentUserId.current);
      console.log('Recipient ID:', recipient.id);
      
      // Check if message belongs to this conversation
      // We need to verify it's for the right property AND involves the current conversation
      if (messagePropertyId === currentPropertyId) {
        // Message is either TO current user FROM recipient, or FROM current user TO recipient
        const fromRecipient = message.from === recipient.id;
        const toRecipient = message.to === recipient.id;
        const fromSelf = message.from === currentUserId.current || message.from === 'self';
        const toSelf = message.to === currentUserId.current;
        
        console.log('From recipient:', fromRecipient);
        console.log('To recipient:', toRecipient);
        console.log('From self:', fromSelf);
        console.log('To self:', toSelf);
        
        // Message is part of this conversation if it's between current user and recipient
        if ((fromRecipient && toSelf) || (fromSelf && toRecipient)) {
          console.log('Message belongs to this conversation - adding to state');
          
          setMessages(prev => {
            // Check for duplicates using both tempId and _id
            const existingIndex = prev.findIndex(m => 
              (m.tempId && m.tempId === message.tempId) || 
              (m._id && m._id === message._id)
            );
            
            if (existingIndex > -1) {
              const newMessages = [...prev];
              newMessages[existingIndex] = message;
              return newMessages;
            }
            return [...prev, message];
          });
          
          // Increment unread count if chat is not open and message is from recipient
          if (!isOpen && fromRecipient) {
            setUnread(prev => prev + 1);
          }
        } else {
          console.log('Message is not for this conversation');
        }
      } else {
        console.log('Message property does not match current property');
      }
    };

    const handleMessageError = (error) => {
      console.error('Message error:', error);
      setMessages(prev => prev.filter(msg => msg.tempId !== error.tempId));
    };

    const handleMessageDelivered = (message) => {
      console.log('Message delivered:', message);
      
      // Update temp messages with confirmed ones
      setMessages(prev => {
        const newMessages = [...prev];
        const index = newMessages.findIndex(m => m.tempId === message.tempId);
        if (index !== -1) {
          newMessages[index] = message;
        }
        return newMessages;
      });
    };

    // Register event handlers
    socketRef.current.on('newMessage', handleNewMessage);
    socketRef.current.on('messageError', handleMessageError);
    socketRef.current.on('messageDelivered', handleMessageDelivered);

    return () => {
      socketRef.current.off('newMessage', handleNewMessage);
      socketRef.current.off('messageError', handleMessageError);
      socketRef.current.off('messageDelivered', handleMessageDelivered);
    };
  }, [isOpen, propertyId, recipient.id]);

  // Reset unread counter when opening chat
  useEffect(() => {
    if (isOpen) {
      setUnread(0);
    }
  }, [isOpen]);

  // Auto scroll to the bottom whenever messages change or chat is opened
  useEffect(() => {
    if (containerRef.current && isOpen) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    // Create temporary message
    const tempId = tempIdRef.current++;
    const tempMessage = {
      _id: `temp-${tempId}`,
      tempId,
      to: recipient.id,
      content: newMessage,
      propertyId,
      from: 'self',
      isTemp: true,
      createdAt: new Date()
    };

    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');

    // Send through socket
    socketRef.current.emit('sendMessage', {
      ...tempMessage,
      propertyId
    });
  };

  // Add polling as a backup mechanism
  useEffect(() => {
    if (!isOpen) return;
    
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(
          `http://localhost:5373/messages?recipient=${recipient.id}&property=${propertyId}`,
          {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          }
        );
        const data = await response.json();
        
        // Compare with current messages and update if different
        setMessages(prev => {
          // If we have different message counts, use server data
          if (prev.length !== data.length) return data;
          
          // Otherwise check for message ID differences
          const serverIds = new Set(data.map(msg => msg._id));
          const hasNewMessages = prev.some(msg => 
            msg._id && !msg._id.startsWith('temp-') && !serverIds.has(msg._id)
          );
          
          return hasNewMessages ? data : prev;
        });
      } catch (err) {
        console.error('Error polling messages:', err);
      }
    }, 5000); // Poll every 5 seconds
    
    return () => clearInterval(pollInterval);
  }, [isOpen, propertyId, recipient.id]);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen ? (
        <button onClick={() => setIsOpen(true)} 
          className="bg-blue-600 p-4 rounded-full shadow-lg relative hover:bg-blue-700 transition">
          <FaComment className="text-white text-xl" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
              {unread}
            </span>
          )}
        </button>
      ) : (
        <div className="bg-white rounded-lg shadow-xl w-80">
          <div className="bg-blue-600 text-white p-4 rounded-t-lg flex justify-between items-center">
            <div className="flex items-center gap-2">
              {recipient.profilePicture && (
                <img
                  src={recipient.profilePicture}
                  alt={`${recipient.firstName}'s profile`}
                  className="w-8 h-8 rounded-full object-cover"
                />
              )}
              <h3 className="font-semibold">Chat with {recipient.firstName}</h3>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setIsOpen(false)}>
                <FaMinus className="hover:text-blue-200" />
              </button>
              <button onClick={() => setIsOpen(false)}>
                <FaTimes className="hover:text-blue-200" />
              </button>
            </div>
          </div>
          
          {/* Use containerRef for scrolling */}
          <div ref={containerRef} className="h-64 overflow-y-auto p-4">
            {messages.map((msg, i) => (
              <div key={i} className={`mb-4 ${msg.from === recipient.id ? 'text-left' : 'text-right'}`}>
                <div className={`inline-block p-2 rounded-lg ${
                  msg.from === recipient.id ? 'bg-gray-100' : 'bg-blue-600 text-white'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSend} className="p-4 border-t">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="w-full p-2 border rounded focus:outline-none focus:border-blue-500"
            />
            <button type="submit" className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Chat;