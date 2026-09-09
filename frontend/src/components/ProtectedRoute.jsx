import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ allowedAccountType = 'ROOM' }) => {
    const { isAuthenticated, user, loading } = useAuth();
    const location = useLocation();

    if (loading) return <div>Loading...</div>;

    if (!isAuthenticated) {
        return <Navigate to={allowedAccountType === 'PERSONAL' ? "/personal/login" : "/login"} state={{ from: location }} replace />;
    }

    if (user?.accountType !== allowedAccountType) {
        return <Navigate to={user?.accountType === 'PERSONAL' ? "/personal/dashboard" : "/dashboard"} replace />;
    }

    return <Outlet />;
};

export const AdminRoute = () => {
    const { isAuthenticated, role, loading } = useAuth();

    if (loading) return <div>Loading...</div>;

    if (!isAuthenticated) return <Navigate to="/login" replace />;
    
    if (role !== 'ADMIN') return <Navigate to="/dashboard" replace />; // or 403 page

    return <Outlet />;
};
