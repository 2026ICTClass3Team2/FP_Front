import React from 'react';
import { Link } from 'react-router-dom';
import { FiThumbsUp, FiMessageSquare, FiClock } from 'react-icons/fi';

const PostItem = ({ post, onPostClick }) => {
  const postUrl = `/${post.contentType}/${post.id}`;
  // Format date to include time (24-hour format)
  const formattedDateTime = new Date(post.createdAt).toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false, // Use 24-hour format
  });

  const content = (
    <>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${post.contentType === 'qna' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
          {post.contentType === 'qna' ? 'Q&A' : '피드'}
        </span>
        <span className="text-sm text-muted-foreground">{post.authorName}</span>
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2 truncate">{post.title}</h3>
      <div className="flex items-center text-sm text-muted-foreground gap-4">
        <div className="flex items-center gap-1">
          <FiThumbsUp className="w-4 h-4" />
          <span>{post.likeCount || 0}</span>
        </div>
        <div className="flex items-center gap-1">
          <FiMessageSquare className="w-4 h-4" />
          <span>{post.commentCount}</span>
        </div>
        <div className="flex items-center gap-1 ml-auto">
          <FiClock className="w-4 h-4" />
          <span>{formattedDateTime}</span>
        </div>
      </div>
    </>
  );

  return (
    <li className="border-b border-border last:border-b-0">
      {onPostClick ? (
        <button type="button" onClick={() => onPostClick(post)} className="w-full text-left block p-4 hover:bg-accent/50 transition-colors">
          {content}
        </button>
      ) : (
        <Link to={postUrl} className="block p-4 hover:bg-accent/50 transition-colors">
          {content}
        </Link>
      )}
    </li>
  );
};

const PostList = ({ posts, emptyMessage = "게시글이 없습니다.", onPostClick }) => {
  if (!posts || posts.length === 0) {
    return <div className="text-center py-20 text-muted-foreground">{emptyMessage}</div>;
  }

  return (
    <ul className="bg-card border border-border rounded-xl">
      {posts.map(post => (
        <PostItem key={post.id} post={post} onPostClick={onPostClick} />
      ))}
    </ul>
  );
};

export default PostList;