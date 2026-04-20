import React, { useEffect, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { CKEditor } from '@ckeditor/ckeditor5-react';  // 4ck 멘토링 피드백 이후 설치하고 난 임포트 
import ClassicEditor from '@ckeditor/ckeditor5-build-classic'; // 4ck 멘토링 피드백 이후 설치하고 난 임포트 
import Modal from '../common/Modal';
import axios from 'axios'; 

const NoticeBar = ({ isOpen }) => {
    const [dynamicNotices, setDynamicNotices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedNotice, setSelectedNotice] = useState(null);

    const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
    const [newPost, setNewPost] = useState({
        id: null, // 수정 시 필요한 ID
        title: '',
        body: '',
        isHidden: false 
    });

    const fetchAllNotices = async () => {
        try {
            setIsLoading(true);
            let dbData = [];
            try {
                const dbResponse = await axios.get('http://localhost:8090/api/admin/notice/list');
                dbData = dbResponse.data.map(post => ({
                    id: `db-${post.id}`, 
                    tag: "공지",
                    title: post.title,
                    content: post.body,
                    date: new Date(post.createdAt).toLocaleDateString(),
                    views: `조회수 ${post.viewCount || 0}`,
                    isHidden: post.isHidden 
                }));
            } catch (dbErr) { console.error("DB 로드 실패:", dbErr); }

            // PDF 로직 (기존 상원님 코드 유지)
            pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
            const response = await fetch("/notice.pdf");
            const arrayBuffer = await response.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
            const pdf = await loadingTask.promise;
            const page = await pdf.getPage(1);
            const textContent = await page.getTextContent();
            const lines = {};
            textContent.items.forEach(item => {
                const y = Math.round(item.transform[5]);
                if (!lines[y]) lines[y] = [];
                lines[y].push({ x: item.transform[4], str: item.str.trim() });
            });
            const sortedLines = Object.keys(lines).sort((a, b) => b - a)
                .map(y => lines[y].sort((a, b) => a.x - b.x).map(obj => obj.str).join(" ").trim())
                .filter(line => line !== "" && line !== "관리자" && !line.includes("공지사항"));

            let pdfNotices = [];
            let tempNotice = null;
            const tagKeywords = ["일반", "이벤트", "가이드라인", "유지보수"];
            for (let i = 0; i < sortedLines.length; i++) {
                const line = sortedLines[i];
                if (tagKeywords.includes(line)) {
                    if (tempNotice) pdfNotices.push(tempNotice);
                    tempNotice = { id: `pdf-${pdfNotices.length}`, tag: line, title: "", content: "", date: "방금 전", views: "조회수 0", isHidden: false };
                    continue;
                }
                if (!tempNotice) continue;
                if (!tempNotice.title) tempNotice.title = line;
                else if (line.includes("전") || (line.includes("일") && line.length < 10)) tempNotice.date = line;
                else if (line.includes("조회수")) tempNotice.views = line;
                else if (!line.includes("내용을 확인합니다")) tempNotice.content += (tempNotice.content ? "\n" : "") + line;
            }
            if (tempNotice) pdfNotices.push(tempNotice);

            const visibleNotices = [...dbData, ...pdfNotices].filter(n => !n.isHidden);
            setDynamicNotices(visibleNotices.slice(0, 5)); 
        } catch (e) { console.error(e); } finally { setIsLoading(false); }
    };

    useEffect(() => { fetchAllNotices(); }, []);

    // 🔴 [수정/등록 통합 핸들러]
    const handleSaveNotice = async () => {
        if (!newPost.title || !newPost.body) return alert("제목과 내용을 입력해주세요!");
        const token = localStorage.getItem("accessToken") || localStorage.getItem("token");

        try {
            if (newPost.id) {
                // 수정 모드 (PUT)
                await axios.put(`http://localhost:8090/api/admin/notice/${newPost.id}`, {
                    title: newPost.title,
                    body: newPost.body
                }, { headers: { Authorization: `Bearer ${token}` } });
                alert("공지사항이 수정되었습니다! 🫡");
            } else {
                // 등록 모드 (POST)
                await axios.post('http://localhost:8090/api/admin/notice/write', {
                    title: newPost.title,
                    body: newPost.body
                }, { headers: { Authorization: `Bearer ${token}` } });
                alert("공지사항이 등록되었습니다! 🫡");
            }
            setIsWriteModalOpen(false);
            setNewPost({ id: null, title: '', body: '', isHidden: false });
            fetchAllNotices(); 
        } catch (error) {
            alert("처리 실패! 권한을 확인하세요.");
        }
    };

    // 🔴 [삭제 핸들러]
    const handleDeleteNotice = async (noticeId) => {
        if (!window.confirm("정말로 이 공지사항을 삭제하시겠습니까?")) return;
        const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
        const realId = noticeId.replace('db-', '');

        try {
            await axios.delete(`http://localhost:8090/api/admin/notice/${realId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("삭제되었습니다! 🗑️");
            setSelectedNotice(null);
            fetchAllNotices();
        } catch (err) { alert("삭제 실패!"); }
    };

    const handleNoticeClick = async (notice) => {
        if (notice.id.startsWith('db-')) {
            try {
                const realId = notice.id.replace('db-', '');
                await axios.patch(`http://localhost:8090/api/admin/notice/view/${realId}`);
            } catch (err) { console.error(err); }
        }
        setSelectedNotice(notice);
    };

    return (
        <aside className={`${isOpen ? 'w-80 opacity-100 border-l' : 'w-0 opacity-0 pointer-events-none'} transition-all duration-500 ease-in-out h-full bg-background overflow-hidden shrink-0`}>
            <div className="min-w-[320px] flex flex-col h-full">
                <div className="p-10 pb-6 flex justify-between items-center">
                    <h2 className="text-2xl font-black">공지사항</h2>
                    <button onClick={() => {
                        setNewPost({ id: null, title: '', body: '', isHidden: false });
                        setIsWriteModalOpen(true);
                    }} className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shadow-lg">+</button>
                </div>

                <div className="flex-1 flex flex-col gap-10 p-10 pt-0 overflow-y-auto scrollbar-hide">
                    {isLoading ? <div className="text-center font-bold animate-pulse">로딩 중...</div> : (
                        dynamicNotices.map((notice) => (
                            <div key={notice.id} onClick={() => handleNoticeClick(notice)} className="rounded-[32px] border p-8 hover:bg-accent/40 transition-all cursor-pointer group">
                                <span className="inline-block px-3 py-1 rounded-full bg-pink-50 text-pink-500 text-[11px] font-bold mb-5">{notice.tag}</span>
                                <h3 className="font-bold text-xl mb-4 line-clamp-2 group-hover:text-primary">{notice.title}</h3>
                                <div className="flex justify-between items-center text-[12px] text-muted-foreground pt-6 border-t border-dashed">
                                    <span>{notice.date}</span>
                                    <span className="text-primary font-bold">{notice.views}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* 등록/수정 모달 */}
            <Modal isOpen={isWriteModalOpen} onClose={() => setIsWriteModalOpen(false)} title={newPost.id ? "공지사항 수정하기" : "공지사항 등록하기"}>
                <div className="p-2 flex flex-col gap-6 w-full max-w-[600px] mx-auto">
                    <input type="text" className="w-full bg-accent/30 rounded-[20px] p-5 text-lg font-bold outline-none" placeholder="제목을 입력하세요" value={newPost.title} onChange={(e) => setNewPost({...newPost, title: e.target.value})} />
                    <CKEditor
                        editor={ ClassicEditor }
                        data={newPost.body}
                        onChange={ ( event, editor ) => {
                            const data = editor.getData();
                            setNewPost({ ...newPost, body: data });
                        } }
                    />
                    <button onClick={handleSaveNotice} className="w-full bg-primary text-white font-black py-5 rounded-[24px] text-lg">
                        {newPost.id ? "수정 완료" : "공지사항 등록하기"}
                    </button>
                </div>
            </Modal>

            {/* 상세보기 모달 (수정/삭제 버튼 추가) */}
            <Modal isOpen={!!selectedNotice} onClose={() => setSelectedNotice(null)} title="">
                {selectedNotice && (
                    <div className="p-4 pt-2">
                        <div className="flex justify-between items-center mb-6">
                            <span className="px-3 py-1 rounded-md bg-pink-50 text-pink-500 text-xs font-bold">{selectedNotice.tag}</span>
                            
                            {/* 🔴 관리자 버튼 영역 */}
                            {selectedNotice.id.startsWith('db-') && (
                                <div className="flex gap-4">
                                    <button onClick={() => {
                                        setNewPost({
                                            id: selectedNotice.id.replace('db-', ''),
                                            title: selectedNotice.title,
                                            body: selectedNotice.content,
                                            isHidden: false
                                        });
                                        setSelectedNotice(null);
                                        setIsWriteModalOpen(true);
                                    }} className="text-xs font-bold text-primary hover:underline">수정</button>
                                    <button onClick={() => handleDeleteNotice(selectedNotice.id)} className="text-xs font-bold text-red-500 hover:underline">삭제</button>
                                </div>
                            )}
                        </div>

                        <h2 className="text-3xl font-black mb-6">{selectedNotice.title}</h2>
                        <div className="pb-8 border-b border-dashed mb-10 text-sm text-muted-foreground">
                            관리자 {selectedNotice.date} | <span className="text-primary font-bold">👁️ {selectedNotice.views}</span>
                        </div>
                        <div className="text-[18px] leading-[2.2] ck-content" dangerouslySetInnerHTML={{ __html: selectedNotice.content }} />
                    </div>
                )}
            </Modal>
        </aside>
    );
};

export default NoticeBar;