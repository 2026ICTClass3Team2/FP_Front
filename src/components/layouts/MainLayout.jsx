import React, { useEffect, useState } from 'react'
import Header from './Header'
import { Outlet } from 'react-router-dom'
import Footer from './Footer'
import NavBar from '../sidebar/NavBar'
import AdminNavBar from '../sidebar/AdminNavBar'
import NoticeBar from '../sidebar/NoticeBar'
import GlobalWriteButton from '../common/GlobalWriteButton'
import { useAuth } from '../sidebar/AuthContext'
import useThemeStore from '../../../useThemeStore'

function MainLayout() {
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const { currentUser } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
      {currentUser?.role === 'admin'
        ? <AdminNavBar collapsed={!sidebarOpen} />
        : <NavBar collapsed={!sidebarOpen} />}
      
      <div className="flex-1 flex flex-col min-w-0 bg-background">
        <Header onToggleSidebar={() => setSidebarOpen(o => !o)} sidebarOpen={sidebarOpen} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 scrollbar-hide">
          <Outlet />
        </main>
      </div>

      {/* <NoticeBar /> */}
      
      {/* Global write button with popup options */}
      <GlobalWriteButton />
    </div>
  )
}

export default MainLayout