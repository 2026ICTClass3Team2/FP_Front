import React from 'react'
import { Link } from 'react-router-dom'
import Modal from '../../components/common/Modal';
import FeedCard from '../../components/feed/FeedCard';

const MainFeed = () => {
    
    return (
        <div>
            {/* 새 게시물 작성 버튼 */}
            <div>
               <button>새 게시물 작성</button>
            </div>

            {/* 피드 목록 */}
            <div>

                <article>

                    <div>
                        <Link to='/'>
                            <span>프로필 이미지</span>
                            <span>닉네임</span>
                            <span>@사용자명</span>
                        </Link>
                        <div>날짜</div>


                        {/* 오른쪽 메뉴 아이콘 (⋯) */}
                        <button>⋯</button>
                    </div>

                    {/* 게시물 본문 - 클릭하면 모달 열림 */}
                    <div>

                    </div>

                    {/* 태그 */}
                    <div>

                        <span>태그</span>

                    </div>

                    {/* 액션 버튼들 */}
                    <div>
                        <button>❤️ 좋아요</button>
                        <button>💬 댓글  </button>
                        <button>🔗 공유</button>
                        <button>🔖 북마크</button>
                    </div>
                </article>
                <Modal title="새 게시물 작성">
                  {/* FeedCard에 닫기 기능을 전달 */}
                    <FeedCard/> 
                </Modal>
            </div>


        </div>
    );
};
export default MainFeed