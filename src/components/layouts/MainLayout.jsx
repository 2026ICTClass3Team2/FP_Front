import React from 'react'
import Header from './Header'
import { Outlet } from 'react-router-dom'
import Footer from './Footer'
import NavBar from '../sidebar/NavBar'
import NoticeBar from '../sidebar/NoticeBar'
function MainLayout() {
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
      
      
      <button className="global-chat-btn">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2.25"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2 2 2 0 01-2-2 2 2 0 012-2 2 2 0 01-2-2z"
          />
        </svg>
        
      </button>
    </div>
  )
}

export default MainLayout