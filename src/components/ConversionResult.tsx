import React, { useMemo } from 'react';
import { FileItem } from '../lib/converter';
import { Download, Archive, Sparkles, TrendingDown } from 'lucide-react';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { countTokens, formatTokenCount, estimateRawFileTokens, calculateSavings } from '../lib/tokens';

interface ConversionResultProps {
  files: FileItem[];
  onReset: () => void;
}

interface FileTokenStats {
  fileItem: FileItem;
  rawTokens: number;
  outputTokens: number;
  savings: { absolute: number; percent: number } | null;
}

export const ConversionResult: React.FC<ConversionResultProps> = ({ files, onReset }) => {
  const successfulFiles = files.filter(f => f.status === 'success' && f.resultContent);

  // Compute token stats once per render. countTokens is O(n) but cl100k_base
  // is fast enough that we don't need to memoize per-file separately.
  const stats: FileTokenStats[] = useMemo(() => {
    return successfulFiles.map(fileItem => {
      const outputTokens = countTokens(fileItem.resultContent || '');
      const rawTokens = estimateRawFileTokens(fileItem.file);
      const savings = calculateSavings(rawTokens, outputTokens);
      return { fileItem, rawTokens, outputTokens, savings };
    });
  }, [successfulFiles]);

  const totalRawTokens = stats.reduce((sum, s) => sum + s.rawTokens, 0);
  const totalOutputTokens = stats.reduce((sum, s) => sum + s.outputTokens, 0);
  const totalSavings = calculateSavings(totalRawTokens, totalOutputTokens);

  const downloadSingle = (fileItem: FileItem) => {
    if (!fileItem.resultContent) return;
    const originalName = fileItem.file.name.split('.').slice(0, -1).join('.');
    const ext = fileItem.targetFormat.toLowerCase();
    const blob = new Blob([fileItem.resultContent], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, `${originalName}.${ext}`);
  };

  const downloadAll = async () => {
    const zip = new JSZip();
    successfulFiles.forEach(fileItem => {
      if (fileItem.resultContent) {
        const originalName = fileItem.file.name.split('.').slice(0, -1).join('.');
        const ext = fileItem.targetFormat.toLowerCase();
        zip.file(`${originalName}.${ext}`, fileItem.resultContent);
      }
    });
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, 'converted_files.zip');
  };

  if (successfulFiles.length === 0) return null;

  return (
    <div className="mt-8 p-6 bg-emerald-900/20 rounded-2xl border border-emerald-500/30">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-emerald-400">Conversion Complete</h3>
          <p className="text-sm text-emerald-500 mt-1">{successfulFiles.length} files successfully converted.</p>
        </div>
        {successfulFiles.length > 1 && (
          <button
            onClick={downloadAll}
            className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-[0_0_15px_rgba(16,185,129,0.3)]"
          >
            <Archive className="w-4 h-4" />
            <span>Download ZIP</span>
          </button>
        )}
      </div>

      {/* Token Savings Summary - the signature feature */}
      {stats.length > 0 && (
        <div className="mb-5 p-4 bg-emerald-950/30 rounded-xl border border-emerald-500/20 flex items-start gap-3">
          <div className="p-2 bg-emerald-500/20 rounded-lg shrink-0">
            <Sparkles className="w-4 h-4 text-emerald-300" />
          </div>
          <div className="flex-1 text-sm text-emerald-100/90 leading-relaxed">
            <p className="font-medium text-emerald-300 mb-1">Token footprint after optimization</p>
            <p>
              Output total: <span className="font-mono font-semibold text-white">~{formatTokenCount(totalOutputTokens)}</span> tokens
              {totalSavings && (
                <>
                  {' '}<span className="text-emerald-300">.</span>{' '}
                  <span className="inline-flex items-center gap-1 text-emerald-300 font-semibold">
                    <TrendingDown className="w-3.5 h-3.5" />
                    saved ~{formatTokenCount(totalSavings.absolute)} tokens ({totalSavings.percent}% lighter)
                  </span>
                </>
              )}
            </p>
            <p className="text-xs text-emerald-200/60 mt-1">
              Estimates use cl100k_base (GPT-4 tokenizer) as a cross-model reference. Actual counts on Gemini/Claude differ by ~10%.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {stats.map(({ fileItem, outputTokens, savings }) => (
          <div key={fileItem.id} className="flex items-center justify-between bg-blue-950/40 p-3 rounded-xl shadow-sm border border-blue-800/50 gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sky-100 truncate">
                {fileItem.file.name.split('.').slice(0, -1).join('.')}.{fileItem.targetFormat.toLowerCase()}
              </p>
              <p className="text-xs text-sky-400/60 mt-0.5 font-mono">
                ~{formatTokenCount(outputTokens)} tokens
                {savings && savings.percent >= 5 && (
                  <span className="text-emerald-400 ml-2">-{savings.percent}%</span>
                )}
              </p>
            </div>
            <button
              onClick={() => downloadSingle(fileItem)}
              className="flex items-center space-x-1 text-cyan-400 hover:text-cyan-300 px-3 py-1.5 rounded-lg hover:bg-cyan-900/30 transition-colors text-sm font-medium shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-center">
        <button
          onClick={onReset}
          className="text-sm font-medium text-emerald-400 hover:text-emerald-300 underline underline-offset-4"
        >
          Convert more files
        </button>
      </div>
    </div>
  );
};
