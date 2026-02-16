// Import from lib/pdf-parse directly to avoid pdf-parse's index.js which
// tries to read a test PDF file at import time, breaking bundlers.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse/lib/pdf-parse.js");
import { PayslipData } from "../types";
import { parsePayfit } from "./payfit";
import { parseSilae } from "./silae";

const PDF_PARSE_TIMEOUT_MS = 30_000;

// Bump this when parser logic changes to flag stale rows
export const PARSER_VERSION = 2;

export async function extractText(
  pdfBuffer: Buffer
): Promise<string> {
  const result = await Promise.race([
    pdfParse(pdfBuffer),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("PDF parsing timed out")), PDF_PARSE_TIMEOUT_MS)
    ),
  ]);
  return result.text;
}

export function detectFormat(fullText: string): "payfit" | "silae" {
  if (fullText.includes("BULLETIN DE PAIE")) return "payfit";
  if (fullText.includes("BULLETIN DE SALAIRE")) return "silae";
  if (fullText.includes("CODE DE VÉRIFICATION")) return "payfit";
  return "silae";
}

export async function parsePdf(
  pdfBuffer: Buffer,
  filename: string
): Promise<PayslipData> {
  const fullText = await extractText(pdfBuffer);
  const format = detectFormat(fullText);

  let data: PayslipData;
  if (format === "payfit") {
    data = parsePayfit(fullText, filename);
  } else {
    data = parseSilae(fullText, filename);
  }

  return data;
}
