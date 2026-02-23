import { Link, useLocation } from 'react-router-dom';
import { useContext, useState, useEffect } from 'react';
import AuthContext from '../context/AuthContext';

const Sidebar = ({ isOpen, toggle }) => {
    const location = useLocation();
    const { user } = useContext(AuthContext);

    const pendingRequestsCount = user?.friendRequests?.length || 0;

    const [ballIndex, setBallIndex] = useState(0);
    const sports = ['🏀', '⚽', '🏐', '⚾']; // Removed 8-ball

    const handleAnimationIteration = () => {
        setBallIndex((prev) => (prev + 1) % sports.length);
    };

    const menuItems = [
        { name: 'Events', path: '/dashboard', icon: '📅' },
        { name: 'Profile', path: '/profile', icon: '👤' },
        { name: 'Inbox', path: '/inbox', icon: '📥', hasBadge: pendingRequestsCount > 0 },
        { name: 'Event History', path: '/history', icon: '📜' },
        { name: 'My Stats', path: '/stats', icon: '📈', hasBadge: false },
    ];

    return (
        <div className={`sidebar ${isOpen ? 'open' : 'closed'}`} style={{
            transition: 'all 0.3s',
            background: '#1a1b26', // Tokyo Night Background
            borderRight: '1px solid #24283b',
            minHeight: '100vh',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 100 // Ensure it's above other elements
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                {isOpen && <h2 style={{ color: '#7aa2f7', margin: 0, fontSize: '1.8rem' }}>Menu</h2>}
                <button onClick={toggle} style={{
                    background: 'none',
                    border: 'none',
                    color: '#a9b1d6',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    padding: '5px'
                }}>
                    {isOpen ? '◀' : '▶'}
                </button>
            </div>

            <ul style={{ listStyle: 'none', padding: 0, flex: 1 }}>
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <li key={item.path} style={{ marginBottom: '25px' }}>
                            <Link to={item.path} style={{
                                color: isActive ? '#bb9af7' : '#a9b1d6',
                                fontSize: '1.3rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: isOpen ? 'flex-start' : 'center',
                                gap: '15px',
                                textDecoration: 'none',
                                padding: '10px 15px',
                                background: isActive ? 'rgba(187, 154, 247, 0.1)' : 'transparent',
                                borderLeft: isActive ? '3px solid #bb9af7' : '3px solid transparent',
                                borderRadius: '0 8px 8px 0',
                                transition: 'all 0.2s',
                                width: '100%',
                                boxSizing: 'border-box',
                                position: 'relative'
                            }}>
                                <span style={{
                                    fontSize: '1.5rem',
                                    filter: isActive ? 'drop-shadow(0 0 5px #bb9af7)' : 'none',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    width: isOpen ? '30px' : 'auto'
                                }}>
                                    {item.icon}
                                    {item.hasBadge && (
                                        <span style={{
                                            position: 'absolute',
                                            top: '5px',
                                            right: isOpen ? 'auto' : '5px',
                                            left: isOpen ? '35px' : 'auto',
                                            background: '#f7768e', // Tokyo Night Red/Pink for alerts
                                            color: 'white',
                                            borderRadius: '50%',
                                            width: '10px',
                                            height: '10px',
                                            border: '2px solid #1a1b26'
                                        }}></span>
                                    )}
                                </span>
                                {isOpen && (
                                    <span style={{
                                        fontWeight: isActive ? 'bold' : 'normal',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}>
                                        {item.name}
                                        {item.hasBadge && (
                                            <span style={{
                                                background: 'rgba(247, 118, 142, 0.2)',
                                                color: '#f7768e',
                                                padding: '2px 6px',
                                                borderRadius: '10px',
                                                fontSize: '0.7rem',
                                                fontWeight: 'bold'
                                            }}>
                                                {pendingRequestsCount}
                                            </span>
                                        )}
                                    </span>
                                )}
                            </Link>
                        </li>
                    );
                })}
            </ul>

            {/* Bouncing Ball Animation */}
            <div style={{
                marginTop: 'auto',
                paddingBottom: '20px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-end',
                height: '180px',
                position: 'relative',
                overflow: 'hidden'
            }} className="bouncing-ball-container">
                <style>
                    {`
                        @keyframes ball-bounce {
                            0%, 100% { 
                                transform: translateY(0) scale(1.05, 0.95); 
                                animation-timing-function: cubic-bezier(0, 0, 0.58, 1); /* Quick takeoff */
                            }
                            10% { 
                                transform: translateY(-20px) scale(1);
                                animation-timing-function: ease-out; /* Decelerate as it rises */
                            }
                            50% { 
                                transform: translateY(-110px) rotate(360deg); 
                                animation-timing-function: ease-in; /* Accelerate as it falls */
                            }
                            90% { 
                                transform: translateY(-15px) scale(1);
                                animation-timing-function: cubic-bezier(0.42, 0, 1, 1); /* Fast landing */
                            }
                        }
                        @media (max-height: 650px) {
                            .bouncing-ball-container {
                                display: none !important;
                            }
                        }
                        .bouncing-ball {
                            animation: ball-bounce 1.2s infinite;
                            font-size: 4rem;
                            user-select: none;
                            z-index: 2;
                        }
                        .ball-shadow {
                            position: absolute;
                            bottom: 25px;
                            width: 60px;
                            height: 10px;
                            background: rgba(0,0,0,0.4);
                            border-radius: 50%;
                            filter: blur(4px);
                            transform: scale(1);
                            animation: shadow-scale 1.2s infinite;
                            z-index: 1;
                        }
                        @keyframes shadow-scale {
                            0%, 100% { 
                                transform: scale(1.4); 
                                opacity: 0.6;
                                animation-timing-function: ease-out;
                            }
                            50% { 
                                transform: scale(0.2); 
                                opacity: 0.05;
                                animation-timing-function: ease-in;
                            }
                        }
                    `}
                </style>
                <div className="ball-shadow"></div>
                <div
                    className="bouncing-ball"
                    onAnimationIteration={handleAnimationIteration}
                >
                    {sports[ballIndex]}
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
