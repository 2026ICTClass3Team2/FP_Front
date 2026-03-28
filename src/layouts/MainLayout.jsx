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
            <aside className="sidebar">
                  
            </aside>
          </div>  
        <Footer />
    </div>
  )
}

export default MainLayout