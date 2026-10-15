import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import { recognizeExamFromImage, fileToBase64 } from '../services/imageOcr';

// Configure PDF.js worker
if (typeof window !== 'undefined' && 'Worker' in window) {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
  } catch {
    // Ignore fallback
  }
}

export interface ExtractedDocument {
  text: string;
  fileName: string;
  fileType: 'docx' | 'pdf' | 'txt' | 'image';
  pageCount?: number;
  extractedImages?: string[];
  imageMap?: Record<string, string>; // Maps [HÌNH_ẢNH_1] -> base64 data url
}

/**
 * Extracts text and images from uploaded files: Word (.docx), PDF (.pdf), Text (.txt), or Images (.png, .jpg, .jpeg, .webp)
 */
export async function extractTextFromFile(file: File): Promise<ExtractedDocument> {
  const fileName = file.name;
  const extension = fileName.split('.').pop()?.toLowerCase();

  // 1. Direct Image Files (.png, .jpg, .jpeg, .webp, .bmp): Use Gemini Vision OCR
  if (['png', 'jpg', 'jpeg', 'webp', 'bmp'].includes(extension || '')) {
    const { base64Data, mimeType } = await fileToBase64(file);
    const fullDataUrl = `data:${mimeType};base64,${base64Data}`;
    const ocrText = await recognizeExamFromImage(file);
    const imageMap: Record<string, string> = {
      '[HÌNH_ẢNH_ĐỀ_THI]': fullDataUrl,
      '[HÌNH_ẢNH_1]': fullDataUrl
    };

    return {
      text: ocrText,
      fileName,
      fileType: 'image',
      extractedImages: [fullDataUrl],
      imageMap
    };
  }

  // 2. Word Files (.docx): Extract text and embedded diagrams/images
  if (extension === 'docx') {
    const arrayBuffer = await file.arrayBuffer();
    const extractedImages: string[] = [];
    const imageMap: Record<string, string> = {};
    let imageCounter = 1;

    let finalExamText = '';
    try {
      const htmlResult = await mammoth.convertToHtml(
        { arrayBuffer },
        {
          convertImage: mammoth.images.imgElement((image) => {
            return image.read('base64').then((imageBuffer) => {
              const dataUrl = `data:${image.contentType};base64,${imageBuffer}`;
              extractedImages.push(dataUrl);
              const token = `[HÌNH_ẢNH_${imageCounter++}]`;
              imageMap[token] = dataUrl;
              return { src: token };
            });
          })
        }
      );

      if (htmlResult && htmlResult.value) {
        let textWithImages = htmlResult.value;
        // Replace custom src tags created by mammoth
        textWithImages = textWithImages.replace(/<img[^>]*?src=["']?(\[HÌNH_ẢNH_\d+\])["']?[^>]*>/gi, '\n$1\n');
        // Also catch any data: url img tags that might exist
        textWithImages = textWithImages.replace(/<img[^>]*?src=["']?(data:[^"'>\s]+)["']?[^>]*>/gi, (_match, dUrl) => {
          const token = `[HÌNH_ẢNH_${imageCounter++}]`;
          imageMap[token] = dUrl;
          extractedImages.push(dUrl);
          return `\n${token}\n`;
        });

        textWithImages = textWithImages
          .replace(/<\/p>/gi, '\n')
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<\/div>/gi, '\n')
          .replace(/<\/tr>/gi, '\n')
          .replace(/<\/td>/gi, '   ')
          .replace(/<[^>]+>/g, '');
        finalExamText = textWithImages.replace(/\n{3,}/g, '\n\n').trim();
      }
    } catch {
      // Ignore html conversion error, fallback to raw text
    }

    if (!finalExamText) {
      const rawResult = await mammoth.extractRawText({ arrayBuffer });
      finalExamText = rawResult.value;
    }

    return {
      text: finalExamText,
      fileName,
      fileType: 'docx',
      extractedImages,
      imageMap
    };
  }

  // 3. PDF Files (.pdf): Extract text and embedded images via PDF.js
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
      const extractedImages: string[] = [];
      const imageMap: Record<string, string> = {};
      let imgCounter = 1;

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

        // Try extracting embedded images from PDF page operators
        try {
          const ops = await page.getOperatorList();
          for (let k = 0; k < ops.fnArray.length; k++) {
            if (
              ops.fnArray[k] === (pdfjsLib as any).OPS?.paintImageXObject ||
              ops.fnArray[k] === (pdfjsLib as any).OPS?.paintInlineImageXObject
            ) {
              const imgName = ops.argsArray[k][0];
              if (page.objs && typeof page.objs.get === 'function') {
                page.objs.get(imgName, (imgObj: any) => {
                  if (imgObj && imgObj.data && imgObj.width && imgObj.height) {
                    try {
                      const canvas = document.createElement('canvas');
                      canvas.width = imgObj.width;
                      canvas.height = imgObj.height;
                      const ctx = canvas.getContext('2d');
                      if (ctx) {
                        const imgData = ctx.createImageData(imgObj.width, imgObj.height);
                        if (imgObj.data.length === imgObj.width * imgObj.height * 4) {
                          imgData.data.set(imgObj.data);
                        } else if (imgObj.data.length === imgObj.width * imgObj.height * 3) {
                          for (let p = 0, q = 0; p < imgObj.data.length; p += 3, q += 4) {
                            imgData.data[q] = imgObj.data[p];
                            imgData.data[q + 1] = imgObj.data[p + 1];
                            imgData.data[q + 2] = imgObj.data[p + 2];
                            imgData.data[q + 3] = 255;
                          }
                        }
                        ctx.putImageData(imgData, 0, 0);
                        const dataUrl = canvas.toDataURL('image/png');
                        const token = `[HÌNH_ẢNH_${imgCounter++}]`;
                        imageMap[token] = dataUrl;
                        extractedImages.push(dataUrl);
                        pageLines.push(`\n${token}\n`);
                      }
                    } catch {
                      // Skip image extraction failure
                    }
                  }
                });
              }
            }
          }
        } catch {
          // Ignore operator list errors
        }

        fullText += pageLines.join('\n') + '\n\n';
      }

      return {
        text: fullText.trim(),
        fileName,
        fileType: 'pdf',
        pageCount: numPages,
        extractedImages,
        imageMap
      };
    } catch (pdfErr) {
      console.error('Error parsing PDF with PDF.js:', pdfErr);
      throw new Error(`Không thể đọc trực tiếp nội dung PDF: ${pdfErr instanceof Error ? pdfErr.message : String(pdfErr)}. Bạn có thể chụp ảnh từng trang để tải lên nhận diện AI OCR hoặc chuyển đổi sang Word .docx.`);
    }
  }

  // 4. Plain Text (.txt)
  if (extension === 'txt') {
    const text = await file.text();
    return {
      text,
      fileName,
      fileType: 'txt'
    };
  }

  throw new Error(`Định dạng tệp .${extension} chưa được hỗ trợ. Vui lòng tải lên tệp Word (.docx), PDF (.pdf), Ảnh chụp (.png, .jpg, .jpeg), hoặc Văn bản (.txt).`);
}

/**
 * Extracts and combines text and images from multiple files (e.g., multi-page exam photos)
 */
export async function extractTextFromFiles(files: File[]): Promise<ExtractedDocument> {
  if (files.length === 0) {
    throw new Error('Vui lòng chọn ít nhất một tệp để tải lên.');
  }

  if (files.length === 1) {
    return extractTextFromFile(files[0]);
  }

  const combinedTexts: string[] = [];
  const combinedImageMap: Record<string, string> = {};
  const allExtractedImages: string[] = [];
  let detectedType: 'docx' | 'pdf' | 'txt' | 'image' = 'image';

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const extracted = await extractTextFromFile(file);
    detectedType = extracted.fileType;
    if (extracted.text.trim()) {
      combinedTexts.push(`--- Trang/Phần ${i + 1}: ${file.name} ---\n${extracted.text.trim()}`);
    }
    if (extracted.imageMap) {
      Object.assign(combinedImageMap, extracted.imageMap);
    }
    if (extracted.extractedImages) {
      allExtractedImages.push(...extracted.extractedImages);
    }
  }

  return {
    text: combinedTexts.join('\n\n'),
    fileName: `${files.length} tệp (${files[0].name}...)`,
    fileType: detectedType,
    pageCount: files.length,
    extractedImages: allExtractedImages,
    imageMap: combinedImageMap
  };
}
