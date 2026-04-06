import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'info';
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'danger'
}) => {
  const variants = {
    danger: 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20 text-white',
    warning: 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20 text-white',
    info: 'bg-brand-950 dark:bg-brand-500 hover:bg-brand-800 dark:hover:bg-brand-600 shadow-brand-950/20 text-white'
  };

  const iconColors = {
    danger: 'text-rose-500 bg-rose-50 dark:bg-rose-950/30',
    warning: 'text-amber-500 bg-amber-50 dark:bg-amber-950/30',
    info: 'text-brand-600 bg-brand-50 dark:text-brand-400 dark:bg-brand-950/30'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-brand-950/40 dark:bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-white dark:bg-spicy-mix w-full max-w-md rounded-[2.5rem] shadow-2xl border border-brand-100 dark:border-brand-600 p-8 overflow-hidden"
          >
            <div className="flex justify-between items-start mb-6">
              <div className={cn("p-3 rounded-2xl", iconColors[variant])}>
                <AlertTriangle size={24} />
              </div>
              <button 
                onClick={onCancel}
                className="p-2 hover:bg-brand-50 dark:hover:bg-brand-950 rounded-full transition-colors text-brand-400 dark:text-brand-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-2 mb-8">
              <h3 className="text-2xl font-serif font-bold text-brand-950 dark:text-brand-50">{title}</h3>
              <p className="text-brand-600 dark:text-brand-400 leading-relaxed">{message}</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={onConfirm}
                className={cn(
                  "flex-1 py-4 px-6 rounded-2xl font-bold transition-all shadow-lg active:scale-95",
                  variants[variant]
                )}
              >
                {confirmLabel}
              </button>
              <button
                onClick={onCancel}
                className="flex-1 py-4 px-6 bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-400 rounded-2xl font-bold hover:bg-brand-100 dark:hover:bg-brand-950 transition-all active:scale-95"
              >
                {cancelLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
