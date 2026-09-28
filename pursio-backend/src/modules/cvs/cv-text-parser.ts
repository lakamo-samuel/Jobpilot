import * as mammoth from "mammoth";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

const maxPages = 100;
const maxTextLength = 100_000;

export class CvTextError extends Error {
  constructor(public readonly code: "no_extractable_text" | "cv_too_many_pages" | "cv_text_too_large") { super(code); }
}

export async function extractCvText(bytes: Buffer, mimeType: string): Promise<string> {
  let text: string;
  if (mimeType === "application/pdf") {
    const task = getDocument({ data: new Uint8Array(bytes), useSystemFonts: false, disableFontFace: true, stopAtErrors: true });
    try {
      const document = await task.promise;
      if (document.numPages > maxPages) throw new CvTextError("cv_too_many_pages");
      const pages: string[] = [];
      let textLength = 0;
      for (let index = 1; index <= document.numPages; index++) {
        const content = await (await document.getPage(index)).getTextContent();
        const pageText = content.items.map(item => "str" in item ? item.str : "").join(" ");
        textLength += pageText.length;
        pages.push(pageText);
        if (textLength > maxTextLength) throw new CvTextError("cv_text_too_large");
      }
      text = pages.join("\n");
    } finally { await task.destroy(); }
  } else if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    text = (await mammoth.extractRawText({ buffer: bytes })).value;
  } else {
    throw new CvTextError("no_extractable_text");
  }
  const normalized = text.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, "").replace(/[ \t]+/g, " ").trim();
  if (normalized.length > maxTextLength) throw new CvTextError("cv_text_too_large");
  if (normalized.length < 20) throw new CvTextError("no_extractable_text");
  return normalized;
}
