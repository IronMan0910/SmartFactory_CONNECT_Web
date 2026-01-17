import React, { useState, useEffect, useMemo } from 'react';
import {
  Megaphone,
  Search,
  Filter,
  Calendar,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  Building,
  MessageCircle,
  Globe,
  ChevronDown,
  ChevronUp,
  Plus,
  Download,
  RefreshCw,
  AlertCircle,
  Check
} from 'lucide-react';

// Helper function to format date
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

interface PublishedIdea {
  id: string;
  title: string;
  description: string;
  ideabox_type: 'pink' | 'white';
  category: string;
  status: string;
  department_name?: string;
  is_published: boolean;
  published_response?: string;
  published_response_ja?: string;
  published_at?: string;
  published_by_name?: string;
  created_at: string;
  updated_at: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const PublishedResponsesManagement: React.FC = () => {
  const [ideas, setIdeas] = useState<PublishedIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'unpublished'>('all');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    publishedResponse: '',
    publishedResponseJa: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch ideas
  useEffect(() => {
    fetchIdeas();
  }, []);

  const fetchIdeas = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/ideas?ideabox_type=pink`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch ideas');
      
      const data = await response.json();
      // Handle different API response formats
      const ideasArray = data.data || data.ideas || data || [];
      setIdeas(Array.isArray(ideasArray) ? ideasArray : []);
    } catch (err: any) {
      setError(err.message);
      setIdeas([]);
    } finally {
      setLoading(false);
    }
  };

  // Get unique departments
  const departments = useMemo(() => {
    const depts = new Set(ideas.map(i => i.department_name).filter(Boolean));
    return Array.from(depts) as string[];
  }, [ideas]);

  // Filter ideas
  const filteredIdeas = useMemo(() => {
    return ideas.filter(idea => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          idea.title.toLowerCase().includes(query) ||
          idea.description.toLowerCase().includes(query) ||
          idea.published_response?.toLowerCase().includes(query) ||
          idea.published_response_ja?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }
      
      // Status filter
      if (filterStatus === 'published' && !idea.is_published) return false;
      if (filterStatus === 'unpublished' && idea.is_published) return false;
      
      // Department filter
      if (filterDepartment !== 'all' && idea.department_name !== filterDepartment) return false;
      
      return true;
    });
  }, [ideas, searchQuery, filterStatus, filterDepartment]);

  // Toggle publish status
  const togglePublish = async (id: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/ideas/${id}/publish`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ is_published: !currentStatus })
      });
      
      if (!response.ok) throw new Error('Failed to update');
      
      setIdeas(prev => prev.map(idea => 
        idea.id === id 
          ? { 
              ...idea, 
              is_published: !currentStatus,
              published_at: !currentStatus ? new Date().toISOString() : idea.published_at
            } 
          : idea
      ));
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    }
  };

  // Save response
  const saveResponse = async (id: string) => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/ideas/${id}/response`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          published_response: editForm.publishedResponse,
          published_response_ja: editForm.publishedResponseJa
        })
      });
      
      if (!response.ok) throw new Error('Failed to save');
      
      setIdeas(prev => prev.map(idea => 
        idea.id === id 
          ? { 
              ...idea, 
              published_response: editForm.publishedResponse,
              published_response_ja: editForm.publishedResponseJa
            } 
          : idea
      ));
      setEditingId(null);
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Start editing
  const startEditing = (idea: PublishedIdea) => {
    setEditingId(idea.id);
    setEditForm({
      publishedResponse: idea.published_response || '',
      publishedResponseJa: idea.published_response_ja || ''
    });
  };

  // Stats
  const stats = useMemo(() => ({
    total: ideas.length,
    published: ideas.filter(i => i.is_published).length,
    pending: ideas.filter(i => !i.is_published && i.status !== 'rejected').length
  }), [ideas]);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'quality_improvement': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'safety_enhancement': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'productivity': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'cost_reduction': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'quality_improvement': return 'Chất lượng';
      case 'safety_enhancement': return 'An toàn';
      case 'productivity': return 'Năng suất';
      case 'cost_reduction': return 'Giảm chi phí';
      case 'process_improvement': return 'Quy trình';
      case 'innovation': return 'Đổi mới';
      default: return category;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-xl">
              <Megaphone className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Quản lý Phản hồi Công khai</h1>
              <p className="text-gray-500">Quản lý và công bố phản hồi Hòm hồng</p>
            </div>
          </div>
          <button
            onClick={fetchIdeas}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Làm mới
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <MessageCircle className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Tổng ý kiến</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-green-600">Đã công khai</p>
                <p className="text-2xl font-bold text-green-700">{stats.published}</p>
              </div>
            </div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-sm text-yellow-600">Chờ xử lý</p>
                <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Search */}
          <div className="flex-1 min-w-[300px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tiêu đề, nội dung..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="published">Đã công khai</option>
            <option value="unpublished">Chưa công khai</option>
          </select>

          {/* Department Filter */}
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="all">Tất cả phòng ban</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* Ideas List */}
      <div className="space-y-4">
        {filteredIdeas.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Không có ý kiến nào phù hợp</p>
          </div>
        ) : (
          filteredIdeas.map((idea) => (
            <div
              key={idea.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
            >
              {/* Card Header */}
              <div 
                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedId(expandedId === idea.id ? null : idea.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {/* Published Badge */}
                      {idea.is_published ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                          <Globe className="w-3 h-3" />
                          Đã công khai
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                          <EyeOff className="w-3 h-3" />
                          Chưa công khai
                        </span>
                      )}
                      
                      {/* Category */}
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getCategoryColor(idea.category)}`}>
                        {getCategoryLabel(idea.category)}
                      </span>

                      {/* Department */}
                      {idea.department_name && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                          <Building className="w-3 h-3" />
                          {idea.department_name}
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{idea.title}</h3>
                    <p className="text-gray-600 text-sm line-clamp-2">{idea.description}</p>
                    
                    {idea.published_at && (
                      <p className="text-xs text-gray-400 mt-2">
                        Công khai lúc: {formatDate(idea.published_at)}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {/* Toggle Publish */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePublish(idea.id, idea.is_published);
                      }}
                      className={`p-2 rounded-lg transition-colors ${
                        idea.is_published 
                          ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      title={idea.is_published ? 'Ẩn khỏi công khai' : 'Công khai'}
                    >
                      {idea.is_published ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                    </button>

                    {/* Edit Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditing(idea);
                      }}
                      className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                      title="Sửa phản hồi"
                    >
                      <Edit className="w-5 h-5" />
                    </button>

                    {/* Expand */}
                    {expandedId === idea.id ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedId === idea.id && (
                <div className="border-t border-gray-200 p-4 bg-gray-50">
                  {editingId === idea.id ? (
                    /* Edit Form */
                    <div className="space-y-4">
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                          🇻🇳 Phản hồi tiếng Việt
                        </label>
                        <textarea
                          value={editForm.publishedResponse}
                          onChange={(e) => setEditForm(prev => ({ ...prev, publishedResponse: e.target.value }))}
                          rows={5}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                          placeholder="Nhập phản hồi chính thức bằng tiếng Việt..."
                        />
                      </div>
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                          🇯🇵 Phản hồi tiếng Nhật
                        </label>
                        <textarea
                          value={editForm.publishedResponseJa}
                          onChange={(e) => setEditForm(prev => ({ ...prev, publishedResponseJa: e.target.value }))}
                          rows={5}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                          placeholder="公式回答を日本語で入力してください..."
                        />
                      </div>
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          Hủy
                        </button>
                        <button
                          onClick={() => saveResponse(idea.id)}
                          disabled={saving}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                          {saving ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                          Lưu phản hồi
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* View Response */
                    <div className="space-y-4">
                      {/* Vietnamese Response */}
                      {idea.published_response ? (
                        <div>
                          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                            🇻🇳 Phản hồi tiếng Việt
                          </label>
                          <div className="bg-white p-4 rounded-lg border-l-4 border-green-500">
                            <p className="text-gray-700 whitespace-pre-wrap">{idea.published_response}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-gray-400 italic">Chưa có phản hồi tiếng Việt</div>
                      )}

                      {/* Japanese Response */}
                      {idea.published_response_ja ? (
                        <div>
                          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                            🇯🇵 Phản hồi tiếng Nhật
                          </label>
                          <div className="bg-white p-4 rounded-lg border-l-4 border-green-500">
                            <p className="text-gray-700 whitespace-pre-wrap">{idea.published_response_ja}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-gray-400 italic">Chưa có phản hồi tiếng Nhật</div>
                      )}

                      {!idea.published_response && !idea.published_response_ja && (
                        <button
                          onClick={() => startEditing(idea)}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          Thêm phản hồi
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Results count */}
      {filteredIdeas.length > 0 && (
        <div className="mt-4 text-center text-gray-500 text-sm">
          Hiển thị {filteredIdeas.length} / {ideas.length} ý kiến
        </div>
      )}
    </div>
  );
};

export default PublishedResponsesManagement;
