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

export const ADMIN_USER: AuthUser = {
  id: 'admin-001',
  email: 'boss@infotech.pro',
  name: 'Super Admin',
  role: 'ADMIN',
};

export const WORKER_USER: AuthUser = {
  id: 'WK-001',
  email: 'worker@infotech.pro',
  name: 'Agent Ramesh',
  role: 'WORKER',
};

interface AuthContextType {
  user: AuthUser | null;
  role: UserRole | null;
  isLoading: boolean;
  login: (role: UserRole, userDetails?: Partial<AuthUser>) => void;
  switchRole: (newRole: UserRole) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

const STORAGE_ROLE_KEY = 'infotech_portal_auth_role';
const STORAGE_USER_KEY = 'infotech_portal_auth_user';
const COOKIE_NAME = 'infotech_role';

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
      // Clear legacy dev auto-login keys if present
      localStorage.removeItem('infotech_auth_role');
      localStorage.removeItem('infotech_auth_user');
      localStorage.removeItem('infotech_auth_initialized');

      const savedRole = localStorage.getItem(STORAGE_ROLE_KEY) as UserRole | null;
      const savedUserStr = localStorage.getItem(STORAGE_USER_KEY);

      if (savedRole === 'ADMIN' || savedRole === 'WORKER') {
        let parsedUser: AuthUser | null = null;
        if (savedUserStr) {
          try {
            parsedUser = JSON.parse(savedUserStr);
          } catch {
            parsedUser = null;
          }
        }
        const activeUser = parsedUser || (savedRole === 'ADMIN' ? ADMIN_USER : WORKER_USER);
        setUser(activeUser);
        setRole(savedRole);
        setRoleCookie(savedRole);
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

  const login = useCallback((targetRole: UserRole, userDetails?: Partial<AuthUser>) => {
    const baseUser = targetRole === 'ADMIN' ? ADMIN_USER : WORKER_USER;
    const activeUser: AuthUser = {
      ...baseUser,
      ...userDetails,
      role: targetRole,
    };

    setUser(activeUser);
    setRole(targetRole);
    setRoleCookie(targetRole);

    try {
      localStorage.setItem(STORAGE_INIT_KEY, 'true');
      localStorage.setItem(STORAGE_ROLE_KEY, targetRole);
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(activeUser));
    } catch (e) {
      console.error('Failed to persist auth session:', e);
    }

    if (targetRole === 'ADMIN') {
      router.replace('/admin/dashboard');
    } else {
      router.replace('/worker/my-dashboard');
    }
  }, [router]);

  const switchRole = useCallback((newRole: UserRole) => {
    const newUser = newRole === 'ADMIN' ? ADMIN_USER : WORKER_USER;
    setUser(newUser);
    setRole(newRole);
    setRoleCookie(newRole);

    try {
      localStorage.setItem(STORAGE_ROLE_KEY, newRole);
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(newUser));
    } catch (e) {
      console.error('Failed to save switched role:', e);
    }

    if (newRole === 'ADMIN') {
      router.replace('/admin/dashboard');
    } else {
      router.replace('/worker/my-dashboard');
    }
  }, [router]);

  const logout = useCallback(() => {
    setUser(null);
    setRole(null);
    setRoleCookie(null);

    try {
      localStorage.removeItem(STORAGE_ROLE_KEY);
      localStorage.removeItem(STORAGE_USER_KEY);
      localStorage.setItem(STORAGE_INIT_KEY, 'true');
    } catch (e) {
      console.error('Failed to clear auth session on logout:', e);
    }

    router.replace('/login');
  }, [router]);

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
