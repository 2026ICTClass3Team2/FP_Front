import React, { useState, useEffect } from 'react';
import Header from './Header';
import { Outlet } from 'react-router-dom';
import Footer from './Footer.jsx'; 
import NavBar from '../sidebar/NavBar';
import NoticeBar from '../sidebar/NoticeBar';
import GlobalWriteButton from '../common/GlobalWriteButton';
import useThemeStore from "../../../useThemeStore";

function MainLayout() {
    const [isNoticeOpen, setIsNoticeOpen] = useState(true);
    const isDarkMode = useThemeStore((state) => state.isDarkMode);

    useEffect(() => {
        const html = document.documentElement;
        if (isDarkMode) html.classList.add('dark');
        else html.classList.remove('dark');
    }, [isDarkMode]);

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-background text-foreground">
            <Header onToggleNotice={() => setIsNoticeOpen(!isNoticeOpen)} />
            <div className="flex flex-1 overflow-hidden">
                <NavBar />
                
              
                <main className="flex-1 overflow-y-auto relative custom-scrollbar invisible">
                    <Outlet />
                    <GlobalWriteButton />
                </main>

                {/* 우측 공지사항 바 (세로 정렬 유지, 비정형/정형 5개 데이터) */}
                <NoticeBar isOpen={isNoticeOpen} />
            </div>
            <Footer />
        </div>
    );
}

export default MainLayout;