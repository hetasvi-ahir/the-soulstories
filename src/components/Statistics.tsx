import React, { useMemo } from 'react';
import { Book } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';
import { BarChart3, PieChart as PieChartIcon, TrendingUp, Calendar, Award, BookOpen, Star, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { format, startOfYear, endOfYear, eachMonthOfInterval, isSameMonth } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface StatisticsProps {
  books: Book[];
}

const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];

export const Statistics: React.FC<StatisticsProps> = ({ books }) => {
  const completedBooks = useMemo(() => books.filter(b => b.status === 'Completed'), [books]);
  
  // Books per Year
  const booksPerYear = useMemo(() => {
    const years: Record<string, number> = {};
    completedBooks.forEach(b => {
      const finishDate = b.dateFinished && (b.dateFinished as any).toDate ? (b.dateFinished as any).toDate() : null;
      if (finishDate) {
        const year = finishDate.getFullYear();
        years[year] = (years[year] || 0) + 1;
      }
    });
    return Object.entries(years).map(([year, count]) => ({ year, count })).sort((a, b) => a.year.localeCompare(b.year));
  }, [completedBooks]);

  // Books per Genre
  const booksPerGenre = useMemo(() => {
    const genres: Record<string, number> = {};
    completedBooks.forEach(b => {
      b.genre.forEach(g => {
        genres[g] = (genres[g] || 0) + 1;
      });
    });
    return Object.entries(genres)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [completedBooks]);

  // Pages per Month (Current Year)
  const pagesPerMonth = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const months = eachMonthOfInterval({
      start: startOfYear(new Date()),
      end: endOfYear(new Date())
    });

    return months.map(month => {
      const pages = completedBooks
        .filter(b => {
          const finishDate = b.dateFinished?.toDate();
          return finishDate && isSameMonth(finishDate, month) && finishDate.getFullYear() === currentYear;
        })
        .reduce((acc, b) => acc + (b.pageCount || 0), 0);
      
      return {
        month: format(month, 'MMM'),
        pages
      };
    });
  }, [completedBooks]);

  // Rating Distribution
  const ratingDist = useMemo(() => {
    const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    completedBooks.forEach(b => {
      if (b.rating) {
        const r = Math.floor(b.rating);
        dist[r] = (dist[r] || 0) + 1;
      }
    });
    return Object.entries(dist).map(([rating, count]) => ({ rating: `${rating} ★`, count }));
  }, [completedBooks]);

  if (completedBooks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="w-24 h-24 bg-brand-50 dark:bg-brand-900 text-brand-200 dark:text-brand-700 rounded-full flex items-center justify-center mb-8">
          <BarChart3 size={48} />
        </div>
        <h3 className="text-2xl font-serif font-bold text-brand-950 dark:text-brand-50 mb-2">No statistics yet</h3>
        <p className="text-brand-600 dark:text-brand-400 max-w-md">
          Complete some books to see your reading patterns and analytics visualized here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <header>
        <h1 className="text-5xl font-serif font-bold text-treehouse mb-2 tracking-tight">Reading Analytics</h1>
        <p className="text-treehouse font-medium">Insights into your reading journey and habits.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Books Read per Year */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-10 bg-white dark:bg-brand-900 rounded-[2.5rem] shadow-xl border border-brand-100 dark:border-brand-800"
        >
          <div className="flex items-center gap-3 mb-10">
            <div className="p-2 bg-brand-950 dark:bg-brand-500 text-white rounded-xl">
              <Calendar size={20} />
            </div>
            <h3 className="text-xl font-serif font-bold text-brand-950 dark:text-brand-50">Books Read per Year</h3>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={booksPerYear}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-brand-800" />
                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', color: '#f8fafc' }}
                  cursor={{ fill: '#f1f5f9', className: 'dark:fill-brand-800/50' }}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Genre Distribution */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="p-10 bg-white dark:bg-brand-900 rounded-[2.5rem] shadow-xl border border-brand-100 dark:border-brand-800"
        >
          <div className="flex items-center gap-3 mb-10">
            <div className="p-2 bg-brand-950 dark:bg-brand-800 text-white rounded-xl">
              <PieChartIcon size={20} />
            </div>
            <h3 className="text-xl font-serif font-bold text-brand-950 dark:text-brand-50">Top Genres</h3>
          </div>
          <div className="h-80 w-full flex flex-col md:flex-row items-center">
            <div className="flex-1 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={booksPerGenre}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {booksPerGenre.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#36251d', borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', color: '#ece4e0' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-4 p-4">
              {booksPerGenre.map((genre, i) => (
                <div key={genre.name} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-sm font-bold text-brand-700 dark:text-brand-300">{genre.name}</span>
                  <span className="text-sm font-medium text-brand-400 dark:text-brand-500 ml-auto">{genre.value}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Pages Read per Month */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="p-10 bg-white dark:bg-brand-900 rounded-[2.5rem] shadow-xl border border-brand-100 dark:border-brand-800"
        >
          <div className="flex items-center gap-3 mb-10">
            <div className="p-2 bg-brand-950 dark:bg-brand-500 text-white rounded-xl">
              <TrendingUp size={20} />
            </div>
            <h3 className="text-xl font-serif font-bold text-brand-950 dark:text-brand-50">Pages Read per Month</h3>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={pagesPerMonth}>
                <defs>
                  <linearGradient id="colorPages" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-brand-800" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', color: '#f8fafc' }}
                />
                <Area type="monotone" dataKey="pages" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorPages)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Rating Distribution */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="p-10 bg-white dark:bg-brand-900 rounded-[2.5rem] shadow-xl border border-brand-100 dark:border-brand-800"
        >
          <div className="flex items-center gap-3 mb-10">
            <div className="p-2 bg-brand-950 dark:bg-brand-500 text-white rounded-xl">
              <Star size={20} />
            </div>
            <h3 className="text-xl font-serif font-bold text-brand-950 dark:text-brand-50">Rating Distribution</h3>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ratingDist} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" className="dark:stroke-brand-800" />
                <XAxis type="number" hide />
                <YAxis dataKey="rating" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', color: '#f8fafc' }}
                  cursor={{ fill: '#f1f5f9', className: 'dark:fill-brand-800/50' }}
                />
                <Bar dataKey="count" fill="#f59e0b" radius={[0, 8, 8, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Statistics;
