import { useRef, useState, useCallback } from 'react';
import { UploadCloud, X, Loader2, FileImage, AlertCircle } from 'lucide-react';
import type { VocabularyItem } from '../types/homework';
import { useExtractMutation } from '../hooks/useHomeworkAPI';

interface UploadViewProps {
  onSuccess: (vocab: VocabularyItem[]) => void;
}

export function UploadView({ onSuccess }: UploadViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const { mutate, isPending, isError, error } = useExtractMutation();

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const newFiles = Array.from(incoming).filter(
      (f) => f.type.startsWith('image/')
    );
    setSelectedFiles((prev) => {
      const merged = [...prev, ...newFiles];
      return merged.slice(0, 5); // max 5
    });
  }, []);

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Drag & drop handlers ──────────────────────────────────────────────────
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const onDragLeave = () => setIsDragging(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) return;
    mutate(selectedFiles, {
      onSuccess: (data) => onSuccess(data),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload whiteboard images"
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={[
          'flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed',
          'cursor-pointer p-12 text-center transition-all duration-200 select-none',
          isDragging
            ? 'border-indigo-500 bg-indigo-50 scale-[1.01]'
            : 'border-gray-300 bg-gray-50 hover:border-indigo-400 hover:bg-indigo-50/50',
        ].join(' ')}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
          <UploadCloud size={28} />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-700">
            Drag &amp; drop whiteboard images here
          </p>
          <p className="mt-1 text-xs text-gray-500">
            or <span className="text-indigo-600 underline">browse files</span> — up to 5 images
          </p>
        </div>
        <input
          ref={fileInputRef}
          id="whiteboard-upload"
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={handleFileInputChange}
        />
      </div>

      {/* File list */}
      {selectedFiles.length > 0 && (
        <ul className="space-y-2">
          {selectedFiles.map((file, i) => (
            <li
              key={`${file.name}-${i}`}
              className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-2.5 shadow-sm"
            >
              <FileImage size={18} className="shrink-0 text-indigo-500" />
              <span className="flex-1 truncate text-sm text-gray-700">{file.name}</span>
              <span className="text-xs text-gray-400">{(file.size / 1024).toFixed(0)} KB</span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                className="ml-1 rounded-lg p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                aria-label={`Remove ${file.name}`}
              >
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Error */}
      {isError && (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error?.message ?? 'An unexpected error occurred.'}</span>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        id="extract-vocab-btn"
        disabled={isPending || selectedFiles.length === 0}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Extracting vocabulary…
          </>
        ) : (
          <>
            <UploadCloud size={16} />
            Extract Vocabulary
          </>
        )}
      </button>
    </form>
  );
}
