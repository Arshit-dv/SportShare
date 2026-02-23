import { createContext, useReducer, useContext } from 'react';
import axios from 'axios';
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
            const res = await axios.get('/api/events');

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
        const config = {
            headers: {
                'Content-Type': 'application/json'
            }
        };

        try {
            const res = await axios.post('/api/events', event, config);

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
        const config = {
            headers: {
                'Content-Type': 'application/json'
            }
        };

        try {
            const res = await axios.put(`/api/events/${id}`, updatedData, config);

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
            await axios.delete(`/api/events/${id}`);

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
            const res = await axios.put(`/api/events/join/${id}`);

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
                joinEvent
            }}
        >
            {children}
        </EventContext.Provider>
    );
};

export default EventContext;
