import React from 'react'
import { Link } from 'react-router-dom'

const Header = () => {
  return (
    <div className="header">
      <ul className= "tag-group">
        <li><Link to="/">Dev community</Link></li>
        <li className='card'><Link to="/board">커뮤니티</Link></li>
        <li className='card'><Link to="/study">학습</Link></li>
        
      </ul>
        <div>검색창</div>


    <ul className='tag-group'>
        <li><Link>로그인</Link></li>
        <li><Link>회원가입</Link></li>
      <li><Link to="/mypage">마이페이지</Link></li>
        <li><Link to="/admin">관리자페이지</Link></li>
    </ul>

    </div>
  )
}

export default Header