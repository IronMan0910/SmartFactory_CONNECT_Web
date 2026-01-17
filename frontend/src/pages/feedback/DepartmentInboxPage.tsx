/**
 * DepartmentInboxPage.tsx
 * Trang inbox cho Phòng ban - hiển thị các ý kiến Pink Box được chuyển tiếp đến
 * Department Inbox Page - shows Pink Box feedback forwarded to the department
 * 
 * Song ngữ / Bilingual: Việt - Nhật
 */
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { 
  Inbox, 
  Clock, 
  MessageSquare, 
  ArrowRight, 
  Building2, 
  AlertCircle, 
  RefreshCw,
  Search,
  CheckCircle2,
} from "lucide-react";
import PageMeta from "../../components/common/PageMeta";
import { useTranslation } from "../../contexts/LanguageContext";
import { useSocketRefresh } from "../../hooks/useSocket";
import { SensitiveMessage } from "../../components/feedback/types";
import { DepartmentResponseModal } from "../../components/feedback/DepartmentResponseModal";
import api from "../../services/api";

interface ForwardedIdea {
  id: string;
  title: string;
  description: string;
  status: string;
  forwarded_at: string;
  forwarded_note?: string;
  forwarded_note_ja?: string;
  forwarded_by_name?: string;
  department_response?: string;
  department_response_ja?: string;
  need_revision?: boolean;
  revision_note?: string;
}

// Map to SensitiveMessage for modal
const mapToSensitiveMessage = (idea: ForwardedIdea): SensitiveMessage => ({
  id: idea.id,
  isAnonymous: true,
  title: idea.title,
  fullContent: idea.description,
  timestamp: new Date(idea.forwarded_at),
  status: idea.status as any,
  history: [],
  replies: [],
  forwardInfo: {
    forwarded_at: new Date(idea.forwarded_at),
    forwarded_by: idea.forwarded_by_name,
    forwarded_note: idea.forwarded_note,
    forwarded_note_ja: idea.forwarded_note_ja,
  },
  departmentResponse: {
    department_response: idea.department_response,
    department_response_ja: idea.department_response_ja,
  }
});

const DepartmentInboxPage: React.FC = () => {
  const { language } = useTranslation();
  const [ideas, setIdeas] = useState<ForwardedIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<ForwardedIdea | null>(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "responded" | "revision">("all");

  // Fetch department inbox
  const fetchDepartmentInbox = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setRefreshing(true);
      const res = await api.get('/ideas/department-inbox');
      setIdeas(res.data.data || []);
    } catch (error) {
      console.error("Failed to fetch department inbox:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDepartmentInbox();
  }, [fetchDepartmentInbox]);

  // WebSocket refresh
  useSocketRefresh(
    ['idea_created', 'idea_updated'],
    () => fetchDepartmentInbox(false),
    ['ideas']
  );

  const handleOpenResponse = (idea: ForwardedIdea) => {
    setSelectedIdea(idea);
    setShowResponseModal(true);
  };

  const handleResponseSuccess = () => {
    fetchDepartmentInbox(false);
  };

  // Filter ideas
  const filteredIdeas = useMemo(() => {
    return ideas.filter((idea) => {
      // Search filter
      const matchSearch =
        searchTerm === "" ||
        idea.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        idea.description.toLowerCase().includes(searchTerm.toLowerCase());

      // Status filter
      let matchStatus = statusFilter === "all";
      if (statusFilter === "pending") matchStatus = !idea.department_response;
      if (statusFilter === "responded") matchStatus = !!idea.department_response && !idea.need_revision;
      if (statusFilter === "revision") matchStatus = !!idea.need_revision;

      return matchSearch && matchStatus;
    });
  }, [ideas, searchTerm, statusFilter]);

  // Stats
  const stats = useMemo(() => ({
    total: ideas.length,
    pending: ideas.filter((i) => !i.department_response).length,
    responded: ideas.filter((i) => i.department_response && !i.need_revision).length,
    revision: ideas.filter((i) => i.need_revision).length,
  }), [ideas]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString(language === 'ja' ? 'ja-JP' : 'vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (idea: ForwardedIdea) => {
    if (idea.need_revision) {
      return (
        <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs font-medium rounded-full flex items-center gap-1">
          <AlertCircle size={12} />
          {language === 'ja' ? '要修正' : 'Cần chỉnh sửa'}
        </span>
      );
    }
    if (idea.department_response) {
      return (
        <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium rounded-full">
          {language === 'ja' ? '回答済み' : 'Đã phản hồi'}
        </span>
      );
    }
    return (
      <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-xs font-medium rounded-full">
        {language === 'ja' ? '未回答' : 'Chưa phản hồi'}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title={`${language === 'ja' ? '部署の受信箱' : 'Hộp thư Phòng ban'} | SmartFactory CONNECT`}
        description={language === 'ja' ? '転送された意見' : 'Các ý kiến được chuyển tiếp'}
      />
      
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-900">
        {/* Header */}
        <div className="bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700">
          <div className="max-w-6xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white shadow-lg">
                  <Building2 size={28} />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    {language === 'ja' ? '部署の受信箱' : 'Hộp thư Phòng ban'}
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {language === 'ja' 
                      ? 'ピンクボックスから転送された意見に回答してください'
                      : 'Phản hồi các ý kiến từ Hòm hồng được chuyển tiếp đến phòng ban'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => fetchDepartmentInbox()}
                disabled={refreshing}
                className="p-2 rounded-lg border border-gray-300 dark:border-neutral-600 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"
              >
                <RefreshCw
                  size={18}
                  className={`text-gray-600 dark:text-gray-400 ${refreshing ? "animate-spin" : ""}`}
                />
              </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
              <button
                onClick={() => setStatusFilter("all")}
                className={`p-4 rounded-xl text-left transition-all ${
                  statusFilter === "all"
                    ? "bg-gradient-to-br from-gray-600 to-gray-700 text-white shadow-lg scale-[1.02]"
                    : "bg-white dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 hover:shadow-md"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-xs font-medium ${statusFilter === "all" ? "text-white/80" : "text-gray-500 dark:text-gray-400"}`}>
                      {language === "ja" ? "全件" : "Tổng cộng"}
                    </p>
                    <p className={`text-2xl font-bold ${statusFilter === "all" ? "text-white" : "text-gray-900 dark:text-white"}`}>
                      {stats.total}
                    </p>
                  </div>
                  <div className={`p-2 rounded-lg ${statusFilter === "all" ? "bg-white/20" : "bg-gray-100 dark:bg-neutral-600"}`}>
                    <Inbox size={18} className={statusFilter === "all" ? "text-white" : "text-gray-500 dark:text-gray-400"} />
                  </div>
                </div>
              </button>

              <button
                onClick={() => setStatusFilter("pending")}
                className={`p-4 rounded-xl text-left transition-all ${
                  statusFilter === "pending"
                    ? "bg-gradient-to-br from-yellow-500 to-orange-500 text-white shadow-lg scale-[1.02]"
                    : "bg-white dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 hover:shadow-md"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-xs font-medium ${statusFilter === "pending" ? "text-white/80" : "text-gray-500 dark:text-gray-400"}`}>
                      {language === "ja" ? "未回答" : "Chưa phản hồi"}
                    </p>
                    <p className={`text-2xl font-bold ${statusFilter === "pending" ? "text-white" : "text-gray-900 dark:text-white"}`}>
                      {stats.pending}
                    </p>
                  </div>
                  <div className={`p-2 rounded-lg ${statusFilter === "pending" ? "bg-white/20" : "bg-yellow-100 dark:bg-yellow-900/30"}`}>
                    <Clock size={18} className={statusFilter === "pending" ? "text-white" : "text-yellow-600 dark:text-yellow-400"} />
                  </div>
                </div>
              </button>

              <button
                onClick={() => setStatusFilter("responded")}
                className={`p-4 rounded-xl text-left transition-all ${
                  statusFilter === "responded"
                    ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg scale-[1.02]"
                    : "bg-white dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 hover:shadow-md"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-xs font-medium ${statusFilter === "responded" ? "text-white/80" : "text-gray-500 dark:text-gray-400"}`}>
                      {language === "ja" ? "回答済み" : "Đã phản hồi"}
                    </p>
                    <p className={`text-2xl font-bold ${statusFilter === "responded" ? "text-white" : "text-gray-900 dark:text-white"}`}>
                      {stats.responded}
                    </p>
                  </div>
                  <div className={`p-2 rounded-lg ${statusFilter === "responded" ? "bg-white/20" : "bg-green-100 dark:bg-green-900/30"}`}>
                    <CheckCircle2 size={18} className={statusFilter === "responded" ? "text-white" : "text-green-600 dark:text-green-400"} />
                  </div>
                </div>
              </button>

              <button
                onClick={() => setStatusFilter("revision")}
                className={`p-4 rounded-xl text-left transition-all ${
                  statusFilter === "revision"
                    ? "bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-lg scale-[1.02]"
                    : "bg-white dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 hover:shadow-md"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-xs font-medium ${statusFilter === "revision" ? "text-white/80" : "text-gray-500 dark:text-gray-400"}`}>
                      {language === "ja" ? "要修正" : "Cần chỉnh sửa"}
                    </p>
                    <p className={`text-2xl font-bold ${statusFilter === "revision" ? "text-white" : "text-gray-900 dark:text-white"}`}>
                      {stats.revision}
                    </p>
                  </div>
                  <div className={`p-2 rounded-lg ${statusFilter === "revision" ? "bg-white/20" : "bg-orange-100 dark:bg-orange-900/30"}`}>
                    <AlertCircle size={18} className={statusFilter === "revision" ? "text-white" : "text-orange-600 dark:text-orange-400"} />
                  </div>
                </div>
              </button>
            </div>

            {/* Search */}
            <div className="relative mt-4">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={language === "ja" ? "検索..." : "Tìm kiếm ý kiến..."}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-neutral-600 rounded-xl bg-white dark:bg-neutral-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-6xl mx-auto px-4 py-6">
          {filteredIdeas.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 dark:bg-neutral-800 rounded-full flex items-center justify-center">
                <Inbox size={40} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">
                {language === 'ja' ? '転送された意見はありません' : 'Không có ý kiến được chuyển tiếp'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {language === 'ja' 
                  ? '新しい意見が転送されると、ここに表示されます'
                  : 'Các ý kiến mới sẽ hiển thị tại đây khi được chuyển tiếp'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredIdeas.map((idea) => (
                <div
                  key={idea.id}
                  className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-700 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusBadge(idea)}
                          <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <Clock size={12} />
                            {formatDate(idea.forwarded_at)}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          {idea.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {idea.description}
                        </p>
                        
                        {/* Forwarded note */}
                        {(idea.forwarded_note || idea.forwarded_note_ja) && (
                          <div className="mt-3 p-3 bg-gray-50 dark:bg-neutral-900 rounded-lg border-l-4 border-blue-500">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                              <ArrowRight size={12} />
                              {language === 'ja' ? '管理者からの備考' : 'Ghi chú từ Coordinator'}:
                            </p>
                            <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                              {language === 'ja' 
                                ? idea.forwarded_note_ja || idea.forwarded_note
                                : idea.forwarded_note}
                            </p>
                          </div>
                        )}

                        {/* Revision note if any */}
                        {idea.need_revision && idea.revision_note && (
                          <div className="mt-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border-l-4 border-orange-500">
                            <p className="text-xs text-orange-600 dark:text-orange-400 mb-1 flex items-center gap-1">
                              <AlertCircle size={12} />
                              {language === 'ja' ? '修正依頼' : 'Yêu cầu chỉnh sửa'}:
                            </p>
                            <p className="text-sm text-orange-700 dark:text-orange-300">
                              {idea.revision_note}
                            </p>
                          </div>
                        )}

                        {/* Previous response if exists */}
                        {idea.department_response && !idea.need_revision && (
                          <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border-l-4 border-green-500">
                            <p className="text-xs text-green-600 dark:text-green-400 mb-1 flex items-center gap-1">
                              <MessageSquare size={12} />
                              {language === 'ja' ? 'あなたの回答' : 'Phản hồi của bạn'}:
                            </p>
                            <p className="text-sm text-green-700 dark:text-green-300">
                              {language === 'ja' 
                                ? idea.department_response_ja || idea.department_response
                                : idea.department_response}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Action button */}
                      <button
                        onClick={() => handleOpenResponse(idea)}
                        className={`px-4 py-2 text-sm rounded-lg flex items-center gap-2 transition-colors ${
                          idea.department_response && !idea.need_revision
                            ? 'bg-gray-100 hover:bg-gray-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-gray-700 dark:text-gray-300'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        <MessageSquare size={16} />
                        {idea.need_revision
                          ? (language === 'ja' ? '修正して回答' : 'Chỉnh sửa phản hồi')
                          : idea.department_response
                            ? (language === 'ja' ? '回答を編集' : 'Sửa phản hồi')
                            : (language === 'ja' ? '回答する' : 'Phản hồi')}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Stats */}
          {filteredIdeas.length > 0 && (
            <div className="mt-6 flex justify-center gap-6 text-sm text-gray-500 dark:text-gray-400">
              <span>
                {language === 'ja' 
                  ? `表示中 ${filteredIdeas.length} / ${ideas.length} 件`
                  : `Hiển thị ${filteredIdeas.length} / ${ideas.length} ý kiến`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Response Modal */}
      {showResponseModal && selectedIdea && (
        <DepartmentResponseModal
          message={mapToSensitiveMessage(selectedIdea)}
          onClose={() => {
            setShowResponseModal(false);
            setSelectedIdea(null);
          }}
          onSuccess={handleResponseSuccess}
        />
      )}
    </>
  );
};

export default DepartmentInboxPage;
