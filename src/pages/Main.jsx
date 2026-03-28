import React from 'react'

const Main = () => {
  return (
    <div>
      <div className="tag-group">
          <button className="write-btn">게시판</button>
          <button className="tag">스터디</button>
          <button className='tag'>공지사항</button>
      </div>
            <article className="card post-item">
          <div className="post-header">
              <strong className="post-item">React Hook 사용법 질문있습니다</strong>
              <span className="point-badge">50 포인트</span>
              <span className="status-badge">해결됨</span>
          </div>
          
          <div className="post-footer">
             <span>조회수 1234</span>
             <span>좋아요 45</span>
          </div>
      </article>
    </div>
  )
}

export default Main