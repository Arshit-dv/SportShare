import { useContext, useEffect, useState } from 'react';
import AuthContext from '../context/AuthContext';
import EventContext from '../context/EventContext';
import EventItem from '../components/EventItem';

const PastEvents = () => {
    const authContext = useContext(AuthContext);
    const eventContext = useContext(EventContext);

    const { user } = authContext;
    const { events, getEvents, loading } = eventContext;

    useEffect(() => {
        getEvents();
        // eslint-disable-next-line
    }, []);

    const [searchQuery, setSearchQuery] = useState('');

    // Filter for Past Events
    const now = new Date();
    let pastEvents = [];

    if (events) {
        // 1. Filter by search query first
        const searchedEvents = events.filter(event =>
            event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            event.sportType.toLowerCase().includes(searchQuery.toLowerCase()) ||
            event.location.toLowerCase().includes(searchQuery.toLowerCase())
        );

        // 2. Filter for Past AND Attended/Hosted
        pastEvents = searchedEvents
            .filter(event => new Date(event.date) < now)
            .filter(event => {
                if (!user || !user._id) return false;

                const userId = user._id.toString();

                // Handle Creator check
                const creatorId = event.user._id
                    ? event.user._id.toString()
                    : event.user.toString();

                const isCreator = creatorId === userId;

                // Handle Participant check
                const isParticipant = event.participants.some(p => {
                    const pUserId = (p.user && p.user._id)
                        ? p.user._id.toString()
                        : (p.user ? p.user.toString() : null);

                    return pUserId === userId;
                });

                return isCreator || isParticipant;
            })
            .sort((a, b) => new Date(b.date) - new Date(a.date)); // Descending (most recent first)
    }

    return (
        <div className="dashboard-container">
            <div className="feed">
                <div style={{ marginBottom: '20px' }}>
                    <h1 style={{ margin: 0, fontSize: '2rem', color: '#aaa' }}>
                        Past Events
                    </h1>
                    <p style={{ color: '#666', margin: '5px 0 0 0' }}>Events you hosted or attended.</p>
                </div>

                {/* Search Bar (Reused style) */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: '#1a1b26',
                    borderRadius: '20px',
                    padding: '5px',
                    border: '1px solid #7aa2f7',
                    marginBottom: '30px',
                    width: '100%',
                    maxWidth: '800px'
                }}>
                    <input
                        type="text"
                        placeholder="Search your history..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            flex: 1,
                            padding: '5px 15px',
                            border: 'none',
                            background: 'transparent',
                            color: 'white',
                            outline: 'none',
                            fontSize: '1.1rem'
                        }}
                    />
                    <span style={{ fontSize: '1.3rem', paddingRight: '15px' }}>🔍</span>
                </div>

                <div className="events-list">
                    {events !== null && !loading ? (
                        pastEvents.length > 0 ? (
                            pastEvents.map(event => (
                                <EventItem key={event._id} event={event} />
                            ))
                        ) : (
                            <p style={{ color: '#666', fontStyle: 'italic', textAlign: 'center', marginTop: '50px' }}>
                                {searchQuery ? 'No past events match your search.' : 'No past events found.'}
                            </p>
                        )
                    ) : (
                        <p>Loading events...</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PastEvents;
