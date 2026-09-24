import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Trash2, 
  Eye, 
  Share2, 
  Download, 
  Clock, 
  ShieldAlert, 
  CheckCircle2, 
  QrCode, 
  Search, 
  User, 
  FileText, 
  Printer, 
  ExternalLink,
  Plus,
  PenTool,
  CheckSquare,
  AlertCircle,
  Save,
  Award
} from 'lucide-react';
import { Exam, ExamSubmission, EssayScoreDetail } from '../types';

interface ExamManagementProps {
  exams: Exam[];
  submissions: ExamSubmission[];
  onDeleteExam: (id: string) => void;
  onTakeExam: (id: string) => void;
  onUpdateSubmission?: (submission: ExamSubmission) => void;
  onCreateNew: () => void;
}

export const ExamManagement: React.FC<ExamManagementProps> = ({
  exams,
  submissions,
  onDeleteExam,
  onTakeExam,
  onUpdateSubmission,
  onCreateNew
}) => {
  const [selectedExamId, setSelectedExamId] = useState<string>(exams[0]?.id || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'gradebook' | 'exams_list'>('gradebook');
  
  // Share modal state
  const [sharingExam, setSharingExam] = useState<Exam | null>(null);
  const [copied, setCopied] = useState(false);

  // Student submission inspection & grading modal
  const [inspectingSub, setInspectingSub] = useState<ExamSubmission | null>(null);
  const [gradingDraft, setGradingDraft] = useState<Record<string, EssayScoreDetail>>({});
  const [overallFeedback, setOverallFeedback] = useState<string>('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  // Current active exam
  const currentExam = exams.find((e) => e.id === selectedExamId) || exams[0];
  const examSubmissions = submissions.filter((s) => s.examId === selectedExamId);

  // Filtered submissions
  const filteredSubs = examSubmissions.filter(
    (s) =>
      s.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.studentClass.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.studentId && s.studentId.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Statistics
  const totalSubs = examSubmissions.length;
  const avgScore =
    totalSubs > 0
      ? (examSubmissions.reduce((acc, cur) => acc + cur.score, 0) / totalSubs).toFixed(1)
      : '0.0';
  const highestScore =
    totalSubs > 0 ? Math.max(...examSubmissions.map((s) => s.score)) : 0;
  const passedCount = examSubmissions.filter((s) => s.score >= 5.0).length;
  const passRate = totalSubs > 0 ? Math.round((passedCount / totalSubs) * 100) : 0;
  const pendingGradingCount = examSubmissions.filter((s) => s.gradingStatus === 'pending_review').length;

  // Open Grading Modal
  const handleOpenGrading = (sub: ExamSubmission) => {
    setInspectingSub(sub);
    setGradingDraft(sub.essayScores ? { ...sub.essayScores } : {});
    setOverallFeedback(sub.teacherFeedback || '');
    setSaveSuccessMsg(false);
  };

  // Save Teacher Essay Grading
  const handleSaveGrading = () => {
    if (!inspectingSub || !currentExam) return;

    let totalEssayScore = 0;
    Object.values(gradingDraft).forEach((detail) => {
      totalEssayScore += Number(detail.score) || 0;
    });

    const mcScore = inspectingSub.multipleChoiceScore ?? inspectingSub.score;
    const finalTotal = Number((mcScore + totalEssayScore).toFixed(2));

    const updatedSub: ExamSubmission = {
      ...inspectingSub,
      essayScores: gradingDraft,
      essayScore: Number(totalEssayScore.toFixed(2)),
      score: finalTotal,
      gradingStatus: 'graded',
      teacherFeedback: overallFeedback
    };

    if (onUpdateSubmission) {
      onUpdateSubmission(updatedSub);
    }
    setInspectingSub(updatedSub);
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 3000);
  };

  // Export CSV
  const handleExportCSV = () => {
    if (examSubmissions.length === 0) {
      alert('Chưa có học sinh nào nộp bài thi này để xuất dữ liệu.');
      return;
    }

    const headers = [
      'STT', 
      'Họ và tên', 
      'Lớp', 
      'SBD', 
      'Điểm Trắc nghiệm',
      'Điểm Tự luận',
      'Tổng Điểm', 
      'Trạng thái chấm',
      'Thời gian làm (giây)', 
      'Số lần vi phạm', 
      'Thời điểm nộp'
    ];
    
    const rows = examSubmissions.map((s, idx) => [
      idx + 1,
      `"${s.studentName}"`,
      `"${s.studentClass}"`,
      `"${s.studentId || ''}"`,
      s.multipleChoiceScore ?? s.score,
      s.essayScore ?? 0,
      s.score,
      s.gradingStatus === 'pending_review' ? 'Chờ chấm TL' : 'Đã chấm',
      s.timeSpentSeconds,
      s.violationsCount,
      `"${new Date(s.submittedAt).toLocaleString('vi-VN')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Bang_diem_${currentExam?.title || 'thi'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy share URL
  const handleCopyShare = (code: string) => {
    const url = `${window.location.origin}/?code=${code}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Quản Lý Đề Thi & Chấm Bài Trực Tuyến
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi phổ điểm trắc nghiệm, trực tiếp chấm điểm tự luận và xuất bảng điểm học sinh
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCreateNew}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Đề Thi Mới</span>
          </button>
        </div>
      </div>

      {/* Tabs Selection */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('gradebook')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'gradebook'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Bảng Điểm & Chấm Bài Tự Luận</span>
          {pendingGradingCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black">
              {pendingGradingCount} chờ chấm
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('exams_list')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'exams_list'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Kho Đề Thi Của Tôi ({exams.length})</span>
        </button>
      </div>

      {/* TAB 1: GRADEBOOK & ESSAY GRADING */}
      {activeTab === 'gradebook' && (
        <div className="space-y-6">
          {/* Exam Selector Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-500 shrink-0">Chọn đề thi:</span>
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 max-w-md"
              >
                {exams.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.title} ({ex.subject} - {ex.accessCode})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              {currentExam && (
                <>
                  <button
                    type="button"
                    onClick={() => setSharingExam(currentExam)}
                    className="px-3 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 flex items-center gap-1.5"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Lấy link thi</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onTakeExam(currentExam.id)}
                    className="px-3 py-2 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold hover:bg-blue-100 border border-blue-200 flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Thi thử</span>
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={handleExportCSV}
                className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Xuất Excel/CSV</span>
              </button>
            </div>
          </div>

          {/* Exam Structure Banner */}
          {currentExam && (
            <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-xs font-bold text-blue-300 uppercase tracking-wider">
                  Cấu Trúc Đề Thi Đã Thiết Lập
                </div>
                <div className="text-base font-bold">
                  {currentExam.title}
                </div>
                <div className="text-xs text-slate-300 flex flex-wrap items-center gap-2 pt-1">
                  <span>Thời gian: {currentExam.durationMinutes} phút</span>
                  <span>|</span>
                  <span>Mã phòng thi: <strong className="text-amber-400 font-mono text-sm">{currentExam.accessCode}</strong></span>
                  <span>|</span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    currentExam.restrictToGrade ? 'bg-amber-400 text-slate-900' : 'bg-blue-600 text-white'
                  }`}>
                    {currentExam.restrictToGrade ? `🔒 Giới hạn ${currentExam.grade}` : `🌐 Mọi khối lớp`}
                  </span>
                  {currentExam.targetClass && (
                    <span className="bg-white/20 px-2 py-0.5 rounded text-[11px]">
                      Lớp {currentExam.targetClass}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-white/10 px-3.5 py-2 rounded-xl border border-white/10 text-center">
                  <div className="text-[10px] text-blue-200">Trắc nghiệm</div>
                  <div className="text-sm font-black text-white">
                    {currentExam.multipleChoicePoints ?? 7}đ ({currentExam.questions.filter(q => (q.type || 'multiple_choice') === 'multiple_choice').length} câu)
                  </div>
                </div>

                <div className="bg-white/10 px-3.5 py-2 rounded-xl border border-white/10 text-center">
                  <div className="text-[10px] text-purple-200">Tự luận</div>
                  <div className="text-sm font-black text-white">
                    {currentExam.essayPoints ?? 3}đ ({currentExam.questions.filter(q => q.type === 'essay').length} câu)
                  </div>
                </div>

                <div className="bg-white/10 px-3.5 py-2 rounded-xl border border-white/10 text-center">
                  <div className="text-[10px] text-amber-200">Tổng điểm</div>
                  <div className="text-sm font-black text-amber-400">
                    {currentExam.totalPoints}đ
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Analytics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs text-slate-500 font-medium">Số lượt nộp bài</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{totalSubs}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Học sinh hoàn thành</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs text-slate-500 font-medium">Điểm trung bình</div>
              <div className="text-2xl font-black text-blue-600 mt-1">{avgScore}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Thang điểm 10</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs text-slate-500 font-medium">Tỉ lệ đạt (≥ 5.0)</div>
              <div className="text-2xl font-black text-emerald-600 mt-1">{passRate}%</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{passedCount} / {totalSubs} học sinh</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs text-slate-500 font-medium">Chờ chấm tự luận</div>
              <div className={`text-2xl font-black mt-1 ${pendingGradingCount > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                {pendingGradingCount}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Cần giáo viên vào chấm</div>
            </div>
          </div>

          {/* Submissions Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  Danh Sách Điểm Bài Thi ({filteredSubs.length} học sinh)
                </h3>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm học sinh, lớp, SBD..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>
            </div>

            {filteredSubs.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                Chưa có học sinh nào nộp bài thi này hoặc không tìm thấy kết quả phù hợp.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">STT</th>
                      <th className="py-3 px-4">Họ và tên</th>
                      <th className="py-3 px-4">Lớp / SBD</th>
                      <th className="py-3 px-4 text-center">Trắc nghiệm</th>
                      <th className="py-3 px-4 text-center">Tự luận</th>
                      <th className="py-3 px-4 text-center">Tổng Điểm</th>
                      <th className="py-3 px-4 text-center">Trạng thái</th>
                      <th className="py-3 px-4 text-center">Vi phạm</th>
                      <th className="py-3 px-4 text-right">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {filteredSubs.map((sub, idx) => (
                      <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{sub.studentName}</div>
                          <div className="text-[10px] text-slate-400">
                            {new Date(sub.submittedAt).toLocaleTimeString('vi-VN')} {new Date(sub.submittedAt).toLocaleDateString('vi-VN')}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-800">{sub.studentClass}</span>
                          {sub.studentId && (
                            <span className="text-slate-400 ml-1">({sub.studentId})</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-blue-700">
                          {sub.multipleChoiceScore ?? sub.score}đ
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-purple-700">
                          {sub.gradingStatus === 'graded' ? `${sub.essayScore ?? 0}đ` : 'Chờ chấm'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`font-black text-sm px-2.5 py-1 rounded-lg ${
                              sub.score >= 8.0
                                ? 'bg-emerald-100 text-emerald-800'
                                : sub.score >= 5.0
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {sub.score}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {sub.gradingStatus === 'pending_review' ? (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                              ⏳ Chờ chấm TL
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                              ✓ Đã chấm xong
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {sub.violationsCount > 0 ? (
                            <span className="text-amber-600 font-bold flex items-center justify-center gap-1">
                              <ShieldAlert className="w-3.5 h-3.5" />
                              {sub.violationsCount} lần
                            </span>
                          ) : (
                            <span className="text-emerald-600">0</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleOpenGrading(sub)}
                            className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs transition-colors inline-flex items-center gap-1 border border-blue-200"
                          >
                            <PenTool className="w-3 h-3" />
                            <span>Chấm & Xem bài</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: EXAMS LIST */}
      {activeTab === 'exams_list' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {exams.map((ex) => {
            const exSubs = submissions.filter((s) => s.examId === ex.id);
            const mcCount = ex.questions.filter(q => (q.type || 'multiple_choice') === 'multiple_choice').length;
            const esCount = ex.questions.filter(q => q.type === 'essay').length;

            return (
              <div
                key={ex.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-blue-100 text-blue-800">
                      {ex.subject} - {ex.grade}
                    </span>
                    <button
                      type="button"
                      onClick={() => onDeleteExam(ex.id)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                      title="Xóa đề thi"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base leading-snug">
                    {ex.title}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-2">
                    {ex.description || 'Không có mô tả thêm.'}
                  </p>
                </div>

                {/* Structure details */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Cấu trúc đề:</span>
                    <span className="font-bold text-slate-800">
                      {mcCount} TN ({ex.multipleChoicePoints ?? 7}đ) + {esCount} TL ({ex.essayPoints ?? 3}đ)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Mã phòng thi:</span>
                    <strong className="text-blue-700 font-mono">{ex.accessCode}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Đã nộp bài:</span>
                    <strong className="text-slate-800">{exSubs.length} lượt thi</strong>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedExamId(ex.id);
                      setActiveTab('gradebook');
                    }}
                    className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors flex items-center justify-center gap-1"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Xem điểm</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSharingExam(ex)}
                    className="px-3 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs"
                    title="Chia sẻ link"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onTakeExam(ex.id)}
                    className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                    title="Vào phòng thi"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: TEACHER ESSAY GRADING & DETAILED INSPECTION */}
      {inspectingSub && currentExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block">
                  Bảng Chấm Bài Tự Luận & Đánh Giá
                </span>
                <h3 className="text-xl font-black text-slate-900">
                  Bài Làm Của {inspectingSub.studentName} ({inspectingSub.studentClass})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Đề: {currentExam.title} | Nộp lúc {new Date(inspectingSub.submittedAt).toLocaleString('vi-VN')}
                </p>
              </div>

              <div className="text-right">
                <div className="text-xs text-slate-500">Tổng điểm hiện tại</div>
                <div className="text-2xl font-black text-blue-600">
                  {inspectingSub.score} <span className="text-xs text-slate-400">/ 10</span>
                </div>
              </div>
            </div>

            {/* Score Breakdown Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 block">Điểm Trắc nghiệm (Tự động):</span>
                <strong className="text-blue-700 text-sm font-bold">
                  {inspectingSub.multipleChoiceScore ?? inspectingSub.score} / {currentExam.multipleChoicePoints ?? 7}đ
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block">Điểm Tự luận (Giáo viên chấm):</span>
                <strong className="text-purple-700 text-sm font-bold">
                  {inspectingSub.essayScore ?? 0} / {currentExam.essayPoints ?? 3}đ
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block">Cảnh báo vi phạm:</span>
                <strong className={`text-sm font-bold ${inspectingSub.violationsCount > 0 ? 'text-amber-600' : 'text-slate-800'}`}>
                  {inspectingSub.violationsCount} lần chuyển tab
                </strong>
              </div>
            </div>

            {/* Questions Inspection & Grading Form */}
            <div className="space-y-6">
              <h4 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">
                Chi Tiết Từng Câu Hỏi & Nhập Điểm Tự Luận
              </h4>

              {currentExam.questions.map((q, idx) => {
                const isEssay = q.type === 'essay';
                const studentAnswer = inspectingSub.answers[q.id];

                if (isEssay) {
                  const currentDetail = gradingDraft[q.id] || {
                    score: q.points || 1.5,
                    maxScore: q.points || 1.5,
                    teacherNote: ''
                  };

                  return (
                    <div
                      key={q.id}
                      className="p-5 rounded-2xl border-2 border-purple-200 bg-purple-50/20 space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-100 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-purple-600 text-white font-bold text-xs flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="font-bold text-purple-950 text-sm">
                            Câu {idx + 1} (Tự luận - Thang {q.points || 1.5} điểm)
                          </span>
                        </div>

                        {/* Point Input */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-purple-900">Cho điểm câu này:</span>
                          <input
                            type="number"
                            step={0.25}
                            min={0}
                            max={q.points || 10}
                            value={currentDetail.score ?? 0}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setGradingDraft({
                                ...gradingDraft,
                                [q.id]: {
                                  ...currentDetail,
                                  score: val,
                                  maxScore: q.points || 1.5
                                }
                              });
                            }}
                            className="w-20 px-2 py-1 rounded-lg border border-purple-300 font-black text-sm text-purple-950 text-center bg-white focus:ring-2 focus:ring-purple-500"
                          />
                          <span className="text-xs text-purple-700 font-bold">/ {q.points || 1.5}đ</span>
                        </div>
                      </div>

                      {/* Question Text */}
                      <div className="text-xs text-slate-700 font-medium">
                        <strong>Đề bài:</strong> {q.text}
                      </div>

                      {/* Student's answer */}
                      <div className="p-3 rounded-xl bg-white border border-purple-200 space-y-1">
                        <div className="text-[11px] font-bold text-purple-900 uppercase">
                          Bài làm của học sinh:
                        </div>
                        <div className="text-xs text-slate-900 whitespace-pre-line font-medium leading-relaxed">
                          {studentAnswer || <em className="text-slate-400">Học sinh không điền câu trả lời.</em>}
                        </div>
                      </div>

                      {/* Teacher's model answer & rubric */}
                      {q.modelAnswer && (
                        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs space-y-1 text-emerald-950">
                          <strong className="block text-[11px] font-bold text-emerald-800 uppercase">
                            Đáp án chuẩn & Barem của giáo viên:
                          </strong>
                          <p className="whitespace-pre-line">{q.modelAnswer}</p>
                          {q.rubric && (
                            <p className="text-[11px] text-emerald-800 pt-1 border-t border-emerald-200/50">
                              <strong>Barem:</strong> {q.rubric}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Teacher question note */}
                      <div>
                        <label className="block text-[11px] font-bold text-purple-900 mb-1">
                          Nhận xét riêng cho câu tự luận này:
                        </label>
                        <input
                          type="text"
                          value={currentDetail.teacherNote || ''}
                          onChange={(e) => {
                            setGradingDraft({
                              ...gradingDraft,
                              [q.id]: {
                                ...currentDetail,
                                teacherNote: e.target.value
                              }
                            });
                          }}
                          placeholder="VD: Làm đúng bước giải phương trình, còn thiếu điều kiện nghiệm..."
                          className="w-full px-3 py-1.5 rounded-lg border border-purple-200 text-xs text-purple-950 bg-white focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  );
                }

                // Multiple choice display
                const isCorrect = studentAnswer === q.correctOptionId;
                return (
                  <div
                    key={q.id}
                    className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
                      isCorrect ? 'border-emerald-200 bg-emerald-50/20' : 'border-rose-200 bg-rose-50/20'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-md font-bold text-white text-[11px] flex items-center justify-center ${
                        isCorrect ? 'bg-emerald-600' : 'bg-rose-600'
                      }`}>
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-slate-800 line-clamp-1 max-w-md">
                        {q.text}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-slate-500">
                        Chọn: <strong className={isCorrect ? 'text-emerald-700' : 'text-rose-700'}>{studentAnswer || 'Chưa chọn'}</strong> (Đ/A: {q.correctOptionId})
                      </span>
                      <span className={`font-bold ${isCorrect ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {isCorrect ? `+${q.points || 1}đ` : '0đ'}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Overall feedback */}
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-bold text-slate-800">
                  Nhận xét & Lời khuyên tổng thể cho học sinh:
                </label>
                <textarea
                  rows={2}
                  value={overallFeedback}
                  onChange={(e) => setOverallFeedback(e.target.value)}
                  placeholder="Nhập lời khen hoặc dặn dò ôn tập cho học sinh..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {saveSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Đã lưu kết quả chấm bài và cập nhật điểm tổng kết thành công!</span>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setInspectingSub(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100"
              >
                Đóng
              </button>

              <button
                type="button"
                onClick={handleSaveGrading}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>Lưu & Cập Nhật Điểm Bài Thi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SHARE MODAL */}
      {sharingExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-slate-900">
                Chia Sẻ Phòng Thi Trực Tuyến
              </h3>
              <p className="text-xs text-slate-500">{sharingExam.title}</p>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50 text-center space-y-1">
              <div className="text-[11px] font-bold text-blue-700 uppercase">
                Mã Phòng Thi
              </div>
              <div className="text-3xl font-black text-blue-700 tracking-wider">
                {sharingExam.accessCode}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/?code=${sharingExam.accessCode}`}
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-600 font-mono"
              />
              <button
                type="button"
                onClick={() => handleCopyShare(sharingExam.accessCode)}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shrink-0"
              >
                {copied ? 'Đã chép' : 'Sao chép'}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setSharingExam(null)}
              className="w-full py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
