/**
 * ConfirmDialog.tsx
 * Reusable confirmation dialog with premium styling
 */
import React, { useEffect, useState } from "react";
import { X, AlertTriangle, Info, CheckCircle2, Trash2 } from "lucide-react";
import { useTranslation } from "../../contexts/LanguageContext";

export type ConfirmType = "danger" | "warning" | "info" | "success";

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    type?: ConfirmType;
    loading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel,
    cancelLabel,
    type = "danger",
    loading = false,
}) => {
    const { language } = useTranslation();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isOpen && !isVisible) return null;

    const typeConfig = {
        danger: {
            icon: Trash2,
            iconBg: "bg-red-100 dark:bg-red-900/30",
            iconColor: "text-red-600 dark:text-red-400",
            btnBg: "bg-red-600 hover:bg-red-700 shadow-red-500/20",
            accent: "border-red-500",
        },
        warning: {
            icon: AlertTriangle,
            iconBg: "bg-amber-100 dark:bg-amber-900/30",
            iconColor: "text-amber-600 dark:text-amber-400",
            btnBg: "bg-amber-600 hover:bg-amber-700 shadow-amber-500/20",
            accent: "border-amber-500",
        },
        info: {
            icon: Info,
            iconBg: "bg-blue-100 dark:bg-blue-900/30",
            iconColor: "text-blue-600 dark:text-blue-400",
            btnBg: "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20",
            accent: "border-blue-500",
        },
        success: {
            icon: CheckCircle2,
            iconBg: "bg-green-100 dark:bg-green-900/30",
            iconColor: "text-green-600 dark:text-green-400",
            btnBg: "bg-green-600 hover:bg-green-700 shadow-green-500/20",
            accent: "border-green-500",
        },
    }[type];

    const Icon = typeConfig.icon;

    return (
        <div
            className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Dialog Body */}
            <div
                className={`relative bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all duration-300 border border-gray-100 dark:border-neutral-700 ${isOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
                    }`}
            >
                {/* Accent Bar - Now absolute and rounded */}
                <div className={`h-1.5 w-full absolute top-0 left-0 ${typeConfig.btnBg.split(" ")[0]} rounded-t-2xl`} />

                <div className="pt-8 pb-6 px-6">
                    <div className="flex flex-col items-center text-center">
                        <div className={`mb-4 p-4 rounded-2xl ${typeConfig.iconBg} ${typeConfig.iconColor}`}>
                            <Icon size={32} strokeWidth={2.5} />
                        </div>

                        <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">
                            {title}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed max-w-[280px]">
                            {message}
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-5 bg-gray-50/50 dark:bg-neutral-900/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 px-6 py-2.5 text-sm font-bold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-neutral-700/50 rounded-xl transition-all duration-200"
                    >
                        {cancelLabel || (language === "ja" ? "キャンセル" : "Hủy bỏ")}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className={`flex-1 px-8 py-2.5 text-sm font-black text-white rounded-xl shadow-lg ring-offset-2 dark:ring-offset-neutral-800 focus:ring-2 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:active:scale-100 ${typeConfig.btnBg}`}
                    >
                        {loading ? (
                            <div className="flex items-center justify-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>{language === "ja" ? "処理中..." : "Đang xử lý..."}</span>
                            </div>
                        ) : (
                            confirmLabel || (language === "ja" ? "実行" : "Xác nhận")
                        )}
                    </button>
                </div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors z-10"
                >
                    <X size={18} />
                </button>
            </div>
        </div>
    );
};

export default ConfirmDialog;
