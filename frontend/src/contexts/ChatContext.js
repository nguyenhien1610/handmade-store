// /home/huyen/handmade-store/frontend/src/contexts/ChatContext.js
import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import chatService from '../api/chatService';
import authService from '../api/authService';

// Initial state
const initialState = {
  messages: [],
  isConnected: false,
  isLoading: false,
  isTyping: false,
  adminTyping: false,
  unreadCount: 0,
  chatStatus: {
    isAdminOnline: false,
    adminResponseTime: 'Trong vòng 24h',
    storeInfo: null
  },
  error: null,
  quickQuestions: []
};

// Action types
const CHAT_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_CONNECTED: 'SET_CONNECTED',
  SET_MESSAGES: 'SET_MESSAGES',
  ADD_MESSAGE: 'ADD_MESSAGE',
  UPDATE_MESSAGE: 'UPDATE_MESSAGE',
  SET_TYPING: 'SET_TYPING',
  SET_ADMIN_TYPING: 'SET_ADMIN_TYPING',
  SET_UNREAD_COUNT: 'SET_UNREAD_COUNT',
  SET_CHAT_STATUS: 'SET_CHAT_STATUS',
  SET_ERROR: 'SET_ERROR',
  SET_QUICK_QUESTIONS: 'SET_QUICK_QUESTIONS',
  CLEAR_ERROR: 'CLEAR_ERROR',
  RESET_CHAT: 'RESET_CHAT'
};

// Reducer
const chatReducer = (state, action) => {
  switch (action.type) {
    case CHAT_ACTIONS.SET_LOADING:
      return { ...state, isLoading: action.payload };
    
    case CHAT_ACTIONS.SET_CONNECTED:
      return { ...state, isConnected: action.payload };
    
    case CHAT_ACTIONS.SET_MESSAGES:
      return { ...state, messages: action.payload };
    
    case CHAT_ACTIONS.ADD_MESSAGE:
      return { 
        ...state, 
        messages: [...state.messages, action.payload],
        unreadCount: action.payload.sender === 'admin' ? state.unreadCount + 1 : state.unreadCount
      };
    
    case CHAT_ACTIONS.UPDATE_MESSAGE:
      return {
        ...state,
        messages: state.messages.map(msg => 
          msg.id === action.payload.id ? { ...msg, ...action.payload } : msg
        )
      };
    
    case CHAT_ACTIONS.SET_TYPING:
      return { ...state, isTyping: action.payload };
    
    case CHAT_ACTIONS.SET_ADMIN_TYPING:
      return { ...state, adminTyping: action.payload };
    
    case CHAT_ACTIONS.SET_UNREAD_COUNT:
      return { ...state, unreadCount: action.payload };
    
    case CHAT_ACTIONS.SET_CHAT_STATUS:
      return { ...state, chatStatus: { ...state.chatStatus, ...action.payload } };
    
    case CHAT_ACTIONS.SET_ERROR:
      return { ...state, error: action.payload };
    
    case CHAT_ACTIONS.SET_QUICK_QUESTIONS:
      return { ...state, quickQuestions: action.payload };
    
    case CHAT_ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };
    
    case CHAT_ACTIONS.RESET_CHAT:
      return { ...initialState };
    
    default:
      return state;
  }
};

// Create context
const ChatContext = createContext();

// Provider component
export const ChatProvider = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const user = authService.getClientUser();

  // Initialize socket connection
  useEffect(() => {
    if (user) {
      initializeSocket();
      loadChatData();
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [user]);

  // Initialize socket
  const initializeSocket = () => {
    try {
      socketRef.current = chatService.initSocket();
      
      if (socketRef.current) {
        // Connection events
        socketRef.current.on('connect', () => {
          dispatch({ type: CHAT_ACTIONS.SET_CONNECTED, payload: true });
          if (user) {
            chatService.joinChatRoom(socketRef.current, user.id);
          }
        });

        socketRef.current.on('disconnect', () => {
          dispatch({ type: CHAT_ACTIONS.SET_CONNECTED, payload: false });
        });

        // Message events
        socketRef.current.on('receive-admin-message', (data) => {
          const formattedMessage = chatService.formatMessage(data.message);
          dispatch({ type: CHAT_ACTIONS.ADD_MESSAGE, payload: formattedMessage });
          
          // Show notification
          chatService.createNotification(formattedMessage);
        });

        socketRef.current.on('message-sent', (data) => {
          dispatch({ 
            type: CHAT_ACTIONS.UPDATE_MESSAGE, 
            payload: { ...data, status: 'sent' }
          });
        });

        // Typing events
        socketRef.current.on('admin-typing', (data) => {
          dispatch({ type: CHAT_ACTIONS.SET_ADMIN_TYPING, payload: data.isTyping });
        });

        // Status events
        socketRef.current.on('admin-status-changed', (data) => {
          dispatch({ 
            type: CHAT_ACTIONS.SET_CHAT_STATUS, 
            payload: { isAdminOnline: data.isOnline }
          });
        });
      }
    } catch (error) {
      console.error('Error initializing socket:', error);
      dispatch({ type: CHAT_ACTIONS.SET_ERROR, payload: 'Không thể kết nối với server' });
    }
  };

  // Load initial chat data
  const loadChatData = async () => {
    try {
      dispatch({ type: CHAT_ACTIONS.SET_LOADING, payload: true });
      
      // Load chat history
      const historyResponse = await chatService.getCustomerChatHistory();
      if (historyResponse.success) {
        const formattedMessages = historyResponse.data.map(chatService.formatMessage);
        dispatch({ type: CHAT_ACTIONS.SET_MESSAGES, payload: formattedMessages });
      }

      // Load chat status
      const statusResponse = await chatService.getChatStatus();
      if (statusResponse.success) {
        dispatch({ type: CHAT_ACTIONS.SET_CHAT_STATUS, payload: statusResponse.data });
      }

      // Load unread count
      const unreadResponse = await chatService.getUnreadCount();
      if (unreadResponse.success) {
        dispatch({ type: CHAT_ACTIONS.SET_UNREAD_COUNT, payload: unreadResponse.data.unreadCount });
      }

      // Load quick questions
      const questionsResponse = await chatService.getQuickQuestions();
      if (questionsResponse.success) {
        dispatch({ type: CHAT_ACTIONS.SET_QUICK_QUESTIONS, payload: questionsResponse.data });
      }

    } catch (error) {
      console.error('Error loading chat data:', error);
      dispatch({ type: CHAT_ACTIONS.SET_ERROR, payload: 'Không thể tải dữ liệu chat' });
    } finally {
      dispatch({ type: CHAT_ACTIONS.SET_LOADING, payload: false });
    }
  };

  // Send message
  const sendMessage = async (messageContent) => {
    try {
      // Validate message
      const validation = chatService.validateMessage(messageContent);
      if (!validation.valid) {
        dispatch({ type: CHAT_ACTIONS.SET_ERROR, payload: validation.error });
        return false;
      }

      // Add temporary message with pending status
      const tempMessage = {
        id: Date.now(),
        content: validation.message,
        sender: 'customer',
        createdAt: new Date().toISOString(),
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        isFromCustomer: true,
        status: 'sending'
      };
      
      dispatch({ type: CHAT_ACTIONS.ADD_MESSAGE, payload: tempMessage });

      // Send to backend
      const response = await chatService.sendCustomerMessage(validation.message);
      
      if (response.success) {
        // Update message with real data
        const realMessage = chatService.formatMessage(response.data);
        dispatch({ 
          type: CHAT_ACTIONS.UPDATE_MESSAGE, 
          payload: { ...realMessage, status: 'sent' }
        });
        return true;
      } else {
        dispatch({ type: CHAT_ACTIONS.SET_ERROR, payload: response.message });
        return false;
      }
    } catch (error) {
      console.error('Error sending message:', error);
      dispatch({ type: CHAT_ACTIONS.SET_ERROR, payload: 'Không thể gửi tin nhắn' });
      return false;
    }
  };

  // Start chat
  const startChat = async () => {
    try {
      dispatch({ type: CHAT_ACTIONS.SET_LOADING, payload: true });
      
      const response = await chatService.startChat();
      if (response.success) {
        const formattedMessages = response.data.messages.map(chatService.formatMessage);
        dispatch({ type: CHAT_ACTIONS.SET_MESSAGES, payload: formattedMessages });
        return true;
      } else {
        dispatch({ type: CHAT_ACTIONS.SET_ERROR, payload: response.message });
        return false;
      }
    } catch (error) {
      console.error('Error starting chat:', error);
      dispatch({ type: CHAT_ACTIONS.SET_ERROR, payload: 'Không thể bắt đầu chat' });
      return false;
    } finally {
      dispatch({ type: CHAT_ACTIONS.SET_LOADING, payload: false });
    }
  };

  // Mark messages as read
  const markAsRead = async () => {
    try {
      const response = await chatService.markCustomerMessagesAsRead();
      if (response.success) {
        dispatch({ type: CHAT_ACTIONS.SET_UNREAD_COUNT, payload: 0 });
      }
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  // Send typing status
  const setTyping = async (isTyping) => {
    try {
      dispatch({ type: CHAT_ACTIONS.SET_TYPING, payload: isTyping });
      
      // Send to socket
      if (socketRef.current) {
        chatService.emitTyping(socketRef.current, user?.id, isTyping);
      }

      // Send to API
      await chatService.sendTypingStatus(isTyping);

      // Auto stop typing after 3 seconds
      if (isTyping) {
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
          setTyping(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Error setting typing status:', error);
    }
  };

  // Send quick question
  const sendQuickQuestion = async (question) => {
    return await sendMessage(question.message);
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: CHAT_ACTIONS.CLEAR_ERROR });
  };

  // Refresh chat data
  const refreshChat = async () => {
    await loadChatData();
  };

  const value = {
    ...state,
    sendMessage,
    startChat,
    markAsRead,
    setTyping,
    sendQuickQuestion,
    clearError,
    refreshChat,
    isUserLoggedIn: !!user
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

// Hook to use chat context
export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export default ChatContext;