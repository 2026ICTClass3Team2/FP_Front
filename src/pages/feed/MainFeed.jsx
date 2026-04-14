import React, { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom';
import Modal from '../../components/common/Modal';
import FeedCard from '../../components/feed/FeedCard';
import FeedList from '../../components/feed/FeedList';

const MainFeed = () => {
    const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
    const [editingPost, setEditingPost] = useState(null); // 수정할 게시글 데이터 상태
    const feedListRef = useRef();
    const [searchParams, setSearchParams] = useSearchParams();

    // URL 파라미터로 모달 열기
    useEffect(() => {
        if (searchParams.get('write') === 'feed') {
            setEditingPost(null);
            setIsWriteModalOpen(true);
            // URL에서 파라미터 제거 (React Router 상태 동기화)
            searchParams.delete('write');
            setSearchParams(searchParams, { replace: true });
        }
    }, [searchParams, setSearchParams]);

    // 새 글 작성 버튼 클릭 핸들러
    const handleWriteClick = () => {
        setEditingPost(null); // 새 글 작성이므로 수정 상태는 null로 초기화
        setIsWriteModalOpen(true);
    };
    // 수정 버튼 클릭 핸들러 (FeedList로부터 전달받음)
    const handleEditClick = (post) => {
        setEditingPost(post); // 수정할 포스트 데이터 설정
        setIsWriteModalOpen(true);
    };
    const handleCloseModal = () => setIsWriteModalOpen(false);

    // 작성/수정 완료 후 피드 새로고침 핸들러
    const handlePostCreated = () => {
        handleCloseModal();
        feedListRef.current?.refresh();
    };
    
    return (
        <div className="w-full bg-background min-h-screen">
            {/* 무한 스크롤, 피드 카드 렌더링을 담당하는 FeedList 컴포넌트 */}
            <FeedList ref={feedListRef} onEditClick={handleEditClick} />

            <Modal title={editingPost ? "게시글 수정" : "새 게시물 작성"} isOpen={isWriteModalOpen} onClose={handleCloseModal}>
                <FeedCard postToEdit={editingPost} onClose={handleCloseModal} onPostCreated={handlePostCreated} /> 
            </Modal>
        </div>
    );
};
export default MainFeed