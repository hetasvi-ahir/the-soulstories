import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db, collection, addDoc, updateDoc, doc, Timestamp, OperationType, handleFirestoreError, getDocs, query, where } from '../firebase';
import { Book, BookStatus, GENRES, STATUS_OPTIONS } from '../types';
import { X, Save, Trash2, Camera, Link as LinkIcon, Star, Calendar, BookOpen, Hash, FileText, User, Layers, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface BookFormProps {
  book?: Book;
  onClose: () => void;
  onSuccess: () => void;
  books: Book[];
  initialSeries?: string;
}

export const BookForm: React.FC<BookFormProps> = ({ book, onClose, onSuccess, books, initialSeries }) => {
  const [user] = useAuthState(auth);
  const [loading, setLoading] = useState(false);
  const [existingSeries, setExistingSeries] = useState<string[]>([]);
  const [isSeries, setIsSeries] = useState(!!book?.seriesName || !!initialSeries);
  const [formData, setFormData] = useState<Partial<Book>>({
    title: '',
    author: '',
    seriesName: initialSeries || '',
    seriesPosition: undefined,
    readingOrder: undefined,
    type: initialSeries ? 'Series' : 'Standalone',
    genre: [],
    status: 'To Read',
    rating: 0,
    coverImageUrl: '',
    isbn: '',
    publicationYear: undefined,
    pageCount: undefined,
    review: '',
    personalNotes: '',
    isFavorite: false,
    ...book
  });

  useEffect(() => {
    const fetchSeries = async () => {
      if (!user) return;
      try {
        const q = query(collection(db, 'books'), where('userId', '==', user.uid));
        const snapshot = await getDocs(q);
        const series = new Set<string>();
        snapshot.forEach(doc => {
          const data = doc.data() as Book;
          if (data.seriesName) series.add(data.seriesName);
        });
        setExistingSeries(Array.from(series).sort());
      } catch (error) {
        console.error("Error fetching series:", error);
      }
    };
    fetchSeries();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: value ? parseFloat(value) : null }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleGenreToggle = (genre: string) => {
    setFormData(prev => {
      const currentGenres = prev.genre || [];
      if (currentGenres.includes(genre)) {
        return { ...prev, genre: currentGenres.filter(g => g !== genre) };
      } else {
        return { ...prev, genre: [...currentGenres, genre] };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      const now = Timestamp.now();
      
      // Explicitly map fields to ensure clean data and handle cleared fields
      const data: any = {
        title: formData.title?.trim(),
        author: formData.author?.trim(),
        genre: formData.genre || [],
        status: formData.status,
        rating: formData.rating || 0,
        coverImageUrl: formData.coverImageUrl || '',
        pageCount: formData.pageCount || null,
        personalNotes: formData.personalNotes || '',
        type: formData.type || 'Standalone',
        updatedAt: now,
        userId: user.uid,
        // Handle dates - use null if cleared to remove from Firestore
        dateStarted: formData.dateStarted || null,
        dateFinished: formData.dateFinished || null,
      };

      // Handle Series specific fields
      if (isSeries) {
        data.seriesName = formData.seriesName?.trim() || '';
        data.seriesPosition = formData.seriesPosition || null;
        data.readingOrder = formData.readingOrder || formData.seriesPosition || null;
      } else {
        data.seriesName = '';
        data.seriesPosition = null;
        data.readingOrder = null;
        data.type = 'Standalone';
      }

      if (book?.id) {
        console.log('Updating book:', book.id, data);
        const bookRef = doc(db, 'books', book.id);
        // Ensure we don't lose the original creation date
        if (book.createdAt) {
          data.createdAt = book.createdAt;
        }
        await updateDoc(bookRef, data);
        toast.success('Book updated successfully!');
      } else {
        console.log('Adding new book:', data);
        data.createdAt = now;
        await addDoc(collection(db, 'books'), data);
        toast.success('Book added to library!');
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error saving book:", error);
      handleFirestoreError(error, book?.id ? OperationType.UPDATE : OperationType.CREATE, 'books');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-950/40 dark:bg-black/60 backdrop-blur-md"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-white dark:bg-brand-900 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl border border-brand-100 dark:border-brand-800 scrollbar-hide"
      >
        <div className="sticky top-0 bg-white/80 dark:bg-brand-900/80 backdrop-blur-md border-b border-brand-100 dark:border-brand-800 px-8 py-6 flex items-center justify-between z-10">
          <h2 className="text-2xl font-serif font-bold text-brand-950 dark:text-brand-50">
            {book ? 'Edit Book' : 'Add New Book'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-brand-50 dark:hover:bg-brand-950 rounded-full transition-colors">
            <X size={24} className="text-brand-600 dark:text-brand-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-brand-700 dark:text-brand-400 uppercase tracking-[0.2em] ml-1">Book Title*</label>
              <div className="relative">
                <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-600 dark:text-brand-500" size={20} />
                <input
                  required
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="The Great Gatsby"
                  className="w-full pl-14 pr-6 py-4 bg-brand-50/50 dark:bg-brand-950/50 border border-brand-100 dark:border-brand-800 rounded-[1.5rem] focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all font-medium placeholder:text-brand-400 dark:placeholder:text-brand-600 text-brand-950 dark:text-brand-50"
                />
              </div>
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black text-brand-700 dark:text-brand-400 uppercase tracking-[0.2em] ml-1">Author Name*</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-600 dark:text-brand-500" size={20} />
                <input
                  required
                  name="author"
                  value={formData.author}
                  onChange={handleChange}
                  placeholder="F. Scott Fitzgerald"
                  className="w-full pl-14 pr-6 py-4 bg-brand-50/50 dark:bg-brand-950/50 border border-brand-100 dark:border-brand-800 rounded-[1.5rem] focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all font-medium placeholder:text-brand-400 dark:placeholder:text-brand-600 text-brand-950 dark:text-brand-50"
                />
              </div>
            </div>
          </div>

          {/* Series Toggle */}
          <div className="space-y-6 p-8 bg-brand-50/30 dark:bg-brand-950/30 rounded-[2.5rem] border border-brand-100/50 dark:border-brand-800/50">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-4 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={isSeries}
                    onChange={(e) => setIsSeries(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={cn(
                    "w-12 h-6 rounded-full transition-all duration-500",
                    isSeries ? "bg-brand-500" : "bg-brand-300 dark:bg-brand-800"
                  )} />
                  <div className={cn(
                    "absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all duration-500 shadow-lg",
                    isSeries ? "translate-x-6" : "translate-x-0"
                  )} />
                </div>
                <span className="text-sm font-bold text-brand-950 dark:text-brand-200 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">Is this part of a series?</span>
              </label>
              <p className="hidden sm:block text-[9px] text-brand-400 dark:text-brand-500 italic">Linking books to a series creates a collection in the Series view.</p>
            </div>

            <AnimatePresence>
              {isSeries && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-8 pt-4 overflow-hidden"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-brand-700 dark:text-brand-400 uppercase tracking-widest ml-1">Series Name</label>
                      <div className="relative">
                        <Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-600 dark:text-brand-500" size={18} />
                        <input
                          list="series-list"
                          name="seriesName"
                          value={formData.seriesName}
                          onChange={handleChange}
                          placeholder="Type or select a series..."
                          className="w-full pl-12 pr-4 py-3 bg-white dark:bg-brand-900 border border-brand-100 dark:border-brand-800 rounded-2xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all text-sm font-medium text-brand-950 dark:text-brand-50"
                        />
                        <datalist id="series-list">
                          {existingSeries.map(s => <option key={s} value={s} />)}
                        </datalist>
                      </div>
                      {formData.seriesName && (
                        <div className="mt-4 p-4 bg-white/50 dark:bg-brand-950/50 rounded-2xl border border-brand-100/50 dark:border-brand-800/50">
                          <p className="text-[10px] font-black text-brand-600 dark:text-brand-400 uppercase tracking-widest mb-3">Books in this series</p>
                          <div className="flex flex-wrap gap-2">
                            {books
                              .filter(b => b.seriesName === formData.seriesName)
                              .sort((a, b) => (a.seriesPosition || 0) - (b.seriesPosition || 0))
                              .map(b => (
                                <div key={b.id} className="px-3 py-1.5 bg-brand-950/5 dark:bg-brand-500/10 text-brand-950 dark:text-brand-400 rounded-lg text-[10px] font-bold border border-brand-950/10 dark:border-brand-500/20 flex items-center gap-2">
                                  <span className="opacity-40">#{b.seriesPosition}</span>
                                  <span className="truncate max-w-[100px]">{b.title}</span>
                                </div>
                              ))}
                            {books.filter(b => b.seriesName === formData.seriesName).length === 0 && (
                              <p className="text-[10px] font-medium text-brand-600 dark:text-brand-500 italic">No other books found in this series yet.</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-brand-700 dark:text-brand-400 uppercase tracking-widest ml-1">Position in Series</label>
                      <div className="relative">
                        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-600 dark:text-brand-500" size={18} />
                        <input
                          type="number"
                          name="seriesPosition"
                          value={formData.seriesPosition || ''}
                          onChange={handleChange}
                          placeholder="Ex: 1"
                          className="w-full pl-12 pr-4 py-3 bg-white dark:bg-brand-900 border border-brand-100 dark:border-brand-800 rounded-2xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all text-sm font-medium text-brand-950 dark:text-brand-50"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Status & Rating */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-brand-700 dark:text-brand-400 uppercase tracking-[0.2em] ml-1">Reading Status*</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-6 py-4 bg-brand-50/50 dark:bg-brand-950/50 border border-brand-100 dark:border-brand-800 rounded-[1.5rem] focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all appearance-none font-medium text-brand-950 dark:text-brand-50"
              >
                {STATUS_OPTIONS.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            {formData.status === 'Completed' && (
              <div className="space-y-4">
                <label className="text-[10px] font-black text-brand-700 dark:text-brand-400 uppercase tracking-[0.2em] ml-1">Rating (1-5)</label>
                <div className="flex gap-3 bg-brand-50/30 dark:bg-brand-950/30 p-3 rounded-2xl border border-brand-100/50 dark:border-brand-800/50 w-fit">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, rating: star }))}
                      className={cn(
                        "p-2 rounded-xl transition-all hover:scale-110 active:scale-95",
                        formData.rating && formData.rating >= star ? "text-brand-500 bg-brand-500/10" : "text-brand-400 dark:text-brand-600 hover:text-brand-500"
                      )}
                    >
                      <Star size={24} fill={formData.rating && formData.rating >= star ? "currentColor" : "none"} />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Genres */}
          <div className="space-y-4">
            <label className="text-[10px] font-black text-brand-700 dark:text-brand-400 uppercase tracking-[0.2em] ml-1">Genres*</label>
            <div className="relative">
              <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-600 dark:text-brand-500" size={20} />
              <select
                onChange={(e) => {
                  const selectedGenre = e.target.value;
                  if (selectedGenre && !formData.genre?.includes(selectedGenre)) {
                    setFormData(prev => ({ ...prev, genre: [...(prev.genre || []), selectedGenre] }));
                  }
                  e.target.value = ""; // Reset select
                }}
                className="w-full pl-14 pr-6 py-4 bg-brand-50/50 dark:bg-brand-950/50 border border-brand-100 dark:border-brand-800 rounded-[1.5rem] focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all appearance-none font-medium text-brand-950 dark:text-brand-50"
              >
                <option value="">Select a genre...</option>
                {GENRES.map(genre => (
                  <option key={genre} value={genre} disabled={formData.genre?.includes(genre)}>
                    {genre}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {formData.genre?.map(genre => (
                <span 
                  key={genre}
                  className="px-4 py-2 bg-brand-950 dark:bg-brand-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 group"
                >
                  {genre}
                  <button 
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, genre: prev.genre?.filter(g => g !== genre) }))}
                    className="hover:text-rose-400 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-brand-700 dark:text-brand-400 uppercase tracking-[0.2em] ml-1">Book Type</label>
              <div className="flex gap-4">
                {['Standalone', 'Series'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type: t as any }))}
                    className={cn(
                      "flex-1 py-4 px-6 rounded-2xl text-sm font-bold transition-all border-2",
                      formData.type === t
                        ? "bg-brand-950 dark:bg-brand-500 text-white border-brand-950 dark:border-brand-500 shadow-lg"
                        : "bg-white dark:bg-brand-900 text-brand-700 dark:text-brand-400 border-brand-100 dark:border-brand-800 hover:border-brand-300 dark:hover:border-brand-500"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            {formData.type === 'Series' && (
              <div className="space-y-4">
                <label className="text-[10px] font-black text-brand-700 dark:text-brand-400 uppercase tracking-[0.2em] ml-1">Reading Order</label>
                <div className="relative">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-600 dark:text-brand-500" size={20} />
                  <input
                    type="number"
                    name="readingOrder"
                    value={formData.readingOrder || ''}
                    onChange={handleChange}
                    placeholder="Ex: 1"
                    className="w-full pl-14 pr-6 py-4 bg-brand-50/50 dark:bg-brand-950/50 border border-brand-100 dark:border-brand-800 rounded-[1.5rem] focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all font-medium placeholder:text-brand-400 dark:placeholder:text-brand-600 text-brand-950 dark:text-brand-50"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-brand-700 dark:text-brand-400 uppercase tracking-[0.2em] ml-1">Pages</label>
              <input
                type="number"
                name="pageCount"
                value={formData.pageCount || ''}
                onChange={handleChange}
                placeholder="350"
                className="w-full px-6 py-4 bg-brand-50/50 dark:bg-brand-950/50 border border-brand-100 dark:border-brand-800 rounded-[1.5rem] focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all font-medium placeholder:text-brand-400 dark:placeholder:text-brand-600 text-brand-950 dark:text-brand-50"
              />
            </div>
          </div>

          {/* Cover Image */}
          <div className="space-y-4">
            <label className="text-[10px] font-black text-brand-700 dark:text-brand-400 uppercase tracking-[0.2em] ml-1">Cover Image URL</label>
            <div className="relative">
              <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-600 dark:text-brand-500" size={20} />
              <input
                name="coverImageUrl"
                value={formData.coverImageUrl}
                onChange={handleChange}
                placeholder="https://example.com/cover.jpg"
                className="w-full pl-14 pr-6 py-4 bg-brand-50/50 dark:bg-brand-950/50 border border-brand-100 dark:border-brand-800 rounded-[1.5rem] focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all font-medium placeholder:text-brand-400 dark:placeholder:text-brand-600 text-brand-950 dark:text-brand-50"
              />
            </div>
            {formData.coverImageUrl && (
              <div className="mt-6 w-32 h-48 rounded-[2rem] overflow-hidden border-4 border-white dark:border-brand-800 shadow-2xl rotate-3">
                <img 
                  src={formData.coverImageUrl} 
                  alt="Cover Preview" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => (e.currentTarget.src = 'https://picsum.photos/seed/book/300/450')}
                />
              </div>
            )}
          </div>

          {/* Reading Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-brand-700 dark:text-brand-400 uppercase tracking-[0.2em] ml-1">Date Started</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-600 dark:text-brand-500" size={20} />
                <input
                  type="date"
                  name="dateStarted"
                  value={formData.dateStarted && (formData.dateStarted as any).seconds ? new Date((formData.dateStarted as any).seconds * 1000).toISOString().split('T')[0] : ''}
                  onChange={(e) => {
                    const date = e.target.value ? Timestamp.fromDate(new Date(e.target.value)) : null;
                    setFormData(prev => ({ ...prev, dateStarted: date }));
                  }}
                  className="w-full pl-14 pr-6 py-4 bg-brand-50/50 dark:bg-brand-950/50 border border-brand-100 dark:border-brand-800 rounded-[1.5rem] focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all font-medium text-brand-950 dark:text-brand-50"
                />
              </div>
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black text-brand-700 dark:text-brand-400 uppercase tracking-[0.2em] ml-1">Date Finished</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-600 dark:text-brand-500" size={20} />
                <input
                  type="date"
                  name="dateFinished"
                  value={formData.dateFinished && (formData.dateFinished as any).seconds ? new Date((formData.dateFinished as any).seconds * 1000).toISOString().split('T')[0] : ''}
                  onChange={(e) => {
                    const date = e.target.value ? Timestamp.fromDate(new Date(e.target.value)) : null;
                    setFormData(prev => ({ ...prev, dateFinished: date }));
                  }}
                  className="w-full pl-14 pr-6 py-4 bg-brand-50/50 dark:bg-brand-950/50 border border-brand-100 dark:border-brand-800 rounded-[1.5rem] focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all font-medium text-brand-950 dark:text-brand-50"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-10 border-t border-brand-100 dark:border-brand-800 flex gap-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-5 px-8 bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-400 rounded-[2rem] font-black uppercase tracking-widest text-xs hover:bg-brand-100 dark:hover:bg-brand-950 transition-all active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] py-5 px-8 bg-brand-950 dark:bg-brand-500 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-brand-800 dark:hover:bg-brand-600 transition-all shadow-2xl shadow-brand-950/30 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save size={18} />
                  <span>{book ? 'Update Book' : 'Add to Library'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};
