import { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services/api';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        restoreSession();
    }, []);

    const restoreSession = async () => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            setToken(storedToken);
            try {
                // If token exists, fetch current user profile
                const res = await authService.getProfile();
                setUser(res.data);
            } catch (err) {
                // If token invalid/expired, logout
                logout();
            }
        }
        setLoading(false);
    };

    const login = async (room_code, username, password) => {
        try {
            const res = await authService.login({ room_code, username, password });
            const { user: userData, token: jwtToken } = res.data;
            
            localStorage.setItem('token', jwtToken);
            setToken(jwtToken);
            setUser(userData);
            
            return userData;
        } catch (err) {
            throw err;
        }
    };

    const personalLogin = async (email, password) => {
        try {
            const { personalAuthService } = await import('../services/api');
            const res = await personalAuthService.login({ email, password });
            const { user: userData, token: jwtToken } = res.data;
            
            localStorage.setItem('token', jwtToken);
            setToken(jwtToken);
            setUser(userData);
            
            return userData;
        } catch (err) {
            throw err;
        }
    };

    const personalRegister = async (name, email, password) => {
        try {
            const { personalAuthService } = await import('../services/api');
            const res = await personalAuthService.register({ name, email, password });
            const { user: userData, token: jwtToken } = res.data;
            
            localStorage.setItem('token', jwtToken);
            setToken(jwtToken);
            setUser(userData);
            
            return userData;
        } catch (err) {
            throw err;
        }
    };

    const setSession = (jwtToken, userData) => {
        localStorage.setItem('token', jwtToken);
        setToken(jwtToken);
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    const isAuthenticated = !!token && !!user;

    return (
        <AuthContext.Provider value={{ 
            user, 
            member: user?.memberId,
            room: user?.roomId,
            role: user?.role,
            token, 
            isAuthenticated, 
            loading, 
            login, 
            personalLogin,
            personalRegister,
            logout,
            restoreSession,
            setSession
        }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
