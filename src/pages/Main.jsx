import React from 'react'

const Main = () => {
  return (
    <div>
      <div className="main-text">
        <h1>게시판</h1>
        <button className="write-btn">글쓰기</button>
      </div>
      
      <div className="tap-group">
          <button type='button' className="tap">게시판</button>
          <button type='button' className="tap">스터디</button>
          <button type='button' className="tap">공지사항</button>
          
      </div>
            
            
            <article className="">
          <div className="">
              <strong className="post-item"></strong>
              <span className="point-badge"> </span>
              <span className="status-badge"></span>
          </div>
          
          <div className="post-footer">
             <span> </span>
             <span> </span>
          </div>
      </article>
    </div>
  )
}

export default Main