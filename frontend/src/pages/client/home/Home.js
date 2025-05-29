import React, { useState, useEffect, useRef } from 'react';
import './Home.css';
import bannerButterflyImage from '../upload/banner-butterfly.jpg';
import chatService from '../../../api/chatService';
import authService from '../../../api/authService';
// SVG Icons
const IconArrowRight = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" width="0.6em" height="0.9em" fill="currentColor" style={{ marginLeft: '10px', transition: 'transform 0.3s ease' }}>
    <path d="M275.1 233.4c12.5-12.5 12.5-32.8 0-45.3l-160-160c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L206.7 232H64c-17.7 0-32 14.3-32 32s14.3 32 32 32h142.7l-73.4 73.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l160-160z"/>
  </svg>
);

const IconComments = () => '💬';
const IconPaperPlane = () => '➔';
const IconMinus = () => '−';
const IconChevronUp = () => '▲';
const IconClose = () => '✕';

// Sample categories data
const initialCategoriesData = [
    {
        id: 'cat1',
        title: "Thiệp & Quà Tặng Nổi Bật",
        products: [
            { id: 'p1', name: "Hộp quà tặng cá nhân hóa", price: "250.000đ", imageEmoji: "🎁", categoryTag: "Quà Tặng", isHot: true },
            { id: 'p2', name: "Sổ tay bìa vải handmade", price: "120.000đ", imageEmoji: "📔", categoryTag: "Sổ Tay", isHot: false },
        ]
    },
    {
        id: 'cat2',
        title: "Trang Trí Nhà Cửa Độc Đáo",
        products: [
            { id: 'p3', name: "Hoa giấy trang trí tường", price: "180.000đ", imageEmoji: "💐", categoryTag: "Trang Trí", isHot: true },
            { id: 'p4', name: "Nến thơm handmade thư giãn", price: "150.000đ", imageEmoji: "🕯️", categoryTag: "Nến Thơm", isHot: false },
        ]
    },
    {
        id: 'cat3',
        title: "Phụ Kiện Handmade Xinh Xắn",
        products: [
            { id: 'p5', name: "Gấu bông len handmade", price: "350.000đ", imageEmoji: "🧸", categoryTag: "Đồ Chơi", isHot: false },
            { id: 'p6', name: "Túi xách móc len họa tiết", price: "280.000đ", imageEmoji: "👜", categoryTag: "Túi Xách", isHot: true },
            { id: 'p7', name: "Kẹp tóc nơ vải lụa", price: "75.000đ", imageEmoji: "🎀", categoryTag: "Phụ Kiện Tóc", isHot: false },
        ]
    }
];

function HomePage() {
    // Chat states
    const [isChatboxOpen, setIsChatboxOpen] = useState(false);
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [chatStatus, setChatStatus] = useState({ isAdminOnline: false });
    const [unreadCount, setUnreadCount] = useState(0);
    const [quickQuestions, setQuickQuestions] = useState([]);
    const [showQuickQuestions, setShowQuickQuestions] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('disconnected');
    
    // Other states
    const [showBackToTop, setShowBackToTop] = useState(false);
    const [cartButtonStates, setCartButtonStates] = useState({});
    
    // Refs
    const chatMessagesEndRef = useRef(null);
    const socketRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    // Auto scroll to bottom of chat
    const scrollToBottom = () => {
        chatMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [chatMessages]);

    // Initialize chat when component mounts
    useEffect(() => {
    const user = authService.getClientUser();
    const token = authService.getToken();
    
    console.log('[Home] Auth check:', { hasUser: !!user, hasToken: !!token });
    
    if (user && token) {
        // ✅ Tăng delay để đảm bảo authentication đã sẵn sàng
        setTimeout(() => {
        initializeChat();
        loadChatStatus();
        loadQuickQuestions();
        }, 1000); // Tăng lên 1 giây
    } else {
        console.warn('No authentication - showing offline mode');
        setChatMessages([
        { 
            id: 'login-required', 
            content: 'Vui lòng đăng nhập để sử dụng tính năng chat.', 
            sender: 'system', 
            isFromAdmin: true,
            time: chatService.formatMessageTime(new Date().toISOString())
        }
        ]);
    }
    
    return () => {
        if (socketRef.current) {
        socketRef.current.disconnect();
        }
    };
    }, []); // ✅ Dependency array rỗng

    // Initialize chat and socket connection
    const initializeChat = async () => {
  try {
    const user = authService.getClientUser();
    const token = authService.getToken();
    
    if (!user || !token) {
      throw new Error('No authentication found');
    }

    await loadChatHistory();
    
    const socket = chatService.initSocket();
    if (socket) {
      socketRef.current = socket;
      setupSocketListeners(socket);
      setConnectionStatus('connected');
    }
  } catch (error) {
    console.error('Error initializing chat:', error);
    setConnectionStatus('error');
    
    // ✅ Hiển thị message yêu cầu đăng nhập
    setChatMessages([
      { 
        id: 'auth-error', 
        content: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 
        sender: 'system', 
        isFromAdmin: true,
        time: chatService.formatMessageTime(new Date().toISOString())
      }
    ]);
  }
};

    // Setup socket event listeners
    const setupSocketListeners = (socket) => {
        socket.on('connect', () => {
            setConnectionStatus('connected');
            console.log('Connected to chat server');
        });

        socket.on('disconnect', () => {
            setConnectionStatus('disconnected');
            console.log('Disconnected from chat server');
        });

        socket.on('receive-admin-message', (data) => {
            const formattedMessage = chatService.formatMessage(data.message);
            setChatMessages(prev => [...prev, formattedMessage]);
            
            // Show notification if chat is closed
            if (!isChatboxOpen) {
                chatService.createNotification(data.message);
                setUnreadCount(prev => prev + 1);
            }
        });

        socket.on('admin-typing', (data) => {
            setIsTyping(data.isTyping);
        });

        socket.on('message-sent', (data) => {
            // Update message status or handle confirmation
            console.log('Message sent confirmation:', data);
        });
    };

    // Load chat history
    const loadChatHistory = async () => {
        try {
            setIsLoading(true);
            const response = await chatService.getCustomerChatHistory();
            if (response.success) {
                const formattedMessages = response.data.map(msg => chatService.formatMessage(msg));
                setChatMessages(formattedMessages);
            }
        } catch (error) {
            console.error('Error loading chat history:', error);
            // Show welcome message if no history or error
            setChatMessages([
                { 
                    id: 'welcome', 
                    content: 'Xin chào! Chúng tôi có thể giúp gì cho bạn?', 
                    sender: 'admin', 
                    isFromAdmin: true,
                    time: chatService.formatMessageTime(new Date().toISOString())
                }
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    // Load chat status
    const loadChatStatus = async () => {
        try {
            const response = await chatService.getChatStatus();
            if (response.success) {
                setChatStatus(response.data);
            }
        } catch (error) {
            console.error('Error loading chat status:', error);
        }
    };

    // Load quick questions
    const loadQuickQuestions = async () => {
        try {
            const response = await chatService.getQuickQuestions();
            if (response.success) {
                setQuickQuestions(response.data);
            }
        } catch (error) {
            console.error('Error loading quick questions:', error);
        }
    };

    // Load unread count
    const loadUnreadCount = async () => {
        try {
            const response = await chatService.getUnreadCount();
            if (response.success) {
                setUnreadCount(response.data.unreadCount);
            }
        } catch (error) {
            console.error('Error loading unread count:', error);
        }
    };

    // Toggle chatbox
    const toggleChatbox = async () => {
        if (!isChatboxOpen) {
            // Opening chat
            setIsChatboxOpen(true);
            await loadUnreadCount();
            
            // Mark messages as read when opening
            try {
                await chatService.markCustomerMessagesAsRead();
                setUnreadCount(0);
            } catch (error) {
                console.error('Error marking messages as read:', error);
            }
        } else {
            // Closing chat
            setIsChatboxOpen(false);
            setShowQuickQuestions(false);
        }
    };

    // Send message
    const handleSendMessage = async (messageText = null) => {
        const message = messageText || chatInput.trim();
        if (!message) return;

        try {
            setIsLoading(true);
            
            // Add message to UI immediately for better UX
            const tempMessage = {
                id: `temp-${Date.now()}`,
                content: message,
                sender: 'customer',
                isFromCustomer: true,
                time: chatService.formatMessageTime(new Date().toISOString()),
                status: 'sending'
            };
            
            setChatMessages(prev => [...prev, tempMessage]);
            setChatInput('');
            setShowQuickQuestions(false);

            // Send to server
            const response = await chatService.sendCustomerMessage(message);
            
            if (response.success) {
                // Replace temp message with server response
                setChatMessages(prev => 
                    prev.map(msg => 
                        msg.id === tempMessage.id 
                            ? { ...chatService.formatMessage(response.data), status: 'sent' }
                            : msg
                    )
                );
            } else {
                throw new Error(response.message || 'Failed to send message');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            
            // Update temp message to show error
            setChatMessages(prev => 
                prev.map(msg => 
                    msg.id === tempMessage.id 
                        ? { ...msg, status: 'error' }
                        : msg
                )
            );
            
            // Show error message
            alert('Không thể gửi tin nhắn. Vui lòng thử lại.');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle input change with typing indicator
    const handleChatInputChange = (e) => {
        setChatInput(e.target.value);
        
        // Send typing indicator
        if (socketRef.current) {
            chatService.emitTyping(socketRef.current, 'customer', true);
            
            // Clear previous timeout
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            
            // Stop typing after 2 seconds of inactivity
            typingTimeoutRef.current = setTimeout(() => {
                chatService.emitTyping(socketRef.current, 'customer', false);
            }, 2000);
        }
    };

    // Handle enter key press
    const handleChatInputKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // Handle quick question click
    const handleQuickQuestionClick = (question) => {
        handleSendMessage(question.message);
    };

    // Back to top functionality
    useEffect(() => {
        const handleScroll = () => {
            setShowBackToTop(window.pageYOffset > 300);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Add to cart functionality
    const handleAddToCart = (productId) => {
        setCartButtonStates(prev => ({
            ...prev,
            [productId]: { text: "Đã thêm ✓", style: { backgroundColor: "#4CAF50", color: "white" } }
        }));

        setTimeout(() => {
            setCartButtonStates(prev => ({
                ...prev,
                [productId]: { text: "Thêm vào giỏ hàng", style: {} }
            }));
        }, 1500);
    };

    return (
        <>
            <section className="hero" style={{ backgroundImage: `url(${bannerButterflyImage})` }}>
                <div className="heroOverlay"></div>
                <div className="heroContent">
                    <h1>Thế giới đồ <span className="animatedGradientText">handmade</span> xinh xắn</h1>
                    <p>Khám phá bộ sưu tập độc đáo với những sản phẩm handmade đầy tâm huyết và sáng tạo, mang đến không gian sống đẹp và ý nghĩa cho bạn.</p>
                    <a href="/products" className="btn">Khám phá ngay</a>
                </div>
            </section>

            <section className="productsByCategorySection">
                <h2 className="sectionTitle">Khám phá theo Danh mục</h2>
                
                <div className="categoryShowcaseSection">
                    {initialCategoriesData.map(category => (
                        <div key={category.id} className="categoryBlock">
                            <h3 className="categoryTitleHeader">
                                <span>{category.title}</span>
                                <IconArrowRight />
                            </h3>
                            <div className="productContainer">
                                {category.products.map(product => {
                                    const buttonState = cartButtonStates[product.id] || { text: "Thêm vào giỏ hàng", style: {} };
                                    return (
                                        <div key={product.id} className="productCard">
                                            <div className="productImg">
                                                {product.imageEmoji}
                                                {product.isHot && (
                                                    <div className="productBadges">
                                                        <span className="productBadge hotBadge">Hot</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="productInfo">
                                                {product.categoryTag && (
                                                    <div className="productMeta">
                                                        <span className="productCategoryTag">{product.categoryTag}</span>
                                                    </div>
                                                )}
                                                <div className="productName">{product.name}</div>
                                                <div className="productPrice">{product.price}</div>
                                                <button 
                                                    className="addToCart"
                                                    onClick={() => handleAddToCart(product.id)}
                                                    style={buttonState.style}
                                                >
                                                    {buttonState.text}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Enhanced Chatbox */}
            {isChatboxOpen && (
                <div className="chatbox">
                    <div className="chatboxHeader">
                        <div className="chatboxTitle">
                            <span>Hỗ trợ trực tuyến</span>
                            <div className="chatStatus">
                                <span className={`statusIndicator ${chatStatus.isAdminOnline ? 'online' : 'offline'}`}></span>
                                <span className="statusText">
                                    {chatStatus.isAdminOnline ? 'Đang hoạt động' : 'Không trực tuyến'}
                                </span>
                            </div>
                        </div>
                        <div className="chatboxControls">
                            <button 
                                className="quickQuestionsBtn"
                                onClick={() => setShowQuickQuestions(!showQuickQuestions)}
                                title="Câu hỏi nhanh"
                            >
                                ❓
                            </button>
                            <div className="chatboxToggle" onClick={toggleChatbox}>
                                <IconMinus />
                            </div>
                        </div>
                    </div>

                    {/* Quick Questions */}
                    {showQuickQuestions && (
                        <div className="quickQuestions">
                            <div className="quickQuestionsHeader">
                                <span>Câu hỏi thường gặp:</span>
                                <button onClick={() => setShowQuickQuestions(false)}>
                                    <IconClose />
                                </button>
                            </div>
                            <div className="quickQuestionsList">
                                {quickQuestions.map(question => (
                                    <button
                                        key={question.id}
                                        className="quickQuestionItem"
                                        onClick={() => handleQuickQuestionClick(question)}
                                    >
                                        {question.question}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="chatboxBody">
                        {isLoading && chatMessages.length === 0 ? (
                            <div className="chatLoading">Đang tải lịch sử chat...</div>
                        ) : (
                            <div className="chatMessages">
                                {chatMessages.map((msg, index) => (
                                    <div key={msg.id || index} className={`message ${msg.isFromCustomer ? 'messageSent' : 'messageReceived'}`}>
                                        <div className="messageContent">
                                            {msg.content}
                                            {msg.status === 'sending' && <span className="messageStatus"> ⏳</span>}
                                            {msg.status === 'error' && <span className="messageStatus error"> ❌</span>}
                                        </div>
                                        <div className="messageTime">{msg.time}</div>
                                    </div>
                                ))}
                                
                                {isTyping && (
                                    <div className="message messageReceived">
                                        <div className="messageContent typing">
                                            <span className="typingIndicator">
                                                <span></span>
                                                <span></span>
                                                <span></span>
                                            </span>
                                            Đang nhập...
                                        </div>
                                    </div>
                                )}
                                
                                <div ref={chatMessagesEndRef} />
                            </div>
                        )}
                    </div>

                    <div className="chatboxFooter">
                        <div className="connectionStatus">
                            <span className={`connectionIndicator ${connectionStatus}`}></span>
                            <span className="connectionText">
                                {connectionStatus === 'connected' ? 'Đã kết nối' : 
                                 connectionStatus === 'disconnected' ? 'Mất kết nối' : 
                                 'Lỗi kết nối'}
                            </span>
                        </div>
                        <div className="chatInputContainer">
                            <input 
                                type="text" 
                                placeholder="Nhập tin nhắn..." 
                                className="chatInput"
                                value={chatInput}
                                onChange={handleChatInputChange}
                                onKeyPress={handleChatInputKeyPress}
                                disabled={isLoading || connectionStatus !== 'connected'}
                            />
                            <button 
                                className="chatSendBtn" 
                                onClick={() => handleSendMessage()}
                                disabled={isLoading || !chatInput.trim() || connectionStatus !== 'connected'}
                            >
                                {isLoading ? '⏳' : <IconPaperPlane />}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Chat Button with Unread Badge */}
            {!isChatboxOpen && (
                <div className="chatButton" onClick={toggleChatbox}>
                    <IconComments />
                    {unreadCount > 0 && (
                        <div className="unreadBadge">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </div>
                    )}
                </div>
            )}

            {/* Back to Top Button */}
            <div 
                className="backToTop" 
                onClick={scrollToTop} 
                style={{ 
                    opacity: showBackToTop ? 1 : 0, 
                    visibility: showBackToTop ? 'visible' : 'hidden' 
                }}
            >
                <IconChevronUp />
            </div>
        </>
    );
}

export default HomePage;