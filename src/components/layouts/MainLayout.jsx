import React from 'react'
import Header from './Header'
import { Outlet } from 'react-router-dom'
import Footer from './Footer'
import NavBar from '../sidebar/NavBar'
import NoticeBar from '../sidebar/NoticeBar'
import GlobalWriteButton from '../common/GlobalWriteButton'
function MainLayout() {
  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <NavBar />                    
      
      <div className="flex-1 flex flex-col min-w-0 bg-background">
        {/* 🔴 Header에 클릭 시 실행할 함수(onMenuClick) 전달 */}
        <Header onMenuClick={() => setIsNoticeOpen(!isNoticeOpen)} />                
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 scrollbar-hide">
          <Outlet />
        </main>
      </div>

      <NoticeBar />                 
      
      <GlobalWriteButton />
    </div>
  );
}

export default MainLayout;