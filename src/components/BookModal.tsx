import React from 'react';
import { Book } from '../types';
import { auth, db, doc, updateDoc, handleFirestoreError, OperationType } from '../firebase';
import { STATUS_OPTIONS } from '../types';
import { X, Star, Layers, Heart, Calendar, Hash, BookOpen, FileText, Quote, Tag, Edit3, Trash2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface BookModalProps {
  book: Book;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const BookModal: React.FC<BookModalProps> = ({ book, onClose, onEdit, onDelete }) => {
  const statusColors = {
    'To Read': 'bg-brand-50 text-brand-600 border-brand-200 dark:bg-brand-950/50 dark:text-brand-400 dark:border-brand-800',
    'Currently Reading': 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800',
    'Completed': 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800',
    'DNF': 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800',
    'On Hold': 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/30 dark:text-sky-400 dark:border-sky-800'
  };

  const handleStatusChange = async (newStatus: Book['status']) => {
    try {
      const now = new Date();
      const updates: any = { status: newStatus, updatedAt: now };

      // Basic date logic for quick status changes
      if (newStatus === 'Completed') {
        updates.dateFinished = now;
        if (!book.dateStarted) updates.dateStarted = now;
      } else if (newStatus === 'Currently Reading') {
        if (!book.dateStarted) updates.dateStarted = now;
      } else if (newStatus === 'DNF') {
        updates.dateAbandoned = now;
      } else if (newStatus === 'On Hold') {
        updates.datePaused = now;
      }

      await updateDoc(doc(db, 'books', book.id), updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `books/${book.id}`);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-950/40 dark:bg-black/60 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-spicy-mix w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-2xl border border-brand-100 dark:border-brand-600 flex flex-col md:flex-row relative overflow-hidden"
      >
        {/* Fixed Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 z-50 p-2 bg-white/80 dark:bg-brand-900/80 backdrop-blur-sm hover:bg-brand-50 dark:hover:bg-brand-800 rounded-full transition-all shadow-sm border border-brand-100 dark:border-brand-700"
          aria-label="Close modal"
        >
          <X size={24} className="text-brand-600 dark:text-brand-400" />
        </button>

        {/* Left Side: Cover & Actions */}
        <div className="w-full md:w-[40%] bg-brand-50/30 dark:bg-brand-950/30 p-8 md:p-12 flex flex-col items-center">
          <div className="relative group w-full max-w-[280px] aspect-[2/3] rounded-3xl overflow-hidden shadow-2xl mb-8">
            <img 
              src={book.coverImageUrl || `https://picsum.photos/seed/${book.id}/400/600`} 
              alt={book.title} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              referrerPolicy="no-referrer"
            />
            <div className={cn(
              "absolute top-4 left-4 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border backdrop-blur-md shadow-lg",
              statusColors[book.status]
            )}>
              {book.status}
            </div>
          </div>

            <div className="w-full space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-brand-700 dark:text-brand-400 uppercase tracking-[0.2em] ml-1">Change Status</label>
                <div className="grid grid-cols-1 gap-2">
                  {STATUS_OPTIONS.map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(status)}
                      className={cn(
                        "w-full py-3 px-4 rounded-xl text-xs font-bold transition-all border flex items-center justify-between group",
                        book.status === status
                          ? "bg-brand-950 dark:bg-brand-500 text-white border-brand-950 dark:border-brand-500 shadow-md"
                          : "bg-white dark:bg-brand-900 text-brand-700 dark:text-brand-400 border-brand-100 dark:border-brand-800 hover:border-brand-300 dark:hover:border-brand-600"
                      )}
                    >
                      {status}
                      {book.status === status && <CheckCircle2 size={14} className="text-emerald-400" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 space-y-4">
                <button 
                  onClick={onEdit}
                  className="w-full py-4 px-6 bg-brand-950 dark:bg-brand-500 text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-brand-800 dark:hover:bg-brand-600 transition-all shadow-lg active:scale-95"
                >
                  <Edit3 size={20} />
                  Edit Book
                </button>
                <button 
                  onClick={onDelete}
                  className="w-full py-4 px-6 bg-white dark:bg-brand-900 text-rose-500 border border-rose-100 dark:border-rose-900/50 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all active:scale-95"
                >
                  <Trash2 size={20} />
                  Delete Book
                </button>
              </div>
            </div>
        </div>

        {/* Right Side: Details */}
        <div className="flex-1 p-8 md:p-12 md:pl-0 overflow-y-auto">
          <div className="flex justify-between items-start mb-8 pr-12">
            <div className="flex-1">
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-brand-950 dark:text-brand-50 leading-tight mb-2">
                {book.title}
              </h1>
              <p className="text-xl text-brand-600 dark:text-brand-400 font-medium">{book.author}</p>
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-12">
            {book.seriesName && (
              <div className="flex items-start gap-3">
                <div className="p-2 bg-brand-50 dark:bg-brand-950 rounded-xl text-brand-600 dark:text-brand-400">
                  <Layers size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-brand-600 dark:text-brand-300 uppercase tracking-wider">Series</p>
                  <p className="text-sm font-semibold text-brand-950 dark:text-brand-50">
                    {book.seriesName} {book.readingOrder ? `#${book.readingOrder}` : ''}
                  </p>
                </div>
              </div>
            )}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-brand-50 dark:bg-brand-950 rounded-xl text-brand-700 dark:text-brand-400">
                  <BookOpen size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-brand-600 dark:text-brand-300 uppercase tracking-wider">Type</p>
                  <p className="text-sm font-semibold text-brand-950 dark:text-brand-50">{book.type || 'Standalone'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-brand-50 dark:bg-brand-950 rounded-xl text-brand-700 dark:text-brand-400">
                  <Tag size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-brand-600 dark:text-brand-300 uppercase tracking-wider">Genres</p>
                  <p className="text-sm font-semibold text-brand-950 dark:text-brand-50">{book.genre.join(', ')}</p>
                </div>
              </div>
            {book.rating && (
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-50 dark:bg-amber-950/30 rounded-xl text-amber-500">
                  <Star size={18} fill="currentColor" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-brand-600 dark:text-brand-300 uppercase tracking-wider">Rating</p>
                  <p className="text-sm font-bold text-brand-950 dark:text-brand-50">{book.rating} / 5</p>
                </div>
              </div>
            )}
            {book.pageCount && (
              <div className="flex items-start gap-3">
                <div className="p-2 bg-brand-50 dark:bg-brand-950 rounded-xl text-brand-600 dark:text-brand-400">
                  <BookOpen size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-brand-600 dark:text-brand-300 uppercase tracking-wider">Pages</p>
                  <p className="text-sm font-semibold text-brand-950 dark:text-brand-50">{book.pageCount} pages</p>
                </div>
              </div>
            )}
          </div>

          {/* Review Section */}
          {book.personalNotes && (
            <div className="space-y-10">
              <div>
                <h3 className="text-lg font-serif font-bold text-brand-950 dark:text-brand-50 mb-4 flex items-center gap-2">
                  <Edit3 size={20} className="text-brand-400 dark:text-brand-600" />
                  Personal Notes
                </h3>
                <div className="p-6 bg-brand-50/50 dark:bg-brand-950/50 rounded-2xl border border-brand-100 dark:border-brand-800">
                  <p className="text-brand-700 dark:text-brand-400 text-sm leading-relaxed whitespace-pre-wrap">
                    {book.personalNotes}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="mt-12 pt-8 border-t border-brand-100 dark:border-brand-800 flex flex-wrap gap-8 text-[10px] text-brand-600 dark:text-brand-500 font-black uppercase tracking-widest">
            {book.tentativeStartDate && (
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-brand-400" />
                <span>Tentative Start: {format(book.tentativeStartDate.toDate(), 'MMM d, yyyy')}</span>
              </div>
            )}
            {book.dateStarted && (
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-brand-400" />
                <span>Started: {format(book.dateStarted.toDate(), 'MMM d, yyyy')}</span>
              </div>
            )}
            {book.dateFinished && (
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-brand-400" />
                <span>Finished: {format(book.dateFinished.toDate(), 'MMM d, yyyy')}</span>
              </div>
            )}
            {book.dateAbandoned && (
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-rose-400" />
                <span>Abandoned: {format(book.dateAbandoned.toDate(), 'MMM d, yyyy')}</span>
              </div>
            )}
            {book.datePaused && (
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-sky-400" />
                <span>Paused: {format(book.datePaused.toDate(), 'MMM d, yyyy')}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-brand-300" />
              <span>Added: {format(book.createdAt.toDate(), 'MMM d, yyyy')}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
