import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db, doc, getDoc, setDoc, updateDoc, handleFirestoreError, OperationType, Timestamp, collection, addDoc, serverTimestamp } from '../firebase';
import { UserProfile, GENRES } from '../types';
import { User, Mail, Calendar, Award, Heart, Edit3, Save, Camera, Settings, ShieldCheck, Database, CheckCircle2, FilePlus } from 'lucide-react';
import { ConfirmationModal } from './ConfirmationModal';
import { toast } from 'sonner';
import { SAMPLE_BOOKS } from '../data/sampleBooks';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Profile: React.FC = () => {
  const [user] = useAuthState(auth);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [seeding, setSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);
  const [showSeedConfirm, setShowSeedConfirm] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as UserProfile;
          setProfile(data);
          setFormData(data);
        } else {
          // Create initial profile
          const initialProfile: UserProfile = {
            id: user.uid,
            email: user.email || '',
            firstName: user.displayName?.split(' ')[0] || '',
            lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
            profilePicture: user.photoURL || '',
            joinDate: Timestamp.now(),
            favoriteGenres: [],
            readingGoal: 12,
            theme: 'light'
          };
          await setDoc(docRef, initialProfile);
          setProfile(initialProfile);
          setFormData(initialProfile);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'users');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // Sanitize data: remove undefined values which Firestore doesn't support
      const data = Object.fromEntries(
        Object.entries(formData).filter(([_, v]) => v !== undefined)
      );
      
      await updateDoc(doc(db, 'users', user.uid), data);
      setProfile(formData as UserProfile);
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'users');
    } finally {
      setSaving(false);
    }
  };

  const toggleGenre = (genre: string) => {
    setFormData(prev => {
      const current = prev.favoriteGenres || [];
      if (current.includes(genre)) {
        return { ...prev, favoriteGenres: current.filter(g => g !== genre) };
      } else {
        return { ...prev, favoriteGenres: [...current, genre] };
      }
    });
  };

  const handleSeedData = async () => {
    if (!user) return;
    setShowSeedConfirm(true);
  };

  const confirmSeedData = async () => {
    if (!user) return;
    setShowSeedConfirm(false);
    setSeeding(true);
    try {
      for (const book of SAMPLE_BOOKS) {
        await addDoc(collection(db, 'books'), {
          ...book,
          userId: user.uid,
          status: 'To Read',
          isFavorite: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      setSeedSuccess(true);
      toast.success('Successfully imported 63 books!');
      setTimeout(() => setSeedSuccess(false), 5000);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'books');
    } finally {
      setSeeding(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-12 h-12 border-4 border-brand-100 dark:border-brand-800 border-t-brand-950 dark:border-t-brand-50 rounded-full animate-spin" />
    </div>
  );

  if (!profile) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <header className="flex flex-col md:flex-row items-center gap-10">
        <div className="relative group">
          <div className="w-40 h-40 rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white dark:border-brand-900">
            <img 
              src={profile.profilePicture || `https://ui-avatars.com/api/?name=${profile.firstName}+${profile.lastName}&size=200`} 
              alt="Profile" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          {isEditing && (
            <button className="absolute bottom-2 right-2 p-3 bg-brand-950 dark:bg-brand-500 text-white rounded-2xl shadow-lg hover:scale-110 transition-transform">
              <Camera size={20} />
            </button>
          )}
        </div>

        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
            <h1 className="text-5xl font-serif font-bold text-treehouse">
              {profile.firstName} {profile.lastName}
            </h1>
            {!isEditing ? (
              <button 
                onClick={() => setIsEditing(true)}
                className="w-fit mx-auto md:mx-0 px-4 py-2 bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-brand-100 dark:hover:bg-brand-950 transition-all"
              >
                <Edit3 size={16} />
                Edit Profile
              </button>
            ) : (
              <div className="flex gap-2 justify-center md:justify-start">
                <button 
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2 bg-brand-950 dark:bg-brand-500 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-brand-800 dark:hover:bg-brand-600 transition-all shadow-md disabled:opacity-50"
                >
                  <Save size={16} />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button 
                  onClick={() => { setIsEditing(false); setFormData(profile); }}
                  className="px-6 py-2 bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 rounded-xl text-sm font-bold hover:bg-brand-100 dark:hover:bg-brand-950 transition-all"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
          <p className="text-brand-950 dark:text-brand-400 text-lg font-medium mb-6">{profile.bio || 'No bio yet. Tell us about your reading life!'}</p>
          <div className="flex flex-wrap justify-center md:justify-start gap-6 text-sm font-bold text-brand-950 dark:text-brand-500 uppercase tracking-widest">
            <div className="flex items-center gap-2">
              <Mail size={16} />
              <span>{profile.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={16} />
              <span>Joined {format(profile.joinDate.toDate(), 'MMM yyyy')}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Info Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:col-span-2 space-y-8"
        >
          <div className="p-10 bg-white dark:bg-brand-900 rounded-[2.5rem] shadow-xl border border-brand-100 dark:border-brand-800">
            <h3 className="text-xl font-serif font-bold text-brand-950 dark:text-brand-50 mb-8 flex items-center gap-3">
              <User className="text-brand-400 dark:text-brand-500" />
              Personal Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-brand-400 dark:text-brand-500 uppercase tracking-widest">First Name</label>
                {isEditing ? (
                  <input 
                    value={formData.firstName} 
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full px-4 py-3 bg-brand-50/50 dark:bg-brand-950/50 border border-brand-100 dark:border-brand-800 rounded-xl focus:ring-2 focus:ring-brand-950 dark:focus:ring-brand-500 outline-none transition-all text-brand-950 dark:text-brand-50"
                  />
                ) : (
                  <p className="text-lg font-semibold text-brand-900 dark:text-brand-100">{profile.firstName}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-brand-400 dark:text-brand-500 uppercase tracking-widest">Last Name</label>
                {isEditing ? (
                  <input 
                    value={formData.lastName} 
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full px-4 py-3 bg-brand-50/50 dark:bg-brand-950/50 border border-brand-100 dark:border-brand-800 rounded-xl focus:ring-2 focus:ring-brand-950 dark:focus:ring-brand-500 outline-none transition-all text-brand-950 dark:text-brand-50"
                  />
                ) : (
                  <p className="text-lg font-semibold text-brand-900 dark:text-brand-100">{profile.lastName}</p>
                )}
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-bold text-brand-400 dark:text-brand-500 uppercase tracking-widest">Bio</label>
                {isEditing ? (
                  <textarea 
                    value={formData.bio} 
                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-3 bg-brand-50/50 dark:bg-brand-950/50 border border-brand-100 dark:border-brand-800 rounded-xl focus:ring-2 focus:ring-brand-950 dark:focus:ring-brand-500 outline-none transition-all resize-none text-brand-950 dark:text-brand-50"
                  />
                ) : (
                  <p className="text-brand-700 dark:text-brand-300 leading-relaxed">{profile.bio || 'No bio provided.'}</p>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Reading Goal Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-8"
        >
          <div className="p-10 bg-brand-950 dark:bg-brand-800 text-white rounded-[2.5rem] shadow-2xl relative overflow-hidden">
            <Award className="absolute -right-8 -bottom-8 text-white/10" size={160} />
            <div className="relative z-10">
              <h3 className="text-xl font-serif font-bold mb-8 flex items-center gap-3">
                <Award className="text-amber-400" />
                Reading Goal
              </h3>
              <div className="space-y-6">
                <div className="text-center">
                  <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2">Annual Target</p>
                  {isEditing ? (
                    <input 
                      type="number"
                      value={formData.readingGoal} 
                      onChange={(e) => setFormData(prev => ({ ...prev, readingGoal: parseInt(e.target.value) }))}
                      className="w-24 text-center bg-white/10 border border-white/20 rounded-xl text-3xl font-serif font-bold py-2 outline-none"
                    />
                  ) : (
                    <p className="text-6xl font-serif font-bold">{profile.readingGoal}</p>
                  )}
                  <p className="text-sm font-medium text-white/60 mt-2">Books per year</p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold text-white/50 uppercase tracking-widest">
                    <span>Progress</span>
                    <span>42%</span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400" style={{ width: '42%' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <ConfirmationModal
        isOpen={showSeedConfirm}
        title="Import Sample Collection?"
        message="This will add 63 curated books to your library. This is a great way to explore the app's features."
        confirmLabel="Import Collection"
        onConfirm={confirmSeedData}
        onCancel={() => setShowSeedConfirm(false)}
        variant="info"
      />
    </div>
  );
};
