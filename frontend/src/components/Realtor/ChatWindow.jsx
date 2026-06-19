// ChatWindow.jsx
import React, { useState, useEffect, useRef, useContext } from 'react';
import { FaComment, FaTimes, FaCaretUp } from 'react-icons/fa';
import { ThemeContext } from '../Realtor/ThemeContext';

const ChatWindow = ({ isOpen, onToggle, recipient, property, unread, setUnread, lastMessage, socket, propertyTitle, onMessageReceived }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const tempIdRef = useRef(0);
  const messagesEndRef = useRef(null);
  const { themeClasses } = useContext(ThemeContext);
  
  // Fetch messages when the chat window is opened
  useEffect(() => {
    if (!isOpen) return;
    
    const fetchMessages = async () => {
      try {
        const response = await fetch(`http://localhost:5373/messages?recipient=${recipient.id}&property=${property}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await response.json();
        setMessages(data);
        setUnread(0); // Reset unread counter when messages are viewed
      } catch (err) {
        console.error('Error fetching messages:', err);
      }
    };

    fetchMessages();
  }, [isOpen, property, recipient.id, setUnread]);

  // Handle new incoming messages
  useEffect(() => {
    // This useEffect ensures messages state stays synchronized with parent component
    if (onMessageReceived) {
      const handler = (message) => {
        if (message.property.toString() === property.toString() && 
            (message.from === recipient.id || message.to === recipient.id)) {
          setMessages(prev => {
            const existingIndex = prev.findIndex(m => m.tempId === message.tempId || m._id === message._id);
            if (existingIndex > -1) {
              const newMessages = [...prev];
              newMessages[existingIndex] = message;
              return newMessages;
            }
            return [...prev, message];
          });
        }
      };
      
      onMessageReceived(handler);
    }
  }, [onMessageReceived, property, recipient.id]);

  // Auto scroll to bottom whenever messages update
  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const tempId = tempIdRef.current++;
    const tempMessage = {
      _id: `temp-${tempId}`,
      tempId,
      to: recipient.id,
      content: newMessage,
      propertyId: property,
      from: 'self',
      isTemp: true,
      createdAt: new Date()
    };

    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');

    socket.emit('sendMessage', {
      ...tempMessage,
      propertyId: property,
      tempId,
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-xl overflow-hidden">
      {!isOpen ? (
        <button 
          onClick={onToggle}
          className={`flex items-center gap-2 ${themeClasses.primaryBg} text-white px-4 py-2 w-64 justify-between`}
        >
          <div className="flex items-center gap-2">
            {recipient.avatar && (
              <img src={recipient.avatar} alt={recipient.name} 
                   className="w-6 h-6 rounded-full object-cover" />
            )}
            <span>{recipient.name}</span>
          </div>
          <div className="flex items-center gap-2">
            {unread > 0 && (
              <span className="bg-red-500 text-white rounded-full px-2 py-1 text-xs">
                {unread}
              </span>
            )}
            <FaCaretUp />
          </div>
        </button>
      ) : (
        <div className="w-80">
          <div className={`${themeClasses.primaryBg} text-white p-4 flex justify-between items-center`}>
            <div className="flex items-center gap-2">
              {recipient.avatar && (
                <img src={recipient.avatar} alt={recipient.name} 
                     className="w-8 h-8 rounded-full object-cover" />
              )}
              <div>
                <h3 className="font-semibold">{recipient.name}</h3>
                <p className="text-sm">{propertyTitle}</p>
              </div>
            </div>
            <button onClick={onToggle} className="hover:text-blue-200">
              <FaTimes />
            </button>
          </div>
          
          <div className="h-64 overflow-y-auto p-4 bg-gray-50">
            {messages.map((msg, i) => (
              <div key={i} className={`mb-4 ${msg.from === recipient.id ? 'text-left' : 'text-right'}`}>
                <div className={`inline-block p-2 rounded-lg ${
                  msg.from === recipient.id ? 'bg-white shadow' : `${themeClasses.primaryBg} text-white`
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="p-4 border-t">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="w-full p-2 border rounded focus:outline-none focus:border-blue-500"
            />
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
