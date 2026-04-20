import React, { useEffect, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import Modal from '../common/Modal';
import axios from 'axios';

const NoticeBar = ({ isOpen }) => {
    const [dynamicNotices, setDynamicNotices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedNotice, setSelectedNotice] = useState(null);
    const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
    const [newPost, setNewPost] = useState({ id: null, title: '', body: '', isHidden: false });

    const fetchAllNotices = async () => {
        try {
            setIsLoading(true);
            const dbResponse = await axios.get('http://localhost:8090/api/admin/notice/list');
            const dbData = dbResponse.data.map(post => ({
                id: `db-${post.id}`,
                tag: "공지",
                title: post.title,
                content: post.body,
                date: new Date(post.createdAt).toLocaleDateString(),
                views: `조회수 ${post.viewCount || 0}`,
            }));
            setDynamicNotices(dbData.slice(0, 5));
        } catch (e) { console.error(e); } finally { setIsLoading(false); }
    };

    useEffect(() => { fetchAllNotices(); }, []);

    const handleSaveNotice = async () => {
        const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
        try {
            if (newPost.id) {
                await axios.put(`http://localhost:8090/api/admin/notice/${newPost.id}`, { title: newPost.title, body: newPost.body }, { headers: { Authorization: `Bearer ${token}` } });
            } else {
                await axios.post('http://localhost:8090/api/admin/notice/write', { title: newPost.title, body: newPost.body }, { headers: { Authorization: `Bearer ${token}` } });
            }
            setIsWriteModalOpen(false);
            fetchAllNotices();
        } catch (e) { alert("권한이 없습니다!"); }
    };

    const handleDeleteNotice = async (id) => {
        if (!window.confirm("삭제할까요?")) return;
        const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
        try {
            await axios.delete(`http://localhost:8090/api/admin/notice/${id.replace('db-', '')}`, { headers: { Authorization: `Bearer ${token}` } });
            setSelectedNotice(null);
            fetchAllNotices();
        } catch (e) { alert("삭제 실패!"); }
    };

    return (
        <aside className={`${isOpen ? 'w-80 opacity-100 border-l' : 'w-0 opacity-0 pointer-events-none'} transition-all duration-500 ease-in-out h-full bg-background overflow-hidden shrink-0`}>
            <div className="min-w-[320px] flex flex-col h-full">
                <div className="p-10 pb-6 flex justify-between items-center">
                    <h2 className="text-2xl font-black">공지사항</h2>
                    <button onClick={() => { setNewPost({ id: null, title: '', body: '' }); setIsWriteModalOpen(true); }} className="w-10 h-10 rounded-full bg-primary text-white shadow-lg">+</button>
                </div>
                <div className="flex-1 flex flex-col gap-6 p-10 pt-0 overflow-y-auto scrollbar-hide">
                    {dynamicNotices.map((notice) => (
                        <div key={notice.id} onClick={() => setSelectedNotice(notice)} className="rounded-[32px] border p-8 hover:bg-accent/40 cursor-pointer shadow-sm">
                            <span className="inline-block px-3 py-1 rounded-full bg-pink-50 text-pink-500 text-[11px] font-bold mb-4">{notice.tag}</span>
                            <h3 className="font-bold text-xl leading-tight line-clamp-2">{notice.title}</h3>
                            <div className="flex justify-between items-center text-[12px] pt-4 mt-4 border-t border-dashed border-border">
                                <span>{notice.date}</span>
                                <span className="text-primary font-bold">{notice.views}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <Modal isOpen={isWriteModalOpen} onClose={() => setIsWriteModalOpen(false)} title={newPost.id ? "수정" : "등록"}>
                <div className="p-4 flex flex-col gap-4">
                    <input className="w-full bg-accent/30 p-4 rounded-xl font-bold" value={newPost.title} onChange={(e) => setNewPost({...newPost, title: e.target.value})} />
                    <CKEditor editor={ClassicEditor} data={newPost.body} onChange={(e, editor) => setNewPost({...newPost, body: editor.getData()})} />
                    <button onClick={handleSaveNotice} className="w-full bg-primary text-white py-4 rounded-xl font-bold">확인</button>
                </div>
            </Modal>

            <Modal isOpen={!!selectedNotice} onClose={() => setSelectedNotice(null)}>
                {selectedNotice && (
                    <div className="p-6">
                        <div className="flex justify-between mb-4">
                            <span className="text-pink-500 font-bold">{selectedNotice.tag}</span>
                            {selectedNotice.id.startsWith('db-') && (
                                <div className="flex gap-2">
                                    <button onClick={() => { setNewPost({ id: selectedNotice.id.replace('db-', ''), title: selectedNotice.title, body: selectedNotice.content }); setSelectedNotice(null); setIsWriteModalOpen(true); }} className="text-primary text-sm font-bold">수정</button>
                                    <button onClick={() => handleDeleteNotice(selectedNotice.id)} className="text-red-500 text-sm font-bold">삭제</button>
                                </div>
                            )}
                        </div>
                        <h2 className="text-2xl font-black mb-4">{selectedNotice.title}</h2>
                        <div className="ck-content leading-relaxed" dangerouslySetInnerHTML={{ __html: selectedNotice.content }} />
                    </div>
                )}
            </Modal>
        </aside>
    );
};

export default NoticeBar;