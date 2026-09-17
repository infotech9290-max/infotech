'use client';

import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export type UserRole = 'ADMIN' | 'WORKER';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}


interface AuthContextType {
  user: AuthUser | null;
  role: UserRole | null;
  isLoading: boolean;
  login: (role: UserRole, userDetails: AuthUser) => void;
  switchRole: (newRole: UserRole) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

const STORAGE_ROLE_KEY = 'portal_auth_role';
const STORAGE_USER_KEY = 'portal_auth_user';
const COOKIE_NAME = 'portal_role';

function setRoleCookie(role: UserRole | null) {
  if (typeof document === 'undefined') return;
  if (role) {
    document.cookie = `${COOKIE_NAME}=${role}; path=/; max-age=604800; SameSite=Lax`;
  } else {
    document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
  }
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  // Restore authenticated session ONLY if user previously logged in
  useEffect(() => {
    try {
      const savedRole = (localStorage.getItem(STORAGE_ROLE_KEY) || localStorage.getItem('infotech_portal_auth_role')) as UserRole | null;
      const savedUserStr = localStorage.getItem(STORAGE_USER_KEY) || localStorage.getItem('infotech_portal_auth_user');

      if (savedRole === 'ADMIN' || savedRole === 'WORKER') {
        let parsedUser: AuthUser | null = null;
        if (savedUserStr) {
          try {
            parsedUser = JSON.parse(savedUserStr);
          } catch {
            parsedUser = null;
          }
        }
        
        if (parsedUser) {
          setUser(parsedUser);
          setRole(savedRole);
          setRoleCookie(savedRole);
        } else {
          setUser(null);
          setRole(null);
          setRoleCookie(null);
        }
      } else {
        // Not logged in -> Must see Login Page first!
        setUser(null);
        setRole(null);
        setRoleCookie(null);
      }
    } catch (err) {
      console.error('Failed to initialize auth state:', err);
      setUser(null);
      setRole(null);
      setRoleCookie(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback((targetRole: UserRole, userDetails: AuthUser) => {
    setUser(userDetails);
    setRole(targetRole);
    setRoleCookie(targetRole);

    try {
      localStorage.setItem(STORAGE_ROLE_KEY, targetRole);
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(userDetails));
    } catch (e) {
      console.error('Failed to persist auth session:', e);
    }

    // STEALTH MODE: Both Admin and Worker land on the Worker Dashboard initially.
    router.replace('/worker/my-dashboard');
  }, [router]);

  const switchRole = useCallback((newRole: UserRole) => {
    if (newRole !== 'ADMIN' && newRole !== 'WORKER') return;
    
    setRole(newRole);
    setRoleCookie(newRole);
    try {
      localStorage.setItem(STORAGE_ROLE_KEY, newRole);
      if (user) {
        const updatedUser = { ...user, role: newRole };
        setUser(updatedUser);
        localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(updatedUser));
      }
    } catch (e) {
      console.error('Failed to save switched role:', e);
    }

    if (newRole === 'ADMIN') {
      router.replace('/admin/dashboard');
    } else {
      router.replace('/worker/my-dashboard');
    }
  }, [user, router]);

  const logout = useCallback(() => {
    setUser(null);
    setRole(null);
    setRoleCookie(null);

    try {
      localStorage.removeItem(STORAGE_ROLE_KEY);
      localStorage.removeItem(STORAGE_USER_KEY);
    } catch (e) {
      console.error('Failed to clear auth session on logout:', e);
    }

    // Use window.location instead of router.replace for a TRUE hard refresh 
    // This clears Next.js client-side router cache and forces middleware re-evaluation
    window.location.href = '/login';
  }, []);

  const value = useMemo(() => ({
    user,
    role,
    isLoading,
    login,
    switchRole,
    logout,
  }), [user, role, isLoading, login, switchRole, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
