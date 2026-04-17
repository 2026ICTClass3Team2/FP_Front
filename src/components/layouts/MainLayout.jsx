import React, { useEffect } from 'react'
import Header from './Header'
import { Outlet } from 'react-router-dom'
import Footer from './Footer'
import NavBar from '../sidebar/NavBar'
import NoticeBar from '../sidebar/NoticeBar'
import GlobalWriteButton from '../common/GlobalWriteButton'
import useThemeStore from '../../../useThemeStore'

function MainLayout() {
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
      <NavBar />                    
      
      <div className="flex-1 flex flex-col min-w-0 bg-background">  {/* bg-white → bg-background로만 통일 (색상 동일) */}
        <Header />                
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 scrollbar-hide">
          <Outlet />
          
        </main>
      </div>

      <NoticeBar />                 
      
      {/* Global write button with popup options */}
      <GlobalWriteButton />
    </div>
  )
}

export default MainLayout