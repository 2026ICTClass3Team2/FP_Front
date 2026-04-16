import { BrowserRouter, Routes, Route } from 'react-router-dom';

import MainLayout from '../components/layouts/MainLayout';
import StudyPage from '../pages/study/StudyPage';
import MyProfile from '../pages/profile/MyProfile';
import AdminDashboard from '../pages/admin/AdminDashboard';
import MainFeed from '../pages/feed/MainFeed';
import MyPageLayout from '../components/layouts/MyPageLayout';
import ProfileCard from '../components/profile/ProfileCard';
import QuestionBoard from '../pages/question/QuestionBoard';
import QuestionDetail from '../pages/question/QuestionDetail';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import ProtectedRoute from './ProtectedRoute';
import OAuthCallback from '../pages/auth/OAuthCallback';
import MyPostList from '../components/layouts/MyPostList';
import MyBookmarkList from '../components/layouts/MyBookmarkList';

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* 인증 영역 (레이아웃 미적용) */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/oauth/callback" element={<OAuthCallback />} />

        {/* 로그인된 사용자만 접근할 수 있는 영역 */}
         <Route element={<ProtectedRoute />} />
          {/* Nested Routing */}
          {/* 메인 영역 */}
          <Route element={<MainLayout />}>  
            <Route index element={<MainFeed />} />


          {/* 질문게시판 */}
          <Route path="qna" element={<QuestionBoard />} />
          <Route path="qna/:qnaId" element={<QuestionDetail />} />

            {/* 학습 페이지 */}
            <Route path="study" element={<StudyPage />} />


            {/* 마이페이지 & 타인 프로필 영역 */}
            <Route path="mypage" element={<MyPageLayout />}>
              <Route index element={<MyProfile />} />
              <Route path="posts" element={<MyPostList />} />
              <Route path="bookmarks" element={<MyBookmarkList />} />
            </Route>
            <Route path="user/:userId" element={<MyPageLayout />}>
              <Route index element={<ProfileCard />} />
              {/* 타인 프로필 정보 탭 라우트 추가 예정 */}
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
