import { Timestamp } from 'firebase/firestore';

export type BookStatus = 'To Read' | 'Currently Reading' | 'Completed' | 'DNF' | 'On Hold';

export interface Book {
  id: string;
  userId: string;
  title: string;
  author: string;
  seriesName?: string;
  seriesPosition?: number;
  readingOrder?: number;
  type?: 'Series' | 'Standalone';
  genre: string[];
  status: BookStatus;
  rating?: number;
  coverImageUrl?: string;
  isbn?: string;
  publicationYear?: number;
  pageCount?: number;
  dateStarted?: Timestamp;
  dateFinished?: Timestamp;
  review?: string;
  personalNotes?: string;
  isFavorite: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
  bio?: string;
  favoriteGenres?: string[];
  readingGoal?: number;
  theme?: 'light' | 'dark';
  joinDate: Timestamp;
}

export interface Series {
  id: string;
  userId: string;
  name: string;
  description?: string;
  totalBooks?: number;
  coverImage?: string;
  createdAt: Timestamp;
}

export const GENRES = [
  'Romance', 'Fantasy', 'Thriller', 'Mystery', 'Literary Fiction', 
  'Science Fiction', 'Historical Fiction', 'Young Adult', 'Non-Fiction', 
  'Memoir', 'Self-Help', 'Horror', 'Dark Romance', 'Paranormal Romance', 
  'Contemporary', 'Classic', 'Poetry', 'Graphic Novel'
];

export const STATUS_OPTIONS: BookStatus[] = [
  'To Read', 'Currently Reading', 'Completed', 'DNF', 'On Hold'
];
