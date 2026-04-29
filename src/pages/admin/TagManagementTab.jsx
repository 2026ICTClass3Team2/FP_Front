import React, { useState, useEffect } from 'react';
import jwtAxios from '../../api/jwtAxios';
import { FiSearch, FiPlus, FiTrash2, FiX } from 'react-icons/fi';

const TagManagementTab = () => {
  const [tags, setTags] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchTags = async () => {
    try {
      const res = await jwtAxios.get('admin/tags');
      setTags(res.data);
    } catch {
      alert('태그 목록을 불러오지 못했습니다.');
    }
  };

  useEffect(() => { fetchTags(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    const name = newTagName.trim();
    if (!name) return;
    setIsAdding(true);
    try {
      const res = await jwtAxios.post('admin/tags', { name });
      setTags(prev => [...prev, res.data]);
      setNewTagName('');
    } catch (err) {
      alert(err.response?.data?.message || '태그 추가에 실패했습니다.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await jwtAxios.delete(`admin/tags/${deleteTarget.id}`);
      setTags(prev => prev.filter(t => t.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      alert('태그 삭제에 실패했습니다.');
    }
  };

  const filtered = keyword.trim()
    ? tags.filter(t => t.name.toLowerCase().includes(keyword.toLowerCase()))
    : tags;

  return (
    <div className="space-y-6">
      {/* 추가 폼 */}
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          value={newTagName}
          onChange={e => setNewTagName(e.target.value)}
          placeholder="새 태그 이름 입력 (예: Flutter)"
          maxLength={50}
          className="flex-1 px-4 py-2 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <button
          type="submit"
          disabled={isAdding || !newTagName.trim()}
          className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <FiPlus className="w-4 h-4" />
          추가
        </button>
      </form>

      {/* 검색 */}
      <div className="relative w-72">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="태그 검색"
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {/* 태그 목록 */}
      <div className="flex flex-wrap gap-2">
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground py-4">태그가 없습니다.</p>
        )}
        {filtered.map(tag => (
          <span
            key={tag.id}
            className="group flex items-center gap-1.5 px-3 py-1.5 bg-muted/30 border border-border rounded-full text-sm font-medium"
          >
            #{tag.name}
            <button
              onClick={() => setDeleteTarget(tag)}
              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-all"
              title="삭제"
            >
              <FiX className="w-3.5 h-3.5" />
            </button>
          </span>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">전체 {tags.length}개 태그</p>

      {/* 삭제 확인 모달 */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-red-500">태그 삭제</h3>
            <p className="text-sm text-foreground">
              <span className="font-bold">#{deleteTarget.name}</span> 태그를 삭제하시겠습니까?<br />
              <span className="text-muted-foreground text-xs">해당 태그가 사용된 게시글에서도 제거됩니다.</span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-border hover:bg-muted/5 font-semibold"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TagManagementTab;
