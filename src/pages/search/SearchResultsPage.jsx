import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { globalSearch } from '../../api/search';
import { usePostModalStore } from '../../stores/postModalStore';
import UserProfileModal from '../../components/common/UserProfileModal';
import { stripHtml } from '../../utils/text';

const TABS = [
  { key: 'all', label: '전체' },
  { key: 'post', label: '포스트' },
  { key: 'qna', label: 'QnA' },
  { key: 'channel', label: '채널' },
  { key: 'user', label: '사용자' },
  { key: 'tag', label: '태그' },
];

const SearchResultsPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';

  const [activeTab, setActiveTab] = useState('all');
  const [results, setResults] = useState({ posts: [], users: [], channels: [], tags: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);

  const { openPost, openQna } = usePostModalStore();

  const feedPosts = results.posts.filter(p => p.contentType !== 'qna');
  const qnaPosts = results.posts.filter(p => p.contentType === 'qna');
  const tags = results.tags || [];

  const fetchResults = useCallback(async () => {
    if (!query.trim()) return;
    setIsLoading(true);
    try {
      const data = await globalSearch(query, 20);
      setResults(data);
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  useEffect(() => {
    fetchResults();
    setActiveTab('all');
  }, [fetchResults]);

  const handleOpenPost = (post) => {
    if (post.contentType === 'qna' && post.qnaId) {
      openQna(post.qnaId);
    } else {
      openPost(Number(post.id));
    }
  };

  const tabCounts = {
    post: feedPosts.length,
    qna: qnaPosts.length,
    channel: results.channels.length,
    user: results.users.length,
    tag: tags.length,
  };

  const renderPostCard = (post) => (
    <div
      key={post.id}
      onClick={() => handleOpenPost(post)}
      className="flex items-start gap-4 p-4 bg-surface border border-border rounded-xl hover:bg-muted/30 cursor-pointer transition-colors"
    >
      {post.thumbnailUrl && (
        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
          <img src={post.thumbnailUrl} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {post.contentType === 'qna' && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${post.isSolved ? 'bg-green-500/10 text-green-500' : 'bg-primary/10 text-primary'}`}>
              {post.isSolved ? '해결됨' : 'QnA'}
            </span>
          )}
        </div>
        <p className="text-sm font-semibold text-foreground line-clamp-1">{post.title}</p>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{stripHtml(post.body || '')}</p>
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          <span className="text-[10px] text-muted-foreground">{post.authorName}</span>
          {(post.tags || []).slice(0, 3).map(tag => (
            <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-muted rounded text-muted-foreground">#{tag}</span>
          ))}
        </div>
      </div>
    </div>
  );

  const renderChannelCard = (channel) => (
    <div
      key={channel.id}
      onClick={() => navigate(`/channels/${channel.id}`)}
      className="flex items-center gap-4 p-4 bg-surface border border-border rounded-xl hover:bg-muted/30 cursor-pointer transition-colors"
    >
      <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-muted">
        {channel.imageUrl
          ? <img src={channel.imageUrl} alt="" className="w-full h-full object-cover" />
          : <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">{channel.name?.charAt(0)}</div>
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{channel.name}</p>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{channel.description}</p>
      </div>
    </div>
  );

  const renderUserCard = (user) => (
    <div
      key={user.id}
      onClick={() => setSelectedUserId(user.id)}
      className="flex items-center gap-3 p-4 bg-surface border border-border rounded-xl hover:bg-muted/30 cursor-pointer transition-colors"
    >
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0 overflow-hidden">
        {user.profilePicUrl
          ? <img src={user.profilePicUrl} alt="" className="w-full h-full object-cover" />
          : user.nickname?.charAt(0)
        }
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{user.nickname}</p>
        <p className="text-xs text-muted-foreground">@{user.username}</p>
      </div>
    </div>
  );

  const EmptyState = ({ message }) => (
    <div className="text-center py-20 text-muted-foreground">
      <p className="text-base font-semibold">{message}</p>
      <p className="text-sm mt-1 opacity-70">다른 검색어를 입력해 보세요</p>
    </div>
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    if (activeTab === 'post') {
      if (feedPosts.length === 0) return <EmptyState message="포스트 검색 결과가 없습니다" />;
      return <div className="flex flex-col gap-3">{feedPosts.map(renderPostCard)}</div>;
    }

    if (activeTab === 'qna') {
      if (qnaPosts.length === 0) return <EmptyState message="QnA 검색 결과가 없습니다" />;
      return <div className="flex flex-col gap-3">{qnaPosts.map(renderPostCard)}</div>;
    }

    if (activeTab === 'channel') {
      if (results.channels.length === 0) return <EmptyState message="채널 검색 결과가 없습니다" />;
      return <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{results.channels.map(renderChannelCard)}</div>;
    }

    if (activeTab === 'user') {
      if (results.users.length === 0) return <EmptyState message="사용자 검색 결과가 없습니다" />;
      return <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">{results.users.map(renderUserCard)}</div>;
    }

    if (activeTab === 'tag') {
      if (tags.length === 0) return <EmptyState message="태그 검색 결과가 없습니다" />;
      return (
        <div className="flex flex-wrap gap-2">
          {tags.map(tag => (
            <button
              key={tag.id}
              onClick={() => navigate('/search?q=' + encodeURIComponent(tag.name))}
              className="px-4 py-2 text-sm font-medium bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors"
            >
              #{tag.name}
            </button>
          ))}
        </div>
      );
    }

    // all tab
    const totalResults = results.posts.length + results.users.length + results.channels.length + tags.length;
    if (totalResults === 0) {
      return (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg font-semibold">검색 결과가 없습니다</p>
          <p className="text-sm mt-1 opacity-70">다른 검색어를 입력해 보세요</p>
        </div>
      );
    }

    return (
      <div className="space-y-10">
        {feedPosts.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-foreground">포스트</h2>
              {feedPosts.length > 3 && (
                <button onClick={() => setActiveTab('post')} className="text-xs text-primary hover:underline">
                  모두 보기 ({feedPosts.length})
                </button>
              )}
            </div>
            <div className="flex flex-col gap-3">{feedPosts.slice(0, 3).map(renderPostCard)}</div>
          </section>
        )}

        {qnaPosts.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-foreground">QnA</h2>
              {qnaPosts.length > 3 && (
                <button onClick={() => setActiveTab('qna')} className="text-xs text-primary hover:underline">
                  모두 보기 ({qnaPosts.length})
                </button>
              )}
            </div>
            <div className="flex flex-col gap-3">{qnaPosts.slice(0, 3).map(renderPostCard)}</div>
          </section>
        )}

        {results.channels.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-foreground">채널</h2>
              {results.channels.length > 4 && (
                <button onClick={() => setActiveTab('channel')} className="text-xs text-primary hover:underline">
                  모두 보기 ({results.channels.length})
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{results.channels.slice(0, 4).map(renderChannelCard)}</div>
          </section>
        )}

        {results.users.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-foreground">사용자</h2>
              {results.users.length > 4 && (
                <button onClick={() => setActiveTab('user')} className="text-xs text-primary hover:underline">
                  모두 보기 ({results.users.length})
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">{results.users.slice(0, 4).map(renderUserCard)}</div>
          </section>
        )}

        {tags.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-foreground">태그</h2>
              {tags.length > 8 && (
                <button onClick={() => setActiveTab('tag')} className="text-xs text-primary hover:underline">
                  모두 보기
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.slice(0, 8).map(tag => (
                <button
                  key={tag.id}
                  onClick={() => navigate('/search?q=' + encodeURIComponent(tag.name))}
                  className="px-3 py-1.5 text-sm font-medium bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors"
                >
                  #{tag.name}
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    );
  };

  const totalCount = results.posts.length + results.users.length + results.channels.length + tags.length;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">
          <span className="text-muted-foreground font-normal">검색 결과: </span>
          "{query}"
        </h1>
        {!isLoading && (
          <p className="text-sm text-muted-foreground mt-1">총 {totalCount}개의 결과</p>
        )}
      </div>

      <div className="flex gap-0 border-b border-border mb-6 overflow-x-auto scrollbar-hide">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 -mb-px ${
              activeTab === tab.key
                ? 'text-primary border-primary'
                : 'text-muted-foreground border-transparent hover:text-foreground'
            }`}
          >
            {tab.label}
            {tab.key !== 'all' && tabCounts[tab.key] > 0 && (
              <span className="ml-1.5 text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">
                {tabCounts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {renderContent()}

      <UserProfileModal
        isOpen={!!selectedUserId}
        onClose={() => setSelectedUserId(null)}
        userId={selectedUserId}
      />
    </div>
  );
};

export default SearchResultsPage;
