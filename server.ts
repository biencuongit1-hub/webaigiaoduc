import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

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

I. PHẦN TRẮC NGHIỆM:
Câu 1: [Nội dung câu hỏi]
A. [Phương án A]
B. [Phương án B]
C. [Phương án C]
D. [Phương án D]
Lời giải: [Lời giải nếu có trong ảnh]

Câu 2: ...

II. PHẦN TỰ LUẬN:
Câu [N]: [Nội dung câu hỏi tự luận]
Hướng dẫn chấm: [Barem hoặc đáp án mẫu nếu có]

BẢNG ĐÁP ÁN:
1-A 2-B ... (nếu có trong đề)

Quy tắc bắt buộc:
1. Trích xuất đầy đủ tất cả các câu hỏi nhìn thấy trong ảnh.
2. Giữ nguyên công thức toán học, lý, hóa, số mũ (², ³, √, Δ, π, ...).
3. Đảm bảo các phương án lựa chọn được đánh dấu rõ ràng A., B., C., D. trên từng dòng.
4. Nếu có hình vẽ, ghi chú [Hình ảnh minh họa: mô tả hình vẽ] ngay dưới câu hỏi.
5. Chỉ trả về nội dung đề thi đã số hóa tiếng Việt, không kèm lời giải thích bên ngoài.`;

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

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      hasGeminiKey: !!process.env.GEMINI_API_KEY,
      timestamp: new Date().toISOString(),
    });
  });

  // Connect Vite in dev or static files in prod
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server error:', err);
  process.exit(1);
});
