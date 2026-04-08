import React from 'react'
import { Link } from 'react-router-dom'
const Header = () => {
  return (
    <header>
        <Link to='/'>(로고)Dead Bug</Link>

        <div>
          <span> </span>
          <input type="text" placeholder="무엇이든 검색하세요" />
        </div>

          <div>
            <button>건의사항</button>
             <button>알림</button> 
          </div>

    </header>



  )
}

export default Header