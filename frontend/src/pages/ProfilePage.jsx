import React from 'react';
import { User, KeyRound, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const ProfilePage = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">User Profile</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Manage personal details, credentials, and security preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-2xl shadow-lg shadow-indigo-600/30 mb-4">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">{user?.name}</h2>
          <p className="text-xs text-slate-500">{user?.email}</p>
          <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-[11px] font-semibold">
            {user?.currency || 'USD'} Account
          </div>
        </div>

        <div className="md:col-span-2 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Account Information</h3>
          <p className="text-xs text-slate-500">Edit profile details, password updates, and session preferences will render here.</p>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

