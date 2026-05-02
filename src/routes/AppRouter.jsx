import { BrowserRouter, Routes, Route } from 'react-router-dom';

import MainLayout from '../components/layouts/MainLayout';
import AdminLayout from '../components/layouts/AdminLayout';
import StudyPage from '../pages/study/StudyPage';
import MyProfile from '../pages/profile/MyProfile';
import AdminDashboard from '../pages/admin/AdminDashboard';
import MainFeed from '../pages/feed/MainFeed';
import MyPageLayout from '../components/layouts/MyPageLayout';
import ProfileCard from '../components/profile/ProfileCard';
import QuestionBoard from '../pages/question/QuestionBoard';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import OAuthCallback from '../pages/auth/OAuthCallback';
import OAuthUsernameSetupPage from '../pages/auth/OAuthUsernameSetupPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';
import ProtectedRoute from './ProtectedRoute';
import MyPostList from '../components/layouts/MyPostList';
import MyBookmarkList from '../components/layouts/MyBookmarkList';
import MyNotifications from '../pages/profile/MyNotifications';
import BlockList from '../components/profile/BlockList';
import ChannelDetail from '../pages/channel/ChannelDetail';
import FavoritesFeedPage from '../pages/favorites/FavoritesFeedPage';
import SuspensionModal from '../components/common/SuspensionModal';

const AppRouter = () => {
  return (
    <BrowserRouter>
      <SuspensionModal />
      <Routes>
        {/* 인증 영역 (레이아웃 미적용) */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/oauth/callback" element={<OAuthCallback />} />
        <Route path="/oauth/setup-username" element={<OAuthUsernameSetupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* 로그인된 사용자만 접근할 수 있는 영역 */}
        <Route element={<ProtectedRoute />}>
          {/* Nested Routing */}
          {/* 메인 영역 */}
          <Route element={<MainLayout />}>
            <Route index element={<MainFeed />} />


            {/* 질문게시판 */}
            <Route path="qna" element={<QuestionBoard />} />

            {/* 학습 페이지 */}
            <Route path="study" element={<StudyPage />} />


            {/* 마이페이지 & 타인 프로필 영역 */}
            <Route path="mypage" element={<MyPageLayout />}>
              <Route index element={<MyProfile />} />
              <Route path="posts" element={<MyPostList />} />
              <Route path="bookmarks" element={<MyBookmarkList />} />
              <Route path="notifications" element={<MyNotifications />} />
              <Route path='blocks' element={<BlockList />} />
            </Route>

            {/* 팔로우 피드 */}
            <Route path="favorites" element={<FavoritesFeedPage />} />

            {/* 채널 상세 페이지 */}
            <Route path="channels/:channelId" element={<ChannelDetail />} />
          </Route>

          {/* 관리자 영역 - MainLayout과 분리된 AdminLayout 적용 */}
          <Route path='admin' element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default AppRouter