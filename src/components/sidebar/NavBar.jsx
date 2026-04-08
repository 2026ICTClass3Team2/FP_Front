import React from 'react'
import { Link } from 'react-router-dom'


const NavBar = () => {
    return (
        <aside>
            {/* 1. 상단 프로필 구역 */}
            <div>
                <div>
                    <span>닉네임</span>
                    <span>@사용자명</span>
                </div>


                 {/*포인트 버튼 + 코인 아이콘 */}   
                <button>
                    <span> 포인트표시, 아이콘</span>
                </button>
            </div>
                 {/* 2. 네비게이션 메뉴 구역 */}
                 <nav>
                    <Link to='/'>
                        <span>홈</span>
                    </Link>
                        
                    <Link to='/'>
                        <span>질문게시판</span>
                    </Link>
                        
                    <Link to='/'>
                        <span>학습</span>
                    </Link>
                    
                    <div>
                        <button>구독한 채널
                            <span>▾</span>
                        </button>
                        <div>
                            
                            <button>React 개발자</button>
                        </div>
                    </div>

                        <div>
                            
                            <button>
                                인기채널
                                <span>▾</span>
                            </button>

                            <div>
                               
                                <button>Node.js</button>
                            </div>
                        </div>
                 </nav>
                 <div>
                    <button>로그아웃</button>
                 </div>

        </aside>
    )
}

export default NavBar