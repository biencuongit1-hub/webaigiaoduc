import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Trash2, 
  Eye, 
  Share2, 
  Download, 
  GraduationCap, 
  Clock, 
  ShieldAlert, 
  CheckCircle2, 
  QrCode, 
  Search, 
  User, 
  FileText, 
  Printer, 
  ChevronRight,
  ExternalLink,
  Plus
} from 'lucide-react';
import { Exam, ExamSubmission } from '../types';

interface ExamManagementProps {
  exams: Exam[];
  submissions: ExamSubmission[];
  onDeleteExam: (id: string) => void;
  onTakeExam: (id: string) => void;
  onCreateNew: () => void;
}

export const ExamManagement: React.FC<ExamManagementProps> = ({
  exams,
  submissions,
  onDeleteExam,
  onTakeExam,
  onCreateNew
}) => {
  const [selectedExamId, setSelectedExamId] = useState<string>(exams[0]?.id || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'exams_list' | 'gradebook'>('gradebook');
  
  // Share modal state
  const [sharingExam, setSharingExam] = useState<Exam | null>(null);
  const [copied, setCopied] = useState(false);

  // Student submission inspection modal
  const [inspectingSub, setInspectingSub] = useState<ExamSubmission | null>(null);

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
  const excellentCount = examSubmissions.filter((s) => s.score >= 8.0).length;

  // Export CSV
  const handleExportCSV = () => {
    if (examSubmissions.length === 0) {
      alert('Chưa có học sinh nào nộp bài thi này để xuất dữ liệu.');
      return;
    }

    const headers = ['STT', 'Họ và tên', 'Lớp', 'SBD', 'Điểm', 'Số câu đúng', 'Thời gian làm (giây)', 'Số lần vi phạm', 'Thời điểm nộp'];
    const rows = examSubmissions.map((s, idx) => [
      idx + 1,
      `"${s.studentName}"`,
      `"${s.studentClass}"`,
      `"${s.studentId || ''}"`,
      s.score,
      `${s.correctCount}/${s.totalQuestions}`,
      s.timeSpentSeconds,
      s.violationsCount,
      `"${new Date(s.submittedAt).toLocaleString('vi-VN')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Bang_diem_${currentExam?.title || 'thoi_dai_ai'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 text-blue-600 font-bold text-xs uppercase tracking-wider mb-1">
            <FileSpreadsheet className="w-4 h-4" />
            Bảng Quản Lý Khảo Thí & Sổ Điểm
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Quản Lý Đề Thi & Bảng Điểm Học Sinh
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Theo dõi kết quả làm bài, giám sát chống gian lận và xuất báo cáo điểm số
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCreateNew}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo đề thi mới</span>
          </button>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('gradebook')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'gradebook'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Sổ điểm & Báo cáo kết quả thi
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('exams_list')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'exams_list'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Danh sách đề thi ({exams.length} đề)
        </button>
      </div>

      {/* TAB 1: GRADEBOOK */}
      {activeTab === 'gradebook' && (
        <div className="space-y-6">
          {/* Select Exam Dropdown */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <label className="text-xs font-bold text-slate-700 whitespace-nowrap">
                Chọn đề thi:
              </label>
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="w-full sm:w-80 px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {exams.map((exam) => (
                  <option key={exam.id} value={exam.id}>
                    [{exam.subject} - {exam.grade}] {exam.title} ({exam.accessCode})
                  </option>
                ))}
              </select>
            </div>

            {currentExam && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSharingExam(currentExam)}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Chia sẻ link thi</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Xuất Excel / CSV</span>
                </button>
              </div>
            )}
          </div>

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="text-xs text-slate-500 font-medium">Lượt học sinh nộp</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{totalSubs}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Môn: {currentExam?.subject || '---'}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="text-xs text-slate-500 font-medium">Điểm trung bình</div>
              <div className="text-2xl font-black text-blue-600 mt-1">{avgScore}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Trên thang điểm 10</div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="text-xs text-slate-500 font-medium">Tỉ lệ đạt (≥ 5.0)</div>
              <div className="text-2xl font-black text-emerald-600 mt-1">{passRate}%</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{passedCount} học sinh đạt</div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="text-xs text-slate-500 font-medium">Điểm cao nhất</div>
              <div className="text-2xl font-black text-amber-500 mt-1">{highestScore}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{excellentCount} bài điểm giỏi</div>
            </div>
          </div>

          {/* Submissions Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            {/* Search Bar inside table header */}
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="font-bold text-slate-900 text-sm">
                Danh Sách Bài Nộp ({filteredSubs.length})
              </div>

              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm học sinh, lớp, SBD..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            {filteredSubs.length === 0 ? (
              <div className="p-12 text-center text-slate-500 space-y-2">
                <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                <div className="text-sm font-bold">Chưa có dữ liệu bài nộp cho đề thi này</div>
                <p className="text-xs text-slate-400">
                  Hãy gửi mã đề <span className="font-bold text-blue-600">{currentExam?.accessCode}</span> cho học sinh vào làm bài thi.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <tr>
                      <th className="py-3 px-4">STT</th>
                      <th className="py-3 px-4">Họ và tên</th>
                      <th className="py-3 px-4">Lớp</th>
                      <th className="py-3 px-4">SBD</th>
                      <th className="py-3 px-4 text-center">Điểm số</th>
                      <th className="py-3 px-4 text-center">Số câu đúng</th>
                      <th className="py-3 px-4 text-center">Thời gian làm</th>
                      <th className="py-3 px-4 text-center">Rời tab / Gian lận</th>
                      <th className="py-3 px-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSubs.map((sub, idx) => (
                      <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 text-slate-400 font-medium">{idx + 1}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{sub.studentName}</td>
                        <td className="py-3 px-4 font-medium text-slate-600">{sub.studentClass}</td>
                        <td className="py-3 px-4 font-mono text-slate-500">{sub.studentId || '---'}</td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full font-black text-xs ${
                              sub.score >= 8
                                ? 'bg-emerald-100 text-emerald-800'
                                : sub.score >= 5
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {sub.score}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center text-slate-600 font-medium">
                          {sub.correctCount} / {sub.totalQuestions}
                        </td>
                        <td className="py-3 px-4 text-center text-slate-600 font-medium">
                          {Math.floor(sub.timeSpentSeconds / 60)}p {sub.timeSpentSeconds % 60}s
                        </td>
                        <td className="py-3 px-4 text-center">
                          {sub.violationsCount > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[11px]">
                              <ShieldAlert className="w-3 h-3 text-amber-600" />
                              {sub.violationsCount} lần
                            </span>
                          ) : (
                            <span className="text-emerald-600 font-medium">Trung thực</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setInspectingSub(sub)}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 hover:border-blue-500 hover:text-blue-600 font-bold text-[11px] transition-colors"
                          >
                            Chi tiết bài
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {exams.map((exam) => (
            <div
              key={exam.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-blue-100 text-blue-800">
                    {exam.subject} • {exam.grade}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-slate-100 text-slate-700">
                    Mã: {exam.accessCode}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-base">{exam.title}</h3>
                <p className="text-xs text-slate-500 line-clamp-2">{exam.description}</p>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span>⏱ {exam.durationMinutes} phút</span>
                  <span>•</span>
                  <span>📝 {exam.questions.length} câu</span>
                  <span>•</span>
                  <span>Lớp: {exam.targetClass || 'Tất cả'}</span>
                  {exam.settings.antiCheatProctoring && (
                    <>
                      <span>•</span>
                      <span className="text-amber-600 font-medium">🛡 Chống gian lận</span>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSharingExam(exam)}
                    className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600"
                    title="Chia sẻ đề thi"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteExam(exam.id)}
                    className="p-2 rounded-lg border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-400"
                    title="Xóa đề thi"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedExamId(exam.id);
                      setActiveTab('gradebook');
                    }}
                    className="px-3 py-1.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50"
                  >
                    Xem sổ điểm
                  </button>
                  <button
                    type="button"
                    onClick={() => onTakeExam(exam.id)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1"
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>Thi thử</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: SHARE EXAM */}
      {sharingExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-2">
                <Share2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Chia Sẻ Đề Thi Cho Học Sinh
              </h3>
              <p className="text-xs text-slate-500">{sharingExam.title}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-center space-y-1">
              <span className="text-xs text-blue-600 font-bold block">
                MÃ TRUY CẬP ĐỀ THI:
              </span>
              <span className="text-2xl font-black font-mono text-blue-900 tracking-wider">
                {sharingExam.accessCode}
              </span>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Link trực tiếp:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/?code=${sharingExam.accessCode}`}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono bg-slate-100"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `${window.location.origin}/?code=${sharingExam.accessCode}`
                    );
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="px-3 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold shrink-0 hover:bg-blue-700"
                >
                  {copied ? 'Đã copy' : 'Copy'}
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSharingExam(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* MODAL: INSPECT SUBMISSION DETAILS */}
      {inspectingSub && currentExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Chi Tiết Bài Làm Của {inspectingSub.studentName}
                </h3>
                <div className="text-xs text-slate-500 mt-0.5">
                  Lớp: {inspectingSub.studentClass} • SBD: {inspectingSub.studentId || 'N/A'} • Điểm: <strong className="text-emerald-600 text-sm font-black">{inspectingSub.score}/10</strong>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectingSub(null)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            {/* Content Scrollable */}
            <div className="p-6 overflow-y-auto space-y-4">
              {/* Anti-cheat audit note */}
              {inspectingSub.violationsCount > 0 ? (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-amber-800">
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                    Biên bản giám sát: Ghi nhận {inspectingSub.violationsCount} lần chuyển tab
                  </div>
                  {inspectingSub.violationLogs.map((log, i) => (
                    <div key={i} className="text-slate-600 text-[11px]">
                      • {new Date(log.timestamp).toLocaleTimeString('vi-VN')}: {log.message}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
                  ✓ Học sinh không có hành vi chuyển tab hay rời màn hình trong suốt buổi thi.
                </div>
              )}

              {/* Questions check */}
              <div className="space-y-3">
                {currentExam.questions.map((q, idx) => {
                  const studentAns = inspectingSub.answers[q.id];
                  const isCorrect = studentAns === q.correctOptionId;

                  return (
                    <div
                      key={q.id}
                      className={`p-4 rounded-xl border text-xs space-y-2 ${
                        isCorrect
                          ? 'border-emerald-200 bg-emerald-50/20'
                          : 'border-rose-200 bg-rose-50/20'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-bold text-slate-900">
                          Câu {idx + 1}: {q.text}
                        </div>
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-[10px] shrink-0 ${
                            isCorrect
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {isCorrect ? 'ĐÚNG' : 'SAI'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-slate-600">
                        <div>
                          Học sinh chọn: <strong className={isCorrect ? 'text-emerald-700' : 'text-rose-700'}>{studentAns || 'Chưa chọn'}</strong>
                        </div>
                        <div>
                          Đáp án đúng: <strong className="text-emerald-700">{q.correctOptionId}</strong>
                        </div>
                      </div>

                      {q.explanation && (
                        <div className="text-slate-500 italic bg-white/60 p-2 rounded">
                          HD: {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setInspectingSub(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
