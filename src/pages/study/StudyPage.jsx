import React from 'react'

const StudyPage = () => {
  return (
    <div>
    <aside> {/* 왼쪽 사이드바*/} 
        <div>
            <div>
                <input type="text" placeholder='검색......' />
                <span>🔍</span>
            </div>
        </div>

        {/* 메뉴 영역 */}
    <div>
        <div>
            <h3>언어선택</h3>
        </div>
        <button>JavaScrip</button>
    </div>

        <div>
            <h3>챕터</h3>
            <div>
                <button>
                    <span>챕터 제목 영역</span>
                    <span>기초문법 ❯</span>
                </button>
            </div>
        </div>
    </aside>

    <main>
        <div>
            <nav>
                <span>언어 태크</span>
                <span>선택 챕터타이틀</span>
            </nav>
            <article>
                <h1>챕터타이틀</h1>
                <div>챕터내용</div>
            </article>
        </div>
    </main>


</div>
        

  )
}

export default StudyPage