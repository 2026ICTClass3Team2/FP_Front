import React, { useState, useEffect } from 'react';
import jwtAxios from '../../api/jwtAxios';
import { useAuth } from '../../components/sidebar/AuthContext';
import { FiEye, FiCheck, FiX, FiTrash2, FiEyeOff } from 'react-icons/fi';

const ReportManagementTab = ({ fetchStats }) => {
  const { token } = useAuth();
  const [reports, setReports] = useState([]);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [reportModal, setReportModal] = useState(null);
  const [targetDetails, setTargetDetails] = useState(null);

  const fetchReports = async () => {
    try {
      const response = await jwtAxios.get('admin/reports', {
        params: {
          status: statusFilter === 'all' ? undefined : statusFilter,
          page,
          size: 10
        }
      });
      setReports(response.data.content);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    }
  };

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line
  }, [page, statusFilter]);

  const openReportModal = async (report) => {
    setReportModal(report);
    setTargetDetails(null);
    try {
      const response = await jwtAxios.get(`admin/reports/${report.id}/target`);
      setTargetDetails(response.data);
    } catch (error) {
      console.error('Failed to fetch target details:', error);
    }
  };

  const handleUpdateStatus = async (status) => {
    try {
      await jwtAxios.put(`admin/reports/${reportModal.id}/status`, null, {
        params: { status }
      });
      alert('상태가 업데이트되었습니다.');
      setReportModal(null);
      fetchReports();
      fetchStats();
    } catch (error) {
      console.error('Status update error:', error);
      alert('오류가 발생했습니다.');
    }
  };

  const handleTargetAction = async (action) => {
    if (!window.confirm('해당 대상에 대해 조치를 취하시겠습니까?')) return;
    try {
      if (action === 'delete_comment') {
        await jwtAxios.delete(`admin/comments/${reportModal.targetId}`);
      } else if (action === 'hide_post') {
        await jwtAxios.put(`admin/posts/${reportModal.targetId}/hide`);
      } else if (action === 'hide_channel') {
        await jwtAxios.put(`admin/channels/${reportModal.targetId}/hide`);
      }
      alert('조치가 완료되었습니다.');
      handleUpdateStatus('resolved');
    } catch (error) {
      console.error('Action error:', error);
      alert('조치 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <select 
          className="w-full sm:w-auto px-4 py-2 bg-background border border-border rounded-xl focus:outline-none"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
        >
          <option value="pending">미처리</option>
          <option value="resolved">처리완료</option>
          <option value="all">전체보기</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/5 text-sm text-muted-foreground">
              <th className="py-3 px-4 font-semibold">신고자</th>
              <th className="py-3 px-4 font-semibold">유형</th>
              <th className="py-3 px-4 font-semibold">신고 사유</th>
              <th className="py-3 px-4 font-semibold">상태</th>
              <th className="py-3 px-4 font-semibold">신고일</th>
              <th className="py-3 px-4 font-semibold text-right">상세</th>
            </tr>
          </thead>
          <tbody>
            {reports.map(report => (
              <tr key={report.id} className="border-b border-border hover:bg-muted/5 transition-colors">
                <td className="py-3 px-4 font-medium">{report.reporterUsername || '알수없음'}</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-1 bg-primary/10 text-primary rounded-md text-xs font-bold">
                    {report.targetType}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="font-medium">{report.category}</div>
                  <div className="text-xs text-muted-foreground truncate max-w-[200px]">{report.details}</div>
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                    report.status === 'pending' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  }`}>
                    {report.status === 'pending' ? '미처리' : '처리완료'}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm text-muted-foreground">
                  {new Date(report.createdAt).toLocaleDateString()}
                </td>
                <td className="py-3 px-4 text-right">
                  <button 
                    onClick={() => openReportModal(report)}
                    className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                  >
                    <FiEye />
                  </button>
                </td>
              </tr>
            ))}
            {reports.length === 0 && (
              <tr>
                <td colSpan="6" className="py-8 text-center text-muted-foreground">신고 내역이 없습니다.</td>
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

      {/* Report Detail Modal */}
      {reportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-2xl max-w-2xl w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">신고 상세 내역</h3>
              <button onClick={() => setReportModal(null)} className="text-muted-foreground hover:text-foreground">
                <FiX className="w-6 h-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div className="p-4 bg-muted/5 rounded-xl border border-border">
                <p className="text-muted-foreground mb-1">신고자</p>
                <p className="font-bold">{reportModal.reporterUsername}</p>
              </div>
              <div className="p-4 bg-muted/5 rounded-xl border border-border">
                <p className="text-muted-foreground mb-1">신고 유형</p>
                <p className="font-bold">{reportModal.category}</p>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="font-bold mb-2">신고 상세 내용</h4>
              <p className="p-4 bg-muted/5 rounded-xl border border-border whitespace-pre-wrap">{reportModal.details}</p>
            </div>

            <div className="mb-6">
              <h4 className="font-bold mb-2">신고 대상 확인 ({reportModal.targetType})</h4>
              <div className="p-4 border border-border rounded-xl">
                {targetDetails ? (
                  <div className="space-y-2">
                    {targetDetails.title && <p className="font-bold text-lg">{targetDetails.title}</p>}
                    {targetDetails.content && <p className="text-muted-foreground line-clamp-3">{targetDetails.content}</p>}
                    {!targetDetails.title && !targetDetails.content && <p className="text-muted-foreground">상세 정보를 불러올 수 없거나 삭제된 콘텐츠입니다.</p>}
                  </div>
                ) : (
                  <p className="text-muted-foreground animate-pulse">정보 불러오는 중...</p>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
              {reportModal.status === 'pending' && (
                <>
                  <button onClick={() => handleUpdateStatus('resolved')} className="flex-1 py-2.5 rounded-xl border border-border hover:bg-muted/5 font-semibold flex items-center justify-center gap-2">
                    <FiCheck /> 이상 없음 (종결)
                  </button>
                  
                  {reportModal.targetType.toLowerCase() === 'comment' && (
                    <button onClick={() => handleTargetAction('delete_comment')} className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold flex items-center justify-center gap-2">
                      <FiTrash2 /> 댓글 삭제
                    </button>
                  )}
                  
                  {reportModal.targetType.toLowerCase() === 'post' && (
                    <button onClick={() => handleTargetAction('hide_post')} className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold flex items-center justify-center gap-2">
                      <FiEyeOff /> 포스트 숨김
                    </button>
                  )}

                  {reportModal.targetType.toLowerCase() === 'channel' && (
                    <button onClick={() => handleTargetAction('hide_channel')} className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold flex items-center justify-center gap-2">
                      <FiEyeOff /> 채널 숨김
                    </button>
                  )}
                </>
              )}
              {reportModal.status === 'resolved' && (
                <button onClick={() => handleUpdateStatus('pending')} className="w-full py-2.5 rounded-xl border border-border hover:bg-muted/5 font-semibold">
                  미처리 상태로 되돌리기
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportManagementTab;
