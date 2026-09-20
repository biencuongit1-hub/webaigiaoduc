import React, { useState, useEffect } from 'react';
import { 
  Gamepad2, 
  RotateCw, 
  Trophy, 
  Users, 
  Flame, 
  Check, 
  X, 
  ArrowLeft, 
  ArrowRight,
  Sparkles,
  Volume2,
  Play
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const InteractiveGames: React.FC = () => {
  const [selectedGame, setSelectedGame] = useState<'head_tilt' | 'lucky_wheel' | 'tug_of_war'>('head_tilt');

  // GAME 1: QUIZ NGHIÊNG ĐẦU (Head Tilt Quiz)
  const [tiltQuestions] = useState([
    {
      q: 'Đỉnh Everest là đỉnh núi cao nhất thế giới?',
      ans: true,
      hint: 'Đỉnh Everest cao 8.848m so với mực nước biển'
    },
    {
      q: 'Mặt trời mọc ở hướng Tây và lặn ở hướng Đông?',
      ans: false,
      hint: 'Mặt trời mọc ở hướng Đông và lặn ở hướng Tây'
    },
    {
      q: 'Nước sôi ở 100°C trong điều kiện áp suất tiêu chuẩn?',
      ans: true,
      hint: 'Ở áp suất 1 atm, nhiệt độ sôi của nước tinh khiết là 100°C'
    },
    {
      q: 'Việt Nam có biên giới trên đất liền với 4 quốc gia?',
      ans: false,
      hint: 'Việt Nam chỉ giáp 3 nước: Trung Quốc, Lào, Campuchia'
    },
    {
      q: 'Hình bình hành có hai đường chéo vuông góc với nhau là hình thoi?',
      ans: true,
      hint: 'Đây là một dấu hiệu nhận biết hình thoi trong hình học'
    }
  ]);
  const [tiltIndex, setTiltIndex] = useState(0);
  const [tiltScore, setTiltScore] = useState(0);
  const [tiltStreak, setTiltStreak] = useState(0);
  const [tiltFeedback, setTiltFeedback] = useState<'correct' | 'wrong' | null>(null);

  const handleTiltAnswer = (userChoice: boolean) => {
    const isCorrect = userChoice === tiltQuestions[tiltIndex].ans;
    if (isCorrect) {
      setTiltScore((prev) => prev + 10 + tiltStreak * 2);
      setTiltStreak((prev) => prev + 1);
      setTiltFeedback('correct');
      confetti({ particleCount: 30, spread: 60, origin: { y: 0.7 } });
    } else {
      setTiltStreak(0);
      setTiltFeedback('wrong');
    }

    setTimeout(() => {
      setTiltFeedback(null);
      setTiltIndex((prev) => (prev + 1) % tiltQuestions.length);
    }, 1200);
  };

  // GAME 2: VÒNG QUAY MAY MẮN (Lucky Wheel)
  const [wheelStudents, setWheelStudents] = useState([
    'Nguyễn Văn An', 'Trần Thị Mai', 'Lê Hoàng Long', 'Phạm Minh Thư',
    'Đỗ Quốc Bảo', 'Hoàng Gia Huy', 'Vũ Thảo My', 'Đặng Tuấn Kiệt'
  ]);
  const [newStudentName, setNewStudentName] = useState('');
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelWinner, setWheelWinner] = useState<string | null>(null);
  const [wheelRotation, setWheelRotation] = useState(0);

  const handleSpinWheel = () => {
    if (isSpinning || wheelStudents.length === 0) return;
    setIsSpinning(true);
    setWheelWinner(null);

    const extraDegree = 1440 + Math.floor(Math.random() * 360);
    const newRotation = wheelRotation + extraDegree;
    setWheelRotation(newRotation);

    setTimeout(() => {
      setIsSpinning(false);
      const randomIndex = Math.floor(Math.random() * wheelStudents.length);
      setWheelWinner(wheelStudents[randomIndex]);
      confetti({ particleCount: 60, spread: 80 });
    }, 3000);
  };

  // GAME 3: KÉO CO TRI THỨC (Tug of War)
  const [teamAScore, setTeamAScore] = useState(0);
  const [teamBScore, setTeamBScore] = useState(0);
  const [ropePosition, setRopePosition] = useState(50); // 0 = Team A wins, 100 = Team B wins

  const handleScoreTeam = (team: 'A' | 'B') => {
    if (team === 'A') {
      setTeamAScore((prev) => prev + 1);
      setRopePosition((prev) => Math.max(10, prev - 10));
    } else {
      setTeamBScore((prev) => prev + 1);
      setRopePosition((prev) => Math.min(90, prev + 10));
    }
  };

  const handleResetTug = () => {
    setTeamAScore(0);
    setTeamBScore(0);
    setRopePosition(50);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="inline-flex items-center gap-1.5 text-purple-600 font-bold text-xs uppercase tracking-wider mb-1">
          <Gamepad2 className="w-4 h-4" />
          Hệ sinh thái Giáo viên thời đại AI
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Kho Trò Chơi Tương Tác Lớp Học (Gamification)
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Khuấy động không khí lớp học, tăng khả năng phản xạ và hứng thú học tập cho học sinh
        </p>
      </div>

      {/* Game Selector Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setSelectedGame('head_tilt')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            selectedGame === 'head_tilt'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Quiz Nghiêng Đầu (Head Tilt)
        </button>

        <button
          type="button"
          onClick={() => setSelectedGame('lucky_wheel')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            selectedGame === 'lucky_wheel'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <RotateCw className="w-4 h-4" />
          Vòng Quay May Mắn (Lucky Wheel)
        </button>

        <button
          type="button"
          onClick={() => setSelectedGame('tug_of_war')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            selectedGame === 'tug_of_war'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          Kéo Co Kiến Thức (Tug of War)
        </button>
      </div>

      {/* GAME 1: QUIZ NGHIÊNG ĐẦU */}
      {selectedGame === 'head_tilt' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-sm space-y-8 text-center">
          <div className="flex items-center justify-between max-w-xl mx-auto">
            <div className="text-left">
              <span className="text-xs font-bold text-slate-400 uppercase">Điểm số</span>
              <div className="text-2xl font-black text-purple-600">{tiltScore}</div>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
              <Flame className="w-4 h-4 text-amber-600 fill-amber-500" />
              Streak: {tiltStreak} liên tiếp
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-slate-400 uppercase">Câu hỏi</span>
              <div className="text-base font-black text-slate-800">
                {tiltIndex + 1} / {tiltQuestions.length}
              </div>
            </div>
          </div>

          {/* Question Box */}
          <div className="max-w-2xl mx-auto p-8 rounded-3xl bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200 relative overflow-hidden">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
              {tiltQuestions[tiltIndex].q}
            </h2>
            <p className="text-xs text-slate-500 mt-3 italic">
              💡 Hướng dẫn: Học sinh nghiêng đầu sang TRÁI để chọn ĐÚNG, nghiêng sang PHẢI để chọn SAI
            </p>

            {/* Visual Feedback Overlay */}
            {tiltFeedback && (
              <div className={`absolute inset-0 flex items-center justify-center backdrop-blur-xs font-black text-3xl animate-in zoom-in-75 duration-200 ${
                tiltFeedback === 'correct' ? 'bg-emerald-600/90 text-white' : 'bg-rose-600/90 text-white'
              }`}>
                {tiltFeedback === 'correct' ? '🎉 CHÍNH XÁC! +10' : '❌ SAI RỒI!'}
              </div>
            )}
          </div>

          {/* Interactive Tilt Buttons */}
          <div className="grid grid-cols-2 gap-6 max-w-xl mx-auto">
            <button
              type="button"
              onClick={() => handleTiltAnswer(true)}
              className="group p-6 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95 space-y-2"
            >
              <div className="flex items-center justify-center gap-2">
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <Check className="w-6 h-6" />
              </div>
              <div className="text-lg font-black uppercase tracking-wider">ĐÚNG</div>
              <div className="text-xs text-emerald-100 font-medium">Nghiêng sang Trái</div>
            </button>

            <button
              type="button"
              onClick={() => handleTiltAnswer(false)}
              className="group p-6 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20 transition-all hover:scale-105 active:scale-95 space-y-2"
            >
              <div className="flex items-center justify-center gap-2">
                <X className="w-6 h-6" />
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
              <div className="text-lg font-black uppercase tracking-wider">SAI</div>
              <div className="text-xs text-rose-100 font-medium">Nghiêng sang Phải</div>
            </button>
          </div>
        </div>
      )}

      {/* GAME 2: VÒNG QUAY MAY MẮN */}
      {selectedGame === 'lucky_wheel' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-sm space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-black text-slate-900">
              Vòng Quay May Mắn Chọn Học Sinh Trả Lời
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Tạo sự hồi hộp và công bằng khi gọi học sinh lên bảng kiểm tra bài cũ hoặc trả lời câu hỏi khó
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center max-w-4xl mx-auto">
            {/* Wheel Canvas Mock */}
            <div className="md:col-span-2 flex flex-col items-center justify-center space-y-6">
              <div className="relative w-64 h-64 sm:w-72 sm:h-72">
                {/* Pointer arrow */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[24px] border-t-rose-600 drop-shadow-md" />

                {/* The Rotating Wheel */}
                <div
                  className="w-full h-full rounded-full border-8 border-slate-800 shadow-2xl flex items-center justify-center transition-transform duration-[3000ms] ease-out relative overflow-hidden bg-gradient-to-tr from-amber-400 via-rose-400 to-indigo-500"
                  style={{ transform: `rotate(${wheelRotation}deg)` }}
                >
                  <div className="w-16 h-16 rounded-full bg-white shadow-inner flex items-center justify-center font-black text-slate-800 text-xs z-10 border-4 border-slate-800">
                    AI
                  </div>
                </div>
              </div>

              <button
                type="button"
                disabled={isSpinning}
                onClick={handleSpinWheel}
                className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-sm shadow-xl shadow-purple-600/30 transition-all active:scale-95 disabled:opacity-50"
              >
                {isSpinning ? 'Đang quay...' : 'QUAY NGAY!'}
              </button>

              {wheelWinner && (
                <div className="p-4 rounded-2xl bg-amber-100 border border-amber-300 text-amber-900 font-black text-lg animate-bounce text-center">
                  🎉 Xin chúc mừng: <span className="text-purple-800">{wheelWinner}</span>!
                </div>
              )}
            </div>

            {/* Students List Editor */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3">
              <div className="text-xs font-bold text-slate-700 flex justify-between items-center">
                <span>Danh sách học sinh ({wheelStudents.length})</span>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  placeholder="Thêm tên học sinh..."
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newStudentName.trim()) {
                      setWheelStudents([...wheelStudents, newStudentName.trim()]);
                      setNewStudentName('');
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 shrink-0"
                >
                  Thêm
                </button>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1">
                {wheelStudents.map((st, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-white border border-slate-100 text-xs font-medium"
                  >
                    <span>{st}</span>
                    <button
                      type="button"
                      onClick={() => setWheelStudents(wheelStudents.filter((_, idx) => idx !== i))}
                      className="text-slate-400 hover:text-rose-600 text-[10px]"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GAME 3: KÉO CO TRI THỨC */}
      {selectedGame === 'tug_of_war' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-sm space-y-8 text-center">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-slate-900">
              Kéo Co Tri Thức (Thi Đấu Nhóm)
            </h2>
            <p className="text-xs text-slate-500">
              Mỗi câu trả lời đúng của Đội A hoặc Đội B sẽ kéo sợi dây tri thức về phía đội mình!
            </p>
          </div>

          {/* Tug of War Interactive Board */}
          <div className="max-w-2xl mx-auto p-6 rounded-3xl bg-slate-100 border border-slate-200 space-y-6">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <span className="px-3 py-1 rounded-lg bg-blue-600 text-white font-bold text-xs uppercase">
                  Đội A (Sư Tử)
                </span>
                <div className="text-3xl font-black text-blue-700 mt-2">{teamAScore} điểm</div>
              </div>

              <div className="text-right">
                <span className="px-3 py-1 rounded-lg bg-rose-600 text-white font-bold text-xs uppercase">
                  Đội B (Đại Bàng)
                </span>
                <div className="text-3xl font-black text-rose-700 mt-2">{teamBScore} điểm</div>
              </div>
            </div>

            {/* Rope progress */}
            <div className="relative w-full h-8 bg-slate-200 rounded-full flex items-center overflow-hidden border-2 border-slate-300">
              <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-400 z-10" />
              <div
                className="absolute top-1 bottom-1 w-12 bg-amber-500 rounded-full shadow-md transition-all duration-300 flex items-center justify-center text-white font-bold text-xs"
                style={{ left: `calc(${ropePosition}% - 24px)` }}
              >
                🚩
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 pt-4">
              <button
                type="button"
                onClick={() => handleScoreTeam('A')}
                className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all"
              >
                +1 Điểm Đội A (Kéo về trái)
              </button>

              <button
                type="button"
                onClick={handleResetTug}
                className="px-4 py-3 rounded-xl border border-slate-300 hover:bg-white text-slate-700 font-bold text-xs"
              >
                Đặt lại
              </button>

              <button
                type="button"
                onClick={() => handleScoreTeam('B')}
                className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all"
              >
                +1 Điểm Đội B (Kéo về phải)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
