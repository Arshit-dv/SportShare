import { createContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { io } from 'socket.io-client';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged, 
    sendPasswordResetEmail,
    getIdToken
} from 'firebase/auth';
import { auth } from '../firebase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [socket, setSocket] = useState(null);

    // Sync Firebase Auth state with our Application state
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    // Get the fresh ID token from Firebase
                    const token = await getIdToken(firebaseUser);
                    localStorage.setItem('token', token);
                    
                    // Load user metadata from our MongoDB
                    const res = await api.get('/api/auth/user');
                    setUser(res.data);
                    setIsAuthenticated(true);

                    // Fetch unread messages count
                    const unreadRes = await api.get('/api/messages/unread');
                    setUnreadCount(unreadRes.data.count);
                } catch (err) {
                    console.error('Error syncing user:', err.message);
                    logout();
                }
            } else {
                setUser(null);
                setIsAuthenticated(false);
                localStorage.removeItem('token');
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
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
            const { email, password, name, username, age, gender } = userData;
            
            // 1. Create user in Firebase
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const token = await getIdToken(userCredential.user);
            localStorage.setItem('token', token);

            // 2. Sync metadata to MongoDB
            const res = await api.post('/api/auth/register', { name, username, age, gender });
            
            setUser(res.data);
            setIsAuthenticated(true);
            return { success: true };
        } catch (err) {
            console.error('Registration error:', err.message);
            let msg = 'Registration failed';
            if (err.code === 'auth/email-already-in-use') msg = 'Email already in use';
            return { success: false, msg };
        }
    };

    const login = async (formData) => {
        try {
            const { email, password } = formData; // Assuming login uses email
            
            // 1. Login with Firebase
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const token = await getIdToken(userCredential.user);
            localStorage.setItem('token', token);

            // 2. Load user from MongoDB
            const res = await api.post('/api/auth/login');
            setUser(res.data);
            setIsAuthenticated(true);
            
            return { success: true };
        } catch (err) {
            console.error('Login error:', err.message);
            let msg = 'Login failed. Check credentials.';
            if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
                msg = 'Invalid email or password';
            }
            return { success: false, msg };
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            setSocket(null);
            setUnreadCount(0);
            localStorage.removeItem('token');
        } catch (err) {
            console.error('Logout error:', err.message);
        }
    };

    const forgotPassword = async (email) => {
        try {
            await sendPasswordResetEmail(auth, email);
            return { success: true, msg: 'Password reset email sent!' };
        } catch (err) {
            console.error('Password reset error:', err.message);
            return { success: false, msg: 'Failed to send reset email' };
        }
    };

    const loadUser = async () => {
        // Handled by onAuthStateChanged, but kept for legacy calls if needed
        if (auth.currentUser) {
            const res = await api.get('/api/auth/user');
            setUser(res.data);
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated,
            loading,
            register,
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
