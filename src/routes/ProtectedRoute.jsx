import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../components/sidebar/AuthContext';

const ProtectedRoute = () => {
  const { currentUser, token } = useAuth();
  const location = useLocation();

  // 로그인 정보가 없으면
  if (!currentUser || !token) {
    // [핵심] 현재 접속하려던 주소(경로 + 쿼리스트링)를 가져옵니다.
    const currentUrl = location.pathname + location.search;

    // 로그인 페이지가 아니고, '명시적 로그아웃' 상태가 아닐 때만 세션에 저장
    if (currentUrl !== '/login' && !sessionStorage.getItem('isLoggingOut')) {
      sessionStorage.setItem('redirectUrl', currentUrl);
      console.log("보호된 라우트 진입 시도 - 주소 저장됨:", currentUrl);
    }

    // 로그인 페이지로 이동
    return <Navigate to="/login" replace />;
  }

  // 로그인 되어 있으면 자식 라우트들을 렌더링
  return <Outlet />;
};

export default ProtectedRoute;