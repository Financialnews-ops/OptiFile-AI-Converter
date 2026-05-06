import React from 'react';
import { FileItem, OutputFormat } from '../lib/converter';
import { FileText, Image, FileSpreadsheet, FileIcon, X, CheckCircle, Loader2, AlertCircle } from 'lucide-react';

interface FileListProps {
  files: FileItem[];
  onRemove: (id: string) => void;
  onFormatChange: (id: string, format: OutputFormat) => void;
  isDeveloperMode: boolean;
}

const getFileIcon = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'heic', 'raw'].includes(ext || '')) return <Image className="w-5 h-5 text-blue-500" />;
  if (['pdf', 'docx', 'txt', 'md'].includes(ext || '')) return <FileText className="w-5 h-5 text-rose-500" />;
  if (['xlsx', 'xls'].includes(ext || '')) return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />;
  return <FileIcon className="w-5 h-5 text-slate-500" />;
};

export const FileList: React.FC<FileListProps> = ({ files, onRemove, onFormatChange, isDeveloperMode }) => {
  if (files.length === 0) return null;

  return (
    <div className="mt-8 space-y-3">
      {files.map((fileItem) => (
        <div key={fileItem.id} className="flex items-center justify-between p-4 bg-blue-950/40 rounded-xl shadow-sm border border-blue-800/50">
          <div className="flex items-center space-x-4 flex-1 overflow-hidden">
            <div className="p-2 bg-[#030b1c]/50 rounded-lg">
              {getFileIcon(fileItem.file.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sky-100 truncate">{fileItem.file.name}</p>
              <p className="text-xs text-sky-400/60">{(fileItem.file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {fileItem.status === 'pending' && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-sky-400/60">to</span>
                <select
                  value={fileItem.targetFormat}
                  onChange={(e) => onFormatChange(fileItem.id, e.target.value as OutputFormat)}
                  className="text-sm border-blue-800/50 rounded-lg focus:ring-cyan-500/20 focus:border-cyan-500 bg-[#030b1c] text-sky-100 py-1.5 pl-3 pr-8"
                >
                  <option value="TXT">Text (TXT)</option>
                  <option value="MD">Markdown (MD)</option>
                  {isDeveloperMode && <option value="JSON">JSON (Premium)</option>}
                  {isDeveloperMode && <option value="HTML">HTML (Premium)</option>}
                </select>
              </div>
            )}

            {fileItem.status === 'converting' && (
              <div className="flex items-center space-x-2 text-cyan-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm font-medium">Converting...</span>
              </div>
            )}

            {fileItem.status === 'success' && (
              <div className="flex items-center space-x-2 text-emerald-400">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Ready</span>
              </div>
            )}

            {fileItem.status === 'error' && (
              <div className="flex items-center space-x-2 text-rose-400" title={fileItem.errorMessage}>
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Error</span>
              </div>
            )}

            {fileItem.status === 'pending' && (
              <button
                onClick={() => onRemove(fileItem.id)}
                className="p-1 text-sky-400/60 hover:text-rose-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
