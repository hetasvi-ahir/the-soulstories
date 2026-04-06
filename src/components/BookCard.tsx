import React from 'react';
import { Book } from '../types';
import { Star, Layers, Heart, MoreVertical, Edit2, Trash2, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface BookCardProps {
  book: Book;
  onClick: () => void;
  onEdit: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}

export const BookCard: React.FC<BookCardProps> = ({ book, onClick, onEdit, onDelete }) => {
  const statusColors = {
    'To Read': 'bg-brand-50 text-brand-400 border-brand-100',
    'Currently Reading': 'bg-brand-100 text-brand-700 border-brand-200',
    'Completed': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'DNF': 'bg-rose-50 text-rose-700 border-rose-200',
    'On Hold': 'bg-brand-50 text-brand-400 border-brand-100'
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -12, scale: 1.02 }}
      onClick={onClick}
      className="group relative bg-white dark:bg-spicy-mix rounded-[2.5rem] overflow-hidden shadow-xl shadow-brand-900/5 hover:shadow-2xl hover:shadow-brand-900/10 transition-all duration-700 cursor-pointer border border-brand-100 dark:border-brand-600 flex flex-col h-full"
    >
      {/* Cover Image Container */}
      <div className="relative aspect-[2/3] overflow-hidden bg-brand-50 dark:bg-brand-900">
        <img
          src={book.coverImageUrl || `https://picsum.photos/seed/${book.id}/300/450`}
          alt={book.title}
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
        
        {/* Overlay on Hover */}
        <div className="absolute inset-0 bg-brand-950/60 opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-6 backdrop-blur-[3px]">
          <div className="flex gap-2 mb-4">
            <button 
              onClick={onEdit}
              className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-xl text-white rounded-xl transition-all active:scale-90 border border-white/10"
            >
              <Edit2 size={18} />
            </button>
            <button 
              onClick={onDelete}
              className="p-3 bg-rose-500/10 hover:bg-rose-500/20 backdrop-blur-xl text-rose-100 rounded-xl transition-all active:scale-90 border border-rose-500/10"
            >
              <Trash2 size={18} />
            </button>
          </div>
          <div className="flex items-center gap-2 text-white/90 text-xs font-serif italic">
            <ExternalLink size={14} className="text-brand-400" />
            <span>Open details</span>
          </div>
        </div>

        {/* Status Badge */}
        <div className={cn(
          "absolute top-6 left-6 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border backdrop-blur-xl shadow-lg",
          book.status === 'Completed' ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800" :
          book.status === 'Currently Reading' ? "bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 border-brand-200 dark:border-brand-800" :
          "bg-brand-50 dark:bg-brand-900/50 text-brand-400 dark:text-brand-100 border-brand-100 dark:border-brand-800"
        )}>
          {book.status}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 flex flex-col flex-1">
        <div className="flex-1">
          <h3 className="text-xl font-serif font-bold text-brand-950 dark:text-brand-50 line-clamp-2 mb-1 group-hover:text-brand-600 dark:group-hover:text-brand-200 transition-colors tracking-tight leading-tight">
            {book.title}
          </h3>
          <p className="text-brand-600 dark:text-brand-100 text-[11px] font-bold italic mb-3 line-clamp-2 leading-tight">by {book.author}</p>
          
          {book.seriesName && (
            <div className="flex items-center gap-2 text-[9px] font-black text-brand-600 dark:text-brand-100 uppercase tracking-widest mb-4 bg-brand-50/50 dark:bg-brand-900/50 px-2 py-1 rounded-lg w-fit border border-brand-100 dark:border-brand-800">
              <Layers size={12} className="text-brand-500 dark:text-brand-200" />
              <span className="truncate max-w-[120px]">{book.seriesName} <span className="text-brand-700 dark:text-brand-100">#{book.seriesPosition}</span></span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-auto pt-4 border-t border-brand-50 dark:border-brand-600">
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(star => (
              <Star
                key={star}
                size={14}
                className={cn(
                  book.rating && book.rating >= star ? "text-brand-500" : "text-brand-300 dark:text-brand-400"
                )}
                fill={book.rating && book.rating >= star ? "currentColor" : "none"}
              />
            ))}
          </div>
          <span className="text-[9px] font-black text-brand-500 dark:text-brand-50 uppercase tracking-[0.2em]">
            {book.genre[0]}
          </span>
        </div>
      </div>
    </motion.div>
  );
};
