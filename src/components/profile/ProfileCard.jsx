import { FiEdit2, FiMail, FiUser, FiCode } from 'react-icons/fi';

const ProfileCard = ({ profile, onEdit, onPointShop }) => {
  const initial = (profile.nickname?.[0] || '닉').toUpperCase();

  return (
    <div className="w-full bg-surface border border-border rounded-2xl shadow-md p-10 flex flex-col gap-8">

      {/* 아바타 + 닉네임 */}
      <div className="flex items-center gap-7">
        <div className="relative shrink-0">
          <div className="w-36 h-36 rounded-2xl bg-primary border-2 border-border shadow-lg overflow-hidden flex items-center justify-center text-primary-foreground text-6xl font-bold select-none">
            {profile.profilePicUrl ? (
              <img src={profile.profilePicUrl} alt="프로필" className="w-full h-full object-cover" />
            ) : (
              initial
            )}
          </div>
        </div>

        <div className="flex flex-col min-w-0 gap-1">
          <span className="text-3xl font-extrabold text-foreground leading-tight">{profile.nickname}</span>
          <span className="flex items-center gap-2 text-base text-muted-foreground mt-1">
            <FiUser className="w-4 h-4 shrink-0" />
            @{profile.username}
          </span>
          <span className="flex items-center gap-2 text-base text-muted-foreground">
            <FiMail className="w-4 h-4 shrink-0" />
            <span className="truncate">{profile.email}</span>
          </span>
        </div>
      </div>

      {/* 포인트 + 수정 버튼 */}
      <div className="flex items-center gap-3">
        <button
          onClick={onPointShop}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-amber-500/10 border border-amber-500/30 rounded-xl hover:bg-amber-500/20 transition-all cursor-pointer w-fit"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
            fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13.744 17.736a6 6 0 1 1-7.48-7.48" />
            <path d="M15 6h1v4" />
            <path d="m6.134 14.768.866-.5 2 3.464" />
            <circle cx="16" cy="8" r="6" />
          </svg>
          <span className="text-base font-bold text-amber-600 dark:text-amber-400">
            {(profile.currentPoint ?? 0).toLocaleString()} P
          </span>
        </button>

        <button
          onClick={onEdit}
          className="flex items-center gap-2 px-5 py-3 text-sm font-semibold border border-border bg-background text-foreground rounded-xl hover:bg-secondary transition-colors cursor-pointer shrink-0"
        >
          <FiEdit2 className="w-4 h-4" />
          프로필 수정
        </button>
      </div>

      {/* 구분선 */}
      <div className="h-px bg-border/60" />

      {/* 기술 스택 */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <FiCode className="w-5 h-5 text-primary" />
          <span className="text-base font-bold text-foreground">관심 기술 스택</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {profile.techStacks && profile.techStacks.length > 0 ? (
            profile.techStacks.map((tech) => (
              <span
                key={tech}
                className="px-4 py-2 bg-primary/10 text-primary text-sm font-semibold rounded-full border border-primary/20"
              >
                {tech}
              </span>
            ))
          ) : (
            <span className="text-sm text-muted-foreground italic">등록된 기술 스택이 없습니다.</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;