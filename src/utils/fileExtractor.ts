import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
if (typeof window !== 'undefined' && 'Worker' in window) {
  try {
    // Set standard CDN worker for pdfjs-dist
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
  } catch {
    // Ignore fallback
  }
}

export interface ExtractedDocument {
  text: string;
  fileName: string;
  fileType: 'docx' | 'pdf' | 'txt';
  pageCount?: number;
}

/**
 * Extracts plain text from uploaded files: Word (.docx), PDF (.pdf), or Text (.txt)
 */
export async function extractTextFromFile(file: File): Promise<ExtractedDocument> {
  const fileName = file.name;
  const extension = fileName.split('.').pop()?.toLowerCase();

  if (extension === 'docx') {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return {
      text: result.value,
      fileName,
      fileType: 'docx'
    };
  }

  if (extension === 'pdf') {
    const arrayBuffer = await file.arrayBuffer();
    try {
      const loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(arrayBuffer),
        useWorkerFetch: false,
        useSystemFonts: true
      });
      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;
      let fullText = '';

      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageLines: string[] = [];
        let lastY: number | null = null;
        let currentLine = '';

        for (const item of textContent.items as any[]) {
          if (!('str' in item)) continue;
          const currentY = item.transform ? item.transform[5] : null;
          if (lastY !== null && currentY !== null && Math.abs(currentY - lastY) > 5) {
            if (currentLine.trim()) {
              pageLines.push(currentLine.trim());
            }
            currentLine = item.str;
          } else {
            currentLine += (currentLine.length > 0 && !currentLine.endsWith(' ') ? ' ' : '') + item.str;
          }
          lastY = currentY;
        }
        if (currentLine.trim()) {
          pageLines.push(currentLine.trim());
        }

        fullText += pageLines.join('\n') + '\n\n';
      }

      return {
        text: fullText.trim(),
        fileName,
        fileType: 'pdf',
        pageCount: numPages
      };
    } catch (pdfErr) {
      console.error('Error parsing PDF with PDF.js:', pdfErr);
      throw new Error(`Không thể đọc trực tiếp nội dung PDF: ${pdfErr instanceof Error ? pdfErr.message : String(pdfErr)}. Bạn có thể sao chép văn bản từ file PDF hoặc chuyển đổi sang Word .docx để tải lên.`);
    }
  }

  if (extension === 'txt') {
    const text = await file.text();
    return {
      text,
      fileName,
      fileType: 'txt'
    };
  }

  throw new Error(`Định dạng tệp .${extension} chưa được hỗ trợ. Vui lòng tải lên tệp Word (.docx), PDF (.pdf), hoặc Văn bản (.txt).`);
}
