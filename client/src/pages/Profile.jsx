import { useState, useContext, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import EventContext from '../context/EventContext'; // Import EventContext
import api from '../utils/api';

const Profile = () => {
    const { user: authUser, loadUser, logout } = useContext(AuthContext);
    const { events, getEvents } = useContext(EventContext);
    const { id } = useParams(); // Get ID from URL
    const navigate = useNavigate();
    const [profileUser, setProfileUser] = useState(null); // User to display
    const [loadingProfile, setLoadingProfile] = useState(true);

    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        description: '',
        preferredSports: '',
        profilePhoto: ''
    });
    const [file, setFile] = useState(null);
    const [removePhoto, setRemovePhoto] = useState(false);
    const [showFriendsModal, setShowFriendsModal] = useState(false);

    // Determines if we are viewing our own profile
    const isOwnProfile = !id || (authUser && id === authUser._id);

    useEffect(() => {
        getEvents();

        const fetchProfile = async () => {
            if (isOwnProfile) {
                if (authUser) {
                    setProfileUser(authUser);
                    setLoadingProfile(false);
                }
            } else {
                try {
                    const res = await api.get(`/api/auth/user/${id}`);
                    setProfileUser(res.data);
                } catch (err) {
                    console.error('Error fetching profile', err);
                } finally {
                    setLoadingProfile(false);
                }
            }
        };

        fetchProfile();
    }, [id, authUser, isOwnProfile]);

    useEffect(() => {
        if (profileUser && isOwnProfile) {
            setFormData({
                description: profileUser.description || '',
                preferredSports: profileUser.preferredSports ? profileUser.preferredSports.join(', ') : '',
                profilePhoto: profileUser.profilePhoto || 'https://ui-avatars.com/api/?name=User&background=random'
            });
        }
    }, [profileUser, isOwnProfile]);

    const { description, preferredSports, profilePhoto } = formData;

    const onChange = e => {
        if (e.target.name === 'profilePhoto') {
            setFile(e.target.files[0]);
            setRemovePhoto(false); // If they select a file, cancel removal
        } else {
            setFormData({ ...formData, [e.target.name]: e.target.value });
        }
    };

    const onSubmit = async e => {
        e.preventDefault();

        const formDataToSend = new FormData();
        formDataToSend.append('description', description);
        formDataToSend.append('preferredSports', preferredSports);
        if (file) {
            formDataToSend.append('profilePhoto', file);
        } else if (removePhoto) {
            formDataToSend.append('removePhoto', 'true');
        }

        try {
            await api.put('/api/auth/profile', formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            await loadUser();
            setIsEditing(false);
            setFile(null); // Reset file selection
            setRemovePhoto(false);
        } catch (err) {
            console.error('Profile update failed', err);
            alert(err.response?.data?.msg || 'Profile update failed. Make sure your Cloudinary credentials are set correctly in the server .env file.');
        }
    };

    const onSendRequest = async () => {
        try {
            await api.post(`/api/auth/friend-request/${id}`);
            const res = await api.get(`/api/auth/user/${id}`);
            setProfileUser(res.data);
            loadUser();
        } catch (err) {
            console.error('Error sending friend request', err);
            alert(err.response?.data?.msg || 'Error sending friend request');
        }
    };

    const onAcceptRequest = async () => {
        try {
            await api.put(`/api/auth/friend-request/accept/${id}`);
            const res = await api.get(`/api/auth/user/${id}`);
            setProfileUser(res.data);
            loadUser();
        } catch (err) {
            console.error('Error accepting friend request', err);
            alert(err.response?.data?.msg || 'Error accepting friend request');
        }
    };

    const onDeclineRequest = async () => {
        try {
            await api.delete(`/api/auth/friend-request/decline/${id}`);
            const res = await api.get(`/api/auth/user/${id}`);
            setProfileUser(res.data);
            loadUser();
        } catch (err) {
            console.error('Error declining friend request', err);
            alert(err.response?.data?.msg || 'Error declining friend request');
        }
    };

    const onUnfriend = async () => {
        if (!window.confirm('Are you sure you want to unfriend this user?')) return;
        try {
            await api.delete(`/api/auth/friend/${id}`);
            const res = await api.get(`/api/auth/user/${id}`);
            setProfileUser(res.data);
            loadUser();
        } catch (err) {
            console.error('Error unfriending', err);
            alert(err.response?.data?.msg || 'Error unfriending');
        }
    };

    const onDeleteAccount = async () => {
        if (!window.confirm('WARNING: THIS IS PERMANENT. Are you sure you want to DELETE your account? This will remove all your data, including events you hosted.')) return;
        try {
            await api.delete('/api/auth/account');
            logout();
            navigate('/');
        } catch (err) {
            console.error('Error deleting account', err);
            alert(err.response?.data?.msg || 'Error deleting account');
        }
    };

    if (loadingProfile || !profileUser) return <div style={{ color: 'white', textAlign: 'center', marginTop: '50px' }}>Loading...</div>;

    // Calculate Stats
    const now = new Date();

    // Hosted Count: Events user hosted, that have passed, AND have at least 1 participant
    const hostedCount = events.filter(e => {
        const isCreator = e.user._id === profileUser._id || e.user === profileUser._id;
        const isPast = new Date(e.date) < now;
        const hasParticipants = e.participants && e.participants.length > 0;
        return isCreator && isPast && hasParticipants;
    }).length;

    // Joined Count: Events user joined (as participant), that have passed
    const joinedCount = events.filter(e => {
        // participating means in participants array
        // participants is array of objects {user: id} or just ids depending on population? 
        // EventItem checked: p.user === user._id || (p.user._id && p.user._id === user._id)
        const isParticipant = e.participants.some(p =>
            (p.user === profileUser._id) || (p.user._id && p.user._id === profileUser._id)
        );
        const isPast = new Date(e.date) < now;
        return isParticipant && isPast;
    }).length;

    const friendCount = profileUser.friends ? profileUser.friends.length : 0;
    const isFriend = authUser && profileUser.friends && profileUser.friends.some(f => (f._id || f) === authUser._id);
    const requestSent = authUser && profileUser.friendRequests && profileUser.friendRequests.some(r => (r._id || r) === authUser._id);
    const requestReceived = authUser && authUser.friendRequests && authUser.friendRequests.some(r => (r._id || r) === profileUser._id);

    return (
        <div className="container" style={{ maxWidth: '900px', margin: '0 auto', padding: '10px 20px', color: 'white' }}>
            {/* Header */}
            <header style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #333', marginBottom: '20px', position: 'relative' }}>
                <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>{profileUser.username}</h3>
            </header>

            {/* Top Row: Avatar + Stats */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px' }}>
                {/* Avatar */}
                <div style={{ flex: '0 0 150px', marginRight: '40px' }}>
                    <div style={{
                        width: '150px',
                        height: '150px',
                        borderRadius: '50%',
                        padding: '3px',
                        background: '#FFD700', // Yellow border
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        boxSizing: 'border-box'
                    }}>
                        <img
                            src={
                                profileUser.profilePhoto && profileUser.profilePhoto.startsWith('http')
                                    ? profileUser.profilePhoto
                                    : 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'
                            }
                            alt="Profile"
                            onError={(e) => { e.target.onerror = null; e.target.src = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'; }}
                            style={{
                                width: '100%',
                                height: '100%',
                                borderRadius: '50%',
                                objectFit: 'cover',
                                border: '4px solid black',
                                boxSizing: 'border-box',
                                display: 'block',
                                backgroundColor: '#1a1a1a' // Prevent background bleed
                            }}
                        />
                    </div>
                </div>

                {/* Stats */}
                <div style={{ flex: 1, display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                    <div>
                        <div style={{ fontWeight: 'bold', fontSize: '1.8rem' }}>{hostedCount}</div>
                        <div style={{ fontSize: '1.1rem', color: '#aaa' }}>Hosted</div>
                    </div>
                    <div>
                        <div style={{ fontWeight: 'bold', fontSize: '1.8rem' }}>{joinedCount}</div>
                        <div style={{ fontSize: '1.1rem', color: '#aaa' }}>Joined</div>
                    </div>
                    <div
                        onClick={() => profileUser.friends && profileUser.friends.length > 0 && setShowFriendsModal(true)}
                        style={{ cursor: profileUser.friends && profileUser.friends.length > 0 ? 'pointer' : 'default' }}
                    >
                        <div style={{ fontWeight: 'bold', fontSize: '1.8rem' }}>{friendCount}</div>
                        <div style={{ fontSize: '1.1rem', color: '#aaa' }}>Friends</div>
                    </div>
                </div>
            </div>

            {/* Bio Section */}
            <div style={{ marginBottom: '30px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '1.3rem' }}>{profileUser.name}</div>
                <div style={{ color: '#ccc', marginBottom: '10px', fontSize: '1.1rem' }}>
                    {profileUser.gender} • {profileUser.age} y/o
                </div>
                {profileUser.preferredSports && profileUser.preferredSports.length > 0 && (
                    <div style={{ marginBottom: '15px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {profileUser.preferredSports.map((sport, index) => (
                                <span key={index} style={{
                                    background: '#333',
                                    padding: '5px 12px',
                                    borderRadius: '20px',
                                    fontSize: '0.9rem',
                                    color: 'var(--accent-blue)',
                                    border: '1px solid #444'
                                }}>
                                    {sport}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: '1.1rem' }}>
                    {profileUser.description || 'No bio yet.'}
                </div>
            </div>

            {/* Action Buttons */}
            <div style={{ marginBottom: '30px' }}>
                {isOwnProfile ? (
                    <>
                        <button
                            onClick={() => setIsEditing(true)}
                            style={{
                                width: '100%',
                                background: '#333',
                                color: 'white',
                                border: 'none',
                                padding: '12px',
                                borderRadius: '8px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                fontSize: '1rem',
                                marginBottom: '10px'
                            }}
                        >
                            Edit Profile
                        </button>

                        <button
                            onClick={onDeleteAccount}
                            style={{
                                width: '100%',
                                background: 'transparent',
                                color: '#dc2743',
                                border: '1px solid #dc2743',
                                padding: '10px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                fontWeight: 'bold',
                                transition: 'all 0.3s'
                            }}
                            onMouseOver={(e) => {
                                e.target.style.background = 'rgba(220, 39, 67, 0.1)';
                            }}
                            onMouseOut={(e) => {
                                e.target.style.background = 'transparent';
                            }}
                        >
                            Delete Account
                        </button>
                    </>
                ) : (
                    <div style={{ display: 'flex', gap: '10px' }}>
                        {isFriend ? (
                            <button
                                onClick={onUnfriend}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    borderRadius: '8px',
                                    fontSize: '1rem',
                                    background: '#333',
                                    color: '#dc2743',
                                    border: '1px solid #dc2743',
                                    cursor: 'pointer',
                                    fontWeight: 'bold'
                                }}
                            >
                                Unfriend
                            </button>
                        ) : requestSent ? (
                            <button
                                disabled
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    borderRadius: '8px',
                                    fontSize: '1rem',
                                    background: '#222',
                                    color: '#777',
                                    border: '1px solid #333',
                                    cursor: 'default'
                                }}
                            >
                                Request Sent
                            </button>
                        ) : requestReceived ? (
                            <div style={{ flex: 1, display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={onAcceptRequest}
                                    style={{
                                        flex: 2,
                                        padding: '12px',
                                        borderRadius: '8px',
                                        fontSize: '1rem',
                                        background: 'var(--accent-blue)',
                                        color: 'white',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    Accept
                                </button>
                                <button
                                    onClick={onDeclineRequest}
                                    style={{
                                        flex: 1,
                                        padding: '12px',
                                        borderRadius: '8px',
                                        fontSize: '1rem',
                                        background: 'transparent',
                                        color: '#dc2743',
                                        border: '1px solid #dc2743',
                                        cursor: 'pointer'
                                    }}
                                >
                                    &times;
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={onSendRequest}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    borderRadius: '8px',
                                    fontSize: '1rem',
                                    background: 'var(--accent-blue)',
                                    color: 'white',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontWeight: 'bold'
                                }}
                            >
                                Add Friend
                            </button>
                        )}
                        <button
                            onClick={() => alert('Message feature coming soon!')}
                            className="btn-secondary"
                            style={{ flex: 1, padding: '12px', borderRadius: '8px', fontSize: '1rem' }}
                        >
                            Message
                        </button>
                    </div>
                )}

            </div>

            {/* Edit Modal (Overlay) */}
            {
                isEditing && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                        <div className="card" style={{ width: '90%', maxWidth: '500px', background: '#111', border: '1px solid #333' }}>
                            <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>Edit Profile</h3>
                            <form onSubmit={onSubmit}>
                                <div className="input-group">
                                    <label>Profile Photo</label>
                                    <input type="file" name="profilePhoto" accept="image/*" onChange={onChange} style={{ color: 'white' }} />
                                    {profilePhoto && profilePhoto !== 'https://ui-avatars.com/api/?name=User&background=random' && !removePhoto && (
                                        <button
                                            type="button"
                                            onClick={() => { setRemovePhoto(true); setFile(null); }}
                                            style={{ marginTop: '5px', background: '#dc2743', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: '0.8rem' }}
                                        >
                                            Remove Photo
                                        </button>
                                    )}
                                    {removePhoto && (
                                        <div style={{ color: '#dc2743', fontSize: '0.9rem', marginTop: '5px' }}>
                                            Photo will be removed on save.
                                            <button
                                                type="button"
                                                onClick={() => setRemovePhoto(false)}
                                                style={{ marginLeft: '10px', background: 'none', border: '1px solid #777', color: '#ccc', padding: '2px 5px', borderRadius: '3px', cursor: 'pointer', fontSize: '0.8rem' }}
                                            >
                                                Undo
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="input-group">
                                    <label>Bio</label>
                                    <textarea name="description" value={description} onChange={onChange} rows="3" style={{ width: '100%', padding: '10px', background: '#222', color: 'white', border: '1px solid #444', borderRadius: '5px' }}></textarea>
                                </div>
                                <div className="input-group">
                                    <label>Sports (comma separated)</label>
                                    <input type="text" name="preferredSports" value={preferredSports} onChange={onChange} />
                                </div>
                                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                                    <button type="button" onClick={() => setIsEditing(false)} style={{ flex: 1, padding: '10px', background: '#333', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Cancel</button>
                                    <button type="submit" className="btn-primary" style={{ flex: 1 }}>Save</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Friends Modal */}
            {showFriendsModal && (
                <div
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}
                    onClick={() => setShowFriendsModal(false)}
                >
                    <div
                        className="card"
                        style={{ width: '90%', maxWidth: '400px', background: '#111', border: '1px solid #333', maxHeight: '80vh', overflowY: 'auto' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0 }}>Friends</h3>
                            <button onClick={() => setShowFriendsModal(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {profileUser.friends && profileUser.friends.map(friend => (
                                <div
                                    key={friend._id || friend}
                                    onClick={() => {
                                        if (friend._id) {
                                            navigate(`/profile/${friend._id}`);
                                            setShowFriendsModal(false);
                                        }
                                    }}
                                    style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '10px', background: '#222', borderRadius: '8px', cursor: friend._id ? 'pointer' : 'default', transition: 'background 0.3s' }}
                                    onMouseOver={(e) => friend._id && (e.currentTarget.style.background = '#333')}
                                    onMouseOut={(e) => friend._id && (e.currentTarget.style.background = '#222')}
                                >
                                    <img
                                        src={friend.profilePhoto || 'https://ui-avatars.com/api/?name=User&background=random'}
                                        alt={friend.username}
                                        style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                                        onError={(e) => { e.target.onerror = null; e.target.src = 'https://ui-avatars.com/api/?name=User&background=random'; }}
                                    />
                                    <div>
                                        <div style={{ fontWeight: 'bold' }}>{friend.name || 'Unknown User'}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#aaa' }}>{friend.username ? `@${friend.username}` : ''}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
