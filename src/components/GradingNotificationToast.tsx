import React, { useEffect } from 'react';
import { Sparkles, CheckCircle2, X, Award, ArrowRight, MessageSquareQuote, Bell } from 'lucide-react';
import confetti from 'canvas-confetti';

export interface GradingNotification {
  id: string;
  examId: string;
  examTitle: string;
  score: number;
  mcScore?: number;
  essayScore?: number;
  teacherFeedback?: string;
  gradedAt: string;
  teacherName?: string;
}

export interface GradingNotificationToastProps {
  notification: GradingNotification | null;
  onClose: () => void;
  onViewDetails: (examId: string) => void;
}

export const GradingNotificationToast: React.FC<GradingNotificationToastProps> = ({
  notification,
  onClose,
  onViewDetails
}) => {
  useEffect(() => {
    if (!notification) return;

    // Trigger confetti if high score >= 8.0
    if (notification.score >= 8.0) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8, x: 0.85 }
        });
      } catch {
        // Safe fallback
      }
    }

    // Auto dismiss after 10 seconds
    const timer = setTimeout(() => {
      onClose();
    }, 10000);

    return () => clearTimeout(timer);
  }, [notification, onClose]);

  if (!notification) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full bg-white rounded-3xl shadow-2xl border-2 border-emerald-400 p-4 animate-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/30">
          <Award className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              🔔 Thông Báo Mới
            </span>
            <span className="text-[10px] font-bold text-slate-400">Vừa xong</span>
          </div>

          <h4 className="font-extrabold text-slate-900 text-sm mt-1 truncate">
            {notification.examTitle}
          </h4>

          <p className="text-xs text-slate-600 mt-0.5">
            Giáo viên đã chấm xong bài thi của em:
          </p>

          <div className="mt-2 p-2.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-semibold text-emerald-800 block">Điểm số tổng kết</span>
              <span className="text-xs text-emerald-700">
                TN: {notification.mcScore ?? 0}đ • TL: {notification.essayScore ?? 0}đ
              </span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-emerald-700">{notification.score}</span>
              <span className="text-[11px] text-emerald-600 font-bold">/10đ</span>
            </div>
          </div>

          {notification.teacherFeedback && (
            <div className="mt-2 text-[11px] text-slate-600 italic bg-slate-50 p-2 rounded-xl border border-slate-200 flex items-start gap-1.5">
              <MessageSquareQuote className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
              <span className="line-clamp-2">"{notification.teacherFeedback}"</span>
            </div>
          )}

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onViewDetails(notification.examId);
                onClose();
              }}
              className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-xs"
            >
              <span>Xem kết quả & lời giải</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-1.5 px-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-6 h-6 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
