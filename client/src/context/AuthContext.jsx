import { createContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { io } from 'socket.io-client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [socket, setSocket] = useState(null);

    // Headers are now handled by the api interceptor in src/utils/api.js

    const loadUser = async () => {
        if (!localStorage.getItem('token')) {
            setLoading(false);
            return;
        }

        try {
            const res = await api.get('/api/auth/user');
            setUser(res.data);
            setIsAuthenticated(true);
            
            // Fetch unread messages count
            try {
                const unreadRes = await api.get('/api/messages/unread');
                setUnreadCount(unreadRes.data.count);
            } catch (msgErr) {
                console.error('Error fetching unread messages count', msgErr);
            }
        } catch (err) {
            console.error('User load error:', err);
            logout();
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUser();
    }, []);

    useEffect(() => {

        
        // Setup Socket.io globally when user logs in
        let newSocket;
        if (isAuthenticated && user) {
            newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');
            newSocket.emit('join', user._id);
            
            newSocket.on('receiveMessage', () => {
                 api.get('/api/messages/unread')
                    .then(res => setUnreadCount(res.data.count))
                    .catch(err => console.error(err));
            });
            setSocket(newSocket);
        }

        // Poll for unread messages fallback just in case
        const interval = setInterval(() => {
            if (isAuthenticated) {
                api.get('/api/messages/unread')
                   .then(res => setUnreadCount(res.data.count))
                   .catch(err => console.error('Error polling unread count', err));
            }
        }, 30000);

        return () => {
            clearInterval(interval);
            if (newSocket) newSocket.close();
        };
    }, [isAuthenticated, user?._id]);

    const register = async (userData) => {
        try {
            const res = await api.post('/api/auth/register', userData);
            if (res.data.requireOtp) {
                return { success: true, requireOtp: true, msg: res.data.msg, email: res.data.email };
            }
            return { success: true };
        } catch (err) {
            console.error(err);
            return { success: false, msg: err.response?.data?.msg || 'Registration failed' };
        }
    };

    const verifyOtp = async (email, otp) => {
        try {
            const res = await api.post('/api/auth/verify-otp', { email, otp });
            setToken(res.data.token);
            localStorage.setItem('token', res.data.token);
            setIsAuthenticated(true);
            await loadUser();
            return { success: true };
        } catch (err) {
            console.error(err);
            return { success: false, msg: err.response?.data?.msg || 'Verification failed' };
        }
    };

    const resendOtp = async (email) => {
        try {
            const res = await api.post('/api/auth/resend-otp', { email });
            return { success: true, msg: res.data.msg };
        } catch (err) {
            console.error(err);
            return { success: false, msg: err.response?.data?.msg || 'Failed to resend OTP' };
        }
    };

    const forgotPassword = async (email) => {
        try {
            const res = await api.post('/api/auth/forgot-password', { email });
            return { success: true, msg: res.data.msg };
        } catch (err) {
            console.error(err);
            return { success: false, msg: err.response?.data?.msg || 'Failed to reset password' };
        }
    };

    const login = async (formData) => {
        try {
            const res = await api.post('/api/auth/login', formData);
            setToken(res.data.token);
            localStorage.setItem('token', res.data.token);
            setIsAuthenticated(true);
            await loadUser();
            return { success: true };
        } catch (err) {
            console.error(err);
            if (err.response?.data?.requireOtp) {
                return { success: false, requireOtp: true, msg: err.response.data.msg, email: err.response.data.email };
            }
            return { success: false, msg: err.response?.data?.msg || 'Login failed' };
        }
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
        setUnreadCount(0);
        localStorage.removeItem('token');
    };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            isAuthenticated,
            loading,
            register,
            verifyOtp,
            resendOtp,
            forgotPassword,
            login,
            logout,
            loadUser,
            unreadCount,
            setUnreadCount,
            socket
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
