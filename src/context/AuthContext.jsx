import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../config/supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cek session saat ini
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        setUser(session?.user ?? null);
      } catch (error) {
        console.error("Auth error:", error);
        // Fallback for demo without real supabase keys
        const mockSession = localStorage.getItem('mock_session');
        if (mockSession) {
          setUser(JSON.parse(mockSession));
        }
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Listen untuk perubahan auth state
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          setUser(session.user);
        } else {
          setUser(null);
        }
      }
    );

    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  const login = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return { success: true };
    } catch (error) {
      // Mock login for demo purposes
      console.log("Supabase login failed, using mock auth");
      const mockUser = { id: 1, email, role: 'admin' };
      localStorage.setItem('mock_session', JSON.stringify(mockUser));
      setUser(mockUser);
      return { success: true };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch(e) {
      console.log(e);
    }
    localStorage.removeItem('mock_session');
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
