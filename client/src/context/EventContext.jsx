import { createContext, useReducer, useContext } from 'react';
import api from '../utils/api';
import AuthContext from './AuthContext';

const EventContext = createContext();

const eventReducer = (state, action) => {
    switch (action.type) {
        case 'GET_EVENTS':
            return {
                ...state,
                events: action.payload,
                loading: false
            };
        case 'ADD_EVENT':
            return {
                ...state,
                events: [...state.events, action.payload],
                loading: false
            };
        case 'DELETE_EVENT':
            return {
                ...state,
                events: state.events.filter(event => event._id !== action.payload),
                loading: false
            };
        case 'UPDATE_EVENT':
            return {
                ...state,
                events: state.events.map(event =>
                    event._id === action.payload._id ? action.payload : event
                ),
                loading: false
            };
        case 'EVENT_ERROR':
            return {
                ...state,
                error: action.payload
            };
        default:
            return state;
    }
};

export const EventProvider = ({ children }) => {
    const initialState = {
        events: [],
        error: null,
        loading: true
    };

    const [state, dispatch] = useReducer(eventReducer, initialState);
    const { token } = useContext(AuthContext);

    // Get Events
    const getEvents = async () => {
        try {
            const res = await api.get('/api/events');

            dispatch({
                type: 'GET_EVENTS',
                payload: res.data
            });
        } catch (err) {
            dispatch({
                type: 'EVENT_ERROR',
                payload: err.response.msg
            });
        }
    };
    // Add Event
    const addEvent = async event => {
        try {
            const res = await api.post('/api/events', event);

            dispatch({
                type: 'ADD_EVENT',
                payload: res.data
            });
            return { success: true };
        } catch (err) {
            dispatch({
                type: 'EVENT_ERROR',
                payload: err.response.msg
            });
            return { success: false, msg: err.response.data.msg };
        }
    };

    // Update Event
    const updateEvent = async (id, updatedData) => {
        try {
            const res = await api.put(`/api/events/${id}`, updatedData);

            dispatch({
                type: 'UPDATE_EVENT',
                payload: res.data
            });
            return { success: true };
        } catch (err) {
            dispatch({
                type: 'EVENT_ERROR',
                payload: err.response ? err.response.data.msg : 'Server Error'
            });
            return { success: false, msg: err.response ? err.response.data.msg : 'Server Error' };
        }
    };

    // Delete Event
    const deleteEvent = async id => {
        try {
            await api.delete(`/api/events/${id}`);

            dispatch({
                type: 'DELETE_EVENT',
                payload: id
            });
        } catch (err) {
            dispatch({
                type: 'EVENT_ERROR',
                payload: err.response.msg
            });
        }
    };

    // Join/Leave Event
    const joinEvent = async id => {
        try {
            const res = await api.put(`/api/events/join/${id}`);

            // We need to update the specific event in state with new participants
            // But the API returns only participants array.
            // Let's refetch or update locally. Ideally return the updated event from API or just participants
            // For simplicity, let's re-fetch all events or find the event and update participants.
            // Better: update the backend to return the full event or just update local state.

            // Let's modify the reducer to handle partial updates or just refetch.
            // Refetching is safest for now to get fresh data including population if needed.
            getEvents();

        } catch (err) {
            dispatch({
                type: 'EVENT_ERROR',
                payload: err.response.data.msg
            });
            return { success: false, msg: err.response.data.msg };
        }
    };

    // Upload Event Image
    const uploadEventImage = async (id, formData) => {
        try {
            await api.post(`/api/events/${id}/images`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            getEvents();
            return { success: true };
        } catch (err) {
            dispatch({
                type: 'EVENT_ERROR',
                payload: err.response?.data?.msg || 'Error uploading image'
            });
            return { success: false, msg: err.response?.data?.msg || 'Error uploading image' };
        }
    };

    // Delete Event Image
    const deleteEventImage = async (eventId, imageId) => {
        try {
            await api.delete(`/api/events/${eventId}/images/${imageId}`);
            getEvents();
            return { success: true };
        } catch (err) {
            dispatch({
                type: 'EVENT_ERROR',
                payload: err.response?.data?.msg || 'Error deleting image'
            });
            return { success: false, msg: err.response?.data?.msg || 'Error deleting image' };
        }
    };

    return (
        <EventContext.Provider
            value={{
                events: state.events,
                error: state.error,
                loading: state.loading,
                getEvents,
                addEvent,
                updateEvent,
                deleteEvent,
                joinEvent,
                uploadEventImage,
                deleteEventImage
            }}
        >
            {children}
        </EventContext.Provider>
    );
};

export default EventContext;
