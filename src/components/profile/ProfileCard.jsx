import React from 'react';
import { useParams } from 'react-router-dom';

const ProfileCard = () => {
  const { userId } = useParams(); // 주소창의 :userId 값을 읽어옴

  return (
    <div>
      {/* 상단 정보 */}
      <div>
        <div>이미지 영역</div>
        <div>
          <h2>{userId}님의 프로필</h2>
          <p>@{userId}</p>
        </div>
        <div>
          <button>팔로우</button>
          <button>차단</button>
          <button>신고</button>
        </div>
      </div>

      {/* 통계 */}
      <ul>
        <li>게시글 수: 1</li>
        <li>포인트: 450</li>
        <li>좋아요: 200</li>
      </ul>

      {/* 활동 내역 */}
      <div>
        <h3>최근 게시글</h3>
        <div>
          <h4>게시글 제목</h4>
          <p>내용 요약...</p>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;