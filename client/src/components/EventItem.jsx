import { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import EventContext from '../context/EventContext';

const EventItem = ({ event }) => {
    const { user } = useContext(AuthContext);
    const { deleteEvent, joinEvent, updateEvent } = useContext(EventContext);

    const { _id, title, description, sportType, location, date, participants, maxParticipants, user: creator } = event;

    const [isEditing, setIsEditing] = useState(false);
    const [editDescription, setEditDescription] = useState(description);

    const onDelete = () => {
        deleteEvent(_id);
    };

    const onJoin = () => {
        joinEvent(_id);
    };

    const onSave = async () => {
        await updateEvent(_id, { description: editDescription });
        setIsEditing(false);
    };

    const onCancel = () => {
        setEditDescription(description);
        setIsEditing(false);
    };

    // Check if user has joined
    const isParticipant = participants.some(p => p.user === user._id || (p.user._id && p.user._id === user._id));
    const isCreator = creator._id === user._id;
    const isFull = participants.length >= maxParticipants;
    const isPast = new Date(date) < new Date();

    return (
        <div className="card" style={{ marginBottom: '20px', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: '0 0 10px 0', color: 'var(--accent-green)' }}>{title}</h3>
                <span style={{ background: '#333', padding: '5px 10px', borderRadius: '5px', fontSize: '0.8rem' }}>
                    {sportType}
                </span>
            </div>

            {isEditing ? (
                <div style={{ marginBottom: '15px' }}>
                    <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        rows="3"
                        style={{
                            width: '100%',
                            padding: '10px',
                            background: '#222',
                            color: 'white',
                            border: '1px solid #7aa2f7',
                            borderRadius: '5px',
                            resize: 'vertical'
                        }}
                    />
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                        <button onClick={onSave} style={{ padding: '5px 10px', background: 'var(--accent-green)', border: 'none', borderRadius: '3px', cursor: 'pointer', fontWeight: 'bold' }}>Save</button>
                        <button onClick={onCancel} style={{ padding: '5px 10px', background: '#333', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>Cancel</button>
                    </div>
                </div>
            ) : (
                <div style={{ position: 'relative' }}>
                    <p style={{ color: '#ccc', marginBottom: '15px', paddingRight: isCreator && !isPast ? '30px' : '0' }}>{description}</p>
                    {isCreator && !isPast && (
                        <button
                            onClick={() => setIsEditing(true)}
                            style={{
                                position: 'absolute',
                                top: '-5px',
                                right: '0',
                                background: 'transparent',
                                border: 'none',
                                color: '#7aa2f7',
                                cursor: 'pointer',
                                fontSize: '1.2rem',
                                padding: '2px'
                            }}
                            title="Edit Description"
                        >
                            ✏️
                        </button>
                    )}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', fontSize: '15px', color: 'var(--text-secondary)' }}>
                <div>📍 {location}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <span>📅 {new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    <span style={{ color: '#ccc' }}>🕒 {new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div>
                    👤 Host: <Link to={`/profile/${creator._id}`} target="_blank" rel="noopener noreferrer" style={{
                        color: '#7aa2f7',
                        fontWeight: 'bold',
                        textDecoration: 'none',
                        transition: 'color 0.2s',
                        fontSize: '1.2rem' // Increased size
                    }}
                        onMouseOver={(e) => e.target.style.color = '#bb9af7'}
                        onMouseOut={(e) => e.target.style.color = '#7aa2f7'}
                    >
                        {creator.name}
                    </Link>
                </div>
                <div>👥 Spots: {participants.length} / {maxParticipants}</div>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                {isPast ? (
                    <span style={{
                        padding: '8px 15px',
                        background: '#333',
                        color: '#888',
                        borderRadius: '5px',
                        fontSize: '0.9rem',
                        fontWeight: 'bold',
                        border: '1px solid #444'
                    }}>
                        Event Ended
                    </span>
                ) : (
                    <>
                        {!isCreator && !isParticipant && !isFull && (
                            <button onClick={onJoin} className="btn-primary" style={{ padding: '8px 15px' }}>
                                Join Event
                            </button>
                        )}
                        {!isCreator && isParticipant && (
                            <button onClick={onJoin} className="btn-secondary" style={{ padding: '8px 15px' }}>
                                Leave Event
                            </button>
                        )}
                        {isFull && !isParticipant && !isCreator && (
                            <button disabled style={{ padding: '8px 15px', background: '#333', color: '#666', border: 'none', borderRadius: '5px' }}>
                                Full
                            </button>
                        )}
                    </>
                )}

                {isCreator && (
                    <button onClick={onDelete} style={{ padding: '8px 15px', background: 'var(--danger)', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                        Delete
                    </button>
                )}
            </div>
        </div>
    );
};

export default EventItem;
