import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    passwordConfirm: '',
    nickname: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  
  // 추가 기능 상태
  const [isUsernameAvailable, setIsUsernameAvailable] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [selectedTechStack, setSelectedTechStack] = useState([]);

  const techStacks = ['Java', 'Spring', 'React', 'Vue', 'Python', 'Node.js', 'MySQL'];

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    // 사용자가 필드를 수정하면 해당 필드의 유효성 검사 오류를 지웁니다.
    if (validationErrors[name]) {
      setValidationErrors(prevErrors => ({
        ...prevErrors,
        [name]: undefined
      }));
    }
  };

  const handleTechStackToggle = (tech) => {
    if (selectedTechStack.includes(tech)) {
      setSelectedTechStack(selectedTechStack.filter(t => t !== tech));
    } else {
      setSelectedTechStack([...selectedTechStack, tech]);
    }
  };

  const handleCheckUsername = async () => {
    if (!formData.username) return alert('아이디를 입력해주세요.');
    try {
      const response = await fetch(`http://localhost:8080/api/member/check-username?username=${formData.username}`);
      const data = await response.json();

      if (response.ok) {
        if (data.isDuplicate) {
          alert('이미 사용 중인 아이디입니다.');
          setIsUsernameAvailable(false);
        } else {
          alert('사용 가능한 아이디입니다.');
          setIsUsernameAvailable(true);
        }
      } else {
        alert('아이디 중복 확인 중 오류가 발생했습니다.');
        setIsUsernameAvailable(false);
      }
    } catch (error) {
      console.error('Error checking username:', error);
      alert('서버와 통신 중 오류가 발생했습니다.');
      setIsUsernameAvailable(false);
    }
  };

  const handleSendEmail = async () => {
    if (!formData.email) return alert('이메일을 입력해주세요.');
    try {
      const response = await fetch('http://localhost:8080/api/member/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });
      const data = await response.json();
      if (response.ok) {
        alert(data.message || '인증 번호가 전송되었습니다.');
        setEmailSent(true);
      } else {
        throw new Error(data.error || '이메일 발송에 실패했습니다.');
      }
    } catch (err) {
      console.error('Error sending verification email:', err);
      alert(err.message);
    }
  };

  const handleVerifyEmail = async () => {
    if (!verificationCode) return alert('인증 코드를 입력해주세요.');
    try {
      const response = await fetch('http://localhost:8080/api/member/email/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, code: verificationCode }),
      });
      const data = await response.json();
      if (response.ok && data.verified) {
        alert(data.message || '인증에 성공했습니다.');
        setIsEmailVerified(true);
      } else {
        throw new Error(data.error || '인증에 실패했습니다.');
      }
    } catch (err) {
      console.error('Error verifying email code:', err);
      alert(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 이전 에러 초기화
    setError('');
    setValidationErrors({});

    // 프론트엔드 유효성 검사
    if (formData.password !== formData.passwordConfirm) {
      return setError('비밀번호가 일치하지 않습니다.');
    }
    
    if (!isUsernameAvailable) {
      return setError('아이디 중복 확인을 진행해주세요.');
    }
    if (!isEmailVerified) {
      return setError('이메일 인증을 진행해주세요.');
    }

    try {
      setLoading(true);

      const submitData = {
        email: formData.email,
        username: formData.username,
        password: formData.password,
        nickname: formData.nickname,
        techStacks: selectedTechStack
      };

      const response = await fetch('http://localhost:8080/api/member/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw errorData; // 백엔드에서 온 에러 객체를 throw
      }

      const data = await response.json();
      
      if (data.result === 'success') {
        alert('회원가입이 완료되었습니다. 로그인해주세요.');
        navigate('/login');
      } else {
        setError('알 수 없는 오류로 회원가입에 실패했습니다.');
      }
    } catch (err) {
      if (err.error) {
        // 단일 에러 메시지 처리 (예: "이미 사용 중인 이메일입니다.")
        setError(err.error);
      } else if (Object.keys(err).length > 0) {
        // 필드별 유효성 에러 처리
        setValidationErrors(err);
        setError('입력 내용을 다시 확인해주세요.');
      } else {
        setError(err.message || '회원가입 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4 py-12">
      <div className="bg-card p-8 rounded-2xl shadow-sm w-full max-w-lg border border-border">
        <h2 className="text-2xl font-bold mb-6 text-foreground text-center">회원가입</h2>
        {error && <div className="text-destructive mb-4 text-sm text-center">{error}</div>}
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-foreground">이메일</label>
            <div className="flex gap-2">
              <input type="email" name="email" value={formData.email} onChange={handleChange} required disabled={isEmailVerified} className="flex-1 px-4 py-2 border border-border rounded-xl bg-background text-foreground focus:outline-none focus:border-primary disabled:opacity-50" placeholder="testuser@example.com" />
              <button type="button" onClick={handleSendEmail} disabled={isEmailVerified} className="px-4 py-2 bg-muted text-foreground rounded-xl text-sm font-medium hover:bg-muted/80 disabled:opacity-50 whitespace-nowrap">
                {emailSent ? '재발송' : '인증 발송'}
              </button>
            </div>
            {validationErrors.email && <p className="text-destructive text-xs mt-1">{validationErrors.email}</p>}
          </div>
          
          {emailSent && !isEmailVerified && (
            <div className="flex gap-2">
              <input type="text" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} className="flex-1 px-4 py-2 border border-border rounded-xl bg-background text-foreground focus:outline-none focus:border-primary" placeholder="인증 코드 6자리" />
              <button type="button" onClick={handleVerifyEmail} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 whitespace-nowrap">
                확인
              </button>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-foreground">아이디</label>
            <div className="flex gap-2">
              <input type="text" name="username" value={formData.username} onChange={(e) => { handleChange(e); setIsUsernameAvailable(false); }} required className="flex-1 px-4 py-2 border border-border rounded-xl bg-background text-foreground focus:outline-none focus:border-primary" placeholder="testuser123" />
              <button type="button" onClick={handleCheckUsername} className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap ${isUsernameAvailable ? 'bg-green-500 text-white' : 'bg-muted text-foreground hover:bg-muted/80'}`}>
                {isUsernameAvailable ? '확인 완료' : '중복 확인'}
              </button>
            </div>
            {validationErrors.username && <p className="text-destructive text-xs mt-1">{validationErrors.username}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-foreground">비밀번호</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} required className="px-4 py-2 border border-border rounded-xl bg-background text-foreground focus:outline-none focus:border-primary" placeholder="비밀번호 입력" />
            {validationErrors.password && <p className="text-destructive text-xs mt-1">{validationErrors.password}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-foreground">비밀번호 확인</label>
            <input type="password" name="passwordConfirm" value={formData.passwordConfirm} onChange={handleChange} required className="px-4 py-2 border border-border rounded-xl bg-background text-foreground focus:outline-none focus:border-primary" placeholder="비밀번호 다시 입력" />
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-foreground">닉네임</label>
            <input type="text" name="nickname" value={formData.nickname} onChange={handleChange} required className="px-4 py-2 border border-border rounded-xl bg-background text-foreground focus:outline-none focus:border-primary" placeholder="테스트유저" />
            {validationErrors.nickname && <p className="text-destructive text-xs mt-1">{validationErrors.nickname}</p>}
          </div>
          
          {/* 기술 스택 선택 (선택 사항) */}
          <div className="flex flex-col gap-1.5 mt-2">
            <label className="text-sm font-semibold text-foreground">관심 기술 스택 (선택)</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {techStacks.map(tech => (
                <button
                  key={tech}
                  type="button"
                  onClick={() => handleTechStackToggle(tech)}
                  className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                    selectedTechStack.includes(tech)
                      ? 'bg-primary border-primary text-primary-foreground'
                      : 'bg-background border-border text-foreground hover:border-primary'
                  }`}
                >
                  {tech}
                </button>
              ))}
            </div>
          </div>

          <button disabled={loading} type="submit" className="mt-4 w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50">
            {loading ? '가입 중...' : '회원가입'}
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm text-muted">
          이미 계정이 있으신가요? <Link to="/login" className="text-primary font-semibold hover:underline ml-1">로그인</Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;