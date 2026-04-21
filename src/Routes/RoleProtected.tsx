import React from 'react';
import { Navigate } from 'react-router-dom';
import { getLoggedinUser } from '../helpers/api_helper';

interface RoleProtectedProps {
    allowedRoles: string[];
    children: React.ReactNode;
    redirectTo?: string;
}

const RoleProtected: React.FC<RoleProtectedProps> = ({ allowedRoles, children, redirectTo = '/' }) => {
    const user = getLoggedinUser();
    const roles: string[] = Array.isArray(user?.role) ? user.role : [];
    const hasRole = allowedRoles.some((r) => roles.includes(r));

    if (!hasRole) {
        return <Navigate to={redirectTo} replace />;
    }

    return <>{children}</>;
};

export default RoleProtected;
