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
  currentUserId?: string;
}

export const BookCard: React.FC<BookCardProps> = ({ book, onClick, onEdit, onDelete, currentUserId }) => {
  const isOwner = currentUserId ? book.userId === currentUserId : false;
  const statusColors = {
    'To Read': 'bg-brand-50/80 text-brand-600 border-brand-200 dark:bg-brand-900/80 dark:text-brand-300 dark:border-brand-800',
    'Currently Reading': 'bg-amber-50/80 text-amber-700 border-amber-200 dark:bg-amber-900/80 dark:text-amber-400 dark:border-amber-800',
    'Completed': 'bg-emerald-50/80 text-emerald-700 border-emerald-200 dark:bg-emerald-900/80 dark:text-emerald-400 dark:border-emerald-800',
    'DNF': 'bg-rose-50/80 text-rose-700 border-rose-200 dark:bg-rose-900/80 dark:text-rose-400 dark:border-rose-800',
    'On Hold': 'bg-sky-50/80 text-sky-700 border-sky-200 dark:bg-sky-900/80 dark:text-sky-400 dark:border-sky-800'
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8 }}
      onClick={onClick}
      className="group relative bg-white dark:bg-brand-950 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 cursor-pointer border border-brand-100 dark:border-brand-900 flex flex-col h-full"
    >
      {/* Cover Image Container */}
      <div className="relative aspect-[2/3] overflow-hidden">
        <img
          src={book.coverImageUrl || `https://picsum.photos/seed/${book.id}/300/450`}
          alt={book.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Quick Actions Overlay */}
        {isOwner && (
          <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0">
            <button 
              onClick={onEdit}
              className="p-2.5 bg-white/90 dark:bg-brand-900/90 backdrop-blur-md text-brand-950 dark:text-brand-50 rounded-xl shadow-lg hover:bg-white dark:hover:bg-brand-800 transition-colors border border-white/20"
            >
              <Edit2 size={16} />
            </button>
            <button 
              onClick={onDelete}
              className="p-2.5 bg-rose-500/90 backdrop-blur-md text-white rounded-xl shadow-lg hover:bg-rose-600 transition-colors border border-rose-400/20"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}

        {/* Shared Badge */}
        {!isOwner && (
          <div className="absolute top-4 left-4 px-3 py-1.5 bg-brand-950/80 dark:bg-brand-500/80 backdrop-blur-md text-white rounded-lg text-[8px] font-black uppercase tracking-widest border border-white/20 shadow-lg">
            Read by {book.addedBy || 'Someone'}
          </div>
        )}

        {/* Status Badge */}
        <div className={cn(
          "absolute bottom-4 left-4 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border backdrop-blur-md shadow-lg transition-transform duration-500 group-hover:translate-y-[-4px]",
          !isOwner ? statusColors['To Read'] : statusColors[book.status]
        )}>
          {!isOwner ? 'To Read' : book.status}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex-1">
          <h3 className="text-lg font-serif font-bold text-brand-950 dark:text-brand-50 line-clamp-1 mb-0.5 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors tracking-tight">
            {book.title}
          </h3>
          <p className="text-brand-500 dark:text-brand-400 text-[10px] font-bold uppercase tracking-wider mb-3">by {book.author}</p>
          
          {book.seriesName && (
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-brand-400 dark:text-brand-500 italic mb-4">
              <Layers size={12} className="shrink-0" />
              <span className="truncate">{book.seriesName} #{book.seriesPosition}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-auto pt-4 border-t border-brand-50 dark:border-brand-900">
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(star => (
              <Star
                key={star}
                size={12}
                className={cn(
                  book.rating && book.rating >= star ? "text-amber-400" : "text-brand-100 dark:text-brand-800"
                )}
                fill={book.rating && book.rating >= star ? "currentColor" : "none"}
              />
            ))}
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-200 dark:bg-brand-800" />
            <span className="text-[9px] font-black text-brand-400 dark:text-brand-500 uppercase tracking-widest">
              {book.genre[0]}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
