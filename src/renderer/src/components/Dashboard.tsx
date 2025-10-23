import React, { useState, useEffect } from 'react';
import { User, Briefcase, GraduationCap, Award, Clock, CheckCircle, XCircle, Star } from 'lucide-react';
import { PersonalInfo, JobStats, RecentActivity } from '@shared/types';

interface DashboardProps {
  personalInfo: PersonalInfo | null;
}

const Dashboard = ({ personalInfo }: DashboardProps) => {
  const [jobStats, setJobStats] = useState<JobStats>({
    total: 0,
    queued: 0,
    applied: 0,
    interviewing: 0,
    rejected: 0,
    offers: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [stats, activity] = await Promise.all([
        window.electronAPI.getJobStats(),
        window.electronAPI.getRecentActivity()
      ]);
      setJobStats(stats);
      setRecentActivity(activity);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return time.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome to your job application tracker</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="flex items-center">
                <div className="p-2 bg-gray-200 rounded-lg w-10 h-10"></div>
                <div className="ml-4 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-8"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Briefcase className="w-6 h-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                <p className="text-2xl font-bold text-gray-900">{jobStats.total}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Queued</p>
                <p className="text-2xl font-bold text-gray-900">{jobStats.queued}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Interviewing</p>
                <p className="text-2xl font-bold text-gray-900">{jobStats.interviewing}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Star className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Offers</p>
                <p className="text-2xl font-bold text-gray-900">{jobStats.offers}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          {recentActivity.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Briefcase className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No recent activity</p>
              <p className="text-sm">Start by adding your first job</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.slice(0, 5).map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="p-1 bg-primary-100 rounded-full">
                    <Briefcase className="w-4 h-4 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.description}</p>
                    <p className="text-xs text-gray-500">{formatTimeAgo(activity.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <a
              href="/jobs"
              className="flex items-center p-3 border border-gray-200 rounded-lg hover:border-primary-400 hover:bg-primary-50 transition-colors duration-200"
            >
              <Briefcase className="w-5 h-5 text-primary-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">Add New Job</p>
                <p className="text-xs text-gray-500">Track a new job application</p>
              </div>
            </a>
            
            <a
              href="/profile"
              className="flex items-center p-3 border border-gray-200 rounded-lg hover:border-primary-400 hover:bg-primary-50 transition-colors duration-200"
            >
              <User className="w-5 h-5 text-primary-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">Update Profile</p>
                <p className="text-xs text-gray-500">Keep your information current</p>
              </div>
            </a>
            
            <a
              href="/jobs"
              className="flex items-center p-3 border border-gray-200 rounded-lg hover:border-primary-400 hover:bg-primary-50 transition-colors duration-200"
            >
              <CheckCircle className="w-5 h-5 text-primary-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">View Applications</p>
                <p className="text-xs text-gray-500">Manage your job applications</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
