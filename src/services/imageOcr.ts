/**
 * Client service to communicate with the server-side Gemini Vision OCR API
 * for recognizing exam questions, multiple choice options, formulas, and answer keys.
 */

/**
 * Optimizes and converts an image File or Blob into base64 data.
 * Automatically downscales excessively high-res smartphone photos (e.g. 48MP)
 * to a crisp 2048px max dimension to ensure fast and reliable uploads.
 */
export async function fileToBase64(file: File | Blob): Promise<{ base64Data: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    // If not in browser or Blob cannot be read
    if (typeof window === 'undefined' || !window.FileReader) {
      reject(new Error('Trình duyệt không hỗ trợ FileReader'));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const commaIdx = result.indexOf(',');
      if (commaIdx === -1) {
        resolve({ base64Data: result, mimeType: file.type || 'image/jpeg' });
        return;
      }

      const header = result.substring(0, commaIdx);
      const mimeMatch = header.match(/:(.*?);/);
      const originalMime = mimeMatch ? mimeMatch[1] : (file.type || 'image/jpeg');
      const rawBase64 = result.substring(commaIdx + 1);

      // If image is small (under 2MB), use directly
      if (file.size < 2 * 1024 * 1024 && !file.type.includes('heic')) {
        resolve({ base64Data: rawBase64, mimeType: originalMime });
        return;
      }

      // If image is large, load onto Canvas and compress to max dimension 2048px
      const img = new Image();
      img.onload = () => {
        try {
          const maxDim = 2048;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve({ base64Data: rawBase64, mimeType: originalMime });
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.92);
          const compressedComma = compressedDataUrl.indexOf(',');
          resolve({
            base64Data: compressedDataUrl.substring(compressedComma + 1),
            mimeType: 'image/jpeg',
          });
        } catch {
          // Fallback to original
          resolve({ base64Data: rawBase64, mimeType: originalMime });
        }
      };
      img.onerror = () => {
        // Fallback to raw base64
        resolve({ base64Data: rawBase64, mimeType: originalMime });
      };
      img.src = result;
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

/**
 * Recognizes exam text from an image file using server-side Gemini Vision
 */
export async function recognizeExamFromImage(file: File | Blob, customPrompt?: string): Promise<string> {
  const { base64Data, mimeType } = await fileToBase64(file);

  try {
    const response = await fetch('/api/ocr-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        base64Data,
        mimeType,
        customPrompt,
      }),
    });

    if (!response.ok) {
      let errDetail = '';
      try {
        const errorJson = await response.json();
        errDetail = errorJson.error || errorJson.message || '';
      } catch {
        errDetail = `Mã lỗi HTTP: ${response.status}`;
      }
      throw new Error(errDetail || `Máy chủ phản hồi lỗi ${response.status}`);
    }

    const data = await response.json();
    if (!data.text || !data.text.trim()) {
      throw new Error('AI không tìm thấy nội dung câu hỏi hoặc văn bản trong hình ảnh này. Vui lòng thử lại với ảnh rõ nét hơn.');
    }

    return data.text;
  } catch (err) {
    console.error('Lỗi nhận diện hình ảnh đề thi qua Gemini Vision:', err);
    throw new Error(
      `Không thể nhận diện hình ảnh: ${
        err instanceof Error ? err.message : String(err)
      }. Vui lòng thử lại với hình ảnh chụp góc thẳng, đủ ánh sáng và rõ nét.`
    );
  }
}

/**
 * Recognizes multiple exam images (e.g. multi-page test sheets)
 * and combines their extracted question contents in order.
 */
export async function recognizeMultipleImages(files: File[]): Promise<string> {
  if (files.length === 0) return '';
  if (files.length === 1) return recognizeExamFromImage(files[0]);

  const results: string[] = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const text = await recognizeExamFromImage(file);
    if (text.trim()) {
      results.push(`--- Trang ${i + 1} (${file.name}) ---\n${text.trim()}`);
    }
  }

  return results.join('\n\n');
}
