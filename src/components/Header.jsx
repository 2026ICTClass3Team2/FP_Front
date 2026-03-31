import React, { useState } from 'react';  //useState 추가 안하니까 테스트 할 때 화면송출이 안되어서 넣었음
import { Link } from 'react-router-dom'
import '../assets/css/Modal.css'
import '../assets/css/Auth.css'
const Header = () => {
  /*로그인 후 css 테스용*/ 
  const [loggedIn, setLoggedIn] = useState(false);   // true = 로그인 상태 (테스트용) 깃 올릴 땐 false로 두라고 함
  const [showMenu, setShowMenu] = useState(false);

  const toggleMenu = () => setShowMenu(!showMenu); //계정 이름 클릭시 드롭다운 모달창 나옴
  const closeMenu = () => setShowMenu(false);

  return (
    <header className="header">
      <div className='header-inner'>
        <div className= "header-left">
          <Link to="/" className="logo">Dev community</Link>       
        </div>

          <nav>
            <ul className='nav-menu'>
              <li><Link to="/">커뮤니티</Link></li>
              <li><Link to="/study">학습</Link></li>
            </ul>
          </nav>

          <div className='header-search'>
            <input type="text" placeholder="게시판, 학습, 스터디 검색..." className='search-input'/>          
            </div>

          <div className='header-right'>
              {loggedIn ? (
            /* ==================== 로그인 후 ==================== */
            <div className="user-menu">
              {/* 알림 아이콘 */}
              <button className="icon-btn">
                📢
                <span className="notification-dot">●</span>
              </button>
              <button className="icon-btn">
                🛎️
                <span className="notification-dot">●</span>
              </button>


              {/* 계정 이름 + 드롭다운 */}
              <div className="user-dropdown-wrapper">
                <button 
                  className="username-btn" 
                  onClick={toggleMenu}
                >
                  김개발
                </button>
                  
                {/* 드롭다운 메뉴 / 임시로 내용넣음 */}  
                {showMenu && (
                  <div className="user-dropdown">
                    <div className="dropdown-header">
                      <div className="user-info">
                        <strong>김개발</strong>
                        <span>user1@example.com</span>
                      </div>
                    </div>

                    <ul className="dropdown-menu">
                      <li>
                        <Link to="/" className="dropdown-item" onClick={closeMenu}>
                          내 페이지
                        </Link>
                      </li>
                      <li>
                        <Link to="/" className="dropdown-item" onClick={closeMenu}>
                         내 스터디
                        </Link>
                      </li>
                      <li>
                        <Link to="/" className="dropdown-item" onClick={closeMenu}>
                         내 게시글
                        </Link>
                      </li>
                    </ul>

                    <div className="dropdown-divider"></div>

                    <button 
                      className="dropdown-item logout"
                      onClick={() => {
                        setLoggedIn(false);
                        closeMenu();
                      }}
                    >
                      ↩️ 로그아웃
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (



            <div className='auth-buttons'>
                <Link to="/login" className='login-btn'>로그인</Link>
                <Link to="/signup" className='signup-btn'>회원가입</Link>
              
            </div>
            )}
          </div>
        </div>
    </header>
  );
};

export default Header