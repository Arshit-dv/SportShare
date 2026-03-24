import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import EventContext from '../context/EventContext';
import EventItem from '../components/EventItem';
import EventForm from '../components/EventForm';

const Dashboard = () => {
    const authContext = useContext(AuthContext);
    const eventContext = useContext(EventContext);
    const navigate = useNavigate();

    const { user, logout } = authContext;
    const { events, getEvents, loading } = eventContext;

    if (!user) {
        return <div className="dashboard-container" style={{ textAlign: 'center', marginTop: '50px' }}><h2>Loading profile...</h2></div>;
    }

    useEffect(() => {
        getEvents();
        // eslint-disable-next-line
    }, []);

    const [showForm, setShowForm] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);

    // Filter events based on search query AND date
    // Filter events based on search query
    // Show only UPCOMING events by default in dashboard? Or all valid events?
    // User requested "dashboard will only contain upcoming events"

    // Filter events based on search query AND date (Upcoming only)
    const now = new Date();

    const filteredEvents = events ? events
        .filter(event =>
        (event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            event.sportType.toLowerCase().includes(searchQuery.toLowerCase()) ||
            event.location.toLowerCase().includes(searchQuery.toLowerCase()))
        )
        .filter(event => new Date(event.date) >= now) // Only upcoming
        .sort((a, b) => new Date(a.date) - new Date(b.date)) // Ascending
        : [];

    return (
        <div className="dashboard-container">
            <div className="feed">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '2rem' }}>
                            Hey, <span style={{ color: 'var(--accent-green)' }}>{user && user.name}</span>
                        </h1>
                        <p style={{ color: '#aaa', margin: '5px 0 0 0' }}>Here are the upcoming events.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        {/* Search Bar */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            background: isSearchExpanded ? '#1a1b26' : 'transparent',
                            borderRadius: '20px',
                            padding: '5px',
                            border: isSearchExpanded ? '1px solid #7aa2f7' : '1px solid transparent',
                            transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)', // Smooth expansion
                            width: isSearchExpanded ? '60vw' : 'auto', // Expand to ~60-75% of viewport width
                            maxWidth: '800px'
                        }}>
                            <input
                                type="text"
                                placeholder="Search by title, sport, or location..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    flex: 1, // Take up remaining space
                                    width: isSearchExpanded ? '100%' : '0',
                                    opacity: isSearchExpanded ? 1 : 0,
                                    padding: isSearchExpanded ? '5px 15px' : '0',
                                    border: 'none',
                                    background: 'transparent',
                                    color: 'white',
                                    outline: 'none',
                                    transition: 'all 0.3s',
                                    fontSize: '1.1rem'
                                }}
                            />
                            <button
                                onClick={() => setIsSearchExpanded(!isSearchExpanded)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#7aa2f7',
                                    fontSize: '1.1rem',
                                    cursor: 'pointer',
                                    padding: '8px 15px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                <span style={{ fontSize: '1.3rem' }}>🔍</span>
                                <span style={{ fontWeight: 'bold' }}>Search</span>
                            </button>
                        </div>

                        <button
                            onClick={() => setShowForm(!showForm)}
                            className="btn-primary"
                        >
                            {showForm ? 'Close Form' : '+ Host Event'}
                        </button>
                        <button onClick={() => { logout(); navigate('/'); }} className="btn-secondary" style={{ padding: '8px 15px', fontSize: '0.9rem' }}>
                            Logout
                        </button>
                    </div>
                </div>

                {showForm && <EventForm onClose={() => setShowForm(false)} />}

                <div className="events-list">
                    {events !== null && !loading ? (
                        filteredEvents.length === 0 ? (
                            <p style={{ textAlign: 'center', color: '#666', marginTop: '50px' }}>
                                {searchQuery ? 'No events match your search.' : 'No events found. Be the first to host one!'}
                            </p>
                        ) : (
                            filteredEvents.map(event => (
                                <EventItem key={event._id} event={event} />
                            ))
                        )
                    ) : (
                        <p>Loading events...</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
