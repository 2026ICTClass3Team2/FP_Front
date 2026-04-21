import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiAlertTriangle, FiUsers, FiX } from 'react-icons/fi';
import jwtAxios from '../../api/jwtAxios';
import PostCard from '../../components/feed/PostCard';
import CommunityPostDetail from '../../components/feed/CommunityPostDetail';
import ReportModal from '../../components/common/ReportModal';
import Modal from '../../components/common/Modal';

const ChannelDetail = () => {
  const { channelId } = useParams();
  const navigate = useNavigate();

  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [subscribeLoading, setSubscribeLoading] = useState(false);

  // 게시글 무한 스크롤
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  const lastPostIdRef = useRef(null);
  const isLoadingRef = useRef(false);
  const observerTarget = useRef(null);

  // 모달 상태
  const [selectedPost, setSelectedPost] = useState(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isSubscribersOpen, setIsSubscribersOpen] = useState(false);
  const [subscribers, setSubscribers] = useState([]);
  const [subscribersLoading, setSubscribersLoading] = useState(false);

  const fetchChannelDetail = useCallback(async () => {
    try {
      const res = await jwtAxios.get(`channels/${channelId}`);
      setChannel(res.data);
    } catch (err) {
      setError(err.response?.data?.message || '채널 정보를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, [channelId]);

  const fetchPosts = useCallback(async () => {
    if (isLoadingRef.current || !hasNextPage) return;

    setPostsLoading(true);
    isLoadingRef.current = true;

    try {
      let url = `channels/${channelId}/posts?size=10`;
      if (lastPostIdRef.current) {
        url += `&lastPostId=${lastPostIdRef.current}`;
      }

      const res = await jwtAxios.get(url);
      const data = res.data;

      if (data.content && data.content.length > 0) {
        setPosts((prev) => [...prev, ...data.content]);
        lastPostIdRef.current = String(data.content[data.content.length - 1].postId);
      }
      setHasNextPage(!data.last);
    } catch (err) {
      if (err.response?.status !== 404) {
        console.error('채널 게시글 로드 실패', err);
      }
      setHasNextPage(false);
    } finally {
      setPostsLoading(false);
      isLoadingRef.current = false;
    }
  }, [channelId, hasNextPage]);

  useEffect(() => {
    fetchChannelDetail();
  }, [fetchChannelDetail]);

  useEffect(() => {
    fetchPosts();
  }, [channelId]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isLoadingRef.current) {
          fetchPosts();
        }
      },
      { threshold: 0.5 }
    );
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [hasNextPage, fetchPosts]);

  const handleSubscribe = async () => {
    setSubscribeLoading(true);
    try {
      if (channel.subscribed) {
        await jwtAxios.delete(`channels/${channelId}/subscribe`);
        setChannel((prev) => ({
          ...prev,
          subscribed: false,
          followerCount: prev.followerCount - 1,
        }));
      } else {
        await jwtAxios.post(`channels/${channelId}/subscribe`);
        setChannel((prev) => ({
          ...prev,
          subscribed: true,
          followerCount: prev.followerCount + 1,
        }));
      }
    } catch (err) {
      alert(err.response?.data?.message || '오류가 발생했습니다.');
    } finally {
      setSubscribeLoading(false);
    }
  };

  const openSubscribersModal = async () => {
    setIsSubscribersOpen(true);
    setSubscribersLoading(true);
    try {
      const res = await jwtAxios.get(`channels/${channelId}/subscribers`);
      setSubscribers(res.data);
    } catch (err) {
      setSubscribers([]);
    } finally {
      setSubscribersLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 text-center">
        <p className="text-red-500">{error}</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-primary underline text-sm">돌아가기</button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto w-full px-4 py-6">

      {/* 채널 헤더 */}
      <div className="bg-surface border border-border rounded-2xl p-6 mb-6">

        {/* 채널 이미지 + 기본 정보 */}
        <div className="flex items-start gap-5">
          {channel.imageUrl ? (
            <img
              src={channel.imageUrl}
              alt={channel.name}
              className="w-20 h-20 rounded-2xl object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center flex-shrink-0">
              <span className="text-3xl font-bold text-primary">{channel.name?.[0]?.toUpperCase()}</span>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-foreground truncate">{channel.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">운영자: @{channel.ownerUsername}</p>

            {/* 통계 */}
            <div className="flex items-center gap-4 mt-3">
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">{channel.followerCount?.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">구독자</p>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">{channel.postCount?.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">게시글</p>
              </div>
            </div>
          </div>
        </div>

        {/* 채널 설명 */}
        <p className="mt-4 text-sm text-foreground leading-relaxed">{channel.description}</p>

        {/* 기술 스택 태그 */}
        {channel.techStacks?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {channel.techStacks.map((tech) => (
              <span
                key={tech}
                className="px-3 py-1 text-xs font-bold rounded-full bg-primary/10 text-primary border border-primary/20"
              >
                {tech}
              </span>
            ))}
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="flex items-center gap-2 mt-5">
          {/* 구독 / 구독 취소 */}
          <button
            onClick={handleSubscribe}
            disabled={subscribeLoading}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-colors disabled:opacity-50 ${
              channel.subscribed
                ? 'bg-muted text-foreground hover:bg-muted/80 border border-border'
                : 'btn-primary'
            }`}
          >
            {subscribeLoading ? '처리 중...' : channel.subscribed ? '구독 취소' : '구독하기'}
          </button>

          {/* 구독자 목록 */}
          <button
            onClick={openSubscribersModal}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-border text-foreground hover:bg-muted/5 transition-colors text-sm font-semibold"
          >
            <FiUsers size={16} />
            구독자
          </button>

          {/* 신고 */}
          <button
            onClick={() => setIsReportOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-border text-muted-foreground hover:text-red-500 hover:border-red-300 transition-colors text-sm font-semibold"
          >
            <FiAlertTriangle size={16} />
            신고
          </button>
        </div>
      </div>

      {/* 채널 피드 */}
      <h2 className="text-lg font-bold text-foreground mb-4">채널 게시글</h2>

      <div className="flex flex-col gap-5">
        {posts.map((post) => (
          <PostCard
            key={post.postId}
            post={post}
            onEdit={() => {}}
            onDelete={() => {}}
            onDetailClick={() => setSelectedPost(post)}
            onComment={() => setSelectedPost(post)}
            onReportSuccess={() => setPosts((prev) => prev.filter((p) => p.postId !== post.postId))}
          />
        ))}
      </div>

      {posts.length === 0 && !postsLoading && (
        <div className="text-center py-10 text-muted-foreground">이 채널에 게시글이 없습니다.</div>
      )}

      {/* 무한 스크롤 감지 */}
      <div ref={observerTarget} className="h-14 flex items-center justify-center mt-4">
        {postsLoading && (
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {/* 게시글 상세 모달 */}
      {selectedPost && (
        <CommunityPostDetail
          post={selectedPost}
          autoScrollToComment={false}
          onClose={(updatedPost) => {
            if (updatedPost) {
              setPosts((prev) => prev.map((p) => (p.postId === updatedPost.postId ? updatedPost : p)));
            }
            setSelectedPost(null);
          }}
        />
      )}

      {/* 신고 모달 */}
      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        targetType="channel"
        targetId={Number(channelId)}
        onSuccess={() => setIsReportOpen(false)}
      />

      {/* 구독자 목록 모달 */}
      <Modal isOpen={isSubscribersOpen} onClose={() => setIsSubscribersOpen(false)} title="구독자 목록">
        {subscribersLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : subscribers.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">구독자가 없습니다.</p>
        ) : (
          <div className="flex flex-col gap-3 max-h-96 overflow-y-auto">
            {subscribers.map((sub) => (
              <div key={sub.userId} className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/5 transition-colors">
                {sub.profilePicUrl ? (
                  <img src={sub.profilePicUrl} alt={sub.nickname} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">{sub.nickname?.[0]?.toUpperCase()}</span>
                  </div>
                )}
                <div>
                  <p className="font-semibold text-foreground text-sm">{sub.nickname}</p>
                  <p className="text-xs text-muted-foreground">@{sub.username}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ChannelDetail;
