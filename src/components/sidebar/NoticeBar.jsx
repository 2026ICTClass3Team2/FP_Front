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
        
        const lines = {};
        textContent.items.forEach(item => {
          const y = Math.round(item.transform[5]);
          if (!lines[y]) lines[y] = [];
          lines[y].push({ x: item.transform[4], str: item.str.trim() });
        });

        const sortedLines = Object.keys(lines)
          .sort((a, b) => b - a)
          .map(y => lines[y].sort((a, b) => a.x - b.x).map(obj => obj.str).join(" ").trim())
          .filter(line => 
            line !== "" && 
            line !== "관리자" && 
            !line.includes("공지사항") // 💡 "공지사항 상세" 같은 불필요한 헤더 텍스트 제거
          );

        let pdfNotices = [];
        let tempNotice = null;
        const tagKeywords = ["일반", "이벤트", "가이드라인", "유지보수"];

        for (let i = 0; i < sortedLines.length; i++) {
          const line = sortedLines[i];
          const isTag = tagKeywords.includes(line);

          if (isTag) {
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
          } else if (!line.includes("내용을 확인합니다")) { // 💡 파싱 찌꺼기 문구 제거
            tempNotice.content += (tempNotice.content ? "\n" : "") + line;
          }
        }
        if (tempNotice) pdfNotices.push(tempNotice);
        setDynamicNotices(pdfNotices.slice(0, 5));
      } catch (e) { console.error(e); } finally { setIsLoading(false); }
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
      {/* 헤더 */}
      <div className="p-10 pb-6"><h2 className="text-2xl font-black tracking-tighter">공지사항</h2></div>

      {/* 리스트 영역 */}
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

      {/* 💡 [해결 포인트] Modal은 여기서 단 한 번만! 
          title 속성을 비워서 Modal 컴포넌트가 자체적으로 제목을 띄우지 못하게 막고,
          우리가 내용물 안에서 직접 컨트롤합니다. */}
      <Modal 
        isOpen={!!selectedNotice} 
        onClose={() => setSelectedNotice(null)} 
        title="" 
      >
        {currentNoticeData && (
          <div className="p-4 pt-2">
            {/* 1. 카테고리 태그 */}
            <div className="mb-6">
               <span className="px-3 py-1 rounded-md bg-pink-50 text-pink-500 text-xs font-bold inline-block">
                  {currentNoticeData.tag}
               </span>
            </div>

            {/* 2. 중복 없는 제목 딱 하나! */}
            <h2 className="text-3xl font-black mb-6 leading-tight tracking-tight text-foreground">
              {currentNoticeData.title}
            </h2>

            {/* 3. 메타 정보 (날짜 | 조회수) */}
            <div className="pb-8 border-b border-dashed mb-10">
               <div className="flex gap-4 text-sm text-muted-foreground items-center">
                 <span className="flex items-center gap-1.5">관리자 {currentNoticeData.date}</span>
                 <span className="opacity-30">|</span>
                 <span className="text-primary font-bold flex items-center gap-1.5">
                   👁️ {currentNoticeData.views}
                 </span>
               </div>
            </div>
            
            {/* 4. 본문 (시원한 간격) */}
            <div className="text-[18px] leading-[2.2] text-foreground/80 whitespace-pre-line break-keep tracking-tight">
              {currentNoticeData.content}
            </div>

            {/* 5. 마무리 인사 */}
            <div className="pt-20 text-sm text-muted-foreground italic border-t border-dashed mt-10">
              감사합니다. Dead Bug 운영팀 드림.
            </div>
          </div>
        )}
      </Modal>
    </aside>
  );
};

export default NoticeBar;