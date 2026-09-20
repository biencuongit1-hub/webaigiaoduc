import React, { useState } from 'react';
import { 
  Bot, 
  Sparkles, 
  FileText, 
  Volume2, 
  Copy, 
  Check, 
  Send, 
  Flame, 
  Lightbulb,
  Award
} from 'lucide-react';

export const AIAssistantModal: React.FC = () => {
  const [feature, setFeature] = useState<'cv5512' | 'skkn' | 'dragon_ai'>('cv5512');
  
  // CV5512 State
  const [topic, setTopic] = useState('Định luật vạn vật hấp dẫn');
  const [subject, setSubject] = useState('Vật lý');
  const [grade, setGrade] = useState('Lớp 10');
  const [generatedPlan, setGeneratedPlan] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // SKKN State
  const [skknField, setSkknField] = useState('Ứng dụng Trí tuệ nhân tạo (AI) và Gamification trong dạy học');
  const [skknIdeas, setSkknIdeas] = useState<string[]>([]);

  // Dragon AI state
  const [noiseLevel, setNoiseLevel] = useState(25); // 0 - 100
  const [dragonMood, setDragonMood] = useState<'happy' | 'warning' | 'angry'>('happy');

  const handleGenerateCV5512 = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const plan = `KẾ HOẠCH BÀI DẠY (THEO CÔNG VĂN 5512/BGDĐT-GDTrH)
MÔN: ${subject.toUpperCase()} - KHỐI: ${grade.toUpperCase()}
BÀI: ${topic.toUpperCase()}
Thời lượng thực hiện: 02 tiết

I. MỤC TIÊU DẠY HỌC:
1. Về kiến thức:
- Học sinh phát biểu và giải thích được bản chất của ${topic}.
- Viết được công thức, đơn vị các đại lượng và phân tích ý nghĩa thực tiễn.
2. Về năng lực:
- Năng lực tìm hiểu tự nhiên: Thiết kế thí nghiệm mô phỏng hoặc phân tích dữ liệu thực tế.
- Năng lực giải quyết vấn đề: Vận dụng kiến thức giải thích hiện tượng đời sống.
3. Về phẩm chất:
- Chăm chỉ nghiên cứu tài liệu, trung thực trong thu thập dữ liệu và báo cáo kết quả.

II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU:
- Giáo viên: Bài giảng tương tác 360°, phiếu học tập số, máy chiếu.
- Học sinh: SGK, vở ghi, thiết bị di động có kết nối internet để làm bài kiểm tra nhanh.

III. TIẾN TRÌNH DẠY HỌC:
1. HOẠT ĐỘNG 1: MỞ ĐẦU (Khởi động - 7 phút)
- Mục tiêu: Kích hoạt tư duy và tạo mâu thuẫn nhận thức cho học sinh.
- Nội dung: Giáo viên tổ chức trò chơi "Quiz Nghiêng Đầu" gồm 3 câu hỏi trắc nghiệm nhanh.
- Sản phẩm: Tinh thần hào hứng và dự đoán ban đầu của các nhóm.

2. HOẠT ĐỘNG 2: HÌNH THÀNH KIẾN THỨC MỚI (25 phút)
- Mục tiêu: Học sinh khám phá và xây dựng định luật, công thức ${topic}.
- Tổ chức thực hiện: Học sinh làm việc theo nhóm 4 người, hoàn thành Phiếu học tập số 1.
- Báo cáo và thảo luận: Đại diện 2 nhóm trình bày, các nhóm khác phản biện.

3. HOẠT ĐỘNG 3: LUYỆN TẬP (8 phút)
- Mục tiêu: Củng cố và khắc sâu kiến thức.
- Nội dung: Làm bài kiểm tra 5 câu trên hệ thống trắc nghiệm Giáo viên thời đại AI.
- Đánh giá: Thống kê điểm số và chữa trực tiếp câu có tỉ lệ sai cao nhất.

4. HOẠT ĐỘNG 4: VẬN DỤNG VÀ MỞ RỘNG (5 phút)
- Giao nhiệm vụ về nhà: Tìm hiểu ứng dụng ${topic} trong ngành Hàng không vũ trụ hoặc đời sống.`;

      setGeneratedPlan(plan);
      setIsGenerating(false);
    }, 700);
  };

  const handleGenerateSKKN = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setSkknIdeas([
        `Đề tài 1: "Một số biện pháp nâng cao hứng thú học tập môn ${subject} thông qua tích hợp trò chơi Gamification và nền tảng khảo thí trực tuyến Giáo viên thời đại AI"`,
        `Đề tài 2: "Ứng dụng Trợ lý AI và không gian bài giảng 360 độ nhằm phát triển năng lực tự học cho học sinh THCS trong bối cảnh chuyển đổi số"`,
        `Đề tài 3: "Đổi mới phương pháp kiểm tra, đánh giá thường xuyên môn ${subject} bằng hệ thống đề thi chống gian lận và phân tích phổ điểm tự động"`,
        `Đề tài 4: "Xây dựng ngân hàng câu hỏi trắc nghiệm ma trận 4 cấp độ kết hợp công nghệ giáo dục hiện đại tại trường phổ thông"`
      ]);
      setIsGenerating(false);
    }, 600);
  };

  const handleSimulateNoise = () => {
    const nextNoise = Math.floor(10 + Math.random() * 85);
    setNoiseLevel(nextNoise);
    if (nextNoise < 45) {
      setDragonMood('happy');
    } else if (nextNoise < 75) {
      setDragonMood('warning');
    } else {
      setDragonMood('angry');
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      <div className="border-b border-slate-200 pb-5">
        <div className="inline-flex items-center gap-1.5 text-amber-600 font-bold text-xs uppercase tracking-wider mb-1">
          <Bot className="w-4 h-4" />
          Công nghệ Giáo viên thời đại AI
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Trợ Lý AI Giáo Viên 4.0
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Giảm tải công việc soạn bài, gợi ý đề tài nghiên cứu sư phạm và hỗ trợ điều phối lớp học
        </p>
      </div>

      {/* Feature switch buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFeature('cv5512')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            feature === 'cv5512'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          Soạn Giáo Án Chuẩn CV 5512
        </button>

        <button
          type="button"
          onClick={() => setFeature('skkn')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            feature === 'skkn'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Lightbulb className="w-4 h-4" />
          Trợ Lý Viết Sáng Kiến Kinh Nghiệm (SKKN)
        </button>

        <button
          type="button"
          onClick={() => setFeature('dragon_ai')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            feature === 'dragon_ai'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Volume2 className="w-4 h-4" />
          "Chú Rồng AI" Quản Lý Lớp Học
        </button>
      </div>

      {/* 1. SOẠN GIÁO ÁN 5512 */}
      {feature === 'cv5512' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tên bài dạy / Chủ đề *
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="VD: Định luật vạn vật hấp dẫn"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Môn học & Khối lớp
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs"
                  placeholder="Môn"
                />
                <input
                  type="text"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs"
                  placeholder="Khối"
                />
              </div>
            </div>
          </div>

          <button
            type="button"
            disabled={isGenerating}
            onClick={handleGenerateCV5512}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isGenerating ? 'AI đang biên soạn kế hoạch bài dạy...' : 'Kích hoạt AI soạn giáo án 5512'}</span>
          </button>

          {generatedPlan && (
            <div className="space-y-3 pt-4 border-t border-slate-100 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase">
                  Kết quả giáo án mẫu chuẩn CV 5512:
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedPlan);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1.5 text-slate-700"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Đã sao chép' : 'Sao chép giáo án'}</span>
                </button>
              </div>

              <textarea
                rows={16}
                readOnly
                value={generatedPlan}
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 font-mono text-xs leading-relaxed text-slate-800"
              />
            </div>
          )}
        </div>
      )}

      {/* 2. SÁNG KIẾN KINH NGHIỆM (SKKN) */}
      {feature === 'skkn' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              Lĩnh vực / Phương pháp đổi mới mong muốn:
            </label>
            <input
              type="text"
              value={skknField}
              onChange={(e) => setSkknField(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <button
            type="button"
            disabled={isGenerating}
            onClick={handleGenerateSKKN}
            className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-600/20 transition-all flex items-center justify-center gap-2"
          >
            <Lightbulb className="w-4 h-4" />
            <span>Gợi ý tên đề tài & Đề cương Sáng kiến kinh nghiệm</span>
          </button>

          {skknIdeas.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-700 uppercase">
                Gợi ý đề tài Sáng kiến kinh nghiệm đạt giải cao:
              </h4>
              <div className="space-y-2.5">
                {skknIdeas.map((idea, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 flex items-start gap-3"
                  >
                    <Award className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-xs font-medium text-slate-800 leading-relaxed">
                      {idea}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. CHÚ RỒNG AI QUẢN LÝ LỚP HỌC */}
      {feature === 'dragon_ai' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-8 text-center">
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-xl font-black text-slate-900">
              "Chú Rồng AI" Đo Âm Lượng & Giữ Trật Tự Lớp Học
            </h3>
            <p className="text-xs text-slate-500">
              Tính năng mô phỏng chú rồng AI dễ thương thay đổi biểu cảm khi học sinh thảo luận quá to
            </p>
          </div>

          {/* Dragon State Display */}
          <div className="max-w-xs mx-auto p-8 rounded-3xl bg-slate-50 border-2 border-slate-200 space-y-4">
            <div className="text-7xl animate-bounce">
              {dragonMood === 'happy' ? '🐉' : dragonMood === 'warning' ? '🐲' : '🔥'}
            </div>

            <div className={`font-black text-sm uppercase tracking-wider ${
              dragonMood === 'happy' ? 'text-emerald-600' :
              dragonMood === 'warning' ? 'text-amber-600' : 'text-rose-600'
            }`}>
              {dragonMood === 'happy' ? 'Lớp học trật tự tuyệt vời! ⭐' :
               dragonMood === 'warning' ? 'Chú ý: Tiếng ồn đang tăng dần!' : 'Báo động: Tiếng ồn vượt mức cho phép!'}
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-500 font-bold">
                <span>Âm lượng lớp học</span>
                <span>{noiseLevel} dB</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-3 transition-all duration-300 rounded-full ${
                    noiseLevel < 45 ? 'bg-emerald-500' : noiseLevel < 75 ? 'bg-amber-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${noiseLevel}%` }}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleSimulateNoise}
              className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
            >
              Mô phỏng thay đổi âm lượng lớp
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
