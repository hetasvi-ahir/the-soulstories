import React from 'react';
import { Book } from '../types';
import { BookOpen, CheckCircle2, Star, Clock, TrendingUp, Award, Layers, BarChart3 } from 'lucide-react';
import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DashboardProps {
  books: Book[];
  onBookClick: (book: Book) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ books, onBookClick }) => {
  const totalBooks = books.length;
  const completedBooks = books.filter(b => b.status === 'Completed');
  const currentlyReading = books.filter(b => b.status === 'Currently Reading');
  const toRead = books.filter(b => b.status === 'To Read');
  
  const avgRating = completedBooks.length > 0
    ? (completedBooks.reduce((acc, b) => acc + (b.rating || 0), 0) / completedBooks.length).toFixed(1)
    : '0.0';

  const totalPages = completedBooks.reduce((acc, b) => acc + (b.pageCount || 0), 0);
  
  const currentYear = new Date().getFullYear();
  const completedThisYear = completedBooks.filter(b => {
    const finishDate = b.dateFinished?.toDate();
    return finishDate && finishDate.getFullYear() === currentYear;
  }).length;

  const stats = [
    { label: 'Total Library', value: totalBooks, icon: BookOpen, color: 'bg-brand-950 dark:bg-brand-800 text-white shadow-brand-950/20' },
    { label: 'Read This Year', value: completedThisYear, icon: Award, color: 'bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300' },
    { label: 'Avg. Rating', value: avgRating, icon: Star, color: 'bg-brand-50 dark:bg-brand-900 text-brand-600 dark:text-brand-400' },
    { label: 'Pages Read', value: totalPages.toLocaleString(), icon: BarChart3, color: 'bg-brand-200 dark:bg-brand-900 text-brand-800 dark:text-brand-200' },
  ];

  return (
    <div className="space-y-16">
      {/* Welcome Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-6xl font-serif font-bold text-treehouse tracking-tighter"
          >
            Welcome back, <span className="text-brand-500 italic">Reader</span>
          </motion.h1>
          <p className="text-treehouse text-xl font-medium max-w-xl leading-relaxed">
            You've completed <span className="text-treehouse font-bold underline decoration-brand-300 underline-offset-8">{completedThisYear} books</span> so far in {currentYear}. Your literary journey is blooming beautifully.
          </p>
        </div>
        <div className="flex gap-4">
          <div className="px-8 py-5 bg-white dark:bg-brand-900 border border-brand-100 dark:border-brand-800 rounded-[2.5rem] shadow-xl shadow-brand-950/5 text-center">
            <p className="text-[10px] font-black text-brand-700 dark:text-brand-400 uppercase tracking-[0.2em] mb-3">Reading Goal</p>
            <div className="flex items-center gap-4">
              <div className="w-32 h-3 bg-brand-50 dark:bg-brand-800 rounded-full overflow-hidden border border-brand-100/50 dark:border-brand-700">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((completedThisYear / 50) * 100, 100)}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="h-full bg-brand-500" 
                />
              </div>
              <span className="text-sm font-black text-brand-950 dark:text-brand-100">{completedThisYear}/50</span>
            </div>
          </div>
        </div>
      </header>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.6 }}
            className="p-8 bg-white dark:bg-brand-900 rounded-[3rem] shadow-sm border border-brand-100/50 dark:border-brand-800 group hover:shadow-2xl hover:shadow-brand-950/5 transition-all duration-500 cursor-default"
          >
            <div className={cn("w-14 h-14 rounded-[1.5rem] flex items-center justify-center mb-8 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 shadow-lg", stat.color)}>
              <stat.icon size={28} />
            </div>
            <p className="text-[10px] font-black text-brand-700 dark:text-brand-400 uppercase tracking-[0.2em] mb-2">{stat.label}</p>
            <p className="text-4xl font-serif font-bold text-brand-950 dark:text-brand-50 tracking-tighter">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Currently Reading Section */}
      <section className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-serif font-bold text-treehouse flex items-center gap-4">
            <div className="p-2 bg-brand-100 dark:bg-brand-900 rounded-xl">
              <Clock className="text-brand-600 dark:text-brand-400" size={24} />
            </div>
            Currently Reading
          </h2>
          <span className="px-4 py-1.5 bg-brand-50 dark:bg-brand-900 text-brand-600 dark:text-brand-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-brand-100 dark:border-brand-800">
            {currentlyReading.length} Books
          </span>
        </div>

        {currentlyReading.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {currentlyReading.map((book, i) => (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => onBookClick(book)}
                className="flex gap-8 p-8 bg-white dark:bg-spicy-mix rounded-[2.5rem] border border-brand-100/50 dark:border-brand-600 shadow-sm hover:shadow-2xl hover:shadow-brand-950/5 transition-all cursor-pointer group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-50 dark:bg-brand-500/10 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-150 transition-transform duration-700" />
                
                <div className="w-28 h-40 rounded-2xl overflow-hidden shadow-2xl shadow-brand-950/20 flex-shrink-0 relative z-10">
                  <img 
                    src={book.coverImageUrl || `https://picsum.photos/seed/${book.id}/200/300`} 
                    alt={book.title} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex flex-col justify-center relative z-10">
                  <h3 className="text-xl font-serif font-bold text-brand-950 dark:text-brand-50 line-clamp-1 mb-1 group-hover:text-brand-600 dark:group-hover:text-brand-200 transition-colors">{book.title}</h3>
                  <p className="text-brand-600 dark:text-brand-100 text-sm font-bold mb-6 italic">by {book.author}</p>
                  <div className="space-y-3">
                    <div className="flex justify-between text-[10px] font-black text-brand-700 dark:text-brand-100 uppercase tracking-widest">
                      <span>Progress</span>
                      <span>45%</span>
                    </div>
                    <div className="w-full h-2 bg-brand-50 dark:bg-brand-900/50 rounded-full overflow-hidden border border-brand-100/50 dark:border-brand-800">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '45%' }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="h-full bg-brand-500 dark:bg-brand-200" 
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="p-20 bg-brand-50/30 dark:bg-brand-900/30 rounded-[3rem] border-2 border-dashed border-brand-100 dark:border-brand-800 text-center">
            <p className="text-treehouse font-serif text-xl italic">Your reading nook is quiet. Time to start a new adventure!</p>
          </div>
        )}
      </section>

      {/* Recent Favorites */}
      <section className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-serif font-bold text-treehouse flex items-center gap-4">
            <div className="p-2 bg-brand-100 dark:bg-brand-900 rounded-xl">
              <TrendingUp className="text-brand-600 dark:text-brand-400" size={24} />
            </div>
            Recent Favorites
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {books.filter(b => b.isFavorite).slice(0, 6).map((book, i) => (
            <motion.div
              key={book.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -12, scale: 1.02 }}
              onClick={() => onBookClick(book)}
              className="aspect-[2/3] rounded-[2rem] overflow-hidden shadow-xl shadow-brand-950/10 cursor-pointer relative group border-4 border-white dark:border-brand-900"
            >
              <img 
                src={book.coverImageUrl || `https://picsum.photos/seed/${book.id}/200/300`} 
                alt={book.title} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-brand-950/80 opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col items-center justify-center p-6 text-center backdrop-blur-[2px]">
                <Star className="text-brand-400 mb-3" fill="currentColor" size={24} />
                <p className="text-white text-sm font-serif font-bold line-clamp-3 leading-tight">{book.title}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};
