import { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import api from '../utils/api';

const Inbox = () => {
    const { user, loadUser, setUnreadCount, socket } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // Chat States
    const [conversations, setConversations] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);
    const activeChatRef = useRef(null);
    activeChatRef.current = activeChat;
    const [menuOpenFor, setMenuOpenFor] = useState(null);

    useEffect(() => {
        if (!socket) return;
        
        const messageHandler = (newMessage) => {
            loadConversations(); // Automatically update left-panel sequence and badge statuses
            
            const currentActiveChat = activeChatRef.current;
            if (currentActiveChat && currentActiveChat._id === newMessage.sender) {
                // If actively chatting with them, append the new message to view securely
                setMessages(prev => [...prev, newMessage]);
                // Silently clear unreads since user is actively observing
                api.get(`/api/messages/${newMessage.sender}`).catch(() => {});
            }
        };

        socket.on('receiveMessage', messageHandler);
        
        return () => {
            socket.off('receiveMessage', messageHandler);
        };
    }, [socket]);

    const deleteChat = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this entire conversation? This action cannot be undone.')) return;
        try {
            await api.delete(`/api/messages/${userId}`);
            loadConversations();
        } catch (err) {
            console.error('Error deleting chat:', err);
        }
        setMenuOpenFor(null);
    };

    const muteChat = async (e, userId) => {
        e.stopPropagation();
        try {
            await api.post(`/api/messages/mute/${userId}`);
            loadConversations();
        } catch (err) {
            console.error('Error toggling mute:', err);
        }
        setMenuOpenFor(null);
    };

    const blockUser = async (e, userId) => {
        e.stopPropagation();
        if (!window.confirm('Are you certain? Blocking will prevent them from messaging you.')) return;
        try {
            await api.post(`/api/messages/block/${userId}`);
            loadConversations();
        } catch (err) {
            console.error('Error toggling block:', err);
        }
        setMenuOpenFor(null);
    };

    useEffect(() => {
        loadUser();
        loadConversations();

        if (location.state && location.state.chatUser) {
            setActiveChat(location.state.chatUser);
            // clear the state so a refresh doesn't reopen the chat
            window.history.replaceState({}, document.title);
        }
    }, []);

    useEffect(() => {
        if (activeChat) {
            loadMessages(activeChat._id);
            loadConversations();
        }
    }, [activeChat]);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    useEffect(() => {
        const delaySearch = setTimeout(() => {
            if (searchQuery.trim()) {
                searchUsers();
            } else {
                setSearchResults([]);
            }
        }, 300);
        return () => clearTimeout(delaySearch);
    }, [searchQuery]);

    const loadConversations = async () => {
        try {
            const res = await api.get('/api/messages/conversations');
            setConversations(res.data);
            
            // Sync total unread count with global Sidebar context
            const totalUnread = res.data.reduce((acc, conv) => acc + conv.unreadCount, 0);
            if (setUnreadCount) setUnreadCount(totalUnread);
        } catch (err) {
            console.error('Error loading conversations:', err);
        }
    };

    const loadMessages = async (userId) => {
        try {
            const res = await api.get(`/api/messages/${userId}`);
            setMessages(res.data);
        } catch (err) {
            console.error('Error loading messages:', err);
        }
    };

    const searchUsers = async () => {
        try {
            const res = await api.get(`/api/messages/search/users?query=${searchQuery}`);
            setSearchResults(res.data);
        } catch (err) {
            console.error('Error searching users:', err);
        }
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeChat) return;
        try {
            const res = await api.post('/api/messages', {
                receiverId: activeChat._id,
                text: newMessage
            });
            setMessages([...messages, res.data]);
            setNewMessage('');
            loadConversations(); // update last message in conversation list
        } catch (err) {
            console.error('Error sending message:', err);
            alert(err.response?.data?.msg || 'Error sending message');
        }
    };

    const handleRequest = async (id, action) => {
        setLoading(true);
        try {
            if (action === 'accept') {
                await api.put(`/api/auth/friend-request/accept/${id}`);
            } else {
                await api.delete(`/api/auth/friend-request/decline/${id}`);
            }
            await loadUser(); // Refresh user data
        } catch (err) {
            console.error('Error handling friend request:', err);
            alert(err.response?.data?.msg || 'An error occurred');
        }
        setLoading(false);
    };

    if (activeChat) {
        return (
            <div className="container" style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', color: 'white', display: 'flex', flexDirection: 'column', height: '80vh' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', gap: '15px' }}>
                    <button onClick={() => { setActiveChat(null); loadConversations(); }} style={{ background: 'transparent', border: 'none', color: '#7aa2f7', fontSize: '1.5rem', cursor: 'pointer' }}>
                        ←
                    </button>
                    <img
                        src={activeChat.profilePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(activeChat.name || 'User')}&background=random`}
                        alt={activeChat.username}
                        onClick={() => navigate(`/profile/${activeChat._id}`)}
                        style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', cursor: 'pointer' }}
                        onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(activeChat.name || 'User')}&background=random`; }}
                    />
                    <h2 
                        onClick={() => navigate(`/profile/${activeChat._id}`)}
                        style={{ margin: 0, cursor: 'pointer' }}
                    >
                        {activeChat.name}
                    </h2>
                </div>

                <div style={{ flex: 1, background: '#1a1b26', borderRadius: '10px', border: '1px solid #24283b', padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {messages.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#565f89', marginTop: 'auto', marginBottom: 'auto' }}>No messages yet. Start the conversation!</div>
                    ) : (
                        messages.map(msg => {
                            const isMe = msg.sender === user?._id;
                            return (
                                <div key={msg._id} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
                                    <div style={{
                                        background: isMe ? '#7aa2f7' : '#24283b',
                                        color: isMe ? 'black' : 'white',
                                        padding: '10px 15px',
                                        borderRadius: '15px',
                                        borderBottomRightRadius: isMe ? '0px' : '15px',
                                        borderBottomLeftRadius: isMe ? '15px' : '0px',
                                        wordBreak: 'break-word'
                                    }}>
                                        {msg.text}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#565f89', marginTop: '5px', textAlign: isMe ? 'right' : 'left' }}>
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        {isMe && <span style={{ marginLeft: '5px' }}>{msg.read ? '✓✓' : '✓'}</span>}
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <form onSubmit={sendMessage} style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        style={{ flex: 1, padding: '15px', borderRadius: '25px', border: '1px solid #24283b', background: '#1a1b26', color: 'white', outline: 'none' }}
                    />
                    <button type="submit" disabled={!newMessage.trim()} style={{ background: '#7aa2f7', color: 'black', border: 'none', padding: '0 25px', borderRadius: '25px', cursor: 'pointer', fontWeight: 'bold' }}>
                        Send
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="container" style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', color: 'white' }}>
            <h2 style={{ color: '#7aa2f7', marginBottom: '30px', borderBottom: '1px solid #333', paddingBottom: '10px' }}>Inbox</h2>

            <section style={{ marginBottom: '40px' }}>
                <h3 style={{ fontSize: '1.2rem', color: '#bb9af7', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    📥 Friend Requests
                    {user?.friendRequests?.length > 0 && (
                        <span style={{ background: '#f7768e', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '0.8rem' }}>
                            {user.friendRequests.length}
                        </span>
                    )}
                </h3>

                {user?.friendRequests?.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {user.friendRequests.map(request => (
                            <div key={request._id} className="card" style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                background: '#1a1b26',
                                padding: '15px',
                                border: '1px solid #24283b',
                                borderRadius: '10px'
                            }}>
                                <div
                                    style={{ display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer' }}
                                    onClick={() => navigate(`/profile/${request._id}`)}
                                >
                                    <img
                                        src={request.profilePhoto || 'https://ui-avatars.com/api/?name=User&background=random'}
                                        alt={request.username}
                                        style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }}
                                        onError={(e) => { e.target.onerror = null; e.target.src = 'https://ui-avatars.com/api/?name=User&background=random'; }}
                                    />
                                    <div>
                                        <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{request.name}</div>
                                        <div style={{ color: '#aaa', fontSize: '0.9rem' }}>@{request.username}</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        disabled={loading}
                                        onClick={() => handleRequest(request._id, 'accept')}
                                        style={{ background: '#7aa2f7', color: 'black', border: 'none', padding: '8px 20px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
                                    > Accept </button>
                                    <button
                                        disabled={loading}
                                        onClick={() => handleRequest(request._id, 'decline')}
                                        style={{ background: 'transparent', color: '#f7768e', border: '1px solid #f7768e', padding: '8px 20px', borderRadius: '5px', cursor: 'pointer' }}
                                    > Decline </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '40px', background: '#1a1b26', borderRadius: '10px', border: '1px solid #24283b', color: '#565f89' }}>
                        No pending friend requests.
                    </div>
                )}
            </section>

            <section>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '1.2rem', color: '#bb9af7', margin: 0 }}>💬 Messages</h3>
                </div>

                <div style={{ position: 'relative', marginBottom: '20px' }}>
                    <input
                        type="text"
                        placeholder="Search users to message..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ width: '100%', padding: '12px 15px', borderRadius: '8px', border: '1px solid #24283b', background: '#1a1b26', color: 'white', boxSizing: 'border-box' }}
                    />
                    {searchResults.length > 0 && searchQuery && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#1a1b26', border: '1px solid #24283b', borderRadius: '8px', marginTop: '5px', zIndex: 10, maxHeight: '200px', overflowY: 'auto' }}>
                            {searchResults.map(u => (
                                <div
                                    key={u._id}
                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 15px', cursor: 'pointer', borderBottom: '1px solid #24283b' }}
                                    onClick={() => {
                                        setActiveChat(u);
                                        setSearchQuery('');
                                        setSearchResults([]);
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <img 
                                            src={u.profilePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'User')}&background=random`} 
                                            alt={u.name} 
                                            style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover' }} 
                                            onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'User')}&background=random`; }}
                                        />
                                        <span>{u.name} (@{u.username})</span>
                                    </div>
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/profile/${u._id}`);
                                        }}
                                        style={{ background: 'transparent', border: '1px solid #7aa2f7', color: '#7aa2f7', padding: '3px 10px', borderRadius: '5px', fontSize: '0.8rem' }}
                                    >
                                        View Profile
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {conversations.length > 0 ? (
                        conversations.map(conv => (
                            <div
                                key={conv.partnerId}
                                onClick={() => setActiveChat({ _id: conv.partnerId, name: conv.user.name, username: conv.user.username, profilePhoto: conv.user.profilePhoto })}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '15px',
                                    padding: '15px',
                                    background: conv.unreadCount > 0 ? '#24283b' : '#1a1b26',
                                    border: '1px solid #24283b',
                                    borderRadius: '10px',
                                    cursor: 'pointer',
                                    transition: 'background 0.2s'
                                }}
                            >
                                <img
                                    src={conv.user.profilePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(conv.user.name || 'User')}&background=random`}
                                    alt={conv.user.username}
                                    style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }}
                                    onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(conv.user.name || 'User')}&background=random`; }}
                                />
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                        <div style={{ fontWeight: conv.unreadCount > 0 ? 'bold' : 'normal', fontSize: '1.1rem', color: conv.unreadCount > 0 ? 'white' : '#aaa' }}>{conv.user.name}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#565f89' }}>
                                            {new Date(conv.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div style={{ color: conv.unreadCount > 0 ? '#bb9af7' : '#565f89', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: conv.unreadCount > 0 ? 'bold' : 'normal' }}>
                                        {conv.isSender ? 'You: ' : ''}{conv.lastMessage}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative' }}>
                                    {conv.unreadCount > 0 && (
                                        <div style={{ background: '#f7768e', color: 'white', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                            {conv.unreadCount}
                                        </div>
                                    )}
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setMenuOpenFor(menuOpenFor === conv.partnerId ? null : conv.partnerId); }}
                                        style={{ background: 'transparent', border: 'none', color: '#a9b1d6', fontSize: '1.5rem', cursor: 'pointer', padding: '0 5px' }}
                                    >⋮</button>
                                    {menuOpenFor === conv.partnerId && (
                                        <div style={{ position: 'absolute', right: 0, top: '100%', background: '#1a1b26', border: '1px solid #24283b', borderRadius: '5px', zIndex: 10, minWidth: '120px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
                                            <div 
                                                onClick={(e) => { e.stopPropagation(); deleteChat(conv.partnerId); }} 
                                                style={{ padding: '10px 15px', cursor: 'pointer', color: '#f7768e', borderBottom: '1px solid #24283b' }}
                                                onMouseOver={(e) => e.target.style.background = '#24283b'}
                                                onMouseOut={(e) => e.target.style.background = 'transparent'}
                                            >
                                                Delete
                                            </div>
                                            <div 
                                                onClick={(e) => muteChat(e, conv.partnerId)} 
                                                style={{ padding: '10px 15px', cursor: 'pointer', color: '#a9b1d6', borderBottom: '1px solid #24283b' }}
                                                onMouseOver={(e) => e.target.style.background = '#24283b'}
                                                onMouseOut={(e) => e.target.style.background = 'transparent'}
                                            >
                                                {conv.isMuted ? 'Unmute' : 'Mute'}
                                            </div>
                                            <div 
                                                onClick={(e) => blockUser(e, conv.partnerId)} 
                                                style={{ padding: '10px 15px', cursor: 'pointer', color: conv.isBlocked ? '#7aa2f7' : '#f7768e' }}
                                                onMouseOver={(e) => e.target.style.background = '#24283b'}
                                                onMouseOut={(e) => e.target.style.background = 'transparent'}
                                            >
                                                {conv.isBlocked ? 'Unblock' : 'Block'}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={{ textAlign: 'center', padding: '40px', background: '#1a1b26', borderRadius: '10px', border: '1px solid #24283b', color: '#565f89' }}>
                            No conversations yet. Search for a user to start chatting!
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default Inbox;
