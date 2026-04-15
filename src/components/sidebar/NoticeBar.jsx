import React, { useEffect, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import Modal from '../common/Modal';
 

const NoticeBar = () => {
  const [dynamicNotices, setDynamicNotices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedNotice, setSelectedNotice] = useState(null); // 모달용 상태, pdf에 불러올 데이터 

  useEffect(() => {
    const fetchPdfText = async () => {
      try {
        // console.log("--- PDF 정찰 시작 ---");
        // 워커 설정
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
        // 2. "/notice.pdf" 대신 임포트한 pdfFile 변수를 사용합니다.
        const response = await fetch("/notice.pdf");
        
        if (!response.ok) {
          throw new Error("PDF 보급로 차단됨 (파일 응답 실패)");
        }

        const arrayBuffer = await response.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        
        const page = await pdf.getPage(1);
        const textContent = await page.getTextContent();

        // 텍스트 추출
        const rawItems = textContent.items.map(item => item.str.trim()).filter(s => s !== "");
        // console.log("정찰 성공! 원본 데이터:", rawItems);

        // [필터링 시작] "공지사항"이라는 단어가 몇 번째 칸에 있는지 찾습니다.
        const noticeStart = rawItems.findIndex(text => text.includes("공지사항"));

        // "공지사항" 글자 이후의 데이터만 남깁니다. (그 전의 '닉네임', '홈' 등은 버림)
        const noticeData = noticeStart !== -1 ? rawItems.slice(noticeStart + 1) : rawItems;

        // 3. 데이터 가공 로직 (이미지 구성에 맞게 4개씩 끊기)
        const testNotices = [];
        const cleanItems = rawItems[0] === "공지사항" ? rawItems.slice(1) : rawItems;
        
        for (let i = 0; i < cleanItems.length; i += 4) {
         if (noticeData[i] && noticeData[i].length > 2) {
    if (noticeData[i] === "로그아웃" || noticeData[i] === "홈") break;

    testNotices.push({
      id: `notice-${i}`,
      title: noticeData[i],         // 예: Dead Bug 커뮤니티...
      content: noticeData[i+1],      // 예: 안녕하세요! Dead Bug...
      date: noticeData[i+2],         // 예: 2시간 전
      views: noticeData[i+3]         // 예: 조회수 1234
    });
  }
}
 setDynamicNotices(testNotices);
      } catch (error) {
        console.error("정찰 실패:", error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPdfText();
  }, []);

  return (
    <aside className="w-50 border-l border-border flex flex-col h-full bg-background shrink-0">
      
      <div className="p-6">
        <h2 className="text-lg font-black text-foreground">공지사항</h2>
      </div>
      
      <div className="flex-1 flex flex-col gap-4 p-6 overflow-y-auto scrollbar-hide">
        {isLoading ? (
          <div className="text-sm text-muted-foreground animate-pulse">데이터 확보 중...</div>
        ) : dynamicNotices.length > 0 ? (
          dynamicNotices.map((notice, index) => (
            <div key={index} className="rounded-xl border p-4 hover:bg-accent/50 transition-colors">
              <h3 className="font-bold text-foreground line-clamp-1">{notice.title}</h3>
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{notice.content}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">현재 등록된 공지가 없습니다.</p>
        )}
      </div>

      {/* ✅ [포인트 2] 상원님이 만드신 Modal 컴포넌트에 데이터를 불러와서 보여줍니다. */}
      {/* isOpen: 데이터가 담기면(selectedNotice가 있으면) true
          onClose: 닫으면 다시 바구니를 비움(null)
          title: PDF에서 긁어온 제목을 넘겨줌
      */}
      <Modal 
        isOpen={!!selectedNotice} 
        onClose={() => setSelectedNotice(null)} 
        title={selectedNotice?.title}
      >
        {selectedNotice && (
          <div className="space-y-4">
            <div className="text-xs text-muted-foreground pb-2 border-b">
              {selectedNotice.date} | {selectedNotice.views}
            </div>
            {/* PDF의 줄바꿈을 살리기 위해 whitespace-pre-wrap 사용 */}
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
              {selectedNotice.content}
            </p>
          </div>
        )}
      </Modal>
    </aside>
  );
};

export default NoticeBar;