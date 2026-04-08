import React, { useState, useMemo, useRef } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Book, BookStatus, GENRES } from '../types';
import { BookCard } from './BookCard';
import { Search, Filter, Grid, List, ChevronDown, X, Star, Heart, Layers, ArrowUpDown, SlidersHorizontal, User, Trash2, FileUp, Plus, ChevronLeft, ChevronRight, Clock, Edit2, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { db, collection, addDoc, serverTimestamp, auth } from '../firebase';
import { toast } from 'sonner';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const SuggestedBookCard: React.FC<{ 
  book: Book; 
  onAdd: (book: Book) => void;
  isAlreadyInLibrary: boolean;
}> = ({ book, onAdd, isAlreadyInLibrary }) => {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="w-32 flex-shrink-0 group cursor-pointer"
    >
      <div className="relative aspect-square rounded-2xl overflow-hidden shadow-lg mb-2 border border-brand-100 dark:border-brand-800 group-hover:ring-2 group-hover:ring-brand-500 transition-all">
        <img 
          src={book.coverImageUrl || `https://picsum.photos/seed/${book.id}/200/200`} 
          alt={book.title} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2 text-center">
          {isAlreadyInLibrary ? (
            <span className="text-[8px] font-black text-white uppercase tracking-widest bg-emerald-500/80 px-2 py-1 rounded-lg backdrop-blur-sm">
              In Library
            </span>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAdd(book);
              }}
              className="p-2 bg-white dark:bg-brand-500 text-brand-950 dark:text-white rounded-full shadow-xl transform scale-0 group-hover:scale-100 transition-transform duration-300 hover:bg-brand-500 hover:text-white dark:hover:bg-brand-400"
            >
              <Plus size={16} />
            </button>
          )}
        </div>
      </div>
      <h4 className="text-[10px] font-bold text-brand-950 dark:text-brand-50 line-clamp-1 text-center px-1">{book.title}</h4>
      <p className="text-[8px] font-medium text-brand-500 text-center truncate">by {book.author}</p>
    </motion.div>
  );
};

const SuggestedSection: React.FC<{ 
  books: Book[]; 
  myBooks: Book[];
  onAdd: (book: Book) => void;
}> = ({ books, myBooks, onAdd }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollAmount = clientWidth * 0.6;
      const scrollTo = direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  if (books.length === 0) return null;

  return (
    <div className="space-y-4 mb-12">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-500/10 text-brand-500 rounded-xl flex items-center justify-center">
            <Heart size={16} fill="currentColor" />
          </div>
          <h2 className="text-sm font-black text-brand-950 dark:text-brand-50 uppercase tracking-[0.2em]">Books suggested by others</h2>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => scroll('left')}
            className="p-2 bg-white dark:bg-brand-900 border border-brand-100 dark:border-brand-800 rounded-xl text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-800 transition-all"
          >
            <ChevronLeft size={16} />
          </button>
          <button 
            onClick={() => scroll('right')}
            className="p-2 bg-white dark:bg-brand-900 border border-brand-100 dark:border-brand-800 rounded-xl text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-800 transition-all"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 px-2 scroll-smooth"
      >
        {books.map(book => {
          const isAlreadyInLibrary = myBooks.some(b => 
            b.title.toLowerCase() === book.title.toLowerCase() && 
            b.author.toLowerCase() === book.author.toLowerCase()
          );
          return (
            <SuggestedBookCard 
              key={book.id} 
              book={book} 
              onAdd={onAdd} 
              isAlreadyInLibrary={isAlreadyInLibrary}
            />
          );
        })}
      </div>
    </div>
  );
};

interface LibraryProps {
  books: Book[];
  onBookClick: (book: Book) => void;
  onEdit: (book: Book) => void;
  onDelete: (book: Book) => void;
  mode?: 'personal' | 'community';
}

export const Library: React.FC<LibraryProps> = ({ books, onBookClick, onEdit, onDelete, mode = 'personal' }) => {
  const [user] = useAuthState(auth);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<BookStatus | 'All'>('All');
  const [genreFilter, setGenreFilter] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'title' | 'author' | 'rating' | 'date'>('date');
  const [showFilters, setShowFilters] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processImportedData = async (data: any[]) => {
    if (!auth.currentUser) return;
    if (!data || data.length === 0) {
      toast.error('The file appears to be empty.');
      return;
    }
    
    const uid = auth.currentUser.uid;
    let successCount = 0;
    
    for (const row of data) {
      // Normalize keys to lowercase and trim for easier matching
      const normalizedRow: any = {};
      Object.keys(row).forEach(key => {
        normalizedRow[key.toLowerCase().trim()] = row[key];
      });

      // Flexible column detection for Title and Author
      const title = normalizedRow['book name'] || 
                    normalizedRow['title'] || 
                    normalizedRow['book title'] || 
                    normalizedRow['name'] ||
                    normalizedRow['bookname'] ||
                    normalizedRow['booktitle'] ||
                    normalizedRow['subject'] ||
                    normalizedRow['book'];
                    
      const author = normalizedRow['author'] || 
                     normalizedRow['writer'] ||
                     normalizedRow['author name'] ||
                     normalizedRow['authorname'] ||
                     normalizedRow['by'] ||
                     normalizedRow['creator'] ||
                     normalizedRow['written by'] ||
                     'Unknown Author';

      const genreStr = normalizedRow['genre'] || normalizedRow['category'] || '';
      const genres = genreStr ? String(genreStr).split(',').map((g: string) => g.trim()) : [];
      
      const pages = parseInt(normalizedRow['pages'] || normalizedRow['page count'] || normalizedRow['pagecount'] || '0');
      const seriesName = normalizedRow['series name'] || normalizedRow['seriesname'] || normalizedRow['series'] || '';
      const type = normalizedRow['type'] || normalizedRow['book type'] || '';
      const readingOrder = parseInt(normalizedRow['reading order'] || normalizedRow['readingorder'] || normalizedRow['series position'] || normalizedRow['seriesposition'] || '0');

      if (title) {
        try {
          await addDoc(collection(db, 'books'), {
            userId: uid,
            title: String(title).trim(),
            author: String(author).trim(),
            status: 'To Read',
            genre: genres,
            pageCount: pages > 0 ? pages : undefined,
            seriesName: seriesName || undefined,
            type: (type === 'Series' || type === 'Standalone') ? type : undefined,
            readingOrder: readingOrder > 0 ? readingOrder : undefined,
            seriesPosition: readingOrder > 0 ? readingOrder : undefined, // Keep both for compatibility
            isFavorite: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          successCount++;
        } catch (error) {
          console.error('Error adding book:', error);
        }
      }
    }
    
    if (successCount === 0 && data.length > 0) {
      const foundCols = Object.keys(data[0]).join(', ');
      toast.error(`No books were added. Please ensure your file has columns like "Book Name" and "Author". Detected columns: ${foundCols}`);
    } else {
      toast.success(`Successfully added ${successCount} books to your "To Read" list!`);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !auth.currentUser) return;

    setIsUploading(true);
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.csv')) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          await processImportedData(results.data);
          setIsUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        },
        error: (error) => {
          console.error('CSV Parsing Error:', error);
          setIsUploading(false);
          toast.error('Failed to parse CSV file.');
        }
      });
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          // Try to get data as array of objects first
          let jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          // If the first row is empty or doesn't look like a header, try again with different options
          if (jsonData.length > 0 && Object.keys(jsonData[0]).length <= 1) {
            jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            // If it's an array of arrays, convert to objects using the first row as headers
            if (Array.isArray(jsonData[0])) {
              const headers = (jsonData[0] as any[]).map(h => String(h).trim());
              const rows = jsonData.slice(1) as any[][];
              jsonData = rows.map(row => {
                const obj: any = {};
                headers.forEach((h, i) => {
                  if (h) obj[h] = row[i];
                });
                return obj;
              });
            }
          }
          
          await processImportedData(jsonData);
        } catch (error) {
          console.error('Excel Parsing Error:', error);
          alert('Failed to parse Excel file.');
        } finally {
          setIsUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      alert('Please upload a CSV or Excel file.');
      setIsUploading(false);
    }
  };

  const myBooks = useMemo(() => {
    if (!user) return [];
    return books.filter(b => b.userId === user.uid);
  }, [books, user]);

  const suggestedBooks = useMemo(() => {
    if (!user) return [];
    return books.filter(b => b.userId !== user.uid && b.isPublic);
  }, [books, user]);

  const filteredBooks = useMemo(() => {
    return myBooks
      .filter(book => {
        const matchesSearch = 
          book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
          book.seriesName?.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesStatus = statusFilter === 'All' || book.status === statusFilter;
        
        const matchesGenre = genreFilter.length === 0 || 
          genreFilter.some(g => book.genre.includes(g));
        
        return matchesSearch && matchesStatus && matchesGenre;
      })
      .sort((a, b) => {
        if (sortBy === 'title') return (a.title || '').localeCompare(b.title || '');
        if (sortBy === 'author') return (a.author || '').localeCompare(b.author || '');
        if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
        
        // Defensive check for toMillis
        const getTime = (book: Book) => {
          if (!book.createdAt) return 0;
          if (typeof book.createdAt.toMillis === 'function') return book.createdAt.toMillis();
          if (book.createdAt instanceof Date) return book.createdAt.getTime();
          if (typeof book.createdAt === 'number') return book.createdAt;
          if (typeof book.createdAt === 'string') return new Date(book.createdAt).getTime();
          return 0;
        };

        const timeA = getTime(a);
        const timeB = getTime(b);
        return timeB - timeA;
      });
  }, [myBooks, searchQuery, statusFilter, genreFilter, sortBy]);

  const addToMyLibrary = async (book: Book) => {
    if (!user) return;
    
    // Check if already in library
    const isDuplicate = myBooks.some(b => 
      b.title.toLowerCase() === book.title.toLowerCase() && 
      b.author.toLowerCase() === book.author.toLowerCase()
    );

    if (isDuplicate) {
      toast.error('This book is already in your library!');
      return;
    }

    try {
      await addDoc(collection(db, 'books'), {
        userId: user.uid,
        addedBy: user.displayName || 'Anonymous',
        title: book.title,
        author: book.author,
        genre: book.genre,
        coverImageUrl: book.coverImageUrl,
        pageCount: book.pageCount,
        status: 'To Read',
        isPublic: true,
        isFavorite: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast.success(`"${book.title}" added to your library!`);
    } catch (error) {
      console.error('Error adding book:', error);
      toast.error('Failed to add book to library.');
    }
  };

  const toggleGenre = (genre: string) => {
    setGenreFilter(prev => 
      prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
    );
  };

  return (
    <div className="space-y-10">
      {/* Header & Search */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="space-y-2">
          <h1 className="text-6xl font-serif font-bold text-treehouse tracking-tighter">
            {mode === 'personal' ? 'Your Library' : 'Community'}
          </h1>
          <p className="text-treehouse font-medium text-lg">
            {mode === 'personal' 
              ? `Organize and explore your collection of ${myBooks.length} books.`
              : `Discover ${suggestedBooks.length} books suggested by the community.`
            }
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative w-full sm:w-80 group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-600 dark:text-brand-400 group-focus-within:text-brand-700 dark:group-focus-within:text-brand-200 transition-colors" size={20} />
            <input
              type="text"
              placeholder="Search title, author, or series..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-6 py-5 bg-white dark:bg-brand-900 border border-brand-100 dark:border-brand-800 rounded-[2.5rem] shadow-xl shadow-brand-950/5 focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all placeholder:text-brand-400 dark:placeholder:text-brand-500 font-medium text-brand-950 dark:text-brand-50"
            />
          </div>
          <div className="flex items-center gap-2 p-2 bg-white dark:bg-brand-900 border border-brand-100 dark:border-brand-800 rounded-[2.5rem] shadow-xl shadow-brand-950/5">
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="p-3 rounded-2xl text-brand-300 dark:text-brand-500 hover:text-brand-600 dark:hover:text-brand-300 hover:bg-brand-50 dark:hover:bg-brand-800 transition-all duration-500 flex items-center gap-2"
              title="Upload CSV/Excel (Book Name, Author)"
            >
              {isUploading ? (
                <div className="w-5 h-5 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
              ) : (
                <>
                  <FileUp size={20} />
                  <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Import</span>
                </>
              )}
            </button>
            <div className="w-[1px] h-6 bg-brand-100 dark:bg-brand-800 mx-1" />
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-3 rounded-2xl transition-all duration-500",
                viewMode === 'grid' ? "bg-brand-950 dark:bg-brand-500 text-white shadow-lg shadow-brand-950/20" : "text-brand-300 dark:text-brand-500 hover:text-brand-600 dark:hover:text-brand-300 hover:bg-brand-50 dark:hover:bg-brand-800"
              )}
            >
              <Grid size={20} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "p-3 rounded-2xl transition-all duration-500",
                viewMode === 'list' ? "bg-brand-950 dark:bg-brand-500 text-white shadow-lg shadow-brand-950/20" : "text-brand-300 dark:text-brand-500 hover:text-brand-600 dark:hover:text-brand-300 hover:bg-brand-50 dark:hover:bg-brand-800"
              )}
            >
              <List size={20} />
            </button>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "p-5 rounded-[2.5rem] border transition-all duration-500 flex items-center gap-3 shadow-xl shadow-brand-950/5",
              showFilters ? "bg-brand-950 dark:bg-brand-500 text-white border-brand-950 dark:border-brand-500" : "bg-white dark:bg-brand-900 text-brand-600 dark:text-brand-400 border-brand-100 dark:border-brand-800 hover:border-brand-300 dark:hover:border-brand-500"
            )}
          >
            <SlidersHorizontal size={20} />
            <span className="font-black text-[10px] uppercase tracking-[0.2em]">Filters</span>
          </button>
        </div>
      </header>

      {/* Advanced Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0, y: -20 }}
            animate={{ height: 'auto', opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: -20 }}
            className="overflow-hidden"
          >
            <div className="p-10 bg-white dark:bg-brand-900 border border-brand-100 dark:border-brand-800 rounded-[3rem] shadow-2xl shadow-brand-950/10 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                {/* Status Filter */}
                <div className="space-y-6">
                  <h3 className="text-[10px] font-black text-brand-600 dark:text-brand-400 uppercase tracking-[0.2em]">By Status</h3>
                  <div className="flex flex-wrap gap-2">
                    {['All', 'To Read', 'Currently Reading', 'Completed', 'DNF', 'On Hold'].map(status => (
                      <button
                        key={status}
                        onClick={() => setStatusFilter(status as any)}
                        className={cn(
                          "px-5 py-2.5 rounded-2xl text-xs font-bold transition-all duration-500 border",
                          statusFilter === status 
                            ? "bg-brand-950 dark:bg-brand-500 text-white border-brand-950 dark:border-brand-500 shadow-lg shadow-brand-950/20" 
                            : "bg-brand-50 dark:bg-brand-800/50 text-brand-600 dark:text-brand-400 border-brand-100 dark:border-brand-800 hover:border-brand-300 dark:hover:border-brand-500 hover:bg-white dark:hover:bg-brand-800"
                        )}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Genre Filter */}
                <div className="space-y-6">
                  <h3 className="text-[10px] font-black text-brand-600 dark:text-brand-400 uppercase tracking-[0.2em]">By Genre</h3>
                  <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-3 scrollbar-hide">
                    {GENRES.map(genre => (
                      <button
                        key={genre}
                        onClick={() => toggleGenre(genre)}
                        className={cn(
                          "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 border",
                          genreFilter.includes(genre)
                            ? "bg-brand-950 dark:bg-brand-500 text-white border-brand-950 dark:border-brand-500 shadow-lg shadow-brand-950/20"
                            : "bg-brand-50 dark:bg-brand-800/50 text-brand-600 dark:text-brand-400 border-brand-100 dark:border-brand-800 hover:border-brand-300 dark:hover:border-brand-500 hover:bg-white dark:hover:bg-brand-800"
                        )}
                      >
                        {genre}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sort By */}
                <div className="space-y-6">
                  <h3 className="text-[10px] font-black text-brand-600 dark:text-brand-400 uppercase tracking-[0.2em]">Sort By</h3>
                  <div className="flex flex-col gap-3">
                    {[
                      { id: 'date', label: 'Recently Added', icon: Clock },
                      { id: 'title', label: 'Title (A-Z)', icon: ArrowUpDown },
                      { id: 'author', label: 'Author (A-Z)', icon: User },
                      { id: 'rating', label: 'Highest Rating', icon: Star },
                    ].map(option => (
                      <button
                        key={option.id}
                        onClick={() => setSortBy(option.id as any)}
                        className={cn(
                          "flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-bold transition-all duration-500 border",
                          sortBy === option.id
                            ? "bg-brand-950 dark:bg-brand-500 text-white border-brand-950 dark:border-brand-500 shadow-lg shadow-brand-950/20"
                            : "bg-brand-50 dark:bg-brand-800/50 text-brand-600 dark:text-brand-400 border-brand-100 dark:border-brand-800 hover:border-brand-300 dark:hover:border-brand-500 hover:bg-white dark:hover:bg-brand-800"
                        )}
                      >
                        <option.icon size={18} />
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="pt-8 border-t border-brand-50 dark:border-brand-800 flex justify-between items-center">
                <p className="text-sm text-brand-500 dark:text-brand-400 font-serif italic">
                  Showing <span className="text-brand-950 dark:text-brand-400 font-bold not-italic">{filteredBooks.length}</span> of {myBooks.length} books
                </p>
                <button 
                  onClick={() => {
                    setStatusFilter('All');
                    setGenreFilter([]);
                    setSortBy('date');
                  }}
                  className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] hover:text-rose-600 transition-colors flex items-center gap-2"
                >
                  <X size={14} />
                  Clear All Filters
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Suggested Section */}
      {mode === 'community' ? (
        <div className="space-y-12">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {suggestedBooks.map(book => {
              const isAlreadyInLibrary = myBooks.some(b => 
                b.title.toLowerCase() === book.title.toLowerCase() && 
                b.author.toLowerCase() === book.author.toLowerCase()
              );
              return (
                <SuggestedBookCard 
                  key={book.id} 
                  book={book} 
                  onAdd={addToMyLibrary} 
                  isAlreadyInLibrary={isAlreadyInLibrary}
                />
              );
            })}
          </div>
          {suggestedBooks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 bg-brand-50 dark:bg-brand-900 text-brand-200 dark:text-brand-700 rounded-full flex items-center justify-center mb-6">
                <Users size={40} />
              </div>
              <h3 className="text-xl font-serif font-bold text-brand-950 dark:text-brand-50">No community suggestions yet</h3>
              <p className="text-brand-600 dark:text-brand-400 max-w-xs mt-2">Be the first to share a public book in your library!</p>
            </div>
          )}
        </div>
      ) : (
        <>
          <SuggestedSection books={suggestedBooks} myBooks={myBooks} onAdd={addToMyLibrary} />

          <div className="flex items-center gap-3 px-2 mb-6">
            <div className="w-8 h-8 bg-brand-950 dark:bg-brand-500 text-white rounded-xl flex items-center justify-center shadow-lg rotate-3">
              <Layers size={16} />
            </div>
            <h2 className="text-sm font-black text-brand-950 dark:text-brand-50 uppercase tracking-[0.2em]">Books in your library</h2>
          </div>

          {/* Content Grid/List */}
          {filteredBooks.length > 0 ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {filteredBooks.map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    currentUserId={user?.uid}
                    onClick={() => onBookClick(book)}
                    onEdit={(e) => { e.stopPropagation(); onEdit(book); }}
                    onDelete={(e) => { e.stopPropagation(); onDelete(book); }}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-brand-900 rounded-[3rem] shadow-2xl shadow-brand-950/5 overflow-hidden border border-brand-100 dark:border-brand-800">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-brand-50/50 dark:bg-brand-950/50 border-b border-brand-100 dark:border-brand-800">
                        <th className="px-10 py-8 text-[10px] font-black text-brand-500 dark:text-brand-400 uppercase tracking-[0.2em]">Book</th>
                        <th className="px-10 py-8 text-[10px] font-black text-brand-500 dark:text-brand-400 uppercase tracking-[0.2em]">Author</th>
                        <th className="px-10 py-8 text-[10px] font-black text-brand-500 dark:text-brand-400 uppercase tracking-[0.2em]">Genre</th>
                        <th className="px-10 py-8 text-[10px] font-black text-brand-500 dark:text-brand-400 uppercase tracking-[0.2em]">Status</th>
                        <th className="px-10 py-8 text-[10px] font-black text-brand-500 dark:text-brand-400 uppercase tracking-[0.2em]">Rating</th>
                        <th className="px-10 py-8 text-[10px] font-black text-brand-500 dark:text-brand-400 uppercase tracking-[0.2em]">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-50 dark:divide-brand-800">
                      {filteredBooks.map((book) => (
                        <tr 
                          key={book.id} 
                          onClick={() => onBookClick(book)}
                          className="hover:bg-brand-50/30 dark:hover:bg-brand-950/30 transition-colors cursor-pointer group"
                        >
                          <td className="px-10 py-8">
                            <div className="flex items-center gap-6">
                              <div className="w-12 h-16 rounded-xl overflow-hidden shadow-lg shadow-brand-950/10 flex-shrink-0 group-hover:scale-110 transition-transform duration-500">
                                <img 
                                  src={book.coverImageUrl || `https://picsum.photos/seed/${book.id}/100/150`} 
                                  alt={book.title} 
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                              <div>
                                <p className="font-serif font-bold text-brand-950 dark:text-brand-50 text-lg group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors line-clamp-2 leading-tight">{book.title}</p>
                                {book.seriesName && (
                                  <p className="text-[10px] font-black text-brand-300 dark:text-brand-500 uppercase tracking-widest mt-1">
                                    {book.seriesName} <span className="text-brand-500 dark:text-brand-400">#{book.seriesPosition}</span>
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-10 py-8 text-brand-600 dark:text-brand-400 font-bold italic">by {book.author}</td>
                          <td className="px-10 py-8">
                            <span className="px-3 py-1 bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-50 rounded-full text-[10px] font-black uppercase tracking-widest border border-brand-100 dark:border-brand-800">
                              {book.genre[0]}
                            </span>
                          </td>
                          <td className="px-10 py-8">
                            <span className={cn(
                              "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border",
                              book.status === 'Completed' ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800" :
                              book.status === 'Currently Reading' ? "bg-brand-50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-400 border-brand-100 dark:border-brand-950" :
                              "bg-brand-50/50 dark:bg-brand-950/50 text-brand-500 dark:text-brand-500 border-brand-100 dark:border-brand-800"
                            )}>
                              {book.status}
                            </span>
                          </td>
                          <td className="px-10 py-8">
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map(star => (
                                <Star 
                                  key={star} 
                                  size={14} 
                                  className={cn(book.rating && book.rating >= star ? "text-brand-500" : "text-brand-300 dark:text-brand-700")} 
                                  fill={book.rating && book.rating >= star ? "currentColor" : "none"}
                                />
                              ))}
                            </div>
                          </td>
                          <td className="px-10 py-8">
                            <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0">
                              <button 
                                onClick={(e) => { e.stopPropagation(); onEdit(book); }}
                                className="p-3 bg-brand-50 dark:bg-brand-950 hover:bg-brand-100 dark:hover:bg-brand-800 rounded-2xl text-brand-600 dark:text-brand-400 hover:text-brand-950 dark:hover:text-brand-100 transition-all shadow-sm"
                              >
                                <Edit2 size={18} />
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); onDelete(book); }}
                                className="p-3 bg-rose-50 dark:bg-rose-900/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded-2xl text-rose-500 hover:text-rose-600 transition-all shadow-sm"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center py-32 px-4 text-center">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-32 h-32 bg-brand-50 dark:bg-brand-900 text-brand-200 dark:text-brand-700 rounded-[2.5rem] flex items-center justify-center mb-10 shadow-inner"
              >
                <Search size={56} />
              </motion.div>
              <h3 className="text-4xl font-serif font-bold text-brand-950 dark:text-brand-50 mb-4 tracking-tighter">No books found</h3>
              <p className="text-brand-700 dark:text-brand-400 max-w-md font-medium text-lg leading-relaxed">
                We couldn't find any books matching your current search or filters. Try adjusting them or add a new book to your library.
              </p>
              <button 
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('All');
                  setGenreFilter([]);
                }}
                className="mt-12 px-10 py-5 bg-brand-950 dark:bg-brand-500 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-brand-800 dark:hover:bg-brand-600 transition-all shadow-2xl shadow-brand-950/20"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
