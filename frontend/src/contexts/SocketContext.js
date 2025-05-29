import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineCustomers, setOnlineCustomers] = useState([]);

  useEffect(() => {
    // Kết nối đến WebSocket server
    const newSocket = io('http://localhost:5000', {
      transports: ['websocket'],
      withCredentials: true
    });

    newSocket.on('connect', () => {
      console.log('Connected to WebSocket server');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      setIsConnected(false);
    });

    newSocket.on('online-customers', (customers) => {
      setOnlineCustomers(customers);
    });

    newSocket.on('customer-online', (customerId) => {
      setOnlineCustomers(prev => [...prev, customerId]);
    });

    newSocket.on('customer-offline', (customerId) => {
      setOnlineCustomers(prev => prev.filter(id => id !== customerId));
    });

    setSocket(newSocket);

    // Cleanup
    return () => {
      newSocket.close();
    };
  }, []);

  const joinAsAdmin = (adminId) => {
    if (socket) {
      socket.emit('admin-join', adminId);
    }
  };

  const joinAsCustomer = (customerId) => {
    if (socket) {
      socket.emit('customer-join', customerId);
    }
  };

  const sendAdminMessage = (customerId, message) => {
    if (socket) {
      const timestamp = new Date().toISOString();
      socket.emit('admin-message', { customerId, message, timestamp });
      return { customerId, message, timestamp, sender: 'admin' };
    }
  };

  const sendCustomerMessage = (customerId, message) => {
    if (socket) {
      const timestamp = new Date().toISOString();
      socket.emit('customer-message', { customerId, message, timestamp });
      return { customerId, message, timestamp, sender: 'customer' };
    }
  };

  const sendTyping = (from, to) => {
    if (socket) {
      socket.emit('typing', { from, to });
    }
  };

  const sendStopTyping = (from, to) => {
    if (socket) {
      socket.emit('stop-typing', { from, to });
    }
  };

  const value = {
    socket,
    isConnected,
    onlineCustomers,
    joinAsAdmin,
    joinAsCustomer,
    sendAdminMessage,
    sendCustomerMessage,
    sendTyping,
    sendStopTyping
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};