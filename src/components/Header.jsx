import React from 'react'
import { Link } from 'react-router-dom'

const Header = () => {
  return (
    <div>
      <ul>
        <li><Link to="/">홈</Link></li>
        <li><Link to="/board">커뮤니티</Link></li>
        <li><Link to="/study">스터디</Link></li>
        <li><Link to="/mypage">마이페이지</Link></li>
        <li><Link to="/admin">관리자페이지</Link></li>
      </ul>
    </div>
  )
}

export default Header