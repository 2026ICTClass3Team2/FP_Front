import React from 'react';

const PasswordValidation = ({ isVisible, validations }) => {
  if (!isVisible) return null;

  const validCount = Object.values(validations).filter(Boolean).length;
  const progressPercentage = (validCount / 3) * 100;

  return (
    <div className="absolute top-[105%] left-0 w-full z-20 p-4 bg-white border border-gray-200 rounded-xl shadow-2xl flex flex-col gap-3">
      <div className="text-sm font-bold text-gray-800">비밀번호 안전도</div>
      {/* 진행률 바 (Progress Bar) */}
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div 
          className="h-full bg-green-500 transition-all duration-300"
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
      {/* 조건 리스트 */}
      <div className="text-xs space-y-2 font-medium">
        <p className={`flex items-center gap-1.5 transition-colors ${validations.combo ? 'text-green-500' : 'text-gray-400'}`}>
          {validations.combo ? '✔️' : '❌'} 영문/숫자 포함
        </p>
        <p className={`flex items-center gap-1.5 transition-colors ${validations.length ? 'text-green-500' : 'text-gray-400'}`}>
          {validations.length ? '✔️' : '❌'} 8자 이상 32자 이하 입력
        </p>
        <p className={`flex items-center gap-1.5 transition-colors ${validations.noConsecutive ? 'text-green-500' : 'text-gray-400'}`}>
          {validations.noConsecutive ? '✔️' : '❌'} 연속 3자 이상 동일한 문자/숫자 제외
        </p>
      </div>
    </div>
  );
};

export default PasswordValidation;