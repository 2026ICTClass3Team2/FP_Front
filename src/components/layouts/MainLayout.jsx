import React, { useEffect, useState } from 'react'
import Header from './Header'
import { Outlet, useLocation } from 'react-router-dom'
import Footer from './Footer'
import NavBar from '../sidebar/NavBar'
import AdminNavBar from '../sidebar/AdminNavBar'
import GlobalWriteButton from '../common/GlobalWriteButton'
import { useAuth } from '../sidebar/AuthContext'
import useThemeStore from '../../../useThemeStore'
import { usePostModalStore } from '../../stores/postModalStore'
import CommunityPostDetail from '../feed/CommunityPostDetail'
import QnADetailModal from '../question/QnADetailModal'

function MainLayout() {
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const { currentUser } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 1024);
  const { postId, qnaId, commentId, close } = usePostModalStore();
  const location = useLocation();

  useEffect(() => {
    const html = document.documentElement;
    if (isDarkMode) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (window.innerWidth < 1024) setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex h-dvh bg-background text-foreground overflow-hidden">
      {/* Mobile backdrop overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {currentUser?.role === 'admin'
        ? <AdminNavBar collapsed={!sidebarOpen} />
        : <NavBar collapsed={!sidebarOpen} />}

      <div className="flex-1 flex flex-col min-w-0 bg-background">
        <Header onToggleSidebar={() => setSidebarOpen(o => !o)} sidebarOpen={sidebarOpen} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 scrollbar-hide">
          <Outlet />
        </main>
      </div>

      {/* Global write button with popup options */}
      <GlobalWriteButton />

      {postId && (
        <CommunityPostDetail
          post={{ postId }}
          autoScrollToComment={!!commentId}
          onClose={close}
        />
      )}
      {qnaId && (
        <QnADetailModal
          post={{ qnaId }}
          autoScrollToComment={!!commentId}
          onClose={close}
        />
      )}
    </div>
  )
}

export default MainLayout