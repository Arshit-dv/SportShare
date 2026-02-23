import { createContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Setup Axios defaults
    if (token) {
        axios.defaults.headers.common['x-auth-token'] = token;
    } else {
        delete axios.defaults.headers.common['x-auth-token'];
    }

    const loadUser = async () => {
        if (localStorage.getItem('token')) {
            axios.defaults.headers.common['x-auth-token'] = localStorage.getItem('token');
        } else {
            setLoading(false);
            return;
        }

        try {
            const res = await axios.get('/api/auth/user');
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
            const res = await axios.post('/api/auth/register', userData);
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
            const res = await axios.post('/api/auth/login', formData);
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
        delete axios.defaults.headers.common['x-auth-token'];
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
