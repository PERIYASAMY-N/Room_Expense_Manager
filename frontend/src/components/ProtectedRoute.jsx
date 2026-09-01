import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = () => {
    const { isAuthenticated, loading } = useAuth();
    const location = useLocation();

    if (loading) return <div>Loading...</div>;

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
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
