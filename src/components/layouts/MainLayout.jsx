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
          <Footer />
        </main>
      </div>

      <NoticeBar />                 
      
      
      <button className="global-chat-btn">
        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#e5e5e5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bot-message-square-icon lucide-bot-message-square"><path d="M12 6V2H8"/><path d="M15 11v2"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="M20 16a2 2 0 0 1-2 2H8.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 4 20.286V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2z"/><path d="M9 11v2"/></svg>
      </button>
    </div>
  )
}

export default MainLayout