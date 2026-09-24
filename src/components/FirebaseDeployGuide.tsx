import React, { useState } from 'react';
import { 
  Flame, 
  Terminal, 
  Copy, 
  Check, 
  Download, 
  Upload, 
  CheckCircle2, 
  Layers, 
  ShieldCheck, 
  RotateCcw,
  ExternalLink,
  Settings,
  Sparkles
} from 'lucide-react';
import { StorageService } from '../services/storage';

export const FirebaseDeployGuide: React.FC = () => {
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [firebaseConfig, setFirebaseConfig] = useState(() => StorageService.getFirebaseConfig());
  const [saveSuccess, setSaveSuccess] = useState(false);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const handleSaveFirebaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.saveFirebaseConfig({
      ...firebaseConfig,
      connected: Boolean(firebaseConfig.apiKey && firebaseConfig.projectId)
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleExportData = () => {
    const jsonStr = StorageService.exportAllData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Giaovien_thoidai_ai_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = StorageService.importAllData(content);
      if (success) {
        alert('Nhập dữ liệu thành công! Trang web sẽ được làm mới.');
        window.location.reload();
      } else {
        alert('File không hợp lệ hoặc dữ liệu sai định dạng JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="inline-flex items-center gap-1.5 text-orange-600 font-bold text-xs uppercase tracking-wider mb-1">
          <Flame className="w-4 h-4" />
          Hướng dẫn triển khai & Triển khai đám mây
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Triển Khai Website Lên Firebase Hosting
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Dự án đã được tạo sẵn file cấu hình <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-orange-600">firebase.json</code> và <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-orange-600">.firebaserc</code> để thầy cô deploy nhanh nhất!
        </p>
      </div>

      {/* Step by step guide */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Terminal className="w-5 h-5 text-orange-500" />
          Các bước deploy lên Firebase chỉ với 3 lệnh đơn giản
        </h2>

        <div className="space-y-4 text-xs">
          {/* Step 1 */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 text-sm">
                Bước 1: Cài đặt Firebase CLI & Đăng nhập (Nếu chưa cài)
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard('npm install -g firebase-tools && firebase login', 'step1')}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 font-bold text-slate-700 flex items-center gap-1"
              >
                {copiedCmd === 'step1' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCmd === 'step1' ? 'Đã copy' : 'Copy'}</span>
              </button>
            </div>
            <pre className="p-3 rounded-xl bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto">
              npm install -g firebase-tools && firebase login
            </pre>
          </div>

          {/* Step 2 */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 text-sm">
                Bước 2: Đóng gói bản build của trang web
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard('npm run build', 'step2')}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 font-bold text-slate-700 flex items-center gap-1"
              >
                {copiedCmd === 'step2' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCmd === 'step2' ? 'Đã copy' : 'Copy'}</span>
              </button>
            </div>
            <pre className="p-3 rounded-xl bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto">
              npm run build
            </pre>
            <p className="text-slate-500">
              Lệnh này sẽ biên dịch toàn bộ mã nguồn React + Tailwind vào thư mục <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">dist/</code>.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 text-sm">
                Bước 3: Deploy trực tiếp lên Firebase Hosting
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard('firebase deploy --only hosting', 'step3')}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 font-bold text-slate-700 flex items-center gap-1"
              >
                {copiedCmd === 'step3' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCmd === 'step3' ? 'Đã copy' : 'Copy'}</span>
              </button>
            </div>
            <pre className="p-3 rounded-xl bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto">
              firebase deploy --only hosting
            </pre>
            <p className="text-slate-500">
              Hệ thống sẽ tải file lên Firebase Hosting và cấp cho bạn một tên miền miễn phí dạng: <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">https://giao-vien-thoi-dai-ai.web.app</code>!
            </p>
          </div>
        </div>

        {/* Automated Deployment Section */}
        <div className="pt-4 border-t border-slate-100 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">
              Cách Deploy Tự Động 100% (Không cần gõ nhiều lệnh)
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Auto Script 1-Click */}
            <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-indigo-950 text-xs">
                  ⚡ Cách 1: Chạy Script Tự Động (1 Lệnh duy nhất)
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard('bash deploy-auto.sh', 'auto1')}
                  className="px-2 py-0.5 rounded-lg bg-white border border-indigo-200 hover:bg-indigo-100 font-bold text-indigo-700 text-[11px] flex items-center gap-1"
                >
                  {copiedCmd === 'auto1' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCmd === 'auto1' ? 'Đã copy' : 'Copy'}</span>
                </button>
              </div>
              <pre className="p-2.5 rounded-xl bg-slate-900 text-indigo-300 font-mono text-xs overflow-x-auto">
                bash deploy-auto.sh
              </pre>
              <p className="text-slate-600 text-[11px]">
                Script đã có sẵn trong dự án: tự động build mã nguồn và tự động deploy lên Firebase Hosting chỉ với 1 click. Trên Windows, thầy/cô có thể nhấp đúp file <code className="font-mono bg-white px-1 py-0.5 rounded">deploy-auto.bat</code>.
              </p>
            </div>

            {/* GitHub Actions CI/CD */}
            <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-purple-950 text-xs">
                  🤖 Cách 2: Tự Động Hoàn Toàn Bằng GitHub Actions (CI/CD)
                </span>
                <span className="text-[10px] bg-purple-200 text-purple-800 font-bold px-1.5 py-0.5 rounded">
                  Đã tạo workflow
                </span>
              </div>
              <p className="text-slate-600 text-[11px]">
                File <code className="font-mono bg-white px-1 py-0.5 rounded">.github/workflows/firebase-deploy.yml</code> đã được thiết lập sẵn. Mỗi khi thầy cô bấm Push / Commit lên GitHub, hệ thống GitHub Actions sẽ <strong>tự động build và deploy lên Firebase</strong> ngay lập tức!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Vercel Deployment & Realtime Cloud Sync Section */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white space-y-5 border border-indigo-500/30 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white text-slate-900 flex items-center justify-center font-black text-lg">
              ▲
            </div>
            <div>
              <h2 className="text-lg font-bold">Triển Khai Lên Vercel & Tự Động Đồng Bộ Realtime</h2>
              <p className="text-xs text-indigo-200">
                Tệp <code className="bg-white/10 px-1.5 py-0.5 rounded text-amber-300 font-mono">vercel.json</code> đã được tạo sẵn ở thư mục gốc để định tuyến SPA chuẩn xác!
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Đồng bộ 2 chiều tức thì
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <h3 className="font-bold text-amber-300 text-sm">1. Cơ chế đồng bộ đề thi lên Vercel</h3>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              Khi giáo viên tải tệp Word/PDF lên hoặc bấm "Lưu & Xuất bản", đề thi được lưu ngay vào Firestore database chung. Giao diện chạy trên <strong>Vercel</strong> sử dụng trình lắng nghe sự kiện <code className="font-mono text-amber-300">onSnapshot</code> nên màn hình học sinh trên Vercel <strong>tự động nhận đề mới ngay lập tức</strong> mà không cần tải lại trang!
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <h3 className="font-bold text-emerald-300 text-sm">2. Cách deploy nhanh lên Vercel</h3>
            <ol className="list-decimal list-inside text-slate-300 space-y-1 text-[11px]">
              <li>Đẩy mã nguồn dự án lên GitHub của thầy/cô.</li>
              <li>Truy cập <code className="font-mono text-emerald-300">vercel.com</code> và bấm <strong>"Add New Project"</strong>.</li>
              <li>Chọn kho GitHub này và bấm <strong>"Deploy"</strong>.</li>
              <li>Vercel sẽ tự động build qua lệnh <code className="font-mono text-emerald-300">npm run build</code> và cấp tên miền miễn phí.</li>
            </ol>
          </div>
        </div>
      </div>

      {/* File config inspection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800 text-sm font-mono">firebase.json (Đã tạo sẵn)</span>
            <span className="text-[11px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">
              ✓ Sẵn sàng
            </span>
          </div>
          <pre className="p-3 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] overflow-x-auto">
{`{
  "hosting": {
    "public": "dist",
    "rewrites": [
      { "source": "**", "destination": "/index.html" }
    ]
  }
}`}
          </pre>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800 text-sm font-mono">.firebaserc (Đã tạo sẵn)</span>
            <span className="text-[11px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">
              ✓ Sẵn sàng
            </span>
          </div>
          <pre className="p-3 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] overflow-x-auto">
{`{
  "projects": {
    "default": "giao-vien-thoi-dai-ai"
  }
}`}
          </pre>
        </div>
      </div>

      {/* Data Backup & Export Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-4">
        <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-blue-600" />
          Sao Lưu & Xuất Dữ Liệu Đề Thi / Bảng Điểm
        </h3>
        <p className="text-xs text-slate-500">
          Bạn có thể xuất toàn bộ ngân hàng câu hỏi, các đề thi đã tạo và kết quả làm bài của học sinh thành một file JSON duy nhất để lưu trữ hoặc di chuyển sang máy tính khác.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleExportData}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Tải file sao lưu dữ liệu (.json)</span>
          </button>

          <label className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer">
            <Upload className="w-4 h-4 text-blue-600" />
            <span>Nhập dữ liệu từ file backup</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportData}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={() => {
              if (confirm('Bạn có chắc chắn muốn khôi phục dữ liệu mẫu ban đầu không?')) {
                StorageService.resetDefaults();
                window.location.reload();
              }
            }}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 text-xs font-semibold flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Đặt lại dữ liệu mẫu ban đầu</span>
          </button>
        </div>
      </div>

      {/* Optional: Firebase Web Credentials Connector */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Settings className="w-5 h-5 text-orange-500" />
              Cấu Hình Firebase Web SDK (Tùy chọn)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Nếu bạn muốn kết nối trực tiếp đến Firebase Firestore Database trên tài khoản Google Cloud của mình
            </p>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
            firebaseConfig.connected ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
          }`}>
            {firebaseConfig.connected ? '✓ Đã gắn config' : 'Sử dụng lưu trữ cục bộ'}
          </span>
        </div>

        <form onSubmit={handleSaveFirebaseConfig} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Firebase API Key</label>
            <input
              type="text"
              value={firebaseConfig.apiKey}
              onChange={(e) => setFirebaseConfig({ ...firebaseConfig, apiKey: e.target.value })}
              placeholder="AIzaSy..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Firebase Project ID</label>
            <input
              type="text"
              value={firebaseConfig.projectId}
              onChange={(e) => setFirebaseConfig({ ...firebaseConfig, projectId: e.target.value })}
              placeholder="giao-vien-doi-moi-azota"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Auth Domain</label>
            <input
              type="text"
              value={firebaseConfig.authDomain}
              onChange={(e) => setFirebaseConfig({ ...firebaseConfig, authDomain: e.target.value })}
              placeholder="project-id.firebaseapp.com"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">App ID</label>
            <input
              type="text"
              value={firebaseConfig.appId}
              onChange={(e) => setFirebaseConfig({ ...firebaseConfig, appId: e.target.value })}
              placeholder="1:1234567890:web:abcdef..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs"
            />
          </div>

          <div className="sm:col-span-2 flex items-center justify-between pt-2">
            <span className="text-[11px] text-slate-400">
              * Không bắt buộc. Ứng dụng đã có sẵn bộ nhớ lưu trữ bền vững tự động.
            </span>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-xs transition-colors"
            >
              {saveSuccess ? 'Đã lưu cấu hình!' : 'Lưu cấu hình Firebase'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
