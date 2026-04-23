import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../components/sidebar/AuthContext';

const OAuthCallback = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { handleOAuthLogin } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const username = params.get('username') || '소셜유저';
    const userIdParam = params.get('userId') || params.get('user_id') || params.get('id');
    const userId = userIdParam ? Number(userIdParam) : null;
    const role = params.get('role') || 'user';
    const isNewUser = params.get('isNewUser') === 'true';

    if (token) {
      if (isNewUser) {
        // 신규 OAuth 가입: 토큰만 저장 후 username 설정 페이지로 이동
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify({
          userId: Number.isNaN(userId) ? null : userId,
          username,
          nickname: username,
          role,
        }));
        navigate('/oauth/setup-username', { replace: true });
        return;
      }

      handleOAuthLogin(token, username, Number.isNaN(userId) ? null : userId, role);

      const redirectUrl = sessionStorage.getItem('redirectUrl');
      if (redirectUrl) {
        sessionStorage.removeItem('redirectUrl');
        window.location.href = redirectUrl;
      } else {
        window.location.replace('/');
      }
    } else {
      alert('로그인에 실패했습니다.');
      navigate('/login', { replace: true });
    }
  }, [location.search, navigate, handleOAuthLogin]);

  return (
    <div className="flex items-center justify-center min-h-screen">소셜 로그인 처리 중...</div>
  );
};

export default OAuthCallback;