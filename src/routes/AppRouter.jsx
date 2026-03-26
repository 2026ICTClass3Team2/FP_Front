import { BrowserRouter, Routes, Route } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import PostDetail from '../pages/board/PostDetail'
import PostList from '../pages/board/PostList'
import PostWrite from '../pages/board/PostWrite'
import MyPage from '../pages/mypage/MyPage'
import AdminDashboard from '../pages/admin/AdminDashboard'
import Main from '../pages/Main'

const AppRouter = () => {
  return (
    <BrowserRouter>
        <Routes>
            {/* Nested Routing */}
            {/* 메인 영역 */}
            <Route element={<MainLayout />}>
                <Route index element={<Main />} />

                {/* 커뮤니티 영역 */}
                <Route path='board'>
                  <Route index element={<PostList />} />
                  <Route path=':id' element={<PostDetail />}/>
                  <Route path='write' element={<PostWrite />}/>
                </Route>

                {/* 마이페이지 영역 */}
                <Route path='mypage'>
                  <Route index element={<MyPage />} />
                </Route>

                {/* 관리자 영역 */}
                <Route path='admin'>
                  <Route index element={<AdminDashboard />} />
                </Route>
          </Route>
        </Routes>
    </BrowserRouter>
  )
}

export default AppRouter