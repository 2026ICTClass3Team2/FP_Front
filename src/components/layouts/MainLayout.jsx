import React, { useState, useEffect } from 'react';
import Header from './Header';
import { Outlet } from 'react-router-dom';
import Footer from './Footer.jsx'; // 🔴 layouts 폴더 안에 같이 있으므로 ./ 입니다.
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
                <main className="flex-1 overflow-y-auto relative custom-scrollbar">
                    <Outlet />
                    <GlobalWriteButton />
                </main>
                <NoticeBar isOpen={isNoticeOpen} />
            </div>
            <Footer />
        </div>
    );
}

export default MainLayout;