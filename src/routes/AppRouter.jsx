import { BrowserRouter, Routes, Route } from 'react-router-dom';

import MainLayout from '../components/layouts/MainLayout';
import StudyPage from '../pages/study/StudyPage';
import MyProfile from '../pages/profile/MyProfile';
import AdminDashboard from '../pages/admin/AdminDashboard';
import MainFeed from '../pages/feed/MainFeed';
import MyPageLayout from '../components/layouts/MyPageLayout';
import ProfileCard from '../components/profile/ProfileCard';
import QuesionBoard from '../pages/question/QuestionBoard';

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Nested Routing */}
        {/* 메인 영역 */}
        <Route element={<MainLayout />}>
          <Route index element={<MainFeed />} />


          {/* 질문게시판 - 여기서 연결 */}
          <Route path="question" element={<QuesionBoard />} />

          {/* 학습 페이지 - 여기서 연결 */}
          <Route path="study" element={<StudyPage />} />



          <Route element={<MyPageLayout />}>
            {/* 마이페이지 영역 */}
            <Route path='MyProfile'>
              <Route index element={<MyProfile />} />
            </Route>

            <Route path='user/:userId'>
              <Route index element={<ProfileCard />} />
            </Route>
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