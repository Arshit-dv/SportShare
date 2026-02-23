import { useState, useContext } from 'react';
import EventContext from '../context/EventContext';

const EventForm = ({ onClose }) => {
    const { addEvent } = useContext(EventContext);

    const [event, setEvent] = useState({
        title: '',
        sportType: 'Football',
        description: '',
        location: '',
        date: '',
        maxParticipants: 10
    });

    const { title, sportType, description, location, date, maxParticipants } = event;

    const onChange = e => setEvent({ ...event, [e.target.name]: e.target.value });

    const onSubmit = e => {
        e.preventDefault();
        addEvent(event);
        setEvent({
            title: '',
            sportType: 'Football',
            description: '',
            location: '',
            date: '',
            maxParticipants: 10
        });
        if (onClose) onClose();
    };

    return (
        <div className="card" style={{ marginBottom: '20px', border: '1px solid var(--accent-blue)' }}>
            <h3 style={{ marginTop: 0 }}>Host a New Event</h3>
            <form onSubmit={onSubmit}>
                <div className="input-group">
                    <input type="text" placeholder="Event Title" name="title" value={title} onChange={onChange} required />
                </div>
                <div className="input-group">
                    <select name="sportType" value={sportType} onChange={onChange} style={{ width: '100%', padding: '10px', background: 'var(--bg-color)', color: 'white', border: '1px solid #333', borderRadius: '5px' }}>
                        <option value="Football">Football</option>
                        <option value="Cricket">Cricket</option>
                        <option value="Basketball">Basketball</option>
                        <option value="Tennis">Tennis</option>
                        <option value="Badminton">Badminton</option>
                        <option value="Running">Running</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                <div className="input-group">
                    <input type="text" placeholder="Location" name="location" value={location} onChange={onChange} required />
                </div>
                <div className="input-group">
                    <input type="datetime-local" name="date" value={date} onChange={onChange} required style={{ colorScheme: 'dark' }} />
                </div>
                <div className="input-group">
                    <input type="number" placeholder="Max Participants" name="maxParticipants" value={maxParticipants} onChange={onChange} required min="2" />
                </div>
                <div className="input-group">
                    <textarea placeholder="Description" name="description" value={description} onChange={onChange} required style={{ width: '100%', padding: '10px', background: 'var(--bg-color)', color: 'white', border: '1px solid #333', borderRadius: '5px', minHeight: '80px' }}></textarea>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="submit" className="btn-primary">Publish Event</button>
                    <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                </div>
            </form>
        </div>
    );
};

export default EventForm;
