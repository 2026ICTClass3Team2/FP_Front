import React from 'react'
import Modal from '../../components/common/Modal';
import QuesionCard from '../../components/quesion/QuesionCard';

const QuesionBoard = () => {
  return (
    <section>
      {/* 1. 상단 타이틀 영역 */}
      <header>
        <h1>질문답변 게시판</h1>
        <p>궁금한 점을 질문하고 답변을 받아보세요. 채택된 답변에는 포인트가 지급됩니다!</p>
      </header>

      {/* 2. 컨트롤 영역 (검색/정렬/글쓰기) */}
      <nav>
        <div>
          <input type="text" placeholder="질문 검색..." />
          <button type="button">🔍</button>
        </div>
        
        <select>
          <option>최신순</option>
          <option>해결됨</option>
          <option>미해결</option>
        </select>

        <button>+ 질문 작성</button>
      </nav>

      {/* 3. 통계 요약 영역 */}
      <aside>
        <div>
          <span>전체 질문</span>
          <strong>1</strong>
        </div>
        <div>
          <span>해결된 질문</span>
          <strong>0</strong>
        </div>
        <div>
          <span>미해결 질문</span>
          <strong>1</strong>
        </div>
      </aside>

      {/* 4. 질문 리스트 영역 */}
      <main>
        {/* 반복될 질문 카드 아이템 */}
        <article>
          {/* 상태 표시 (미해결/해결) */}
          <div>
            <span>미해결</span>
          </div>

          <div>
            {/* 제목 및 포인트 */}
            <div>
              <h2>React useEffect 무한 루프 문제</h2>
              <span>+50P</span>
            </div>

            {/* 본문 요약 */}
            <p>useEffect에서 의존성 배열 설정 시 무한 루프가 발생하는데...</p>
            
            {/* 태그 및 메타 정보 */}
            <footer>
              <div>
                <span>React</span>
                <span>JavaScript</span>
              </div>
              <div>
                <span>작성자: 수현</span>
                <span>날짜: 2026.04.06</span>
                <span>조회: 123</span>
                <span>댓글: 23</span>
                <span>좋아요: 45</span>
              </div>
            </footer>
          </div>
        </article>
      </main>

      {/* 5. 작성 모달 (상태에 따라 렌더링) */}
      {isModalOpen && (
        <Modal title="질문 작성">
           {/* FeedCard에 닫기 기능을 전달 */}
          <QuesionCard />
        </Modal>
      )}
    </section>
  );
};

export default QuesionBoard