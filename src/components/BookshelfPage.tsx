import React from 'react';
import { motion } from 'motion/react';
import { Book as BookType } from '../types';
import { BookOpen, Star, Calendar } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface BookshelfPageProps {
  books: BookType[];
}

const BookshelfPage: React.FC<BookshelfPageProps> = ({ books }) => {
  // Bright and random colors for the bookshelf
  const brightColors = [
    'bg-rose-400', 'bg-pink-400', 'bg-fuchsia-400', 'bg-purple-400',
    'bg-violet-400', 'bg-indigo-400', 'bg-blue-400', 'bg-sky-400',
    'bg-cyan-400', 'bg-teal-400', 'bg-emerald-400', 'bg-green-400',
    'bg-lime-400', 'bg-yellow-400', 'bg-amber-400', 'bg-orange-400',
    'bg-red-400'
  ];

  const heights = ['h-[140px]', 'h-[160px]', 'h-[180px]', 'h-[150px]', 'h-[170px]'];
  const widths = ['w-8', 'w-10', 'w-12', 'w-9', 'w-11'];
  const tilts = ['rotate-1', '-rotate-1', 'rotate-2', '-rotate-2', 'rotate-0'];

  const [booksPerShelf, setBooksPerShelf] = React.useState(18);

  React.useEffect(() => {
    const updateCount = () => {
      if (window.innerWidth < 640) setBooksPerShelf(8);
      else if (window.innerWidth < 1024) setBooksPerShelf(12);
      else setBooksPerShelf(18);
    };
    updateCount();
    window.addEventListener('resize', updateCount);
    return () => window.removeEventListener('resize', updateCount);
  }, []);

  const shelves = [];
  for (let i = 0; i < books.length; i += booksPerShelf) {
    shelves.push(books.slice(i, i + booksPerShelf));
  }

  // If there are no books, we still want to show one empty shelf
  if (shelves.length === 0) {
    shelves.push([]);
  }

  return (
    <div className="space-y-12 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-brand-500">
            <BookOpen size={20} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Visual Collection</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-serif font-black text-brand-950 tracking-tight">
            My Bookshelf
          </h1>
        </div>
        <div className="bg-white/50 dark:bg-brand-900/50 backdrop-blur-md border border-brand-100 dark:border-brand-800 rounded-[2rem] px-8 py-4 flex gap-8">
          <div className="text-center">
            <p className="text-[10px] font-black text-brand-500 uppercase tracking-widest mb-1">Total Books</p>
            <p className="text-2xl font-serif font-black text-brand-950 dark:text-brand-50">{books.length}</p>
          </div>
          <div className="w-[1px] bg-brand-100 dark:bg-brand-800" />
          <div className="text-center">
            <p className="text-[10px] font-black text-brand-500 uppercase tracking-widest mb-1">Shelves</p>
            <p className="text-2xl font-serif font-black text-brand-950 dark:text-brand-50">{shelves.length}</p>
          </div>
        </div>
      </header>

      <div className="space-y-24">
        {shelves.map((shelfBooks, shelfIdx) => (
          <div key={shelfIdx} className="relative pt-10 mx-auto w-fit min-w-[300px] max-w-full">
            {/* Shelf Wood */}
            <div className="absolute inset-x-0 bottom-0 h-8 bg-[#4A3222] rounded-lg shadow-2xl border-t border-white/10 z-10" />
            <div className="absolute inset-x-0 bottom-2 h-2 bg-black/40 rounded-full mx-4 z-10" />
            
            <div className="flex items-end justify-start gap-1 sm:gap-2 px-6 min-h-[220px]">
              {/* Render actual books */}
              {shelfBooks.map((book, idx) => {
                const color = brightColors[(shelfIdx * booksPerShelf + idx) % brightColors.length];
                const height = heights[(shelfIdx * booksPerShelf + idx) % heights.length];
                const width = widths[(shelfIdx * booksPerShelf + idx) % widths.length];
                const tilt = tilts[(shelfIdx * booksPerShelf + idx) % tilts.length];

                return (
                  <motion.div
                    key={book.id}
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    className={cn(
                      "relative group cursor-pointer transition-all duration-500 hover:-translate-y-4",
                      width, height, tilt, color,
                      "rounded-sm shadow-[4px_0_10px_rgba(0,0,0,0.3)] border-l-2 border-white/20"
                    )}
                  >
                    {/* Book Spine Details */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-white/10" />
                    
                    {/* Decorative Lines */}
                    <div className="absolute top-4 inset-x-0 h-[1px] bg-white/30" />
                    <div className="absolute top-6 inset-x-0 h-[1px] bg-white/30" />
                    <div className="absolute bottom-4 inset-x-0 h-[1px] bg-white/30" />
                    <div className="absolute bottom-6 inset-x-0 h-[1px] bg-white/30" />

                    {/* Title */}
                    <div className="absolute inset-0 flex items-center justify-center p-1 overflow-hidden">
                      <p className="text-[8px] sm:text-[9px] font-black text-white uppercase tracking-wider vertical-text text-center leading-tight drop-shadow-md break-words max-h-full">
                        {book.title}
                      </p>
                    </div>

                    {/* Tooltip */}
                    <div className="absolute -top-24 left-1/2 -translate-x-1/2 bg-brand-900 text-white p-4 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50 w-48 shadow-2xl scale-90 group-hover:scale-100">
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-3 h-3 bg-brand-900 rotate-45" />
                      <p className="text-xs font-black uppercase tracking-widest mb-1 truncate">{book.title}</p>
                      <p className="text-[10px] text-brand-500 font-bold mb-2">{book.author}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Star size={10} className="text-yellow-400 fill-yellow-400" />
                          <span className="text-[10px] font-bold">{book.rating || 'N/A'}</span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-white/10 rounded-full">{book.status}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              
              {/* Render empty slots to fill the shelf */}
              {Array.from({ length: booksPerShelf - shelfBooks.length }).map((_, idx) => (
                <div 
                  key={`empty-${idx}`}
                  className={cn(
                    "relative w-8 h-[140px] opacity-10 border-x border-brand-900/20",
                    "rounded-sm"
                  )}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .vertical-text {
          writing-mode: vertical-rl;
          text-orientation: mixed;
          transform: rotate(180deg);
        }
      `}</style>
    </div>
  );
};

export default BookshelfPage;
