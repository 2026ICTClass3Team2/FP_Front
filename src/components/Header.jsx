import React from 'react'
import { Link } from 'react-router-dom'

const Header = () => {
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
            <div className='auth-buttons'>
                <Link to="/login" className='login-btn'>로그인</Link>
                <Link to="/" className='signup-btn'>회원가입</Link>
              {/* <li><Link to="/mypage">마이페이지</Link></li>
                <li><Link to="/admin">관리자페이지</Link></li> */}
            </div>
          </div>
        </div>
    </header>
  )
}

export default Header