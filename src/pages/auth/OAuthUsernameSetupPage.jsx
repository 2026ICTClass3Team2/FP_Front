import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../components/sidebar/AuthContext';

const OAuthUsernameSetupPage = () => {
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [notification, setNotification] = useState('');
  const [isUsernameAvailable, setIsUsernameAvailable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const testURI = import.meta.env.DEV ? 'http://localhost:8090/api/' : '/api/';

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  const handleUsernameChange = (e) => {
    const value = e.target.value;
    setUsername(value);
    setIsUsernameAvailable(false);
    setNotification('');
    const usernameRegex = /^[a-z0-9]{4,20}$/;
    if (value.length > 0 && !usernameRegex.test(value)) {
      setUsernameError('❌ 아이디는 영문 소문자와 숫자 4~20자리여야 합니다.');
    } else {
      setUsernameError('');
    }
  };

  const handleCheckUsername = async () => {
    if (!username) return setError('아이디를 입력해주세요.');
    if (usernameError) return setError('아이디 형식을 먼저 맞춰주세요.');
    setError('');
    setNotification('');
    try {
      const res = await fetch(`${testURI}member/check-username?username=${username}`);
      const data = await res.json();
      if (data.isDuplicate) {
        setError('이미 사용 중인 아이디입니다.');
        setIsUsernameAvailable(false);
      } else {
        setNotification('사용 가능한 아이디입니다.');
        setIsUsernameAvailable(true);
      }
    } catch {
      setError('서버와 통신 중 오류가 발생했습니다.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isUsernameAvailable) return setError('아이디 중복 확인을 진행해주세요.');
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${testURI}member/oauth/setup-username`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username }),
      });
      const data = await res.json();
      if (res.ok && data.result === 'success') {
        // localStorage의 user 정보 username 업데이트
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({ ...storedUser, username }));
        window.location.replace('/');
      } else {
        setError(data.error || '아이디 설정에 실패했습니다.');
      }
    } catch {
      setError('서버와 통신 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="bg-card p-8 rounded-2xl shadow-sm w-full max-w-md border border-border">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <div className="bg-primary text-primary-foreground p-3.5 rounded-2xl shadow-sm border border-primary/20">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-foreground">아이디 설정</h2>
          <p className="text-sm text-muted-foreground mt-2">
            소셜 로그인 완료! 서비스에서 사용할 아이디를 설정해 주세요.
          </p>
        </div>

        {error && <div className="bg-destructive/10 text-destructive p-3 rounded-lg mb-4 text-sm text-center">{error}</div>}
        {notification && <div className="bg-primary/10 text-primary p-3 rounded-lg mb-4 text-sm text-center">{notification}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-foreground">아이디</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={username}
                onChange={handleUsernameChange}
                required
                className={`flex-1 px-4 py-2 border rounded-xl bg-background text-foreground focus:outline-none transition-colors ${usernameError ? 'border-red-500' : 'border-border focus:border-primary'}`}
                placeholder="영문 소문자 + 숫자 4~20자"
              />
              <button
                type="button"
                onClick={handleCheckUsername}
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap ${isUsernameAvailable ? 'bg-green-500 text-white' : 'bg-muted text-foreground hover:bg-muted/80'}`}
              >
                {isUsernameAvailable ? '확인 완료' : '중복 확인'}
              </button>
            </div>
            {usernameError && <p className="text-red-500 text-xs mt-1 font-medium">{usernameError}</p>}
          </div>

          <button
            type="submit"
            disabled={loading || !isUsernameAvailable}
            className="mt-2 w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? '설정 중...' : '아이디 설정 완료'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default OAuthUsernameSetupPage;
