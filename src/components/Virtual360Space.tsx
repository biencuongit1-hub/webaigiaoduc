import React, { useState } from 'react';
import { 
  Compass, 
  Eye, 
  MapPin, 
  Info, 
  Plus, 
  Image as ImageIcon, 
  Layers, 
  Sparkles, 
  Volume2,
  ExternalLink,
  RotateCw
} from 'lucide-react';

interface Hotspot {
  id: string;
  xPercent: number;
  yPercent: number;
  title: string;
  description: string;
  category: string;
}

export const Virtual360Space: React.FC = () => {
  const [activeScene, setActiveScene] = useState<'history_museum' | 'stem_lab'>('history_museum');
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);

  const scenes = {
    history_museum: {
      name: 'Bảo Tàng Lịch Sử & Di Sản Văn Hóa Việt Nam',
      description: 'Không gian triển lãm 360 độ về các thời kỳ dựng nước và giữ nước của dân tộc',
      bgGradient: 'from-amber-950 via-slate-900 to-stone-900',
      hotspots: [
        {
          id: 'hs1',
          xPercent: 25,
          yPercent: 40,
          title: 'Trống Đồng Đông Sơn',
          category: 'Cổ vật thời Văn Lang',
          description: 'Biểu tượng đỉnh cao của nền văn hóa Đông Sơn thời đại đồ đồng. Hoa văn sao nhiều cánh, chim Lạc và cảnh sinh hoạt cộng đồng thể hiện tín ngưỡng sùng bái thiên nhiên.'
        },
        {
          id: 'hs2',
          xPercent: 50,
          yPercent: 35,
          title: 'Cột Cờ Hà Nội (Kỳ Đài)',
          category: 'Di tích thời Nguyễn',
          description: 'Xây dựng năm 1812 dưới triều vua Gia Long. Cột cờ cao hơn 33 mét, là chứng nhân lịch sử kiên cường qua hai cuộc kháng chiến giải phóng thủ đô.'
        },
        {
          id: 'hs3',
          xPercent: 78,
          yPercent: 48,
          title: 'Chiến dịch Điện Biên Phủ 1954',
          category: 'Lịch sử Hiện đại',
          description: 'Mô hình sa bàn 3D tái hiện tập đoàn cứ điểm Điện Biên Phủ với 49 ngày đêm "khoét núi, ngủ hầm, mưa dầm, cơm vắt", làm nên chiến thắng "lừng lẫy năm châu, chấn động địa cầu".'
        }
      ]
    },
    stem_lab: {
      name: 'Phòng Thí Nghiệm Khoa Học & Vũ Trụ STEM 3D',
      description: 'Khám phá cấu tạo nguyên tử, quỹ đạo hành tinh và phản ứng hóa học tương tác',
      bgGradient: 'from-blue-950 via-indigo-950 to-slate-950',
      hotspots: [
        {
          id: 'hs4',
          xPercent: 30,
          yPercent: 45,
          title: 'Mô Hình Hệ Mặt Trời',
          category: 'Vật lý thiên văn',
          description: 'Gồm Mặt trời ở tâm và 8 hành tinh quay theo quỹ đạo elip. Học sinh có thể quan sát góc nghiêng trục quay và chu kỳ quay của Trái Đất tạo nên các mùa.'
        },
        {
          id: 'hs5',
          xPercent: 65,
          yPercent: 38,
          title: 'Kính Hiển Vi Điện Tử Tế Bào',
          category: 'Sinh học phân tử',
          description: 'Quan sát cấu trúc thành tế bào thực vật, lục lạp chứa chất diệp lục thực hiện quá trình quang hợp hấp thụ ánh sáng mặt trời để tổng hợp chất hữu cơ.'
        }
      ]
    }
  };

  const currentScene = scenes[activeScene];

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Compass className="w-4 h-4" />
            Không gian học tập ảo 4.0
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Không Gian Bài Giảng 360° & Bảo Tàng 3D
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Học sinh được "đi dạo" trong không gian 3D tương tác, bấm vào các khung ảnh hotspot để xem bài học
          </p>
        </div>

        {/* Scene Switcher */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveScene('history_museum');
              setSelectedHotspot(null);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeScene === 'history_museum'
                ? 'bg-amber-700 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Bảo tàng Lịch sử
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveScene('stem_lab');
              setSelectedHotspot(null);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeScene === 'stem_lab'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Phòng STEM Vũ trụ
          </button>
        </div>
      </div>

      {/* 360 Interactive Panorama Stage */}
      <div className="relative overflow-hidden rounded-3xl border-2 border-slate-700 shadow-2xl min-h-[440px] flex items-center justify-center select-none bg-slate-900">
        {/* Simulated dynamic 360 background canvas with stylized visual elements */}
        <div className={`absolute inset-0 bg-gradient-to-r ${currentScene.bgGradient} opacity-95`} />
        
        {/* Subtle grid and decorative rings representing VR space */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08)_0%,transparent_70%)] pointer-events-none" />
        <div className="absolute bottom-6 left-6 text-xs text-white/60 flex items-center gap-1.5 backdrop-blur-md bg-black/40 px-3 py-1.5 rounded-full z-10">
          <RotateCw className="w-3.5 h-3.5 text-blue-400" />
          <span>Góc nhìn 360° toàn cảnh tương tác</span>
        </div>

        {/* Floating hotspot pins */}
        {currentScene.hotspots.map((hs) => {
          const isSelected = selectedHotspot?.id === hs.id;
          return (
            <div
              key={hs.id}
              onClick={() => setSelectedHotspot(hs)}
              style={{
                left: `${hs.xPercent}%`,
                top: `${hs.yPercent}%`
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group"
            >
              <div className="relative flex items-center justify-center">
                {/* Pulsing ring */}
                <div className="absolute w-12 h-12 rounded-full bg-blue-500/30 animate-ping" />
                
                {/* Hotspot core icon */}
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition-transform group-hover:scale-125 ${
                  isSelected
                    ? 'bg-amber-400 text-slate-900 ring-4 ring-amber-300/50'
                    : 'bg-white text-blue-700 hover:bg-blue-50'
                }`}>
                  <MapPin className="w-5 h-5 fill-current" />
                </div>
              </div>

              {/* Hotspot label tooltip */}
              <div className="absolute top-11 left-1/2 -translate-x-1/2 whitespace-nowrap px-2.5 py-1 rounded-lg bg-black/80 text-white text-[11px] font-bold backdrop-blur-md shadow-md pointer-events-none group-hover:opacity-100 transition-opacity">
                {hs.title}
              </div>
            </div>
          );
        })}

        {/* Center Guide prompt if none selected */}
        {!selectedHotspot && (
          <div className="relative z-10 text-center text-white/80 p-6 max-w-md bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 space-y-2 pointer-events-none">
            <Compass className="w-8 h-8 text-amber-300 mx-auto animate-pulse" />
            <div className="font-bold text-sm text-white">{currentScene.name}</div>
            <p className="text-xs text-slate-300">
              Nhấp chuột vào các điểm ghim vàng (hotspot) trên màn hình để khám phá nội dung bài giảng tương tác!
            </p>
          </div>
        )}
      </div>

      {/* Selected Hotspot Detailed Modal / Drawer */}
      {selectedHotspot && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-md space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                {selectedHotspot.category}
              </span>
              <h3 className="text-xl font-bold text-slate-900 mt-2">
                {selectedHotspot.title}
              </h3>
            </div>

            <button
              type="button"
              onClick={() => setSelectedHotspot(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              ✕
            </button>
          </div>

          <p className="text-sm text-slate-700 leading-relaxed">
            {selectedHotspot.description}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-slate-500 border-t border-slate-100">
            <span className="flex items-center gap-1 text-blue-700 font-semibold">
              <Volume2 className="w-4 h-4" />
              Có hỗ trợ thuyết minh bài giảng
            </span>
            <span>•</span>
            <span>Tích hợp liên kết hình ảnh trực tuyến không cần tải file về máy</span>
          </div>
        </div>
      )}
    </div>
  );
};
