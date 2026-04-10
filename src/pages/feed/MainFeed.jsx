import React, { useState, useRef } from 'react'
import Modal from '../../components/common/Modal';
import FeedCard from '../../components/feed/FeedCard';
import FeedList from '../../components/feed/FeedList';

const MainFeed = () => {
    const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
    const feedListRef = useRef();

    const handleWriteClick = () => setIsWriteModalOpen(true);
    const handleCloseModal = () => setIsWriteModalOpen(false);

    const handlePostCreated = () => {
        handleCloseModal();
        // FeedList의 새로고침 함수를 호출
        feedListRef.current?.refresh();
    };
    
    return (
        <div className="w-full bg-background min-h-screen">
            {/* 무한 스크롤, 피드 카드 렌더링을 담당하는 FeedList 컴포넌트 */}
            <FeedList ref={feedListRef} />

            {/* 작성버튼 (FAB) - 피드 영역(max-w-2xl) 우측 하단에 딱 맞춰 고정 */}
            <div className="fixed bottom-10 left-0 right-0 w-full max-w-2xl mx-auto flex justify-end px-4 pointer-events-none z-50">
                <button 
                    onClick={handleWriteClick} 
                    className="w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center text-3xl font-light pointer-events-auto"
                >
                    +
                </button>
            </div>

            <Modal title="새 게시물 작성" isOpen={isWriteModalOpen} onClose={handleCloseModal}>
                <FeedCard onClose={handleCloseModal} onPostCreated={handlePostCreated} /> 
            </Modal>
        </div>
    );
};
export default MainFeed