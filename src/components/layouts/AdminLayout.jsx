import React, { useEffect } from 'react'
import Header from './Header'
import { Outlet } from 'react-router-dom'
import AdminNavBar from '../sidebar/AdminNavBar'
import GlobalWriteButton from '../common/GlobalWriteButton'
import useThemeStore from '../../../useThemeStore'

function AdminLayout() {
  const isDarkMode = useThemeStore((state) => state.isDarkMode);

  useEffect(() => {
    const html = document.documentElement;
    if (isDarkMode) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <AdminNavBar />
      
      <div className="flex-1 flex flex-col min-w-0 bg-background">
        <Header />                
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 scrollbar-hide">
          <Outlet />
        </main>
      </div>

      <GlobalWriteButton />
    </div>
  )
}

export default AdminLayout