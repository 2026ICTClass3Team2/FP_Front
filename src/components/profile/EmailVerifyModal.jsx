import React, { useState, useEffect, useRef } from 'react';


const RESEND_INTERVAL = 180; // 3분(초)

const EmailVerifyModal = ({ isOpen, onClose, onVerify, email, onResend }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(RESEND_INTERVAL);
  const timerRef = useRef();
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setTimer(RESEND_INTERVAL);
    setCode('');
    setError('');
    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [isOpen, email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await onVerify(code);
    } catch (err) {
      setError(err.message || '인증에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0 || resending) return;
    setResending(true);
    setError('');
    try {
      await onResend();
      setTimer(RESEND_INTERVAL);
      timerRef.current = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError(err.message || '재전송 실패');
    } finally {
      setResending(false);
    }
  };

  if (!isOpen) return null;

  const min = String(Math.floor(timer / 60)).padStart(2, '0');
  const sec = String(timer % 60).padStart(2, '0');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border border-border">
        <h2 className="text-xl font-bold mb-4 text-foreground">이메일 인증</h2>
        <p className="mb-2 text-sm text-muted-foreground">{email}로 인증번호가 발송되었습니다.<br/>메일함을 확인해 주세요.</p>
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs text-gray-500">남은 시간: <span className="font-mono">{min}:{sec}</span></span>
          <button
            type="button"
            onClick={handleResend}
            disabled={timer > 0 || resending}
            className={`text-xs font-semibold px-3 py-1 rounded-lg border ml-2 ${timer > 0 || resending ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-primary text-white border-primary hover:bg-primary-dark'}`}
          >
            {resending ? '재전송 중...' : '인증번호 재전송'}
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value)}
            className="w-full border border-border rounded-xl px-3 py-2 bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="인증번호 입력"
            required
          />
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <div className="flex justify-end gap-2 mt-2">
            <button type="button" onClick={onClose} className="px-5 py-2 rounded-xl bg-gray-100 text-gray-900 font-semibold hover:bg-gray-200 transition-colors">취소</button>
            <button type="submit" disabled={loading} className="px-5 py-2 rounded-xl bg-black text-white font-bold hover:bg-gray-900 transition-colors">{loading ? '확인 중...' : '인증 확인'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmailVerifyModal;
