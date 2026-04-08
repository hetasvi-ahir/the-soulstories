import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db, collection, onSnapshot, query, where, orderBy, deleteDoc, doc, handleFirestoreError, OperationType, getDoc, or } from './firebase';
import { Book } from './types';
import { Auth } from './components/Auth';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Library } from './components/Library';
import { SeriesView } from './components/SeriesView';
import BookshelfPage from './components/BookshelfPage';
import { Statistics } from './components/Statistics';
import { Profile } from './components/Profile';
import { BookForm } from './components/BookForm';
import { BookModal } from './components/BookModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Toaster } from 'sonner';
import { AnimatePresence, motion } from 'motion/react';

export default function App() {
  const [user, loading] = useAuthState(auth);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [books, setBooks] = useState<Book[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [initialSeries, setInitialSeries] = useState<string | undefined>(undefined);
  const [viewingBookId, setViewingBookId] = useState<string | null>(null);
  const [editingBookId, setEditingBookId] = useState<string | null>(null);
  const [bookToDelete, setBookToDelete] = useState<Book | undefined>(undefined);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const viewingBook = books.find(b => b.id === viewingBookId);
  const editingBook = books.find(b => b.id === editingBookId);

  useEffect(() => {
    if (!user) return;
    const fetchTheme = async () => {
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.theme) setTheme(data.theme);
        }
      } catch (error) {
        console.error("Error fetching theme:", error);
      }
    };
    fetchTheme();
  }, [user]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    if (!loading) {
      setIsAuthReady(true);
    }
  }, [loading]);

  useEffect(() => {
    if (!user || !isAuthReady) {
      setBooks([]);
      return;
    }

    // Query for user's own books
    const qOwn = query(
      collection(db, 'books'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    // Query for public books
    const qPublic = query(
      collection(db, 'books'),
      where('isPublic', '==', true),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeOwn = onSnapshot(qOwn, (snapshot) => {
      const ownBooks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Book));
      setBooks(prev => {
        const publicOnly = prev.filter(b => b.userId !== user.uid);
        const merged = [...ownBooks, ...publicOnly];
        // Sort by createdAt desc
        return merged.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
      });
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'books/own');
    });

    const unsubscribePublic = onSnapshot(qPublic, (snapshot) => {
      const publicBooks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Book));
      setBooks(prev => {
        const ownOnly = prev.filter(b => b.userId === user.uid);
        // Merge and avoid duplicates (if own book is also public)
        const merged = [...ownOnly];
        publicBooks.forEach(pb => {
          if (!merged.some(mb => mb.id === pb.id)) {
            merged.push(pb);
          }
        });
        // Sort by createdAt desc
        return merged.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
      });
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'books/public');
    });

    return () => {
      unsubscribeOwn();
      unsubscribePublic();
    };
  }, [user, isAuthReady]);

  const handleDeleteBook = async (book: Book) => {
    setBookToDelete(book);
  };

  const confirmDelete = async () => {
    if (!bookToDelete) return;
    try {
      await deleteDoc(doc(db, 'books', bookToDelete.id));
      if (viewingBookId === bookToDelete.id) setViewingBookId(null);
      setBookToDelete(undefined);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `books/${bookToDelete.id}`);
    }
  };

  const handleAddBook = (seriesName?: string) => {
    setInitialSeries(typeof seriesName === 'string' ? seriesName : undefined);
    setIsAddModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pearl-bush dark:bg-brand-950">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 border-4 border-brand-200 border-t-brand-950 rounded-full animate-spin" />
          <p className="text-brand-600 font-serif italic text-lg animate-pulse">Opening your library...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Toaster position="top-center" richColors />
      {!user ? (
        <Auth />
      ) : (
        <Layout 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
          onAddBook={handleAddBook}
          books={books}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'dashboard' && (
                <Dashboard books={books} onBookClick={(book) => setViewingBookId(book.id)} />
              )}
              {activeTab === 'library' && (
                <Library 
                  books={books.filter(b => b.userId === user.uid)} 
                  onBookClick={(book) => setViewingBookId(book.id)} 
                  onEdit={(book) => setEditingBookId(book.id)}
                  onDelete={handleDeleteBook}
                  title="My Library"
                />
              )}
              {activeTab === 'community' && (
                <Library 
                  books={books.filter(b => b.isPublic)} 
                  onBookClick={(book) => setViewingBookId(book.id)} 
                  onEdit={(book) => setEditingBookId(book.id)}
                  onDelete={handleDeleteBook}
                  title="Community Library"
                />
              )}
              {activeTab === 'series' && (
                <SeriesView books={books} onBookClick={(book) => setViewingBookId(book.id)} onAddBook={handleAddBook} />
              )}
              {activeTab === 'bookshelf' && (
                <BookshelfPage books={books} />
              )}
              {activeTab === 'stats' && (
                <Statistics books={books} />
              )}
              {activeTab === 'profile' && (
                <Profile />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Modals */}
          <AnimatePresence>
            {isAddModalOpen && (
              <BookForm 
                onClose={() => {
                  setIsAddModalOpen(false);
                  setInitialSeries(undefined);
                }} 
                onSuccess={() => {}} 
                books={books}
                initialSeries={initialSeries}
              />
            )}
            {editingBook && (
              <BookForm 
                key={editingBook.id}
                book={editingBook}
                onClose={() => setEditingBookId(null)} 
                onSuccess={() => setEditingBookId(null)} 
                books={books}
              />
            )}
            {viewingBook && (
              <BookModal 
                book={viewingBook}
                onClose={() => setViewingBookId(null)}
                onEdit={() => {
                  setEditingBookId(viewingBook.id);
                  setViewingBookId(null);
                }}
                onDelete={() => handleDeleteBook(viewingBook)}
              />
            )}
            <ConfirmationModal
              isOpen={!!bookToDelete}
              title="Remove Book?"
              message={`Are you sure you want to remove "${bookToDelete?.title}" from your library? This action cannot be undone.`}
              confirmLabel="Remove Book"
              onConfirm={confirmDelete}
              onCancel={() => setBookToDelete(undefined)}
              variant="danger"
            />
          </AnimatePresence>
        </Layout>
      )}
    </ErrorBoundary>
  );
}
