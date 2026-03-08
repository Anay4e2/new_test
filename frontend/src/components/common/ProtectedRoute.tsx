import { FC, ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

interface ProtectedRouteProps {
    children: ReactNode;
    adminOnly?: boolean;
}

export const ProtectedRoute: FC<ProtectedRouteProps> = ({ children, adminOnly = false }) => {
    const { isAuthenticated, isAdmin } = useAuthStore();
    const location = useLocation();

    if (!isAuthenticated()) {
        const loginPath = adminOnly ? '/admin-login' : `/login?next=${encodeURIComponent(location.pathname)}`;
        return <Navigate to={loginPath} replace />;
    }

    if (adminOnly && !isAdmin()) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};
