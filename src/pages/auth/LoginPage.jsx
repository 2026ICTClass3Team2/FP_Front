import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../components/sidebar/AuthContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberEmail, setRememberEmail] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const testURI = import.meta.env.DEV ? 'http://localhost:8090/api/' : '/api/';

  useEffect(() => {
    // 로그인 페이지에 무사히 도착했으면 로그아웃 팻말을 수거합니다.
    sessionStorage.removeItem('isLoggingOut');

    // 저장된 이메일 복원
    const saved = localStorage.getItem('savedEmail');
    if (saved) {
      setEmail(saved);
      setRememberEmail(true);
    }

    // Interceptor나 라우터 가드가 주소를 못 잡았을 경우 대비 (외부 링크 직접 타고 올 때)
    if (!sessionStorage.getItem('redirectUrl')) {
      const prevPath = document.referrer;
      if (prevPath && prevPath.includes(window.location.host)) {
        const url = new URL(prevPath);
        const target = url.pathname + url.search;
        if (target !== '/login' && target !== '/register' && target !== '/' && !target.startsWith('/oauth/')) {
          sessionStorage.setItem('redirectUrl', target);
        }
      }
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rememberEmail) {
      localStorage.setItem('savedEmail', email);
    } else {
      localStorage.removeItem('savedEmail');
    }
    try {
      setError('');
      setLoading(true);
      await login(email, password);

      // Suspended users stay on this page — SuspensionModal renders on top
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      if (storedUser.status === 'suspended') {
        return;
      }

      const redirectUrl = sessionStorage.getItem('redirectUrl');
      sessionStorage.removeItem('redirectUrl');
      if (redirectUrl && redirectUrl.startsWith('/') && !redirectUrl.startsWith('/oauth/')) {
        window.location.replace(redirectUrl);
      } else {
        window.location.replace('/');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="bg-card p-8 rounded-2xl shadow-sm w-full max-w-md border border-border">
        <h2 className="text-2xl font-bold mb-6 text-foreground text-center">로그인</h2>
        {error && <div className="text-destructive mb-4 text-sm text-center">{error}</div>}
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-foreground">이메일</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              className="px-4 py-2 border border-border rounded-xl bg-background text-foreground focus:outline-none focus:border-primary" 
              placeholder="이메일 주소" 
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-foreground">비밀번호</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 pr-10 border border-border rounded-xl bg-background text-foreground focus:outline-none focus:border-primary"
                placeholder="비밀번호"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
                aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="rememberEmail"
              checked={rememberEmail}
              onChange={(e) => setRememberEmail(e.target.checked)}
              className="w-4 h-4 accent-primary cursor-pointer"
            />
            <label htmlFor="rememberEmail" className="text-sm text-muted-foreground cursor-pointer select-none">
              아이디 저장
            </label>
          </div>
          <button disabled={loading} type="submit" className="mt-4 w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50">
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>
        
        <div className="flex items-center my-4">
          <div className="flex-1 h-px bg-border"></div>
            <span className="px-3 text-sm text-muted-foreground">또는 소셜 로그인</span>
          <div className="flex-1 h-px bg-border"></div>
        </div>

        <div className="flex flex-col gap-3">
          <a 
            href={testURI + "oauth2/authorization/google"} 
            className="w-full flex items-center justify-center gap-2 py-2.5 border border-border rounded-xl font-medium text-foreground hover:bg-muted/30 transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google로 로그인
          </a>
          <a 
            href={testURI + "oauth2/authorization/kakao"} 
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#FEE500] text-[#000000] rounded-xl font-medium hover:bg-[#FDD000] transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3C6.477 3 2 6.477 2 10.762c0 2.72 1.83 5.118 4.604 6.476l-1.18 4.316a.423.423 0 0 0 .654.436l5.044-3.342c.29.02.583.03.878.03 5.523 0 10-3.477 10-7.762C22 6.477 17.523 3 12 3z"/>
            </svg>
            카카오로 로그인
          </a>
          <a 
            href={testURI + "oauth2/authorization/github"} 
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#24292F] text-white rounded-xl font-medium hover:bg-[#3d444b] transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.379.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.137 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
            </svg>
            GitHub로 로그인
          </a>
        </div>
        
        <div className="mt-4 text-center text-sm text-muted-foreground">
          <Link to="/forgot-password" className="text-muted-foreground hover:text-primary hover:underline">비밀번호를 잊으셨나요?</Link>
        </div>
        <div className="mt-3 text-center text-sm text-muted-foreground">
          계정이 없으신가요? <Link to="/register" className="text-primary font-semibold hover:underline ml-1">회원가입</Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
