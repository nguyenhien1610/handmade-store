import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Chatbox.css";

const CustomerChat = () => {
  const [chatList, setChatList] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showChatList, setShowChatList] = useState(true);

  // Fetch danh sách chat
  useEffect(() => {
    const fetchChatList = async () => {
      try {
        setLoading(true);
        const res = await axios.get("http://localhost:5000/api/admin/chats");
        setChatList(res.data);
      } catch (err) {
        setError(err.message || "Lỗi khi tải danh sách chat");
      } finally {
        setLoading(false);
      }
    };

    fetchChatList();
  }, []);

  // Fetch tin nhắn khi chọn chat
  useEffect(() => {
    if (selectedChat) {
      const fetchMessages = async () => {
        try {
          const res = await axios.get(`http://localhost:5000/api/admin/chats/${selectedChat.id}/messages`);
          setMessages(res.data);
        } catch (err) {
          console.error("Lỗi khi tải tin nhắn:", err);
        }
      };

      fetchMessages();
    }
  }, [selectedChat]);

  // Gửi tin nhắn
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;

    try {
      const messageData = {
        chatId: selectedChat.id,
        message: newMessage,
        sender: "admin"
      };

      const res = await axios.post("http://localhost:5000/api/admin/chats/send", messageData);
      
      // Thêm tin nhắn mới vào danh sách
      setMessages(prev => [...prev, res.data]);
      setNewMessage("");

      // Cập nhật preview trong chat list
      setChatList(prev => prev.map(chat => 
        chat.id === selectedChat.id 
          ? { ...chat, lastMessage: newMessage, lastMessageTime: new Date() }
          : chat
      ));
    } catch (err) {
      console.error("Lỗi khi gửi tin nhắn:", err);
    }
  };

  // Chọn chat
  const handleSelectChat = (chat) => {
    setSelectedChat(chat);
    
    // Đánh dấu đã đọc
    if (chat.unreadCount > 0) {
      axios.put(`http://localhost:5000/api/admin/chats/${chat.id}/read`)
        .then(() => {
          setChatList(prev => prev.map(c => 
            c.id === chat.id ? { ...c, unreadCount: 0 } : c
          ));
        })
        .catch(err => console.error("Lỗi khi đánh dấu đã đọc:", err));
    }

    // Ẩn chat list trên mobile
    if (window.innerWidth <= 1024) {
      setShowChatList(false);
    }
  };

  // Tìm kiếm chat
  const filteredChats = chatList.filter(chat =>
    chat.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Format thời gian
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return date.toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays <= 7) {
      return diffDays === 2 ? "Hôm qua" : `${diffDays - 1} ngày trước`;
    } else {
      return date.toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit' });
    }
  };

  // Get avatar initials
  const getAvatarInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading && chatList.length === 0) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Đang tải danh sách chat...</p>
      </div>
    );
  }

  return (
    <main className="chat-content">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Chat với khách hàng</h1>
        <p className="page-description">Quản lý và phản hồi các cuộc trò chuyện với khách hàng</p>
      </div>

      {/* Chat Container */}
      <div className="chat-container">
        {/* Chat List */}
        <div className={`chat-list-container ${showChatList ? 'mobile-active' : ''}`}>
          <div className="chat-list-header">
            <h3 className="chat-list-title">Danh sách cuộc hội thoại</h3>
          </div>
          
          <div className="chat-search">
            <input
              type="text"
              className="search-input"
              placeholder="Tìm kiếm khách hàng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="chat-list">
            {error && (
              <div className="error-message">
                <p>{error}</p>
              </div>
            )}
            
            {filteredChats.length === 0 && !loading ? (
              <div className="empty-chat-list">
                <p>Chưa có cuộc trò chuyện nào</p>
              </div>
            ) : (
              filteredChats.map((chat) => (
                <div
                  key={chat.id}
                  className={`chat-item ${selectedChat?.id === chat.id ? 'active' : ''}`}
                  onClick={() => handleSelectChat(chat)}
                >
                  <div className="chat-avatar">
                    {getAvatarInitials(chat.customerName)}
                  </div>
                  <div className="chat-info">
                    <div className="chat-name">
                      {chat.customerName}
                      {chat.unreadCount > 0 && (
                        <span className="chat-badge">{chat.unreadCount}</span>
                      )}
                    </div>
                    <div className="chat-preview">
                      {chat.lastMessage || "Chưa có tin nhắn"}
                    </div>
                  </div>
                  <div className="chat-time">
                    {chat.lastMessageTime ? formatTime(chat.lastMessageTime) : ""}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Chat Content */}
        <div className="chat-content-container">
          {selectedChat ? (
            <>
              <div className="chat-header">
                <div 
                  className="back-to-chats"
                  onClick={() => setShowChatList(true)}
                >
                  <i className="fas fa-arrow-left"></i> Danh sách chat
                </div>
                <div className="chat-recipient">
                  <div className="recipient-avatar">
                    {getAvatarInitials(selectedChat.customerName)}
                  </div>
                  <div className="recipient-info">
                    <div className="recipient-name">{selectedChat.customerName}</div>
                    <div className={`recipient-status ${selectedChat.isOnline ? '' : 'offline'}`}>
                      {selectedChat.isOnline ? 'Đang online' : 'Offline'}
                    </div>
                  </div>
                </div>
                <div className="chat-actions">
                  <button className="action-btn">
                    <i className="fas fa-phone"></i>
                  </button>
                  <button className="action-btn">
                    <i className="fas fa-video"></i>
                  </button>
                  <button className="action-btn">
                    <i className="fas fa-info-circle"></i>
                  </button>
                </div>
              </div>
              
              <div className="chat-messages">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`message ${message.sender === 'admin' ? 'sent' : 'received'}`}
                  >
                    {message.content}
                    <div className="message-time">
                      {new Date(message.createdAt).toLocaleTimeString("vi-VN", {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                ))}
              </div>
              
              <form className="chat-input-container" onSubmit={handleSendMessage}>
                <button type="button" className="attachment-btn">
                  <i className="fas fa-paperclip"></i>
                </button>
                <input
                  type="text"
                  className="chat-input"
                  placeholder="Nhập tin nhắn..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <button type="submit" className="send-btn">
                  <i className="fas fa-paper-plane"></i>
                </button>
              </form>
            </>
          ) : (
            <div className="empty-chat">
              <i className="fas fa-comments"></i>
              <div className="empty-chat-message">Chọn một cuộc trò chuyện</div>
              <div className="empty-chat-description">
                Chọn một khách hàng từ danh sách bên trái để bắt đầu trò chuyện
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default CustomerChat;