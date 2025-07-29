
"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;

    const isAuthPage = pathname === '/login' || pathname === '/signup';
    const isLandingPage = pathname === '/';
    
    // If there's no user, and we are not on a public page, redirect to login.
    if (!user && !isAuthPage && !isLandingPage) {
      router.push('/login');
    } else if (user && (pathname === '/login' || pathname === '/signup' || pathname === '/')) {
      router.push('/dashboard');
    }
  }, [user, loading, router, pathname]);

  const isAuthPage = pathname === '/login' || pathname === '/signup';
  const isLandingPage = pathname === '/';

  // While initial loading is happening, show a global loader.
  if (loading) {
    const isPublicPage = pathname === '/' || pathname === '/login' || pathname === '/signup';
    if (!user && !isPublicPage) {
        // Don't render anything while redirecting to login
        return null;
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
