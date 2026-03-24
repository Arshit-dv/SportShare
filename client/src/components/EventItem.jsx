import { useContext, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import EventContext from '../context/EventContext';

const EventItem = ({ event }) => {
    const { user } = useContext(AuthContext);
    const { deleteEvent, joinEvent, updateEvent, uploadEventImage, deleteEventImage } = useContext(EventContext);

    const { _id, title, description, sportType, location, date, participants, maxParticipants, user: creator, images = [] } = event;

    const [isEditing, setIsEditing] = useState(false);
    const [editDescription, setEditDescription] = useState(description);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [showGallery, setShowGallery] = useState(false);
    const [showParticipants, setShowParticipants] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [photoDescription, setPhotoDescription] = useState("");
    const fileInputRef = useRef(null);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setSelectedFile(file);
        setPhotoDescription("");
        setShowGallery(true);
    };

    const handleUploadConfirm = async () => {
        if (!selectedFile) return;

        setUploadingImage(true);
        const formData = new FormData();
        formData.append('image', selectedFile);
        if (photoDescription.trim()) {
            formData.append('description', photoDescription.trim());
        }
        await uploadEventImage(_id, formData);
        
        setUploadingImage(false);
        setSelectedFile(null);
        setPhotoDescription("");
        if (fileInputRef.current) fileInputRef.current.value = null;
    };

    const handleUploadCancel = () => {
        setSelectedFile(null);
        setPhotoDescription("");
        if (fileInputRef.current) fileInputRef.current.value = null;
    };

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
                <div 
                    style={{ cursor: participants.length > 0 ? 'pointer' : 'default', position: 'relative' }}
                    onClick={() => participants.length > 0 && setShowParticipants(!showParticipants)}
                    title={participants.length > 0 ? "Click to view participants" : ""}
                >
                    👥 Spots: {participants.length} / {maxParticipants}
                    {participants.length > 0 && (
                        <span style={{ fontSize: '0.8rem', marginLeft: '5px' }}>{showParticipants ? '▲' : '▼'}</span>
                    )}

                    {showParticipants && participants.length > 0 && (
                        <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            marginTop: '10px',
                            background: '#24283b',
                            border: '1px solid #7aa2f7',
                            borderRadius: '8px',
                            padding: '10px',
                            zIndex: 10,
                            width: '200px',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                            maxHeight: '150px',
                            overflowY: 'auto'
                        }}>
                            <h5 style={{ margin: '0 0 5px 0', color: '#aaa', fontSize: '0.9rem', borderBottom: '1px solid #333', paddingBottom: '5px' }}>
                                Participants
                            </h5>
                            {participants.map((p, idx) => (
                                <Link 
                                    key={idx} 
                                    to={`/profile/${p.user?._id || p.user}`} 
                                    style={{ color: '#7aa2f7', textDecoration: 'none', fontSize: '0.9rem' }}
                                    onMouseOver={(e) => e.target.style.color = '#bb9af7'}
                                    onMouseOut={(e) => e.target.style.color = '#7aa2f7'}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {p.user?.name || 'User'}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Action Buttons */}
            <div style={{ marginTop: '20px', display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
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
                </div>

                {isCreator && (
                    <button onClick={onDelete} style={{ padding: '8px 15px', background: 'var(--danger)', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                        Delete
                    </button>
                )}
            </div>

            {/* Gallery Section */}
            {(images.length > 0 || isCreator || isParticipant) && (
                <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #333' }}>
                    <div 
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                        onClick={() => setShowGallery(!showGallery)}
                    >
                        <h4 style={{ margin: 0, color: '#aaa', fontSize: '1.1rem' }}>
                            📷 Event Gallery ({images.length})
                        </h4>
                        <span style={{ color: '#aaa', fontSize: '1.2rem' }}>
                            {showGallery ? '▲' : '▼'}
                        </span>
                    </div>
                    
                    {showGallery && (
                        <div style={{ marginTop: '15px' }}>
                            {(isCreator || isParticipant) && (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginBottom: '15px' }}>
                                    {!selectedFile ? (
                                        <>
                                            <input 
                                                type="file" 
                                                ref={fileInputRef} 
                                                style={{ display: 'none' }} 
                                                accept="image/*"
                                                onChange={handleImageChange}
                                            />
                                            <button 
                                                onClick={() => fileInputRef.current.click()}
                                                disabled={uploadingImage}
                                                style={{ 
                                                    padding: '5px 10px', 
                                                    background: '#24283b', 
                                                    color: '#7aa2f7', 
                                                    border: '1px solid #7aa2f7', 
                                                    borderRadius: '5px', 
                                                    cursor: 'pointer',
                                                    fontSize: '0.9rem',
                                                    transition: 'background 0.2s'
                                                }}
                                                onMouseOver={(e) => e.target.style.background = '#1a1b26'}
                                                onMouseOut={(e) => e.target.style.background = '#24283b'}
                                            >
                                                {uploadingImage ? 'Uploading...' : '+ Add Photo'}
                                            </button>
                                        </>
                                    ) : (
                                        <div style={{
                                            background: '#1a1b26',
                                            padding: '10px',
                                            borderRadius: '8px',
                                            border: '1px solid #7aa2f7',
                                            width: '100%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '10px'
                                        }}>
                                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                <img 
                                                    src={URL.createObjectURL(selectedFile)} 
                                                    alt="preview" 
                                                    style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '5px' }} 
                                                />
                                                <input 
                                                    type="text" 
                                                    placeholder="Add a short caption for this memory (optional)..."
                                                    value={photoDescription}
                                                    onChange={(e) => setPhotoDescription(e.target.value)}
                                                    style={{
                                                        flex: 1,
                                                        padding: '8px',
                                                        background: '#24283b',
                                                        border: '1px solid #444',
                                                        borderRadius: '5px',
                                                        color: 'white',
                                                        outline: 'none'
                                                    }}
                                                />
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                                <button 
                                                    onClick={handleUploadCancel} 
                                                    disabled={uploadingImage} 
                                                    style={{ padding: '5px 10px', background: '#333', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                                                >
                                                    Cancel
                                                </button>
                                                <button 
                                                    onClick={handleUploadConfirm} 
                                                    disabled={uploadingImage} 
                                                    style={{ padding: '5px 10px', background: 'var(--accent-green)', color: '#000', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
                                                >
                                                    {uploadingImage ? 'Uploading...' : 'Confirm Upload'}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {images.length > 0 ? (
                                <div style={{ 
                                    display: 'flex', 
                                    gap: '10px', 
                                    overflowX: 'auto', 
                                    paddingBottom: '10px',
                                    flexWrap: 'nowrap'
                                }}>
                                    {images.map((img, index) => {
                                        const isMyImage = img.uploadedBy?._id === user._id || img.uploadedBy === user._id;
                                        
                                        return (
                                            <div key={index} style={{ flexShrink: 0, position: 'relative' }}>
                                                <img 
                                                    src={img.url} 
                                                    alt={img.description || "event memory"} 
                                                    style={{ 
                                                        width: '120px', 
                                                        height: '120px', 
                                                        objectFit: 'cover', 
                                                        borderRadius: '8px',
                                                        border: '1px solid #444',
                                                        cursor: 'pointer',
                                                        transition: 'transform 0.2s',
                                                    }} 
                                                    onClick={() => window.open(img.url, '_blank')}
                                                    onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
                                                    onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                                                    title={`Uploaded by ${img.uploadedBy?.name || 'A participant'}${img.description ? `\n\n${img.description}` : ''}`}
                                                />
                                                {img.description && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        bottom: '5px',
                                                        left: '5px',
                                                        right: '5px',
                                                        background: 'rgba(0, 0, 0, 0.7)',
                                                        color: '#e0e0e0',
                                                        fontSize: '0.75rem',
                                                        padding: '3px 6px',
                                                        borderRadius: '4px',
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        pointerEvents: 'none',
                                                        textAlign: 'center'
                                                    }}>
                                                        {img.description}
                                                    </div>
                                                )}
                                                {(isMyImage || isCreator) && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (window.confirm("Are you sure you want to delete this photo?")) {
                                                                deleteEventImage(_id, img._id);
                                                            }
                                                        }}
                                                        style={{
                                                            position: 'absolute',
                                                            top: '5px',
                                                            right: '5px',
                                                            background: 'rgba(255, 0, 0, 0.7)',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '50%',
                                                            width: '24px',
                                                            height: '24px',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontSize: '0.8rem',
                                                            transition: 'background 0.2s',
                                                            padding: 0
                                                        }}
                                                        onMouseOver={(e) => e.target.style.background = 'rgba(255, 0, 0, 1)'}
                                                        onMouseOut={(e) => e.target.style.background = 'rgba(255, 0, 0, 0.7)'}
                                                        title="Delete photo"
                                                    >
                                                        ✖
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p style={{ color: '#666', fontSize: '0.9rem', fontStyle: 'italic', margin: 0, paddingBottom: '10px' }}>
                                    No photos yet. Share your memory!
                                </p>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default EventItem;
