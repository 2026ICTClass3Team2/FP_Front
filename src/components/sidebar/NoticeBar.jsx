import React, { useEffect, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import Modal from '../common/Modal';

const NoticeBar = () => {
  const [dynamicNotices, setDynamicNotices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNotice, setSelectedNotice] = useState(null);

  useEffect(() => {
    const fetchPdfText = async () => {
      try {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
        const response = await fetch("/notice.pdf");
        const arrayBuffer = await response.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);
        const textContent = await page.getTextContent();
        
        // [1] PDF 텍스트 추출 로직
        const lines = {};
        textContent.items.forEach(item => {
          const y = Math.round(item.transform[5]);
          if (!lines[y]) lines[y] = [];
          lines[y].push({ x: item.transform[4], str: item.str.trim() });
        });

        const sortedLines = Object.keys(lines)
          .sort((a, b) => b - a)
          .map(y => lines[y].sort((a, b) => a.x - b.x).map(obj => obj.str).join(" ").trim())
          .filter(line => line !== "" && line !== "관리자");

        const noticeData = sortedLines;

        let pdfNotices = [];
        let tempNotice = null;

        for (let i = 0; i < noticeData.length; i++) {
          const line = noticeData[i];
          const isTag = line === "일반" || line === "이벤트" || line === "가이드라인";

          if (isTag || (!tempNotice && line.length > 2)) {
            if (tempNotice) pdfNotices.push(tempNotice);
            tempNotice = { 
              id: `pdf-${pdfNotices.length}`, 
              tag: isTag ? line : "일반", 
              title: "", 
              content: "", 
              date: "1일 전", 
              views: "조회수 1,234" 
            };
            if (isTag) continue;
          }
          if (!tempNotice) continue;

          if (!tempNotice.title) {
            tempNotice.title = line;
          } else if (line.includes("전") || line.includes("일")) {
            tempNotice.date = line;
          } else if (line.includes("조회수")) {
            tempNotice.views = line;
          } else {
            tempNotice.content += (tempNotice.content ? "\n" : "") + line;
          }
        }
        if (tempNotice) pdfNotices.push(tempNotice);

        // 💡 [2] 중복 제거 핵심 로직
        // PDF에서 가져온 것 중 제목에 "챌린지"나 "유지보수"가 있으면 버립니다. (우리가 수동으로 예쁘게 만들 거니까요)
        const filteredPdf = pdfNotices.filter(n => 
          !n.title.includes("챌린지") && !n.title.includes("유지보수") && !n.title.includes("공지사항")
        );

        // [3] 수동 추가 (오른쪽 사진처럼 정리정돈된 데이터)
        const staticNotices = [
          {
            id: "challenge-1",
            tag: "이벤트",
            title: "주간 챌린지 공지",
            content: "이번 주 코딩 챌린지에 참여하고 상품을 받으세요!\n매주 진행되는 코딩 챌린지가 시작되었습니다.\n알고리즘 문제를 풀고 상위권에 들면 특별한 보상을 받을 수 있습니다.\n\n참여 방법:\n1. 챌린지 페이지 방문\n2. 문제 풀기\n3. 코드 제출\n\n많은 참여 부탁드립니다!",
            date: "2일 전",
            views: "조회수 2,949"
          },
          {
            id: "maintenance-1",
            tag: "유지보수",
            title: "유지보수 일정",
            content: "이번 주말 오전 2시부터 4시까지 유지보수가 진행됩니다.\n시스템 안정성 향상을 위한 유지보수가 예정되어 있습니다.\n해당 시간 동안에는 일부 서비스 이용이 제한될 수 있습니다.\n\n일시: 2024년 4월 13일 (토) 02:00 ~ 04:00\n불편을 드려 죄송합니다.",
            date: "3일 전",
            views: "조회수 3,702"
          }
        ];

        setDynamicNotices([...filteredPdf, ...staticNotices]);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPdfText();
  }, []);

  const handleNoticeClick = (notice) => {
    setSelectedNotice(notice);
    setDynamicNotices((prev) =>
      prev.map((n) => {
        if (n.id === notice.id) {
          const currentViews = parseInt(n.views.replace(/[^0-9]/g, "")) || 0;
          return { ...n, views: `조회수 ${(currentViews + 1).toLocaleString()}` };
        }
        return n;
      })
    );
  };

  const currentNoticeData = dynamicNotices.find(n => n.id === selectedNotice?.id);

  return (
    <aside className="w-80 border-l border-border flex flex-col h-full bg-background shrink-0">
      <div className="p-10 pb-6"><h2 className="text-2xl font-black tracking-tighter">공지사항</h2></div>

      <div className="flex-1 flex flex-col gap-10 p-10 pt-0 overflow-y-auto scrollbar-hide">
        {isLoading ? (
          <div className="text-sm text-muted-foreground animate-pulse text-center mt-10 font-bold">로딩 중...</div>
        ) : (
          dynamicNotices.map((notice) => (
            <div 
              key={notice.id} 
              className="rounded-[32px] border border-border/50 p-8 hover:bg-accent/40 transition-all cursor-pointer group shadow-sm"
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

      <Modal isOpen={!!selectedNotice} onClose={() => setSelectedNotice(null)} title={currentNoticeData?.title}>
        {currentNoticeData && (
          <div className="p-6">
            <div className="pb-8 border-b border-dashed mb-10">
               <span className="px-3 py-1 rounded-md bg-pink-50 text-pink-500 text-xs font-bold mb-6 inline-block">{currentNoticeData.tag}</span>
               <h2 className="text-3xl font-black mb-6 leading-tight">{currentNoticeData.title}</h2>
               <div className="flex gap-4 text-sm text-muted-foreground">
                 <span>📅 {currentNoticeData.date}</span>
                 <span className="opacity-30">|</span>
                 <span className="text-primary font-bold">👁️ {currentNoticeData.views}</span>
               </div>
            </div>
            
            {/* 💡 이 부분이 오른쪽 사진처럼 예쁜 간격을 만듭니다 */}
            <div className="text-[18px] leading-[2.2] text-foreground/80 whitespace-pre-line break-keep tracking-tight">
              {currentNoticeData.content}
            </div>
          </div>
        )}
      </Modal>
    </aside>
  );
};

export default NoticeBar;