import React, { useState } from 'react';
import { FiSend } from 'react-icons/fi';
import jwtAxios from '../../api/jwtAxios';

const SuggestionTab = () => {
  const [category, setCategory] = useState('feature');
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const categories = [
    { id: 'feature', label: '기능 제안' },
    { id: 'bug', label: '버그 제보' },
    { id: 'content', label: '콘텐츠 문의' },
    { id: 'other', label: '기타' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !details) return;

    setLoading(true);
    setMessage('');

    try {
      await jwtAxios.post('/suggestions', {
        category,
        title,
        details
      });
      setMessage('제안이 소중하게 전달되었습니다! 감사합니다.');
      setTitle('');
      setDetails('');
    } catch (error) {
      console.error('Failed to submit suggestion:', error);
      setMessage('제안 제출에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-foreground">건의사항</h3>
        <p className="text-sm text-muted-foreground mt-1">
          서비스 발전을 위한 소중한 의견을 기다립니다.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5 flex-1 overflow-y-auto pr-2 custom-scrollbar">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-foreground">카테고리</label>
          <div className="grid grid-cols-2 gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`py-2 px-3 text-xs rounded-lg border transition-all ${
                  category === cat.id
                    ? 'bg-primary/10 border-primary text-primary font-bold'
                    : 'bg-muted/30 border-border text-muted-foreground hover:bg-muted/50'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-foreground">제목</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제안의 제목을 입력하세요"
            maxLength={100}
            className="w-full px-4 py-2.5 bg-muted/20 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
            required
          />
          <div className={`text-right text-xs ${title.length >= 100 ? 'text-red-500 font-medium' : title.length >= 90 ? 'text-orange-400' : 'text-muted-foreground'}`}>
            {title.length} / 100
          </div>
        </div>

        <div className="flex flex-col gap-2 flex-1">
          <label className="text-sm font-semibold text-foreground">상세 내용</label>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="제안 내용을 상세히 입력해주세요..."
            maxLength={1000}
            className="w-full flex-1 px-4 py-3 bg-muted/20 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm resize-none"
            required
          />
          <div className={`text-right text-xs ${details.length >= 1000 ? 'text-red-500 font-medium' : details.length >= 900 ? 'text-orange-400' : 'text-muted-foreground'}`}>
            {details.length} / 1000
          </div>
        </div>

        {message && (
          <div className={`p-3 rounded-lg text-xs text-center ${
            message.includes('실패') ? 'bg-destructive/10 text-destructive' : 'bg-green-500/10 text-green-500'
          }`}>
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !title || !details}
          className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed mt-auto"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
          ) : (
            <>
              <FiSend size={18} />
              제안 보내기
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default SuggestionTab;
