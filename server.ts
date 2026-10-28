import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const args = process.argv.slice(2);
  const portArgIndex = args.indexOf('--port');
  const portFromArgs = portArgIndex !== -1 ? Number(args[portArgIndex + 1]) : undefined;
  const envPort = process.env.APP_PORT ? Number(process.env.APP_PORT) : (process.env.PORT ? Number(process.env.PORT) : undefined);
  // In multi-container Cloud Run architecture, nginx occupies 8080, while app-container probe checks 3000
  const PORT = portFromArgs || (envPort && envPort !== 8080 ? envPort : 3000);

  // Support up to 50MB base64 images from phones/scans
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Initialize Gemini client with user-agent telemetry as instructed by skill
  const getGeminiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY || '';
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  };

  // OCR & Exam extraction endpoint using Gemini Vision
  app.post('/api/ocr-image', async (req, res) => {
    try {
      const { base64Data, mimeType, customPrompt } = req.body;

      if (!base64Data) {
        return res.status(400).json({ error: 'Thiếu dữ liệu hình ảnh (base64Data)' });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({
          error: 'Chưa cấu hình GEMINI_API_KEY trên hệ thống máy chủ.',
        });
      }

      const ai = getGeminiClient();

      const defaultPrompt = `Bạn là chuyên gia số hóa đề thi thông minh của hệ thống Giáo viên thời đại AI.
Hãy phân tích hình ảnh đề thi này và trích xuất TOÀN BỘ nội dung đề thi một cách đầy đủ và chính xác theo định dạng chuẩn:

I. TRẮC NGHIỆM (hoặc I. PHẦN TRẮC NGHIỆM):
Câu 1: [Nội dung câu hỏi]
A. [Phương án A]
B. [Phương án B]
C. [Phương án C]
D. [Phương án D]

Câu 2: ...

II. Tự luận (ĐẶC BIỆT BẮT BUỘC: Nếu đề có câu hỏi tự luận, PHẢI có tiêu đề "II. Tự luận" hoặc "II.Tự luận" trước các câu hỏi tự luận):
Câu [N]: [Nội dung câu hỏi tự luận]

------------------- HẾT -------------------

ĐÁP ÁN
1.D  2.B  3.A ... (Đáp án trắc nghiệm dạng: 1.D, nghĩa là câu 1 đáp án D)
câu [N]. [Câu trả lời / lời giải chi tiết của câu tự luận]

Quy tắc bắt buộc:
1. Trích xuất đầy đủ tất cả các câu hỏi nhìn thấy trong ảnh.
2. CẤU TRÚC ĐỀ THI:
   - Nếu đề có câu hỏi tự luận, BẮT BUỘC phải có tiêu đề: "II. Tự luận" (hoặc "II.Tự luận", "II. TỰ LUẬN") trước các câu hỏi tự luận.
   - Nếu đề có phần trắc nghiệm, có tiêu đề: "I. Trắc nghiệm" (hoặc "I. TRẮC NGHIỆM").
   - Nếu đề hoàn toàn là trắc nghiệm (không có tự luận) thì không ghi "II. Tự luận".
3. Giữ nguyên công thức toán học, lý, hóa, số mũ (², ³, √, Δ, π, ...).
4. Đảm bảo các phương án lựa chọn được đánh dấu rõ ràng A., B., C., D. trên từng dòng.
5. Nếu có hình vẽ, ghi chú [Hình ảnh minh họa: mô tả hình vẽ] ngay dưới câu hỏi.
6. ĐÁP ÁN: Đặt ở phần cuối cùng sau chữ HẾT. Nếu trong ảnh chưa có đáp án, hãy tự động giải và bổ sung đáp án sau chữ HẾT:
   - Trắc nghiệm có dạng: 1.D (nghĩa là câu 1 đáp án D, ví dụ: 1.D  2.B  3.A  4.C ...)
   - Tự luận có dạng: câu [số thứ tự]. câu trả lời (ví dụ: câu 37. Học sinh nêu được... / câu 38. Lời giải: ...)
7. Chỉ trả về nội dung đề thi đã số hóa tiếng Việt, không kèm lời giải thích bên ngoài.`;

      const promptToUse = customPrompt || defaultPrompt;

      const imagePart = {
        inlineData: {
          mimeType: mimeType || 'image/jpeg',
          data: base64Data,
        },
      };

      const textPart = {
        text: promptToUse,
      };

      // Resilient model cascade and retry strategy for handling spikes
      const candidateModels = [
        'gemini-flash-latest',
        'gemini-3.8-flash',
        'gemini-3.1-flash-lite',
      ];

      let lastError: any = null;
      let extractedText = '';

      for (const model of candidateModels) {
        // Try up to 2 attempts per model
        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            const response = await ai.models.generateContent({
              model,
              contents: {
                parts: [imagePart, textPart],
              },
            });

            extractedText = response.text || '';
            if (extractedText.trim()) {
              break;
            }
          } catch (err: any) {
            lastError = err;
            console.warn(
              `Model ${model} attempt ${attempt} failed:`,
              err?.status || err?.message || err
            );
            // Wait 1.5s before retry if temporary 503 or 429
            if (attempt < 2) {
              await new Promise((resolve) => setTimeout(resolve, 1500));
            }
          }
        }

        if (extractedText.trim()) {
          break;
        }
      }

      if (!extractedText.trim()) {
        const errorMsg =
          lastError?.message ||
          'Không thể nhận diện nội dung từ hình ảnh đề thi. Vui lòng thử lại với ảnh rõ nét hơn.';
        return res.status(500).json({ error: errorMsg });
      }

      return res.json({ text: extractedText });
    } catch (err: any) {
      console.error('Lỗi API /api/ocr-image:', err);
      return res.status(500).json({
        error:
          err instanceof Error
            ? err.message
            : 'Đã xảy ra lỗi trong quá trình xử lý hình ảnh.',
      });
    }
  });

  // Auto-solve & supplement answers endpoint
  app.post('/api/auto-solve-exam', async (req, res) => {
    try {
      const { rawText } = req.body;
      if (!rawText || !rawText.trim()) {
        return res.status(400).json({ error: 'Thiếu nội dung đề thi (rawText)' });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({
          error: 'Chưa cấu hình GEMINI_API_KEY trên hệ thống máy chủ.',
        });
      }

      const ai = getGeminiClient();

      const solvePrompt = `Bạn là chuyên gia sư phạm và khảo thí số 1 Việt Nam.
Hãy giải chính xác toàn bộ đề thi dưới đây và bổ sung toàn bộ đáp án vào cuối đề theo đúng quy cách:

QUY TẮC CẤU TRÚC ĐỀ THI:
1. ĐỀ NẾU CÓ TỰ LUẬN THÌ BẮT BUỘC SẼ CÓ TIÊU ĐỀ:
II. Tự luận
(hoặc II.Tự luận)
- Nếu đề ban đầu có các câu hỏi tự luận nhưng chưa có tiêu đề "II. Tự luận", bạn BẮT BUỘC chèn dòng tiêu đề "II. Tự luận" ngay trước câu hỏi tự luận đầu tiên.
- Nếu đề có phần trắc nghiệm, có tiêu đề "I. Trắc nghiệm" (hoặc "I. TRẮC NGHIỆM").
- Giữ nguyên toàn bộ nội dung đề bài ban đầu (nội dung câu hỏi và các phương án A, B, C, D).

QUY TẮC BẮT BUỘC VỀ ĐÁP ÁN:
1. Đáp án phải nằm ở phần cuối cùng, ngay sau chữ HẾT cuối cùng của đề thi:
------------------- HẾT -------------------

ĐÁP ÁN

2. Đáp án phần TRẮC NGHIỆM:
- Bắt buộc có dạng: 1.D (nghĩa là câu 1 đáp án D), ví dụ: 1.D  2.B  3.A  4.C ...
- Xếp gọn gàng theo hàng từ 5-10 câu hoặc theo dòng.

3. Đáp án phần TỰ LUẬN:
- Bắt buộc có dạng:
câu [số thứ tự]. [câu trả lời / lời giải chi tiết, các bước giải, barem điểm và kết quả]
Ví dụ:
câu 37. Học sinh nêu được 3 biểu hiện vi phạm đạo đức và pháp luật khi sử dụng công nghệ số: quay phim chụp ảnh nơi cấm, sao chép tác phẩm có bản quyền trái phép, phát tán hình ảnh thông tin người khác chưa xin phép.
câu 38. Lời giải: Bước 1... Bước 2... Kết quả x = 2.

4. CẤU TRÚC TRẢ VỀ:
- Toàn bộ đề bài (đảm bảo có tiêu đề "II. Tự luận" trước các câu hỏi tự luận nếu đề có tự luận).
- Nếu cuối đề bài ban đầu chưa có dòng chữ HẾT, hãy thêm:
------------------- HẾT -------------------
- Ngay sau dòng HẾT, thêm mục "ĐÁP ÁN" chứa đáp án trắc nghiệm (1.D) và đáp án tự luận (câu [N]. câu trả lời).
- CHỈ trả về toàn bộ đề thi kèm phần đáp án sau chữ HẾT, không thêm lời chào, mở đầu hay kết luận bên ngoài.

NỘI DUNG ĐỀ THI:
${rawText}`;

      const candidateModels = [
        'gemini-flash-latest',
        'gemini-3.8-flash',
        'gemini-3.1-flash-lite',
      ];

      let solvedText = '';
      let lastError: any = null;

      for (const model of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: solvePrompt,
          });
          solvedText = response.text || '';
          if (solvedText.trim()) break;
        } catch (err: any) {
          lastError = err;
          console.warn(`Model ${model} solve attempt failed:`, err?.message || err);
        }
      }

      if (!solvedText.trim()) {
        return res.status(500).json({
          error: lastError?.message || 'Không thể giải đề thi tự động. Vui lòng thử lại.',
        });
      }

      return res.json({ updatedText: solvedText });
    } catch (err: any) {
      console.error('Lỗi API /api/auto-solve-exam:', err);
      return res.status(500).json({
        error: err instanceof Error ? err.message : 'Lỗi xử lý tự động giải đề.',
      });
    }
  });

  // Auto-grade essay questions endpoint using Gemini AI semantic matching
  app.post('/api/auto-grade-essay', async (req, res) => {
    try {
      const { examTitle, questions, studentAnswers, studentName } = req.body;

      if (!questions || !Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ error: 'Thiếu danh sách câu hỏi tự luận cần chấm.' });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({
          error: 'Chưa cấu hình GEMINI_API_KEY trên hệ thống máy chủ.',
        });
      }

      const ai = getGeminiClient();

      const questionsPromptText = questions.map((q: any, idx: number) => {
        const studentAns = studentAnswers?.[q.id] || '(Học sinh để trống không làm bài)';
        const modelAns = q.modelAnswer || q.explanation || 'Đáp án chuẩn theo barem giáo viên';
        const maxScore = Number(q.points) || 1.5;
        return `
--- CÂU ${idx + 1} (Mã ID: "${q.id}") ---
- Đề bài: ${q.text}
- Điểm tối đa: ${maxScore} điểm
- Đáp án mẫu / Barem chuẩn của giáo viên:
${modelAns}
- Bài làm thực tế của học sinh:
${studentAns}
`;
      }).join('\n');

      const gradingPrompt = `Bạn là giám khảo khảo thí chuyên nghiệp và công tâm hàng đầu Việt Nam.
Hãy chấm điểm các câu hỏi TỰ LUẬN trong bài thi "${examTitle || 'Đề kiểm tra'}" của học sinh "${studentName || 'Học sinh'}".

NGUYÊN TẮC CHẤM TỰ LUẬN TƯƠNG ĐƯƠNG (SEMANTIC EQUIVALENCE):
1. ĐỐI CHIẾU Ý NGHĨA THỰC CHẤT, KHÔNG BẮT BẺ TỪNG TỪ:
   - Học sinh có thể diễn đạt bằng ngôn từ riêng của mình, cách trình bày khác biệt hoặc thứ tự các ý khác nhau nhưng ĐÚNG BẢN CHẤT kiến thức thì VẪN ĐƯỢC ĐIỂM TỐI ĐA hoặc ĐIỂM TƯƠNG ĐƯƠNG.
   - Đối với môn Toán/Khoa học: Nếu học sinh làm theo cách giải khác đáp án mẫu nhưng các bước lập luận logic, kết quả chính xác thì vẫn chấm điểm tối đa.
   - Nếu học sinh làm được một phần các ý, tính toán đúng bước đầu: Cho điểm thành phần tương ứng theo thang điểm (làm tròn đến 0.25).
   - Nếu học sinh để trống hoặc trả lời hoàn toàn sai lệch lạc đề: Cho 0 điểm.

2. ĐIỂM SỐ:
   - "score": Điểm số thực tế học sinh đạt được (từ 0.0 đến điểm tối đa của câu đó).
   - "maxScore": Điểm tối đa của câu.
   - "teacherNote": Nhận xét sư phạm ngắn gọn, rõ ràng (1-3 câu): Nêu rõ ý đúng học sinh đã đạt được, ý còn thiếu cần bổ sung hoặc lỗi sai cần lưu ý.

3. YÊU CẦU ĐỊNH DẠNG TRẢ VỀ:
Trả về DUY NHẤT một chuỗi JSON hợp lệ (không kèm markdown ngoài JSON, không giải thích ngoài code block json) theo cấu trúc:
{
  "essayScores": {
    "<Mã ID câu hỏi>": {
      "score": 1.25,
      "maxScore": 1.5,
      "teacherNote": "nhận xét câu này"
    }
  },
  "totalEssayScore": 2.75,
  "overallFeedback": "Lời nhận xét chung động viên và định hướng cho toàn bài thi của học sinh"
}

DANH SÁCH BÀI LÀM CẦN CHẤM:
${questionsPromptText}`;

      const candidateModels = [
        'gemini-flash-latest',
        'gemini-3.8-flash',
        'gemini-3.1-flash-lite',
      ];

      let rawResponseText = '';
      let lastError: any = null;

      for (const model of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: gradingPrompt,
          });
          rawResponseText = response.text || '';
          if (rawResponseText.trim()) break;
        } catch (err: any) {
          lastError = err;
          console.warn(`Model ${model} grading attempt failed:`, err?.message || err);
        }
      }

      if (!rawResponseText.trim()) {
        return res.status(500).json({
          error: lastError?.message || 'Không thể chấm tự luận tự động bằng AI lúc này.',
        });
      }

      // Clean markdown json fences if any
      let jsonClean = rawResponseText.trim();
      if (jsonClean.startsWith('```json')) {
        jsonClean = jsonClean.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
      } else if (jsonClean.startsWith('```')) {
        jsonClean = jsonClean.replace(/^```\s*/i, '').replace(/\s*```$/i, '');
      }

      let parsedResult;
      try {
        parsedResult = JSON.parse(jsonClean);
      } catch (parseErr) {
        const match = jsonClean.match(/\{[\s\S]*\}/);
        if (match) {
          parsedResult = JSON.parse(match[0]);
        } else {
          throw parseErr;
        }
      }

      return res.json(parsedResult);
    } catch (err: any) {
      console.error('Lỗi API /api/auto-grade-essay:', err);
      return res.status(500).json({
        error: err instanceof Error ? err.message : 'Lỗi xử lý chấm tự luận tự động.',
      });
    }
  });

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      hasGeminiKey: !!process.env.GEMINI_API_KEY,
      timestamp: new Date().toISOString(),
    });
  });

  // Dev vs Production detection
  const isDev =
    process.env.NODE_ENV === 'development' ||
    (typeof process.env.K_SERVICE === 'string' && process.env.K_SERVICE.startsWith('ais-dev-')) ||
    (!process.env.NODE_ENV && !process.env.K_SERVICE);

  const isProduction = !isDev;

  const distPath = path.resolve(__dirname, 'dist');
  const distIndexPath = path.resolve(distPath, 'index.html');
  const rootIndexPath = path.resolve(__dirname, 'index.html');

  if (isProduction) {
    let hasDist = fs.existsSync(distIndexPath);
    if (!hasDist) {
      console.log('Production detected without prebuilt dist. Running vite build...');
      try {
        const { execSync } = await import('child_process');
        execSync('npx vite build', { stdio: 'inherit' });
        hasDist = fs.existsSync(distIndexPath);
      } catch (buildErr) {
        console.error('In-process vite build failed:', buildErr);
      }
    }

    if (hasDist) {
      app.use(express.static(distPath));
    }

    // Serve index.html for all non-API SPA routes with safe error handling
    app.get('*', (req, res, next) => {
      if (req.originalUrl.startsWith('/api')) {
        return next();
      }

      if (fs.existsSync(distIndexPath)) {
        return res.sendFile(distIndexPath, (err) => {
          if (err && !res.headersSent) {
            console.warn('sendFile error on dist/index.html, falling back:', err.message);
            if (fs.existsSync(rootIndexPath)) {
              return res.sendFile(rootIndexPath);
            }
            return res.status(200).send('<!doctype html><html><head><title>Giáo viên thời đại AI</title></head><body><div id="root">Giáo viên thời đại AI is ready.</div></body></html>');
          }
        });
      }

      if (fs.existsSync(rootIndexPath)) {
        return res.sendFile(rootIndexPath);
      }

      return res.status(200).send('<!doctype html><html><head><title>Giáo viên thời đại AI</title></head><body><div id="root">Giáo viên thời đại AI is ready.</div></body></html>');
    });
  } else {
    // Development mode with Vite middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    // Fallback handler for SPA navigation in dev
    app.use('*', async (req, res, next) => {
      if (req.originalUrl.startsWith('/api')) {
        return next();
      }
      try {
        if (fs.existsSync(rootIndexPath)) {
          let html = fs.readFileSync(rootIndexPath, 'utf-8');
          html = await vite.transformIndexHtml(req.originalUrl, html);
          return res.status(200).set({ 'Content-Type': 'text/html' }).send(html);
        }
        next();
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT} (mode: ${isProduction ? 'production' : 'development'})`);
  });

  const shutdown = () => {
    console.log('Shutdown signal received: closing HTTP server');
    server.close(() => {
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startServer().catch((err) => {
  console.error('Fatal server error:', err);
  process.exit(1);
});
