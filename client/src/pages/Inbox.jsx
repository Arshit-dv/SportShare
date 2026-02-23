import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import axios from 'axios';

const Inbox = () => {
    const { user, loadUser } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Re-load user on mount to get latest requests
    useEffect(() => {
        loadUser();
    }, []);

    const handleRequest = async (id, action) => {
        setLoading(true);
        try {
            if (action === 'accept') {
                await axios.put(`/api/auth/friend-request/accept/${id}`);
            } else {
                await axios.delete(`/api/auth/friend-request/decline/${id}`);
            }
            await loadUser(); // Refresh user data
        } catch (err) {
            console.error('Error handling friend request:', err);
            alert(err.response?.data?.msg || 'An error occurred');
        }
        setLoading(false);
    };

    return (
        <div className="container" style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', color: 'white' }}>
            <h2 style={{ color: '#7aa2f7', marginBottom: '30px', borderBottom: '1px solid #333', paddingBottom: '10px' }}>Inbox</h2>

            {/* Friend Requests Section */}
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
                                border: '1px solid #24283b'
                            }}>
                                <div
                                    style={{ display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer' }}
                                    onClick={() => navigate(`/profile/${request._id}`)}
                                >
                                    <img
                                        src={request.profilePhoto || '/uploads/default.svg'}
                                        alt={request.username}
                                        style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }}
                                        onError={(e) => { e.target.onerror = null; e.target.src = '/uploads/default.svg'; }}
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
                                        style={{
                                            background: '#7aa2f7',
                                            color: 'black',
                                            border: 'none',
                                            padding: '8px 20px',
                                            borderRadius: '5px',
                                            cursor: 'pointer',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        Accept
                                    </button>
                                    <button
                                        disabled={loading}
                                        onClick={() => handleRequest(request._id, 'decline')}
                                        style={{
                                            background: 'transparent',
                                            color: '#f7768e',
                                            border: '1px solid #f7768e',
                                            padding: '8px 20px',
                                            borderRadius: '5px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Decline
                                    </button>
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

            {/* Messages Section Placeholder */}
            <section>
                <h3 style={{ fontSize: '1.2rem', color: '#bb9af7', marginBottom: '20px' }}>💬 Messages</h3>
                <div style={{ textAlign: 'center', padding: '60px', background: '#1a1b26', borderRadius: '10px', border: '1px solid #24283b', color: '#565f89' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🚧</div>
                    Chat functionality coming soon!
                </div>
            </section>
        </div>
    );
};

export default Inbox;
