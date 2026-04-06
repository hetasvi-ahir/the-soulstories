import React, { ReactNode } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';
import { LayoutDashboard, Library, Layers, BarChart3, User, PlusCircle, Search, Menu, X, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LogoutButton } from './Auth';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { Book } from '../types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LayoutProps {
  children: ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onAddBook: () => void;
  books: Book[];
}

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'library', label: 'Library', icon: Library },
  { id: 'bookshelf', label: 'My Bookshelf', icon: BookOpen },
  { id: 'series', label: 'Series', icon: Layers },
  { id: 'stats', label: 'Statistics', icon: BarChart3 },
  { id: 'profile', label: 'Profile', icon: User },
];

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, onAddBook, books }) => {
  const [user] = useAuthState(auth);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  if (!user) return <>{children}</>;

  return (
    <div className="min-h-screen bg-[var(--bg-main)] flex flex-col md:flex-row transition-colors duration-300">
      {/* Mobile Header */}
      <header className="md:hidden bg-white/80 dark:bg-brand-900/80 backdrop-blur-md border-b border-brand-100 dark:border-brand-800 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-950 dark:bg-brand-500 text-white rounded-lg flex items-center justify-center shadow-sm">
            <BookOpen size={18} />
          </div>
          <span className="font-serif font-bold text-brand-950 dark:text-brand-50 text-lg tracking-tight">The SoulStories</span>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-800 rounded-lg transition-colors"
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Sidebar (Desktop) / Overlay (Mobile) */}
      <AnimatePresence>
        {(isSidebarOpen || window.innerWidth >= 768) && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className={cn(
              "fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-brand-950 border-r border-brand-100 dark:border-brand-900 flex flex-col transition-all duration-300 md:relative md:translate-x-0",
              !isSidebarOpen && "hidden md:flex"
            )}
          >
            <div className="p-8 flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-950 dark:bg-brand-500 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-brand-950/20">
                <BookOpen size={24} />
              </div>
              <span className="font-serif font-bold text-brand-950 dark:text-brand-50 text-2xl tracking-tighter">The SoulStories</span>
            </div>

            <nav className="px-4 space-y-1">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsSidebarOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 group relative",
                    activeTab === item.id 
                      ? "bg-brand-950 dark:bg-brand-500 text-white shadow-lg shadow-brand-950/20" 
                      : "text-brand-600 dark:text-brand-300 hover:bg-brand-50 dark:hover:bg-brand-900 hover:text-brand-950 dark:hover:text-brand-50"
                  )}
                >
                  <item.icon size={20} className={cn(activeTab === item.id ? "text-white" : "text-brand-500 dark:text-brand-400 group-hover:text-brand-950 dark:group-hover:text-brand-50")} />
                  <span className="font-bold tracking-tight">{item.label}</span>
                  {activeTab === item.id && (
                    <motion.div 
                      layoutId="activeNav"
                      className="ml-auto w-1.5 h-1.5 bg-white rounded-full"
                    />
                  )}
                </button>
              ))}
            </nav>

            <div className="p-6 border-t border-brand-100 dark:border-brand-900 space-y-4 mt-auto">
              <button
                onClick={onAddBook}
                className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-brand-950 dark:bg-brand-500 text-white rounded-2xl font-bold hover:bg-brand-900 dark:hover:bg-brand-600 transition-all shadow-xl shadow-brand-950/20 active:scale-95"
              >
                <PlusCircle size={20} />
                <span>Add Book</span>
              </button>
              
              <div className="flex items-center gap-3 px-4 py-3 bg-brand-50/50 dark:bg-brand-900/50 rounded-2xl border border-brand-100 dark:border-brand-900">
                <img 
                  src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || 'User'}`} 
                  alt="Avatar" 
                  className="w-10 h-10 rounded-full border-2 border-white dark:border-brand-800 shadow-sm"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-brand-950 dark:text-brand-50 truncate">{user.displayName}</p>
                  <p className="text-[10px] font-bold text-brand-600 dark:text-brand-300 truncate uppercase tracking-wider">{user.email}</p>
                </div>
              </div>
              <LogoutButton />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 p-4 md:p-10 max-w-7xl mx-auto w-full">
          {children}
        </div>
        <footer className="p-8 text-center border-t border-brand-100 dark:border-brand-900/50 mb-20 md:mb-0">
          <p className="text-brand-500 dark:text-brand-400 font-medium tracking-tight">
            Created by <span className="text-brand-950 dark:text-brand-200 font-bold">@Hetasvi Ahir</span>
          </p>
        </footer>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white/80 dark:bg-brand-950/80 backdrop-blur-md border-t border-brand-100 dark:border-brand-900 px-2 py-2 flex justify-around items-center z-40 shadow-2xl">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all",
              activeTab === item.id ? "text-brand-950 dark:text-brand-400" : "text-brand-500 dark:text-brand-300"
            )}
          >
            <item.icon size={20} strokeWidth={activeTab === item.id ? 2.5 : 2} />
            <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
          </button>
        ))}
        <button
          onClick={onAddBook}
          className="w-12 h-12 bg-brand-950 dark:bg-brand-500 text-white rounded-full flex items-center justify-center shadow-lg -mt-8 border-4 border-pearl-bush dark:border-brand-950 active:scale-90 transition-transform"
        >
          <PlusCircle size={24} />
        </button>
      </nav>
    </div>
  );
};
