import React, { useCallback } from 'react';
import { UploadCloud } from 'lucide-react';

interface DropzoneProps {
  onFilesAdded: (files: File[]) => void;
}

export const Dropzone: React.FC<DropzoneProps> = ({ onFilesAdded }) => {
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesAdded(Array.from(e.dataTransfer.files));
    }
  }, [onFilesAdded]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesAdded(Array.from(e.target.files));
    }
  }, [onFilesAdded]);

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="border-2 border-dashed border-blue-800/60 hover:border-cyan-500 rounded-2xl p-12 text-center cursor-pointer transition-colors bg-blue-950/40 hover:bg-blue-900/40 group shadow-inner shadow-black/20"
      onClick={() => document.getElementById('file-upload')?.click()}
    >
      <input
        id="file-upload"
        type="file"
        multiple
        className="hidden"
        onChange={handleFileInput}
        accept=".jpg,.jpeg,.png,.pdf,.docx,.pptx,.xlsx,.heic,.raw,.txt,.md,.json,.html"
      />
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="p-4 bg-cyan-500/20 text-cyan-400 rounded-full group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(34,211,238,0.3)]">
          <UploadCloud className="w-8 h-8" />
        </div>
        <div>
          <p className="text-lg font-medium text-sky-100">Choose files or drag & drop them here</p>
          <p className="text-sm text-sky-400/60 mt-1">Supports JPG, PNG, PDF, DOCX, PPTX, XLSX, HEIC, RAW</p>
        </div>
      </div>
    </div>
  );
};
