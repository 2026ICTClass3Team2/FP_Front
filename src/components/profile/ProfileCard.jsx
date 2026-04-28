import { FiEdit2, FiMail, FiCalendar, FiUser, FiAward } from 'react-icons/fi';

const ProfileCard = ({ profile, onEdit, onPointShop }) => {
  return (
    <div className="flex flex-col sm:flex-row items-start bg-surface rounded-2xl shadow p-6 sm:p-12 border border-border w-full mx-auto gap-6 sm:gap-0">
      {/* 프로필 이미지 */}
      <div className="w-24 h-24 sm:w-32 sm:h-32 bg-primary flex items-center justify-center text-primary-foreground text-4xl sm:text-5xl font-bold sm:mr-12 select-none border border-border overflow-hidden shrink-0 self-center sm:self-start">
        {profile.profilePicUrl ? (
          <img src={profile.profilePicUrl} alt="프로필" className="w-full h-full object-cover" />
        ) : (
          (profile.nickname?.[0] || '닉')
        )}
      </div>

      <div className="flex-1 flex flex-col gap-2">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <span className="text-3xl font-bold text-foreground">{profile.nickname}</span>
              <button
                className="flex items-center gap-2 px-4 py-2 text-base font-semibold border border-border bg-background text-foreground rounded-xl hover:bg-secondary transition-colors cursor-pointer"
                onClick={onEdit}
              >
                <FiEdit2 className="w-5 h-5" /> 프로필 수정
              </button>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground text-lg mb-1">
              <FiUser className="w-5 h-5" /> @{profile.username}
            </div>
            <div className="flex items-center gap-3 text-muted-foreground text-lg mb-1">
              <FiMail className="w-5 h-5" /> {profile.email}
            </div>
            <div className="flex items-center gap-3 text-yellow-500 font-bold text-xl mt-3">
              <FiAward className="w-6 h-6" />
              <span className="mr-2">{profile.currentPoint} 포인트</span>
              <button onClick={onPointShop} className="flex items-center gap-2 px-3 py-1.5 text-base font-semibold border border-yellow-500/30 bg-yellow-500/10 text-yellow-500 rounded-xl hover:bg-yellow-500/20 transition-colors ml-3 cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
                  fill="none" stroke="#f0b100" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13.744 17.736a6 6 0 1 1-7.48-7.48"/>
                  <path d="M15 6h1v4"/>
                  <path d="m6.134 14.768.866-.5 2 3.464"/>
                  <circle cx="16" cy="8" r="6"/>
                </svg>
                포인트샵
              </button>

            </div>
          </div>
          
        </div>
        <div className="mt-4 sm:mt-7">
          <div className="font-bold text-base sm:text-lg mb-3 text-foreground">관심 기술 스택</div>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {profile.techStacks && profile.techStacks.length > 0 ? (
              profile.techStacks.map((tech) => (
                <span key={tech} className="px-3 py-1.5 sm:px-4 sm:py-2 bg-muted text-foreground rounded-full text-sm sm:text-base font-semibold border border-border">
                  {tech}
                </span>
              ))
            ) : (
              <span className="text-sm sm:text-base text-muted-foreground">관심 기술 없음</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;