import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userAvatar, setUserAvatar] = useState(null);

  useEffect(() => {
    const getSession = async () => {
      setLoading(true);
      try {
        const { data } = await supabase.auth.getSession();
        const currentUser = data.session?.user ?? null;
        setUser(currentUser);
        setUserAvatar(currentUser?.user_metadata?.avatarUrl || null);
      } catch (err) {
        console.error("Sessiyani olishda xatolik:", err);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        setUserAvatar(currentUser?.user_metadata?.avatarUrl || null);
        setLoading(false);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setUserAvatar(null);
    } catch (err) {
      console.error("Logout xatosi:", err);
    }
  };

  const refreshUser = async () => {
    try {
      const {
        data: { user: freshUser },
        error,
      } = await supabase.auth.getUser();
      if (error) throw error;
      setUser(freshUser);
      setUserAvatar(freshUser.user_metadata?.avatarUrl || null);
    } catch (err) {
      console.error("Foydalanuvchini yangilashda xatolik:", err);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, userAvatar, setUserAvatar, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
