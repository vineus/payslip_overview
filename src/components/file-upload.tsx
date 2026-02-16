"use client";

import { useState, useCallback, useEffect } from "react";
import { Upload, CheckCircle, XCircle, X, Loader2 } from "lucide-react";

interface UploadResult {
  filename: string;
  period: string;
  success: boolean;
  error?: string;
}

export function FileUpload({ onUploadComplete }: { onUploadComplete: () => void }) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<UploadResult[]>([]);

  const handleUpload = useCallback(
    async (files: FileList | File[]) => {
      setUploading(true);
      setResults([]);

      const formData = new FormData();
      Array.from(files).forEach((file) => formData.append("files", file));

      try {
        const res = await fetch("/api/payslips", { method: "POST", body: formData });
        const data: UploadResult[] = await res.json();
        setResults(data);
        onUploadComplete();
      } catch {
        setResults([{ filename: "upload", period: "", success: false, error: "Upload failed" }]);
      } finally {
        setUploading(false);
      }
    },
    [onUploadComplete]
  );

  // Auto-dismiss results after 5 seconds
  useEffect(() => {
    if (results.length === 0) return;
    const timer = setTimeout(() => setResults([]), 5000);
    return () => clearTimeout(timer);
  }, [results]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) handleUpload(e.dataTransfer.files);
    },
    [handleUpload]
  );

  return (
    <div className="space-y-3">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
          isDragging
            ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
            : "border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600"
        }`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => {
          const input = document.createElement("input");
          input.type = "file";
          input.multiple = true;
          input.accept = ".pdf";
          input.onchange = (e) => {
            const files = (e.target as HTMLInputElement).files;
            if (files) handleUpload(files);
          };
          input.click();
        }}
      >
        {uploading ? (
          <div className="flex items-center justify-center gap-2 text-zinc-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Parsing payslips...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-zinc-500">
            <Upload className="w-8 h-8" />
            <p className="text-sm">Drop payslip PDFs here or click to browse</p>
          </div>
        )}
      </div>

      {results.length > 0 && (
        <div className="space-y-1 relative">
          <button
            onClick={() => setResults([])}
            className="absolute -top-1 -right-1 p-0.5 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          {results.map((r, i) => (
            <div
              key={i}
              className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded ${
                r.success
                  ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400"
                  : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400"
              }`}
            >
              {r.success ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              <span className="font-mono">{r.period || r.filename}</span>
              {r.error && <span className="text-xs opacity-70">— {r.error}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
