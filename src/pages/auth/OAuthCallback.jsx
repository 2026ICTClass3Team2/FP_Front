import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../components/sidebar/AuthContext';

const OAuthCallback = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { handleOAuthLogin } = useAuth();

  useEffect(() => {
    // URL에서 파라미터 추출 (예: /oauth/callback?token=eyJ...&username=test)
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const username = params.get('username') || '소셜유저'; 

    if (token) {
      handleOAuthLogin(token, username);
      
      const redirectUrl = sessionStorage.getItem('redirectUrl');
      if (redirectUrl) {
        sessionStorage.removeItem('redirectUrl');
        window.location.href = redirectUrl;
      } else {
        navigate('/', { replace: true });
      }
    } else {
      alert('소셜 로그인에 실패했습니다.');
      navigate('/login', { replace: true });
    }
  }, [location.search, navigate, handleOAuthLogin]);

  return (
    <div className="flex items-center justify-center min-h-screen">소셜 로그인 처리 중...</div>
  );
};

export default OAuthCallback;