import React, { useState, useEffect } from 'react';
import jwtAxios from '../../api/jwtAxios';
import { useAuth } from '../../components/sidebar/AuthContext';
import { FiUsers, FiAlertTriangle, FiMessageSquare, FiMonitor, FiFileText, FiHelpCircle } from 'react-icons/fi';
import UserManagementTab from './UserManagementTab';
import ReportManagementTab from './ReportManagementTab';
import SuggestionManagementTab from './SuggestionManagementTab';

const AdminDashboard = () => {
  const { currentUser, token } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingReports: 0,
    unseenSuggestions: 0,
    totalChannels: 0,
    totalFeedPosts: 0,
    totalQnaPosts: 0,
  });
  const [activeTab, setActiveTab] = useState('users'); // 'users', 'reports', 'suggestions'

  const fetchStats = async () => {
    try {
      const response = await jwtAxios.get('admin/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch admin stats:', error);
    }
  };

  useEffect(() => {
    if (token && currentUser?.role === 'admin') {
      fetchStats();
    }
  }, [token, currentUser]);

  const statsConfig = [
    { label: '전체 사용자', value: stats.totalUsers, icon: FiUsers, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    { label: '미처리 신고', value: stats.pendingReports, icon: FiAlertTriangle, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30' },
    { label: '건의사항', value: stats.unseenSuggestions, icon: FiMessageSquare, color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-900/30' },
    { label: '전체 채널', value: stats.totalChannels, icon: FiMonitor, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30' },
    { label: '전체 피드 글', value: stats.totalFeedPosts, icon: FiFileText, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30' },
    { label: '전체 질문 글', value: stats.totalQnaPosts, icon: FiHelpCircle, color: 'text-indigo-500', bg: 'bg-indigo-100 dark:bg-indigo-900/30' },
  ];

  if (currentUser?.role !== 'admin') {
    return <div className="p-8 text-center text-xl font-bold">접근 권한이 없습니다.</div>;
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">관리자 대시보드</h1>
        <p className="text-muted-foreground mt-2">시스템 현황을 한눈에 파악하고 관리하세요.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statsConfig.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className={`p-3 rounded-xl ${stat.bg}`}>
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                <h3 className="text-2xl font-bold mt-1">{stat.value.toLocaleString()}</h3>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="flex border-b border-border">
          <button
            className={`flex-1 py-4 font-semibold text-center transition-colors ${activeTab === 'users' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-muted-foreground hover:bg-muted/5'}`}
            onClick={() => setActiveTab('users')}
          >
            사용자 관리
          </button>
          <button
            className={`flex-1 py-4 font-semibold text-center transition-colors ${activeTab === 'reports' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-muted-foreground hover:bg-muted/5'}`}
            onClick={() => setActiveTab('reports')}
          >
            신고 관리
          </button>
          <button
            className={`flex-1 py-4 font-semibold text-center transition-colors ${activeTab === 'suggestions' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-muted-foreground hover:bg-muted/5'}`}
            onClick={() => setActiveTab('suggestions')}
          >
            건의사항 관리
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'users' && <UserManagementTab fetchStats={fetchStats} />}
          {activeTab === 'reports' && <ReportManagementTab fetchStats={fetchStats} />}
          {activeTab === 'suggestions' && <SuggestionManagementTab fetchStats={fetchStats} />}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;