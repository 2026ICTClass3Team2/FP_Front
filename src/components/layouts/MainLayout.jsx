import React from 'react'
import Header from './Header'
import { Outlet } from 'react-router-dom'
import Footer from './Footer'
import NavBar from '../sidebar/NavBar'
import NoticeBar from '../sidebar/NoticeBar'
function MainLayout() {
  return (
    <div>
      <NavBar/>
      <div>
      <Header/>
        <main>
          <Outlet/>
          <Footer/>
        </main>
      </div>
      <NoticeBar/>
      <button>
        <span>챗봇</span>
        </button>
    </div>
  )
}

export default MainLayout