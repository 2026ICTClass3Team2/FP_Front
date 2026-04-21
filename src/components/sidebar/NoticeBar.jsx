// 네 주석은 그대로 유지하고, CRUD만 실제 DB 연동으로 교체한 버전

import React, { useEffect, useState, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import Modal from '../common/Modal';
import axios from 'axios';

function MyCustomUploadAdapterPlugin(editor) {
    editor.plugins.get('FileRepository').createUploadAdapter = (loader) => {
        return {
            upload() {
                return loader.file.then(file => new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve({ default: reader.result });
                    reader.onerror = error => reject(error);
                    reader.readAsDataURL(file);
                }));
            }
        };
    };
}

const NoticeBar = ({ isOpen }) => {
    const [dynamicNotices, setDynamicNotices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedNotice, setSelectedNotice] = useState(null);
    const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
    
    // UI 전용 수정을 위해 uiId를 추적 (수정 시 id 보존용)
    const [newPost, setNewPost] = useState({
        uiId: null,
        postId: null,
        title: '',
        body: ''
    });
    
    const [menuOpenId, setMenuOpenId] = useState(null);
    const menuRef = useRef(null);

    // 메뉴 외부 클릭 시 닫기
    useEffect(() => {
        const handleOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenuOpenId(null);
            }
        };
        if (menuOpenId) window.addEventListener('mousedown', handleOutside);
        return () => window.removeEventListener('mousedown', handleOutside);
    }, [menuOpenId]);

    const fetchAllData = async () => {
        try {
            setIsLoading(true);
            setMenuOpenId(null);

            // 1. PDF 데이터 (고정 5개 파싱)
            pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
            const pdfResponse = await fetch("/notice.pdf");
            const arrayBuffer = await pdfResponse.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
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

            for (let line of sortedLines) {
                if (tagKeywords.includes(line)) {
                    if (tempNotice) pdfNotices.push(tempNotice);

                    tempNotice = {
                        id: `pdf-${pdfNotices.length}-${Math.random()}`,
                        tag: line,
                        title: "",
                        content: "",
                        date: "방금 전",
                        views: 0
                    };
                    continue;
                }

                if (!tempNotice) continue;

                if (!tempNotice.title) tempNotice.title = line;
                else if (!line.includes("내용을 확인합니다")) {
                    tempNotice.content += (tempNotice.content ? "\n" : "") + line;
                }
            }

            if (tempNotice) pdfNotices.push(tempNotice);

            const fixedPdfNotices = pdfNotices.slice(0, 5);

            // 2. 초기 리스트 데이터 (DB로부터 로드)
            let dbNotices = [];

            try {
                const res = await axios.get('http://localhost:8090/api/admin/notice/list');

                dbNotices = res.data.map((p) => ({
                    id: `db-${p.id}`,
                    postId: p.id,
                    tag: "공지",
                    title: p.title,
                    content: p.body,
                    date: "방금 전",
                    views: p.viewCount || 0
                }));

            } catch (err) {
                console.error("DB 로딩 실패");
            }

            // DB 데이터 + PDF 5개 병합 (최초 7개 수준 유지)
            setDynamicNotices([...dbNotices, ...fixedPdfNotices]);

        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    // 🔴 1. 리스트에서 즉각 삭제 (UI 전용)
    const handleDelete = async (e, notice) => {
        e.stopPropagation();

        if (!window.confirm("항목을 삭제하시겠습니까?")) return;

        try {
            await axios.delete(
                `http://localhost:8090/api/admin/notice/${notice.postId}`
            );

            alert("삭제 완료");
            fetchAllData();

        } catch (err) {
            alert("삭제 실패");
        }

        setMenuOpenId(null);
    };

    // 🔴 2. 수정 버튼 클릭
    const handleEditClick = (e, notice) => {
        e.stopPropagation();

        setNewPost({
            uiId: notice.id,
            postId: notice.postId,
            title: notice.title,
            body: notice.content
        });

        setIsWriteModalOpen(true);
        setMenuOpenId(null);
    };

    // 🔴 3. 저장 로직 (조건부 포함: 제목 10자, 내용 20자)
    const handleSaveToUI = async () => {
        const { title, body, postId } = newPost;

        // 제목 조건 검사
        if (title.trim().length < 10) {
            return alert("제목은 10자 이상 입력해주세요. (현재: " + title.trim().length + "자)");
        }

        // 내용 조건 검사 (HTML 태그 제거 후 순수 텍스트만 계산)
        const pureText = body.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').trim();

        if (pureText.length < 20) {
            return alert("내용은 20자 이상 입력해주세요. (현재: " + pureText.length + "자)");
        }

        try {
            if (postId) {
                // 수정 모드
                await axios.put(
                    `http://localhost:8090/api/admin/notice/${postId}`,
                    { title, body }
                );

                alert("수정이 완료되었습니다.");

            } else {
                // 등록 모드
                await axios.post(
                    "http://localhost:8090/api/admin/notice",
                    { title, body }
                );

                alert("등록이 완료되었습니다.");
            }

            fetchAllData();

            setIsWriteModalOpen(false);
            setNewPost({
                uiId: null,
                postId: null,
                title: '',
                body: ''
            });

        } catch (err) {
            alert("저장 실패");
        }
    };

    return (
        <>
            <aside className={`${isOpen ? 'w-80 opacity-100 border-l' : 'w-0 opacity-0'} transition-all duration-500 h-full bg-background flex flex-col shrink-0`}>
                <div className="p-10 pb-6 flex justify-between items-center">
                    <h2 className="text-2xl font-black">공지사항</h2>

                    <button 
                        onClick={() => {
                            setNewPost({
                                uiId: null,
                                postId: null,
                                title: '',
                                body: ''
                            });
                            setIsWriteModalOpen(true);
                        }} 
                        className="w-10 h-10 rounded-full bg-primary text-white shadow-lg transition-transform hover:scale-110"
                    >
                        +
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-hide p-10 pt-0">
                    <div className="flex flex-col gap-8">

                        {isLoading ? (
                            <div className="text-center py-20 animate-pulse font-bold">
                                로딩 중...
                            </div>
                        ) : (
                            dynamicNotices.map((notice) => (
                                <div
                                    key={notice.id}
                                    className="relative group rounded-[32px] border p-8 hover:bg-accent/40 cursor-pointer transition-all shadow-sm"
                                    onClick={() => {
                                        if (!menuOpenId) setSelectedNotice(notice);
                                    }}
                                >
                                    
                                    {/* DB 접두사 데이터만 수정/삭제 버튼 활성화 */}
                                    {notice.id.includes('db') && (
                                        <div className="absolute top-6 right-6 z-[40]">

                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setMenuOpenId(
                                                        menuOpenId === notice.id
                                                            ? null
                                                            : notice.id
                                                    );
                                                }}
                                                className="p-2 hover:bg-gray-200 rounded-full font-bold text-xl"
                                            >
                                                ⋮
                                            </button>

                                            {menuOpenId === notice.id && (
                                                <div
                                                    ref={menuRef}
                                                    className="absolute right-0 mt-2 w-28 bg-white border border-border rounded-xl shadow-2xl z-[50] overflow-hidden"
                                                >
                                                    <button
                                                        onClick={(e) => handleEditClick(e, notice)}
                                                        className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 border-b"
                                                    >
                                                        수정
                                                    </button>

                                                    <button
                                                        onClick={(e) => handleDelete(e, notice)}
                                                        className="w-full px-4 py-3 text-left text-sm hover:bg-red-50 text-red-500 font-bold"
                                                    >
                                                        삭제
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div>
                                        <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-bold mb-4 ${notice.id.includes('db') ? 'bg-blue-50 text-blue-500' : 'bg-pink-50 text-pink-500'}`}>
                                            {notice.tag}
                                        </span>

                                        <h3 className="font-bold text-xl mb-4 line-clamp-2 leading-tight">
                                            {notice.title}
                                        </h3>

                                        <div className="flex justify-between items-center text-[12px] text-muted-foreground pt-4 border-t border-dashed">
                                            <span>{notice.date}</span>
                                            <span className="text-primary font-bold">
                                                조회수 {notice.views}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}

                    </div>
                </div>
            </aside>

            {/* 작성 및 수정 모달 */}
            <Modal isOpen={isWriteModalOpen} onClose={() => setIsWriteModalOpen(false)}>
                <div className="p-8 flex flex-col gap-6">

                    <div className="flex justify-between items-end border-b pb-4">
                        <h2 className="text-2xl font-black">
                            {newPost.postId ? "공지사항 수정" : "새 공지사항 등록"}
                        </h2>

                        <span className="text-[10px] text-red-500 font-bold">
                            제목 10자 / 내용 20자 이상 필수
                        </span>
                    </div>
                    
                    <input 
                        className="w-full bg-accent/30 p-4 rounded-xl font-bold border focus:outline-none focus:ring-2 focus:ring-primary/50" 
                        value={newPost.title} 
                        placeholder="제목을 입력하세요" 
                        onChange={(e) => setNewPost({...newPost, title: e.target.value})} 
                    />
                    
                    <div className="min-h-[300px] border rounded-xl overflow-hidden">
                        <CKEditor 
                            editor={ClassicEditor} 
                            data={newPost.body}
                            config={{
                                placeholder: '내용을 입력하세요',
                                extraPlugins: [MyCustomUploadAdapterPlugin],
                                toolbar: [
                                    'heading', '|', 'bold', 'italic', 'link',
                                    'bulletedList', 'numberedList',
                                    'blockQuote', 'insertTable',
                                    'undo', 'redo'
                                ]
                            }}
                            onChange={(e, ed) =>
                                setNewPost({
                                    ...newPost,
                                    body: ed.getData()
                                })
                            }
                        />
                    </div>

                    <button 
                        onClick={handleSaveToUI} 
                        className="w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg text-lg"
                    >
                        {newPost.postId ? "수정 완료" : "등록 완료"}
                    </button>
                </div>
            </Modal>

            {/* 상세보기 모달 */}
            <Modal isOpen={!!selectedNotice} onClose={() => setSelectedNotice(null)}>
                {selectedNotice && (
                    <div className="p-8 max-h-[80vh] overflow-y-auto">
                        <span className="px-3 py-1 rounded-full bg-pink-50 text-pink-500 text-xs font-bold mb-6 inline-block">
                            {selectedNotice.tag}
                        </span>

                        <h2 className="text-3xl font-black mb-6">
                            {selectedNotice.title}
                        </h2>

                        <div
                            className="prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{
                                __html: selectedNotice.content.replace(/\n/g, '<br/>')
                            }}
                        />
                    </div>
                )}
            </Modal>
        </>
    );
};

export default NoticeBar;