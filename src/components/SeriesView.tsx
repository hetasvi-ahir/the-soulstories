import React, { useMemo, useRef } from 'react';
import { Book } from '../types';
import { Layers, CheckCircle2, Circle, ChevronRight, ChevronLeft, TrendingUp, Award, BarChart3, Star, Link as LinkIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SeriesViewProps {
  books: Book[];
  onBookClick: (book: Book) => void;
  onAddBook: (seriesName?: string) => void;
}

const SeriesSection: React.FC<{
  name: string;
  seriesBooks: Book[];
  idx: number;
  onBookClick: (book: Book) => void;
  onAddBook: (seriesName: string) => void;
}> = ({ name, seriesBooks, idx, onBookClick, onAddBook }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollAmount = clientWidth * 0.8;
      const scrollTo = direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  const completedCount = seriesBooks.filter(b => b.status === 'Completed').length;
  const progress = (completedCount / seriesBooks.length) * 100;
  const ratedBooks = seriesBooks.filter(b => b.rating);
  const avgRating = ratedBooks.length > 0 
    ? ratedBooks.reduce((acc, b) => acc + (b.rating || 0), 0) / ratedBooks.length 
    : 0;

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: idx * 0.1, duration: 0.8 }}
      className="bg-white dark:bg-spicy-mix rounded-[2.5rem] shadow-2xl shadow-brand-950/5 border border-brand-100/50 dark:border-brand-600 overflow-hidden group"
    >
      {/* Series Header - Made smaller */}
      <div className="p-5 md:p-6 bg-brand-50/30 dark:bg-brand-950/30 border-b border-brand-100/50 dark:border-brand-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-brand-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <div className="flex flex-col gap-6 relative z-10">
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-brand-950 dark:bg-brand-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-brand-950/20 rotate-3">
                <Layers size={16} />
              </div>
              <span className="text-[9px] font-black text-brand-700 dark:text-brand-400 uppercase tracking-[0.3em]">Series Collection</span>
            </div>
            
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-brand-950 dark:text-brand-50 tracking-tight leading-tight">{name}</h2>
            
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2 bg-white dark:bg-brand-950 px-3 py-1.5 rounded-xl border border-brand-100 dark:border-brand-800 shadow-sm">
                  <Award size={14} className="text-brand-500" />
                  <span className="text-[11px] font-black text-brand-950 dark:text-brand-100 uppercase tracking-wider">{completedCount} / {seriesBooks.length} Read</span>
                </div>
                
                {avgRating > 0 && (
                  <div className="flex items-center gap-2 bg-white dark:bg-brand-950 px-3 py-1.5 rounded-xl border border-brand-100 dark:border-brand-800 shadow-sm">
                    <Star size={14} className="text-amber-400" fill="currentColor" />
                    <span className="text-[11px] font-black text-brand-950 dark:text-brand-100 uppercase tracking-wider">{avgRating.toFixed(1)} Rating</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2 bg-white dark:bg-brand-950 px-3 py-1.5 rounded-xl border border-brand-100 dark:border-brand-800 shadow-sm">
                  <BarChart3 size={14} className="text-brand-600 dark:text-brand-400" />
                  <span className="text-[11px] font-black text-brand-950 dark:text-brand-100 uppercase tracking-wider">{seriesBooks.reduce((acc, b) => acc + (b.pageCount || 0), 0)} Pages</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onAddBook(name)}
                    className="flex items-center gap-2 bg-brand-950 dark:bg-brand-500 text-white px-4 py-1.5 rounded-xl shadow-md hover:bg-brand-800 dark:hover:bg-brand-600 transition-all active:scale-95"
                  >
                    <Layers size={14} />
                    <span className="text-[11px] font-black uppercase tracking-wider">Add New</span>
                  </button>
                  <button
                    onClick={() => onAddBook(name)} // We'll handle the "link" logic inside BookForm when seriesName is passed
                    className="flex items-center gap-2 bg-white dark:bg-brand-950 text-brand-950 dark:text-brand-100 px-4 py-1.5 rounded-xl shadow-md border border-brand-100 dark:border-brand-800 hover:bg-brand-50 dark:hover:bg-brand-900 transition-all active:scale-95"
                  >
                    <LinkIcon size={14} className="text-brand-500" />
                    <span className="text-[11px] font-black uppercase tracking-wider">Link Existing</span>
                  </button>
                </div>
              </div>
          </div>
          
          <div className="w-full space-y-2 bg-white dark:bg-brand-950 p-4 rounded-2xl border border-brand-100 dark:border-brand-800 shadow-lg shadow-brand-950/5">
            <div className="flex justify-between items-end">
              <span className="text-[8px] font-black text-brand-700 dark:text-brand-400 uppercase tracking-[0.2em]">Completion</span>
              <span className="text-base font-serif font-bold text-brand-950 dark:text-brand-50">{Math.round(progress)}%</span>
            </div>
            <div className="w-full h-2.5 bg-brand-50 dark:bg-brand-800 rounded-full overflow-hidden shadow-inner p-0.5">
              <motion.div 
                initial={{ width: 0 }}
                whileInView={{ width: `${progress}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="h-full bg-brand-500 rounded-full shadow-lg shadow-brand-500/20"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Books List with Arrow Scroll */}
      <div className="relative group/scroll">
        {/* Left Arrow */}
        <button 
          onClick={() => scroll('left')}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white/90 dark:bg-brand-900/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-2xl border border-brand-100 dark:border-brand-800 text-brand-950 dark:text-brand-100 opacity-0 group-hover/scroll:opacity-100 transition-opacity hover:bg-brand-50 dark:hover:bg-brand-800"
        >
          <ChevronLeft size={20} />
        </button>

        {/* Right Arrow */}
        <button 
          onClick={() => scroll('right')}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white/90 dark:bg-brand-900/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-2xl border border-brand-100 dark:border-brand-800 text-brand-950 dark:text-brand-100 opacity-0 group-hover/scroll:opacity-100 transition-opacity hover:bg-brand-50 dark:hover:bg-brand-800"
        >
          <ChevronRight size={20} />
        </button>

        <div 
          ref={scrollRef}
          className="p-6 md:p-8 overflow-x-auto scrollbar-hide scroll-smooth"
        >
          <div className="flex gap-6 pb-4">
            {seriesBooks.map((book, idx) => (
              <motion.div
                key={book.id}
                whileHover={{ y: -8, scale: 1.02 }}
                onClick={() => onBookClick(book)}
                className="w-36 flex-shrink-0 group/book cursor-pointer"
              >
                <div className="relative aspect-[2/3] rounded-2xl overflow-hidden shadow-xl mb-3 border-2 border-white dark:border-brand-900 ring-1 ring-brand-100 dark:ring-brand-800 group-hover/book:ring-brand-300 dark:group-hover:ring-brand-500 transition-all duration-500">
                  <img 
                    src={book.coverImageUrl || `https://picsum.photos/seed/${book.id}/300/450`} 
                    alt={book.title} 
                    className="w-full h-full object-cover group-hover/book:scale-110 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-2 left-2 w-7 h-7 bg-white/90 dark:bg-brand-900/90 backdrop-blur-md rounded-lg flex items-center justify-center text-[10px] font-black text-brand-950 dark:text-brand-100 shadow-lg border border-brand-100 dark:border-brand-800 rotate-[-8deg] group-hover/book:rotate-0 transition-transform">
                    {book.readingOrder || book.seriesPosition || idx + 1}
                  </div>
                  {book.status === 'Completed' && (
                    <div className="absolute inset-0 bg-brand-950/20 flex items-center justify-center backdrop-blur-[1px] opacity-0 group-hover/book:opacity-100 transition-opacity">
                      <div className="bg-white dark:bg-brand-900 text-brand-950 dark:text-brand-400 p-2 rounded-full shadow-2xl scale-0 group-hover/book:scale-100 transition-transform delay-100">
                        <CheckCircle2 size={20} />
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-1 px-1">
                  <h3 className="text-xs font-serif font-bold text-brand-950 dark:text-brand-50 line-clamp-2 group-hover/book:text-brand-600 dark:group-hover:text-brand-400 transition-colors leading-tight">{book.title}</h3>
                  <p className="text-brand-600 dark:text-brand-400 text-[9px] font-bold italic mb-1 line-clamp-1 leading-tight">by {book.author}</p>
                  <div className={cn(
                    "inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full",
                    book.status === 'Completed' ? "bg-brand-500/10 text-brand-600 dark:text-brand-400" : "bg-brand-50 dark:bg-brand-900 text-brand-600 dark:text-brand-400"
                  )}>
                    {book.status === 'Completed' ? <CheckCircle2 size={8} /> : <Circle size={8} />}
                    {book.status}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export const SeriesView: React.FC<SeriesViewProps> = ({ books, onBookClick, onAddBook }) => {
  const seriesGroups = useMemo(() => {
    const groups: Record<string, Book[]> = {};
    books.forEach(book => {
      if (book.seriesName) {
        if (!groups[book.seriesName]) groups[book.seriesName] = [];
        groups[book.seriesName].push(book);
      }
    });
    
    // Sort books within each series by reading order
    Object.keys(groups).forEach(name => {
      groups[name].sort((a, b) => (a.readingOrder || a.seriesPosition || 0) - (b.readingOrder || b.seriesPosition || 0));
    });
    
    return groups;
  }, [books]);

  const seriesNames = Object.keys(seriesGroups).sort();

  if (seriesNames.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 px-4 text-center">
        <div className="w-32 h-32 bg-brand-50 dark:bg-brand-900 text-brand-200 dark:text-brand-700 rounded-[3rem] flex items-center justify-center mb-10 shadow-inner rotate-3">
          <Layers size={56} />
        </div>
        <h3 className="text-3xl font-serif font-bold text-brand-950 dark:text-brand-50 mb-4 tracking-tight">No series tracked yet</h3>
        <p className="text-brand-700 dark:text-brand-400 max-w-md font-medium leading-relaxed">
          Add series names and positions to your books to track your progress through connected stories.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20">
      <header className="relative flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-brand-200/10 dark:bg-brand-500/5 rounded-full blur-3xl" />
        <div>
          <h1 className="text-6xl font-serif font-bold text-treehouse mb-4 tracking-tighter">Series Tracking</h1>
          <p className="text-treehouse font-bold uppercase tracking-[0.2em] text-xs">You're currently tracking {seriesNames.length} different book series.</p>
        </div>
        <button
          onClick={() => onAddBook()}
          className="px-8 py-4 bg-brand-950 dark:bg-brand-500 text-white rounded-[2rem] font-black uppercase tracking-widest text-[10px] hover:bg-brand-800 dark:hover:bg-brand-600 transition-all shadow-xl shadow-brand-950/20 active:scale-95"
        >
          Add Book to Series
        </button>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {seriesNames.map((name, i) => (
          <SeriesSection 
            key={name}
            name={name}
            seriesBooks={seriesGroups[name]}
            idx={i}
            onBookClick={onBookClick}
            onAddBook={onAddBook}
          />
        ))}
      </div>
    </div>
  );
};
