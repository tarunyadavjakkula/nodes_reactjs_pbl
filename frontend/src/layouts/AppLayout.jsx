import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Sidebar from '../components/common/Sidebar';

export const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col transition-colors">
      {/* Sidebar navigation */}
      <Sidebar isOpen={sidebarOpen} closeSidebar={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex flex-col flex-1 min-w-0">
        <Navbar toggleSidebar={() => setSidebarOpen((prev) => !prev)} />
        
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-200">
          <Outlet />
        </main>

        <footer className="py-4 px-6 border-t border-slate-200 dark:border-slate-800/80 text-center text-xs text-slate-400">
          SpendWise – Smart Personal Expense and Budget Management System • PBL Project
        </footer>
      </div>
    </div>
  );
};

export default AppLayout;

