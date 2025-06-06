import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface DashboardStats {
  overview: {
    totalPosts: number;
    publishedPosts: number;
    draftPosts: number;
    totalViews: number;
    totalCategories: number;
    totalTags: number;
    recentViews: number;
  };
  popularPosts: Array<{
    id: string;
    title: string;
    slug: string;
    viewCount: number;
    publishedAt: string;
  }>;
}

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  isPublished: boolean;
  createdAt: string;
  author: {
    name: string;
  };
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      navigate('/admin');
      return;
    }

    setUser(JSON.parse(userData));
    fetchDashboardData();
  }, [navigate]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      const [statsResponse, postsResponse] = await Promise.all([
        fetch(`${process.env.REACT_APP_API_URL}/analytics/dashboard`, { headers }),
        fetch(`${process.env.REACT_APP_API_URL}/posts/admin/all?limit=5`, { headers }),
      ]);

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      if (postsResponse.ok) {
        const postsData = await postsResponse.json();
        setRecentPosts(postsData.posts);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    navigate('/admin');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="glass-panel p-8">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-byzantium"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Admin Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Link to="/" className="text-2xl font-bold text-byzantium mr-8">
                Creator's Corner
              </Link>
              <h1 className="text-xl font-semibold text-gray-800">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">Welcome, {user?.name}</span>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-4">
            <Link
              to="/admin/posts/new"
              className="bg-byzantium hover:bg-violet-ltci text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center"
            >
              <span className="material-icons mr-2">add</span>
              New Post
            </Link>
            <Link
              to="/admin/posts"
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Manage Posts
            </Link>
            <Link
              to="/admin/media"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Media Library
            </Link>
            <Link
              to="/admin/analytics"
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Analytics
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="glass-panel p-6">
              <div className="flex items-center">
                <span className="material-icons text-3xl text-byzantium mr-3">article</span>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{stats.overview.totalPosts}</p>
                  <p className="text-gray-600">Total Posts</p>
                </div>
              </div>
            </div>

            <div className="glass-panel p-6">
              <div className="flex items-center">
                <span className="material-icons text-3xl text-green-600 mr-3">publish</span>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{stats.overview.publishedPosts}</p>
                  <p className="text-gray-600">Published</p>
                </div>
              </div>
            </div>

            <div className="glass-panel p-6">
              <div className="flex items-center">
                <span className="material-icons text-3xl text-blue-600 mr-3">visibility</span>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{stats.overview.totalViews.toLocaleString()}</p>
                  <p className="text-gray-600">Total Views</p>
                </div>
              </div>
            </div>

            <div className="glass-panel p-6">
              <div className="flex items-center">
                <span className="material-icons text-3xl text-orange-600 mr-3">trending_up</span>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{stats.overview.recentViews}</p>
                  <p className="text-gray-600">Recent Views (30d)</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Posts */}
          <div className="glass-panel p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Recent Posts</h2>
              <Link
                to="/admin/posts"
                className="text-byzantium hover:text-violet-ltci text-sm font-medium"
              >
                View All
              </Link>
            </div>

            <div className="space-y-4">
              {recentPosts.map(post => (
                <div key={post.id} className="flex items-center justify-between py-3 border-b border-gray-200 last:border-b-0">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-800 truncate">{post.title}</h3>
                    <p className="text-sm text-gray-600">
                      {formatDate(post.createdAt)} • {post.isPublished ? 'Published' : 'Draft'}
                    </p>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <Link
                      to={`/admin/posts/edit/${post.id}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <span className="material-icons text-sm">edit</span>
                    </Link>
                    {post.isPublished && (
                      <Link
                        to={`/post/${post.slug}`}
                        target="_blank"
                        className="text-green-600 hover:text-green-800"
                      >
                        <span className="material-icons text-sm">open_in_new</span>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
              
              {recentPosts.length === 0 && (
                <p className="text-gray-500 text-center py-8">No posts yet. Create your first post!</p>
              )}
            </div>
          </div>

          {/* Popular Posts */}
          <div className="glass-panel p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Popular Posts</h2>
              <Link
                to="/admin/analytics"
                className="text-byzantium hover:text-violet-ltci text-sm font-medium"
              >
                View Analytics
              </Link>
            </div>

            <div className="space-y-4">
              {stats?.popularPosts.map((post, index) => (
                <div key={post.id} className="flex items-center justify-between py-3 border-b border-gray-200 last:border-b-0">
                  <div className="flex items-center">
                    <span className="text-sm font-bold text-byzantium mr-3">#{index + 1}</span>
                    <div>
                      <h3 className="font-medium text-gray-800 truncate">{post.title}</h3>
                      <p className="text-sm text-gray-600">{post.viewCount} views</p>
                    </div>
                  </div>
                  <Link
                    to={`/post/${post.slug}`}
                    target="_blank"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <span className="material-icons text-sm">open_in_new</span>
                  </Link>
                </div>
              )) || (
                <p className="text-gray-500 text-center py-8">No published posts yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        {stats && (
          <div className="mt-8 glass-panel p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Stats</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-byzantium">{stats.overview.totalCategories}</p>
                <p className="text-gray-600">Categories</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-violet-ltci">{stats.overview.totalTags}</p>
                <p className="text-gray-600">Tags</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">{stats.overview.draftPosts}</p>
                <p className="text-gray-600">Drafts</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;