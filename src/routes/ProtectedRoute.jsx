import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../components/sidebar/AuthContext';

const ProtectedRoute = () => {
  const { currentUser, token } = useAuth();

  // 로그인 정보가 없으면 로그인 페이지로 강제 이동 (뒤로가기 방지용 replace: true)
  if (!currentUser || !token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;