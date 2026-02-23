import { createContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

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

    const register = async (userData) => {
        try {
            const res = await api.post('/api/auth/register', userData);
            setToken(res.data.token);
            localStorage.setItem('token', res.data.token);
            setIsAuthenticated(true);
            await loadUser();
            return { success: true };
        } catch (err) {
            console.error(err);
            return { success: false, msg: err.response?.data?.msg || 'Registration failed' };
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
            return { success: false, msg: err.response?.data?.msg || 'Login failed' };
        }
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('token');
    };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            isAuthenticated,
            loading,
            register,
            login,
            logout,
            loadUser
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
