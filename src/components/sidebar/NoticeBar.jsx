import React, { useEffect, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import Modal from '../common/Modal';
import axios from 'axios'; 

const NoticeBar = () => {
    const [dynamicNotices, setDynamicNotices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedNotice, setSelectedNotice] = useState(null);

    useEffect(() => {
        const fetchPdfText = async () => {
            try {
                // 1. PDF 파싱 엔진 설정
                pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

                const response = await fetch("/notice.pdf");
                const arrayBuffer = await response.arrayBuffer();
                const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
                const pdf = await loadingTask.promise;
                const page = await pdf.getPage(1);
                const textContent = await page.getTextContent();
                
                // 2. 비정형 -> 반정형 데이터 변환 (상원님 로직 유지)
                const lines = {};
                textContent.items.forEach(item => {
                    const y = Math.round(item.transform[5]);
                    if (!lines[y]) lines[y] = [];
                    lines[y].push({ x: item.transform[4], str: item.str.trim() });
                });

                const sortedLines = Object.keys(lines)
                    .sort((a, b) => b - a)
                    .map(y => lines[y].sort((a, b) => a.x - b.x).map(obj => obj.str).join(" ").trim())
                    .filter(line => line !== "" && line !== "관리자" && !line.includes("공지사항"));

                // 3. 정형 데이터(pdfNotices) 추출
                let pdfNotices = [];
                let tempNotice = null;
                const tagKeywords = ["일반", "이벤트", "가이드라인", "유지보수"];

                for (let i = 0; i < sortedLines.length; i++) {
                    const line = sortedLines[i];
                    if (tagKeywords.includes(line)) {
                        if (tempNotice) pdfNotices.push(tempNotice);
                        tempNotice = {
                            id: `pdf-${pdfNotices.length}`,
                            tag: line,
                            title: "",
                            content: "",
                            date: "방금 전",
                            views: "조회수 0"
                        };
                        continue;
                    }
                    if (!tempNotice) continue;
                    if (!tempNotice.title) {
                        tempNotice.title = line;
                    } else if (line.includes("전") || (line.includes("일") && line.length < 10)) {
                        tempNotice.date = line;
                    } else if (line.includes("조회수")) {
                        tempNotice.views = line;
                    } else if (!line.includes("내용을 확인합니다")) {
                        tempNotice.content += (tempNotice.content ? "\n" : "") + line;
                    }
                }
                if (tempNotice) pdfNotices.push(tempNotice);

                // 4. ★ DB 전송: 오직 PDF 데이터 5개만 보냄 ★
                // 여기서 다른 게시글 데이터를 만지는 코드는 싹 다 지웠습니다.
                pdfNotices.forEach(async (notice) => {
                    try {
                        await axios.post("http://localhost:8090/api/notices/add", {
                            title: notice.title,
                            body: notice.content,
                            authorName: "관리자",
                            contentType: "notice", // DB 분류용 딱지
                            sourceType: "internal",
                            status: "active",
                            viewCount: 0,
                            commentCount: 0,
                            likeCount: 0,
                            dislikeCount: 0,
                            isHidden: false,
                            isSolved: false,
                            channelId: 1
                        });
                    } catch (err) {
                        // 중복 시 무시
                    }
                });

                // 5. ★ 화면 반영: 오직 오른쪽 바 전용 상태만 업데이트 ★
                setDynamicNotices(pdfNotices.slice(0, 5));

            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPdfText();
    }, []);

    const handleNoticeClick = (notice) => setSelectedNotice(notice);
    const currentNoticeData = dynamicNotices.find(n => n.id === selectedNotice?.id);

    return (
        <aside className="w-80 border-l border-border flex flex-col h-full bg-background shrink-0">
            <div className="p-10 pb-6">
                <h2 className="text-2xl font-black tracking-tighter">공지사항</h2>
            </div>
            <div className="flex-1 flex flex-col gap-10 p-10 pt-0 overflow-y-auto scrollbar-hide">
                {isLoading ? (
                    <div className="text-sm text-muted-foreground animate-pulse text-center mt-10 font-bold">로딩 중...</div>
                ) : (
                    dynamicNotices.map((notice) => (
                        <div 
                            key={notice.id} 
                            className="rounded-[32px] border border-border p-8 hover:bg-accent/40 transition-all cursor-pointer group shadow-sm"
                            onClick={() => handleNoticeClick(notice)}
                        >
                            <span className="inline-block px-3 py-1 rounded-full bg-pink-50 text-pink-500 text-[11px] font-bold mb-5">{notice.tag}</span>
                            <h3 className="font-bold text-xl mb-4 line-clamp-2 group-hover:text-primary transition-colors leading-tight">{notice.title}</h3>
                            <p className="text-[14px] text-muted-foreground leading-relaxed line-clamp-2 mb-8 whitespace-pre-line">{notice.content}</p>
                            <div className="flex justify-between items-center text-[12px] text-muted-foreground pt-6 border-t border-dashed">
                                <span>{notice.date}</span>
                                <span className="text-primary font-bold text-sm">{notice.views}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <Modal isOpen={!!selectedNotice} onClose={() => setSelectedNotice(null)} title="">
                {currentNoticeData && (
                    <div className="p-4 pt-2">
                        <span className="px-3 py-1 rounded-md bg-pink-50 text-pink-500 text-xs font-bold mb-6 inline-block">{currentNoticeData.tag}</span>
                        <h2 className="text-3xl font-black mb-6 leading-tight tracking-tight">{currentNoticeData.title}</h2>
                        <div className="pb-8 border-b border-dashed mb-10 text-sm text-muted-foreground">
                            관리자 {currentNoticeData.date} | <span className="text-primary font-bold">👁️ {currentNoticeData.views}</span>
                        </div>
                        <div className="text-[18px] leading-[2.2] whitespace-pre-line">{currentNoticeData.content}</div>
                        <div className="pt-20 text-sm text-muted-foreground italic border-t border-dashed mt-10">감사합니다. Dead Bug 운영팀 드림.</div>
                    </div>
                )}
            </Modal>
        </aside>
    );
};

export default NoticeBar;