import React from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, googleProvider, signInWithPopup, signOut } from '../firebase';
import { LogIn, LogOut, BookOpen } from 'lucide-react';
import { motion } from 'motion/react';

export const Auth: React.FC = () => {
  const [user, loading, error] = useAuthState(auth);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  if (loading) return null;

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-brand-50 p-4 relative">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl shadow-brand-900/10 p-12 text-center border border-brand-100"
        >
          <div className="w-24 h-24 bg-brand-900 text-white rounded-3xl flex items-center justify-center mx-auto mb-10 shadow-xl shadow-brand-900/20 rotate-3">
            <BookOpen size={48} />
          </div>
          <h1 className="text-5xl font-serif font-bold text-brand-950 mb-4 tracking-tighter">The SoulStories</h1>
          <p className="text-brand-400 font-medium mb-12 leading-relaxed">
            Your personal sanctuary for tracking, reviewing, and celebrating your reading journey.
          </p>
          <button
            onClick={handleLogin}
            className="w-full py-5 px-8 bg-brand-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-brand-800 transition-all shadow-xl shadow-brand-900/20 active:scale-95"
          >
            <LogIn size={20} />
            Sign in with Google
          </button>
          {error && <p className="mt-6 text-rose-500 text-sm font-bold">{error.message}</p>}
        </motion.div>
        <footer className="mt-12 pb-6 text-center">
          <p className="text-brand-600 font-bold tracking-tight">
            Created by <span className="text-brand-950 underline decoration-brand-200 underline-offset-4">@Hetasvi Ahir</span>
          </p>
        </footer>
      </div>
    );
  }

  return null;
};

export const LogoutButton: React.FC = () => {
  return (
    <button
      onClick={() => signOut(auth)}
      className="flex items-center gap-2 px-4 py-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-all"
    >
      <LogOut size={18} />
      <span>Sign Out</span>
    </button>
  );
};
