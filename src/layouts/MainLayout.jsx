import Header from '../components/Header'
import Footer from '../components/Footer'

import { Outlet } from 'react-router-dom'
import '../App.css';
const MainLayout = () => {
  return (
    <div className="app-container">
        <Header />
          <div className="content-wrapper">
            <main className="main-content">
                <Outlet />
            </main>  
            <side className="sidebar">
                  <div className="sidebar-card">
                    <h3>공지사항</h3>
                      <ul>
                        <li></li>
                      </ul>
                  </div>
                  <div className="sidebar-card">
                      <h3>인기 게시글</h3>
                      <ul>
                        <li></li>
                      </ul>
                  </div>
            </side>
          </div>  
        <Footer />
    </div>
  )
}

export default MainLayout