import React from 'react'

const QuestionCard = () => {
  return (
 <div>
      <div>
       <h2>질문 작성</h2>
        
      </div>

      <div>
        <label>제목</label>
        <input type="text" placeholder="제목을 입력하세요 (최대 250자)" />
      </div>

        <div>
        <label>채택 포인트</label>
        <span></span>
      </div>


      <div>
        <label>내용</label>
        <textarea placeholder="내용을 입력하세요 (최대 10,000자)" />
      </div>

      <div>
         <label>채널선택(다중 선택가능)</label>
         <div>
          {/* 나중에 입력된 태그들이 나열될 자리 */}
          <span>#React</span> 
          
        </div>
        </div>  
        <div>
         <label>기술스택(최대5개)</label>
         <div>
          <button>React</button>
          <button>TypeScript</button>
          <button>JavaScript</button>
          <button>Node.js</button>
          <button>Python</button>
          <button>Java</button>
          <button>C++</button>
        </div>
        </div>  
            
      <div>
        <label>썸네일 이미지 (선택)</label>
        <div>
          <button>클릭하여 이미지 업로드 (JPG, PNG 최대 10MB)</button>
        </div>
      </div>

      <div>
        <button onClick={onCancel}>취소</button>
        <button>작성완료</button>
      </div>
    </div>

  )
}


export default QuestionCard