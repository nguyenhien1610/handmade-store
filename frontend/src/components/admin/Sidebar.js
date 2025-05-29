// frontend/src/components/admin/Sidebar.js
import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import "./Sidebar.css";

const Sidebar = ({ active }) => {
  const [showChatbox, setShowChatbox] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, sender: 'Khách hàng 1', text: 'Chào shop, sản phẩm này có màu khác không?', time: '10:30' },
    { id: 2, sender: 'Shop', text: 'Chào bạn, sản phẩm có thêm màu đỏ và xanh ạ!', time: '10:32', isOwn: true },
  ]);
  const [newMessage, setNewMessage] = useState('');

  const menuItems = [
    { path: "/admin/dashboard", icon: "tachometer-alt", text: "Dashboard" },
    { path: "/admin/orders", icon: "shopping-bag", text: "Quản lý đơn hàng" },
    { path: "/admin/products", icon: "box", text: "Quản lý sản phẩm" },
    { path: "/admin/customers", icon: "users", text: "Quản lý khách hàng" },
    { path: "/admin/chatbox", icon: "comments", text: "Chatbox" },
    { path: "/admin/social", icon: "share-alt", text: "Mạng xã hội" },
    { path: "/admin/reports", icon: "chart-bar", text: "Báo cáo" },
    { path: "/admin/settings", icon: "cog", text: "Cài đặt" },
  ];

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      const newMsg = {
        id: messages.length + 1,
        sender: 'Shop',
        text: newMessage,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        isOwn: true
      };
      setMessages([...messages, newMsg]);
      setNewMessage('');
    }
  };

  return (
    <>
      <aside className={`sidebar ${active ? "active" : ""}`}>
        <ul className="sidebar-menu">
          {menuItems.map((item, index) => (
            <li key={index}>
              <NavLink
                to={item.path}
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                <i className={`fas fa-${item.icon}`}></i>
                <span>{item.text}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </aside>
      
      {/* Chatbox */}
      {showChatbox && (
        <div className="chatbox">
          <div className="chatbox-header">
            <h3>Chat với khách hàng</h3>
            <button 
              className="chatbox-close"
              onClick={() => setShowChatbox(false)}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
          
          <div className="chatbox-messages">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`message ${msg.isOwn ? 'message-own' : ''}`}
              >
                <div className="message-sender">{msg.sender}</div>
                <div className="message-text">{msg.text}</div>
                <div className="message-time">{msg.time}</div>
              </div>
            ))}
          </div>
          
          <form className="chatbox-input" onSubmit={handleSendMessage}>
            <input 
              type="text" 
              placeholder="Nhập tin nhắn..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
            <button type="submit">
              <i className="fas fa-paper-plane"></i>
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default Sidebar;
