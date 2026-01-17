/**
 * PublishedBoardPage.tsx
 * Trang hiển thị các ý kiến Pink Box đã được công khai
 * Page to display published Pink Box responses - Public announcement board
 * 
 * Song ngữ / Bilingual: Việt - Nhật
 */
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Globe, MessageCircle, Clock, Search, RefreshCw, Megaphone, Filter, X, ChevronLeft, ChevronRight, Building2, Calendar, SortAsc, SortDesc } from "lucide-react";
import PageMeta from "../../components/common/PageMeta";
import { useTranslation } from "../../contexts/LanguageContext";
import { useSocketRefresh } from "../../hooks/useSocket";
import api from "../../services/api";

interface PublishedIdea {
  id: string;
  title: string;
  description: string;
  published_response: string;
  published_response_ja: string;
  published_at: string;
  category?: string;
  department_name?: string;
  created_at?: string;
}

interface Department {
  id: string;
  name: string;
  code: string;
}

const ITEMS_PER_PAGE = 10;

const PublishedBoardPage: React.FC = () => {
  const { language } = useTranslation();
  const [ideas, setIdeas] = useState<PublishedIdea[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch published ideas
  const fetchPublishedIdeas = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const res = await api.get('/ideas/published');
      setIdeas(res.data.data || []);
    } catch (error) {
      console.error("Failed to fetch published ideas:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Fetch departments
  const fetchDepartments = useCallback(async () => {
    try {
      const res = await api.get('/departments');
      setDepartments(res.data.data || []);
    } catch (error) {
      console.error("Failed to fetch departments:", error);
    }
  }, []);

  useEffect(() => {
    fetchPublishedIdeas();
    fetchDepartments();
  }, [fetchPublishedIdeas, fetchDepartments]);

  // WebSocket refresh
  useSocketRefresh(
    ['idea_updated'],
    () => fetchPublishedIdeas(false),
    ['ideas']
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPublishedIdeas();
  };

  const clearFilters = () => {
    setSelectedDepartment("");
    setDateFrom("");
    setDateTo("");
    setSortOrder('newest');
    setSearchTerm("");
    setCurrentPage(1);
  };

  const hasActiveFilters = selectedDepartment || dateFrom || dateTo || searchTerm;

  // Filter and sort ideas
  const filteredIdeas = useMemo(() => {
    let result = [...ideas];
    
    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(idea =>
        idea.title.toLowerCase().includes(search) ||
        idea.description.toLowerCase().includes(search) ||
        idea.published_response?.toLowerCase().includes(search) ||
        idea.published_response_ja?.toLowerCase().includes(search)
      );
    }
    
    // Department filter
    if (selectedDepartment) {
      result = result.filter(idea => idea.department_name === selectedDepartment);
    }
    
    // Date filter
    if (dateFrom) {
      result = result.filter(idea => new Date(idea.published_at) >= new Date(dateFrom));
    }
    if (dateTo) {
      const endDate = new Date(dateTo);
      endDate.setHours(23, 59, 59, 999);
      result = result.filter(idea => new Date(idea.published_at) <= endDate);
    }
    
    // Sort
    result.sort((a, b) => {
      const dateA = new Date(a.published_at).getTime();
      const dateB = new Date(b.published_at).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
    
    return result;
  }, [ideas, searchTerm, selectedDepartment, dateFrom, dateTo, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredIdeas.length / ITEMS_PER_PAGE);
  const paginatedIdeas = filteredIdeas.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedDepartment, dateFrom, dateTo, sortOrder]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(language === 'ja' ? 'ja-JP' : 'vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title={`${language === 'ja' ? '公開回答ボード' : 'Bảng Phản hồi Công khai'} | SmartFactory CONNECT`}
        description={language === 'ja' ? 'ピンクボックスの公開回答' : 'Các phản hồi công khai từ Hòm hồng'}
      />
      
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-gray-50 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-800">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-500 text-white">
          <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <Megaphone size={32} />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">
                  {language === 'ja' ? '公開回答ボード' : 'Bảng Phản hồi Công khai'}
                </h1>
                <p className="text-red-100 text-sm mt-1">
                  {language === 'ja' 
                    ? 'ピンクボックスからの意見と会社からの公式回答'
                    : 'Ý kiến từ Hòm hồng và phản hồi chính thức từ công ty'}
                </p>
              </div>
            </div>

            {/* Search and controls */}
            <div className="flex flex-wrap gap-3 mt-6">
              <div className="flex-1 min-w-[200px] relative">
                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red-200" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={language === 'ja' ? '検索...' : 'Tìm kiếm...'}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/20 border border-white/30 rounded-lg text-white placeholder-red-200 focus:outline-none focus:ring-2 focus:ring-white/50"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors ${
                  showFilters || hasActiveFilters
                    ? 'bg-white text-red-600'
                    : 'bg-white/20 hover:bg-white/30 text-white'
                }`}
              >
                <Filter size={18} />
                {language === 'ja' ? 'フィルター' : 'Bộ lọc'}
                {hasActiveFilters && (
                  <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    !
                  </span>
                )}
              </button>
              <button
                onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
                className="px-4 py-2.5 bg-white/20 hover:bg-white/30 rounded-lg flex items-center gap-2 transition-colors"
              >
                {sortOrder === 'newest' ? <SortDesc size={18} /> : <SortAsc size={18} />}
                {sortOrder === 'newest' 
                  ? (language === 'ja' ? '最新順' : 'Mới nhất')
                  : (language === 'ja' ? '古い順' : 'Cũ nhất')}
              </button>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="px-4 py-2.5 bg-white/20 hover:bg-white/30 rounded-lg flex items-center gap-2 transition-colors"
              >
                <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
                {language === 'ja' ? '更新' : 'Làm mới'}
              </button>
            </div>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700 shadow-sm">
            <div className="max-w-6xl mx-auto px-4 py-4">
              <div className="flex flex-wrap gap-4">
                {/* Department filter */}
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    <Building2 size={12} className="inline mr-1" />
                    {language === 'ja' ? '部門' : 'Phòng ban'}
                  </label>
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="">{language === 'ja' ? 'すべて' : 'Tất cả'}</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.name}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                
                {/* Date from */}
                <div className="min-w-[160px]">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    <Calendar size={12} className="inline mr-1" />
                    {language === 'ja' ? '開始日' : 'Từ ngày'}
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                
                {/* Date to */}
                <div className="min-w-[160px]">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    <Calendar size={12} className="inline mr-1" />
                    {language === 'ja' ? '終了日' : 'Đến ngày'}
                  </label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                
                {/* Clear filters */}
                {hasActiveFilters && (
                  <div className="flex items-end">
                    <button
                      onClick={clearFilters}
                      className="px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center gap-1 transition-colors"
                    >
                      <X size={16} />
                      {language === 'ja' ? 'クリア' : 'Xóa bộ lọc'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Results count */}
        {hasActiveFilters && (
          <div className="max-w-6xl mx-auto px-4 pt-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {language === 'ja' 
                ? `${filteredIdeas.length} 件の結果`
                : `Tìm thấy ${filteredIdeas.length} kết quả`}
            </p>
          </div>
        )}

        {/* Content */}
        <div className="max-w-6xl mx-auto px-4 py-8">
          {filteredIdeas.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 dark:bg-neutral-800 rounded-full flex items-center justify-center">
                <Globe size={40} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">
                {language === 'ja' ? '公開された回答はありません' : 'Chưa có phản hồi công khai'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {language === 'ja' 
                  ? '新しい回答が公開されると、ここに表示されます'
                  : 'Các phản hồi mới sẽ hiển thị tại đây khi được công khai'}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {paginatedIdeas.map((idea) => (
                <div
                  key={idea.id}
                  className="bg-white dark:bg-neutral-800 rounded-2xl shadow-lg overflow-hidden border border-gray-100 dark:border-neutral-700 hover:shadow-xl transition-shadow"
                >
                  {/* Question header */}
                  <div className="bg-gray-50 dark:bg-neutral-900 px-6 py-4 border-b border-gray-100 dark:border-neutral-700">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs font-medium rounded-full">
                            {language === 'ja' ? '匿名の意見' : 'Ý kiến ẩn danh'}
                          </span>
                          {idea.department_name && (
                            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full">
                              {idea.department_name}
                            </span>
                          )}
                          {idea.category && (
                            <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full">
                              {idea.category}
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {idea.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                          {idea.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        <Clock size={14} />
                        {formatDate(idea.published_at)}
                      </div>
                    </div>
                  </div>

                  {/* Response */}
                  <div className="px-6 py-5">
                    <div className="flex items-center gap-2 mb-3">
                      <MessageCircle size={18} className="text-green-600" />
                      <span className="text-sm font-medium text-green-700 dark:text-green-400">
                        {language === 'ja' ? '公式回答' : 'Phản hồi chính thức'}
                      </span>
                    </div>
                    
                    {/* Vietnamese response */}
                    {idea.published_response && (
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-gray-500">🇻🇳</span>
                          <span className="text-xs font-medium text-gray-500">Tiếng Việt</span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed bg-green-50 dark:bg-green-900/10 p-4 rounded-lg border-l-4 border-green-500">
                          {idea.published_response}
                        </p>
                      </div>
                    )}

                    {/* Japanese response */}
                    {idea.published_response_ja && (
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-gray-500">🇯🇵</span>
                          <span className="text-xs font-medium text-gray-500">日本語</span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed bg-green-50 dark:bg-green-900/10 p-4 rounded-lg border-l-4 border-green-500">
                          {idea.published_response_ja}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => 
                    page === 1 || 
                    page === totalPages || 
                    Math.abs(page - currentPage) <= 1
                  )
                  .map((page, idx, arr) => (
                    <React.Fragment key={page}>
                      {idx > 0 && arr[idx - 1] !== page - 1 && (
                        <span className="px-2 text-gray-400">...</span>
                      )}
                      <button
                        onClick={() => setCurrentPage(page)}
                        className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                          currentPage === page
                            ? 'bg-red-600 text-white'
                            : 'border border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-700'
                        }`}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  ))}
              </div>
              
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}

          {/* Stats footer */}
          {filteredIdeas.length > 0 && (
            <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
              {language === 'ja' 
                ? `${filteredIdeas.length} 件中 ${(currentPage - 1) * ITEMS_PER_PAGE + 1}-${Math.min(currentPage * ITEMS_PER_PAGE, filteredIdeas.length)} を表示`
                : `Hiển thị ${(currentPage - 1) * ITEMS_PER_PAGE + 1}-${Math.min(currentPage * ITEMS_PER_PAGE, filteredIdeas.length)} trong ${filteredIdeas.length} phản hồi`}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default PublishedBoardPage;
