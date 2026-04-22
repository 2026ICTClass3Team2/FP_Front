import React, { useState, useEffect } from 'react';
import jwtAxios from '../../api/jwtAxios';
import { FiSearch, FiSlash, FiTrash2, FiCheck, FiX } from 'react-icons/fi';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import ChannelDetailModal from './ChannelDetailModal';

const ChannelManagementTab = ({ fetchStats }) => {
  const [channels, setChannels] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  
  const [actionModal, setActionModal] = useState(null); // { channel, type: 'frozen' | 'hidden' }
  const [selectedChannel, setSelectedChannel] = useState(null); // For detail modal

  const fetchChannels = async () => {
    try {
      const response = await jwtAxios.get('admin/channels', {
        params: {
          keyword: keyword || undefined,
          status: statusFilter === 'all' ? undefined : statusFilter,
          page,
          size: 10
        }
      });
      setChannels(response.data.content);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Failed to fetch channels:', error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchChannels();
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line
  }, [keyword, page, statusFilter]);

  const handleStatusChange = async () => {
    if (!actionModal) return;
    try {
      await jwtAxios.put(`admin/channels/${actionModal.channel.id}/status`, null, {
        params: { status: actionModal.type }
      });
      alert('상태가 변경되었습니다.');
      setActionModal(null);
      fetchChannels();
      if (fetchStats) fetchStats();
    } catch (error) {
      console.error('Status change error:', error);
      alert('오류가 발생했습니다.');
      setActionModal(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="채널명, 소유자 닉네임 검색" 
              className="w-full pl-10 pr-10 py-2 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                setPage(0);
              }}
            />
            {keyword && (
              <button 
                onClick={() => { setKeyword(''); setPage(0); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <FiX />
              </button>
            )}
          </div>
        </div>

        <select 
          className="w-full sm:w-auto px-4 py-2 bg-background border border-border rounded-xl focus:outline-none"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
        >
          <option value="all">전체 상태</option>
          <option value="active">활성</option>
          <option value="frozen">정지됨</option>
          <option value="hidden">삭제됨(숨김)</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/5 text-sm text-muted-foreground">
              <th className="py-3 px-4 font-semibold">채널명</th>
              <th className="py-3 px-4 font-semibold">관리자 (소유자)</th>
              <th className="py-3 px-4 font-semibold text-right">구독자/게시물</th>
              <th className="py-3 px-4 font-semibold">상태</th>
              <th className="py-3 px-4 font-semibold">생성일</th>
              <th className="py-3 px-4 font-semibold text-right">작업</th>
            </tr>
          </thead>
          <tbody>
            {channels.map(channel => (
              <tr key={channel.id} className="border-b border-border hover:bg-muted/5 transition-colors group cursor-pointer" onClick={() => setSelectedChannel(channel)}>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    {channel.imageUrl ? (
                      <img src={channel.imageUrl} alt={channel.name} className="w-8 h-8 rounded-lg object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                        <span className="text-xs font-bold text-primary">{channel.name?.[0]?.toUpperCase()}</span>
                      </div>
                    )}
                    <span className="font-semibold text-foreground group-hover:text-primary transition-colors">{channel.name}</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="font-medium">{channel.ownerNickname}</div>
                  <div className="text-xs text-muted-foreground">@{channel.ownerUsername}</div>
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="font-semibold text-primary">{channel.followerCount?.toLocaleString()}명</div>
                  <div className="text-xs text-muted-foreground">{channel.postCount?.toLocaleString()}개</div>
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                    channel.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                    channel.status === 'frozen' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {channel.status === 'active' ? '활성' : channel.status === 'frozen' ? '정지' : '삭제'}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm text-muted-foreground">
                  {new Date(channel.createdAt).toLocaleDateString()}
                </td>
                <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-end gap-2">
                    {channel.status !== 'active' && (
                      <button 
                        onClick={() => setActionModal({ channel, type: 'active' })}
                        className="p-2 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                        title="활성화"
                      >
                        <FiCheck />
                      </button>
                    )}
                    <button 
                      onClick={() => setActionModal({ channel, type: 'frozen' })}
                      disabled={channel.status === 'frozen'}
                      className="p-2 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="채널 정지"
                    >
                      <FiSlash />
                    </button>
                    <button 
                      onClick={() => setActionModal({ channel, type: 'hidden' })}
                      disabled={channel.status === 'hidden'}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="채널 삭제"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {channels.length === 0 && (
              <tr>
                <td colSpan="6" className="py-8 text-center text-muted-foreground">검색 결과가 없습니다.</td>
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

      {/* Action Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!actionModal}
        onClose={() => setActionModal(null)}
        onConfirm={handleStatusChange}
        title={`채널 ${actionModal?.type === 'frozen' ? '정지' : actionModal?.type === 'hidden' ? '삭제' : '활성화'}`}
        message={`정말로 '${actionModal?.channel?.name}' 채널을 ${actionModal?.type === 'frozen' ? '정지' : actionModal?.type === 'hidden' ? '삭제' : '활성화'}하시겠습니까?`}
        confirmText={actionModal?.type === 'frozen' ? '정지하기' : actionModal?.type === 'hidden' ? '삭제하기' : '활성화하기'}
        cancelText="취소"
      />

      {/* Channel Detail Modal */}
      <ChannelDetailModal 
        isOpen={!!selectedChannel}
        onClose={() => setSelectedChannel(null)}
        channel={selectedChannel}
      />
    </div>
  );
};

export default ChannelManagementTab;
