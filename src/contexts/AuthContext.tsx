import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
    isAdmin: boolean;
    login: (password: string) => boolean;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('isAdmin');
        if (stored === 'true') {
            setIsAdmin(true);
        }
    }, []);

    const login = (password: string) => {
        // Simple hardcoded password for now. Ideally use env var.
        const validPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'shinkwang1234';
        if (password === validPassword) {
            setIsAdmin(true);
            localStorage.setItem('isAdmin', 'true');
            return true;
        }
        return false;
    };

    const logout = () => {
        setIsAdmin(false);
        localStorage.removeItem('isAdmin');
    };

    return (
        <AuthContext.Provider value={{ isAdmin, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
