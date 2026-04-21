import React, { useState, useEffect } from 'react';
import jwtAxios from '../../api/jwtAxios';
import { useAuth } from '../../components/sidebar/AuthContext';
import { FiEye, FiCheck, FiX } from 'react-icons/fi';

const SuggestionManagementTab = ({ fetchStats }) => {
  const { token } = useAuth();
  const [suggestions, setSuggestions] = useState([]);
  const [isSeenFilter, setIsSeenFilter] = useState('false'); // 'false', 'true', 'all'
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [suggestionModal, setSuggestionModal] = useState(null);

  const fetchSuggestions = async () => {
    try {
      let filterValue = undefined;
      if (isSeenFilter === 'true') filterValue = true;
      if (isSeenFilter === 'false') filterValue = false;

      const response = await jwtAxios.get('admin/suggestions', {
        params: {
          isSeen: filterValue,
          page,
          size: 10
        }
      });
      setSuggestions(response.data.content);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    }
  };

  useEffect(() => {
    fetchSuggestions();
    // eslint-disable-next-line
  }, [page, isSeenFilter]);

  const handleMarkAsSeen = async (id) => {
    try {
      await jwtAxios.put(`admin/suggestions/${id}/seen`);
      setSuggestionModal(null);
      fetchSuggestions();
      fetchStats();
    } catch (error) {
      console.error('Mark as seen error:', error);
      alert('오류가 발생했습니다.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <select 
          className="w-full sm:w-auto px-4 py-2 bg-background border border-border rounded-xl focus:outline-none"
          value={isSeenFilter}
          onChange={(e) => { setIsSeenFilter(e.target.value); setPage(0); }}
        >
          <option value="false">미확인 건의사항</option>
          <option value="true">확인된 건의사항</option>
          <option value="all">전체보기</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/5 text-sm text-muted-foreground">
              <th className="py-3 px-4 font-semibold w-24">카테고리</th>
              <th className="py-3 px-4 font-semibold">제목</th>
              <th className="py-3 px-4 font-semibold">상태</th>
              <th className="py-3 px-4 font-semibold text-right">상세</th>
            </tr>
          </thead>
          <tbody>
            {suggestions.map(suggestion => (
              <tr key={suggestion.id} className="border-b border-border hover:bg-muted/5 transition-colors">
                <td className="py-3 px-4">
                  <span className="px-2 py-1 bg-primary/10 text-primary rounded-md text-xs font-bold">
                    {suggestion.category}
                  </span>
                </td>
                <td className="py-3 px-4 font-medium">{suggestion.title}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                    !suggestion.isSeen ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                    'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                  }`}>
                    {!suggestion.isSeen ? '미확인' : '확인됨'}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <button 
                    onClick={() => setSuggestionModal(suggestion)}
                    className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                  >
                    <FiEye />
                  </button>
                </td>
              </tr>
            ))}
            {suggestions.length === 0 && (
              <tr>
                <td colSpan="4" className="py-8 text-center text-muted-foreground">건의사항 내역이 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                page === i ? 'bg-primary text-primary-foreground' : 'bg-muted/10 hover:bg-muted/20 text-foreground'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* Suggestion Detail Modal */}
      {suggestionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-2xl max-w-2xl w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">건의사항 상세 내역</h3>
              <button onClick={() => setSuggestionModal(null)} className="text-muted-foreground hover:text-foreground">
                <FiX className="w-6 h-6" />
              </button>
            </div>
            
            <div className="mb-4">
              <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-lg text-sm font-bold mb-2">
                {suggestionModal.category}
              </span>
              <h4 className="text-2xl font-bold">{suggestionModal.title}</h4>
            </div>

            <div className="mb-8">
              <p className="p-5 bg-muted/5 rounded-xl border border-border whitespace-pre-wrap leading-relaxed min-h-[150px]">
                {suggestionModal.details}
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <button onClick={() => setSuggestionModal(null)} className="px-6 py-2.5 rounded-xl border border-border hover:bg-muted/5 font-semibold">
                닫기
              </button>
              {!suggestionModal.isSeen && (
                <button 
                  onClick={() => handleMarkAsSeen(suggestionModal.id)} 
                  className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold flex items-center gap-2"
                >
                  <FiCheck /> 확인 처리
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuggestionManagementTab;
