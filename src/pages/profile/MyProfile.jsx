import React, { useEffect, useState } from 'react';
import jwtAxios from '../../api/jwtAxios';
import ProfileCard from '../../components/profile/ProfileCard';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import AlertModal from '../../components/common/AlertModal';
import Modal from '../../components/common/Modal';
import PasswordEditForm from '../../components/profile/PasswordEditForm';
import ProfileEditForm from '../../components/profile/ProfileEditForm';
import TechStackModal from '../../components/auth/TechStackModal';
import EmailVerifyModal from '../../components/profile/EmailVerifyModal';

const initialProfile = {
  profilePicUrl: null,
  nickname: '',
  username: '',
  email: '',
  registeredAt: '',
  currentPoint: 0,
  techStacks: [],
  provider: 'local',
};

const MyProfile = () => {
  const [profile, setProfile] = useState(initialProfile);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPasswordSuccess, setShowPasswordSuccess] = useState(false);
  const [showEmailVerify, setShowEmailVerify] = useState(false);
  const [pendingProfile, setPendingProfile] = useState(null);
  const [pendingEmail, setPendingEmail] = useState('');

  // 프로필 정보 불러오기
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await jwtAxios.get('/mypage/profile');
        setProfile(res.data);
      } catch (err) {
        setError(err.response?.data?.message || '프로필 정보를 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) return <div className="flex justify-center items-center h-96">로딩 중...</div>;

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      {/* 글로벌 메시지 */}
      {error && <div className="mb-4 text-red-500 text-center font-semibold">{error}</div>}
      {success && <div className="mb-4 text-green-600 text-center font-semibold">{success}</div>}
      <ProfileCard profile={profile} onEdit={() => setShowEditModal(true)} onPassword={() => setShowPasswordModal(true)} />
      {/* 프로필 수정 모달 */}
      {showEditModal && (
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="프로필 수정"
        >
          <ProfileEditForm
            initial={profile}
            onPasswordChange={profile.provider === 'local' ? () => setShowPasswordModal(true) : undefined}
            onSubmit={async (form) => {
              // 이메일이 변경된 경우 인증 플로우로 분기
              if (form.email !== profile.email) {
                try {
                  await jwtAxios.post('/mypage/email/request', { email: form.email });
                  setPendingProfile(form);
                  setPendingEmail(form.email);
                  setShowEmailVerify(true);
                } catch (err) {
                  setError(err.response?.data?.message || '이메일 인증 요청 실패');
                  setSuccess('');
                }
                return;
              }
              // 이메일 변경이 없으면 기존대로 저장
              try {
                await jwtAxios.put('/mypage/profile', form);
                const res = await jwtAxios.get('/mypage/profile');
                setProfile(res.data);
                setShowEditModal(false);
                setSuccess('프로필이 성공적으로 수정되었습니다.');
                setError('');
                setTimeout(() => setSuccess(''), 2500);
              } catch (err) {
                setError(err.response?.data?.message || '프로필 수정 실패');
                setSuccess('');
              }
            }}
            onCancel={() => setShowEditModal(false)}
          />
          {/* 이메일 인증번호 입력 모달 */}
          {showEmailVerify && (
            <EmailVerifyModal
              isOpen={showEmailVerify}
              onClose={() => { setShowEmailVerify(false); setPendingProfile(null); setPendingEmail(''); }}
              email={pendingEmail}
              onVerify={async (code) => {
                try {
                  await jwtAxios.post('/mypage/email/verify', { email: pendingEmail, code });
                  // 인증 성공 시 실제 프로필 저장
                  await jwtAxios.put('/mypage/profile', { ...pendingProfile, email: pendingEmail });
                  const res = await jwtAxios.get('/mypage/profile');
                  setProfile(res.data);
                  setShowEditModal(false);
                  setShowEmailVerify(false);
                  setPendingProfile(null);
                  setPendingEmail('');
                  setSuccess('이메일이 성공적으로 변경되었습니다.');
                  setError('');
                  setTimeout(() => setSuccess(''), 2500);
                } catch (err) {
                  throw new Error(err.response?.data?.message || '이메일 인증 실패');
                }
              }}
              onResend={async () => {
                try {
                  await jwtAxios.post('/mypage/email/request', { email: pendingEmail });
                } catch (err) {
                  throw new Error(err.response?.data?.message || '인증번호 재전송 실패');
                }
              }}
            />
          )}
          {/* 비밀번호 변경 중첩 모달 */}
          {showPasswordModal && (
            <>
              <PasswordEditForm
                isOpen={showPasswordModal}
                onSubmit={async (form, setFormError, setFormSuccess) => {
                  try {
                    await jwtAxios.put('/mypage/password', form);
                    setShowPasswordSuccess(true);
                  } catch (err) {
                    const errorMessage = err.response?.data?.message || '비밀번호 변경 실패';
                    // 모달 내부에 에러 메시지 표시
                    if (typeof setFormError === 'function') {
                      setFormError(errorMessage);
                    } else {
                      setError(errorMessage);
                    }
                    setSuccess('');
                    throw new Error(errorMessage);
                  }
                }}
                onCancel={() => setShowPasswordModal(false)}
              />
              {showPasswordSuccess && (
                <AlertModal
                  isOpen={showPasswordSuccess}
                  onClose={() => {
                    setShowPasswordSuccess(false);
                    setShowPasswordModal(false);
                  }}
                  title="비밀번호 변경 완료"
                  message="비밀번호가 성공적으로 변경되었습니다."
                  confirmText="확인"
                />
              )}
            </>
          )}
        </Modal>
      )}
      {/* 비밀번호 수정 모달(중첩) 제거: 상단에서 중첩 렌더링됨 */}
    </div>
  );
};

export default MyProfile;
