import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PasswordValidation from '../../components/auth/PasswordValidation';
import TechStackModal from '../../components/auth/TechStackModal';

const RegisterPage = () => {
  const testURI = import.meta.env.DEV ? 'http://localhost:8090/api/' : '/api/';

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
  const [notification, setNotification] = useState('');
  const [emailError, setEmailError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [passwordConfirmError, setPasswordConfirmError] = useState('');
  
  // 추가 기능 상태
  const [isUsernameAvailable, setIsUsernameAvailable] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [selectedTechStack, setSelectedTechStack] = useState([]);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isTechStackModalOpen, setIsTechStackModalOpen] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [passwordValidations, setPasswordValidations] = useState({
    combo: false,         // 조건 A: 영문/숫자/특수문자 중 2가지 이상
    length: false,        // 조건 B: 8~32자, 공백 제외 
    noConsecutive: false, // 조건 C: 연속 3자 이상 동일 문자 제외
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // 1. 이메일 실시간 검증
    if (name === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (value.length > 0 && !emailRegex.test(value)) {
        setEmailError('❌ 이메일 형식이 올바르지 않습니다.');
      } else {
        setEmailError('');
      }
    }

    // 2. 아이디 실시간 검증
    if (name === 'username') {
      const usernameRegex = /^[a-z0-9]{4,20}$/;
      if (value.length > 0 && !usernameRegex.test(value)) {
        setUsernameError('❌ 아이디는 영문 소문자와 숫자 4~20자리여야 합니다.');
      } else {
        setUsernameError('');
      }
    }

    // 3. 비밀번호 실시간 검증
    if (name === 'password') {
      const hasLetter = /[a-zA-Z]/.test(value);
      const hasNumber = /[0-9]/.test(value);
      const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);
      const comboCount = [hasLetter, hasNumber, hasSpecial].filter(Boolean).length;

      setPasswordValidations({
        combo: comboCount >= 2,
        length: value.length >= 8 && value.length <= 32 && !/\s/.test(value),
        noConsecutive: value.length > 0 && !/(.)\1\1/.test(value),
      });
    }

    // 4. 비밀번호 확인 실시간 검증 (비밀번호나 비밀번호 확인이 변경될 때 모두 체크)
    if (name === 'passwordConfirm' || name === 'password') {
      const checkPassword = name === 'password' ? value : formData.password;
      const checkConfirm = name === 'passwordConfirm' ? value : formData.passwordConfirm;
      
      if (checkConfirm.length > 0 && checkPassword !== checkConfirm) {
        setPasswordConfirmError('❌ 비밀번호가 일치하지 않습니다.');
      } else {
        setPasswordConfirmError('');
      }
    }

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
    if (!formData.username) {
      setError('아이디를 입력해주세요.');
      return;
    }
    if (usernameError) {
      setError('아이디 형식을 먼저 맞춰주세요.');
      return;
    }
    setError('');
    setNotification('');

    try {
      const response = await fetch(`${testURI}member/check-username?username=${formData.username}`);
      const data = await response.json();

      if (response.ok) {
        if (data.isDuplicate) {
          setError('이미 사용 중인 아이디입니다.');
          setIsUsernameAvailable(false);
        } else {
          setNotification('사용 가능한 아이디입니다.');
          setIsUsernameAvailable(true);
        }
      } else {
        setError('아이디 중복 확인 중 오류가 발생했습니다.');
        setIsUsernameAvailable(false);
      }
    } catch (error) {
      console.error('Error checking username:', error);
      setError('서버와 통신 중 오류가 발생했습니다.');
      setIsUsernameAvailable(false);
    }
  };

  const handleSendEmail = async () => {
    if (!formData.email) {
      setError('이메일을 입력해주세요.');
      return;
    }
    setIsSendingEmail(true);
    setError('');
    setNotification('');
    try {
      const response = await fetch(`${testURI}member/email/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });
      const data = await response.json();
      if (response.ok) {
        setNotification(data.message || '인증 번호가 전송되었습니다.');
        setEmailSent(true);
      } else {
        throw new Error(data.error || '이메일 발송에 실패했습니다.');
      }
    } catch (err) {
      console.error('Error sending verification email:', err);
      setError(err.message);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (!verificationCode) return setError('인증 코드를 입력해주세요.');
    setError('');
    setNotification('');
    try {
      const response = await fetch(`${testURI}member/email/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, code: verificationCode }),
      });
      const data = await response.json();
      if (response.ok && data.verified) {
        setNotification(data.message || '인증에 성공했습니다.');
        setIsEmailVerified(true);
      } else {
        throw new Error(data.error || '인증에 실패했습니다.');
      }
    } catch (err) {
      console.error('Error verifying email code:', err);
      setError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 이전 에러 초기화
    setError('');
    setValidationErrors({});
    setNotification('');

    // 프론트엔드 유효성 검사
    if (emailError || usernameError || passwordConfirmError) {
      return setError('입력 형식을 다시 확인해주세요.');
    }

    const isPasswordValid = Object.values(passwordValidations).every(Boolean);
    if (!isPasswordValid) {
      return setError('비밀번호가 유효성 조건을 만족하지 않습니다.');
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

      const response = await fetch(`${testURI}member/signup`, {
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
        navigate('/api/login');
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 py-12">
      
      {/* 헤더 섹션: 로고, 사이트명, 환영 문구 (폼 바깥으로 이동) */}
      <div className="text-center mb-8 w-full max-w-lg">
        <div className="flex justify-center mb-4">
          <div className="bg-primary text-primary-foreground p-3.5 rounded-2xl shadow-sm border border-primary/20">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
            </svg>
          </div>
        </div>
        <h1 className="text-2xl font-extrabold text-foreground mb-2 tracking-tight">Dead Bug 시작하기</h1>
        <p className="text-sm text-muted-foreground">
          지금 가입하고 관심 있는 기술을 가진 동료 개발자를 찾아보세요! 🚀
        </p>
      </div>

      <div className="bg-card p-8 rounded-2xl shadow-sm w-full max-w-lg border border-border">
        <h2 className="text-2xl font-bold mb-6 text-foreground text-center">회원가입</h2>
        
        {error && <div className="bg-destructive/10 text-destructive p-3 rounded-lg mb-4 text-sm text-center">{error}</div>}
        {notification && <div className="bg-primary/10 text-primary p-3 rounded-lg mb-4 text-sm text-center">{notification}</div>}
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-foreground">이메일</label>
            <div className="flex gap-2">
              <input type="email" name="email" value={formData.email} onChange={handleChange} required disabled={isEmailVerified} className={`flex-1 px-4 py-2 border rounded-xl bg-background text-foreground focus:outline-none disabled:opacity-50 transition-colors ${emailError ? 'border-red-500 focus:border-red-500' : 'border-border focus:border-primary'}`} placeholder="testuser@example.com" />
              <button type="button" onClick={handleSendEmail} disabled={isEmailVerified || isSendingEmail} className="px-4 py-2 bg-muted text-foreground rounded-xl text-sm font-medium hover:bg-muted/80 disabled:opacity-50 whitespace-nowrap">
                {isSendingEmail ? '전송 중...' : emailSent ? '재발송' : '인증 발송'}
              </button>
            </div>
            {emailError && <p className="text-red-500 text-xs mt-1 font-medium">{emailError}</p>}
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
              <input type="text" name="username" value={formData.username} onChange={(e) => { handleChange(e); setIsUsernameAvailable(false); }} required className={`flex-1 px-4 py-2 border rounded-xl bg-background text-foreground focus:outline-none transition-colors ${usernameError ? 'border-red-500 focus:border-red-500' : 'border-border focus:border-primary'}`} placeholder="testuser123" />
              <button type="button" onClick={handleCheckUsername} className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap ${isUsernameAvailable ? 'bg-green-500 text-white' : 'bg-muted text-foreground hover:bg-muted/80'}`}>
                {isUsernameAvailable ? '확인 완료' : '중복 확인'}
              </button>
            </div>
            {usernameError && <p className="text-red-500 text-xs mt-1 font-medium">{usernameError}</p>}
            {validationErrors.username && <p className="text-destructive text-xs mt-1">{validationErrors.username}</p>}
          </div>

          <div className="flex flex-col gap-1.5 relative">
            <label className="text-sm font-semibold text-foreground">비밀번호</label>
            <input 
              type="password" 
              name="password" 
              value={formData.password} 
              onChange={handleChange} 
              onFocus={() => setIsPasswordFocused(true)}
              onBlur={() => setIsPasswordFocused(false)}
              required 
              className="px-4 py-2 border border-border rounded-xl bg-background text-foreground focus:outline-none focus:border-primary" 
              placeholder="비밀번호 입력" 
            />
            {validationErrors.password && <p className="text-destructive text-xs mt-1">{validationErrors.password}</p>}
            
            {/* 비밀번호 검증 팝오버 (모달 느낌) */}
            <PasswordValidation isVisible={isPasswordFocused} validations={passwordValidations} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-foreground">비밀번호 확인</label>
            <input type="password" name="passwordConfirm" value={formData.passwordConfirm} onChange={handleChange} required className={`px-4 py-2 border rounded-xl bg-background text-foreground focus:outline-none transition-colors ${passwordConfirmError ? 'border-red-500 focus:border-red-500' : 'border-border focus:border-primary'}`} placeholder="비밀번호 다시 입력" />
            {passwordConfirmError && <p className="text-red-500 text-xs mt-1 font-medium">{passwordConfirmError}</p>}
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-foreground">닉네임</label>
            <input type="text" name="nickname" value={formData.nickname} onChange={handleChange} required className="px-4 py-2 border border-border rounded-xl bg-background text-foreground focus:outline-none focus:border-primary" placeholder="테스트유저" />
            {validationErrors.nickname && <p className="text-destructive text-xs mt-1">{validationErrors.nickname}</p>}
          </div>
          
          {/* 기술 스택 선택 (선택 사항) */}
          <div className="flex flex-col gap-1.5 mt-2">
            <label className="text-sm font-semibold text-foreground">관심 기술 스택 (선택)</label>
            <button
              type="button"
              onClick={() => setIsTechStackModalOpen(true)}
              className="flex items-center justify-between w-full min-h-[46px] p-3 border border-border rounded-xl bg-background text-left focus:outline-none focus:border-primary transition-colors hover:bg-muted/30"
            >
              <div className="flex flex-wrap gap-1.5">
                {selectedTechStack.length > 0 ? (
                  selectedTechStack.map(tech => (
                    <span key={tech} className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-lg shadow-sm">
                      {tech}
                    </span>
                  ))
                ) : (
                  <span className="text-muted-foreground text-sm">관심 있는 기술을 선택해주세요...</span>
                )}
              </div>
              <svg className="w-5 h-5 text-muted-foreground flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>
          </div>

          <button disabled={loading} type="submit" className="mt-4 w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50">
            {loading ? '가입 중...' : '회원가입'}
          </button>
        </form>
        
        <TechStackModal 
          isOpen={isTechStackModalOpen} 
          onClose={() => setIsTechStackModalOpen(false)} 
          selectedTechStack={selectedTechStack} 
          onToggle={handleTechStackToggle} 
        />

        <div className="mt-6 text-center text-sm text-muted">
          이미 계정이 있으신가요? <Link to="/login" className="text-primary font-semibold hover:underline ml-1">로그인</Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;