import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const testURI = import.meta.env.DEV ? 'http://localhost:8090/api/' : '/api/';
  const backendBaseURL = import.meta.env.DEV ? 'http://localhost:8090' : '';

  // 앱 진입/새로고침 시 스토리지에서 인증 정보 복구
  useEffect(() => {
    const user = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    if (user && storedToken) {
      setCurrentUser(JSON.parse(user));
      setToken(storedToken);
    }
    setLoading(false);
  }, []);

  // 로그인 로직
  const login = async (email, password) => {
    const body = new URLSearchParams();
    body.append('email', email);
    body.append('pw', password);

    const response = await fetch(`${testURI}login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      credentials: 'include',
      body: body.toString(),
    });

    if (!response.ok) {
      let errorMessage = '로그인에 실패했습니다. 아이디 또는 비밀번호를 확인해주세요.';
      try {
        const errorData = await response.json();
        if (errorData && errorData.message) {
          errorMessage = errorData.message;
        }
      } catch (e) {
        // Not a JSON error response, use a generic server error message
        errorMessage = `서버 오류가 발생했습니다 (HTTP ${response.status})`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    const userProfile = {
      userId: data.userId ?? data.user_id ?? data.id ?? null,
      username: data.username,
      nickname: data.username.split('@')[0], // 이메일 앞부분을 닉네임으로 임시 사용
      role: data.role || 'user',
      status: data.status || 'active',
      releasedAt: data.releasedAt || null,
    };

    setCurrentUser(userProfile);
    setToken(data.accessToken);
    localStorage.setItem('user', JSON.stringify(userProfile));
    localStorage.setItem('token', data.accessToken);
  };

  // 소셜 로그인 처리 로직 (OAuthCallback에서 호출)
  const handleOAuthLogin = useCallback((token, username, userId = null, role = 'user') => {
    const userProfile = {
      userId,
      username: username,
      nickname: username.split('@')[0],
      role,
      status: 'active', // 소셜 로그인은 기본적으로 활성 상태로 시작한다고 가정 (실제로는 서버 연동 필요)
      releasedAt: null,
    };
    setCurrentUser(userProfile);
    setToken(token);
    localStorage.setItem('user', JSON.stringify(userProfile));
    localStorage.setItem('token', token);
  }, []);

  // 로그아웃 로직
  const logout = async () => {
    // 로컬 상태를 먼저 동기적으로 정리
    setCurrentUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    sessionStorage.removeItem('redirectUrl');
    sessionStorage.setItem('isLoggingOut', 'true');

    // 서버 측 refresh token 무효화 (실패해도 무관)
    try {
      await fetch(`${backendBaseURL}/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (e) { }
  };

  const value = {
    currentUser,
    token,
    login,
    handleOAuthLogin,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {/* 인증 정보를 가져오는 중이 아닐 때만 렌더링 */}
      {!loading && children}
    </AuthContext.Provider>
  );
};