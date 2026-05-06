import React, { useState } from 'react';
import { Dropzone } from './components/Dropzone';
import { FileList } from './components/FileList';
import { ConversionResult } from './components/ConversionResult';
import { FileItem, OutputFormat, convertFile } from './lib/converter';
import { ArrowRight, Instagram, Facebook, Code2, FileIcon, Settings, AlertCircle, Key } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PerformanceComparison } from './components/PerformanceComparison';
import { SettingsDrawer } from './components/SettingsDrawer';

export default function App() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [isDeveloperMode, setIsDeveloperMode] = useState(false);
  const [isApiValid, setIsApiValid] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleFilesAdded = (newFiles: File[]) => {
    const newFileItems: FileItem[] = newFiles.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      status: 'pending',
      targetFormat: 'MD', // Default format
    }));
    setFiles(prev => [...prev, ...newFileItems]);
  };

  const handleRemoveFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleFormatChange = (id: string, format: OutputFormat) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, targetFormat: format } : f));
  };

  const handleConvert = async () => {
    setIsConverting(true);
    
    const pendingFiles = files.filter(f => f.status === 'pending');
    
    await Promise.all(pendingFiles.map(async (fileItem) => {
      // Update status to converting
      setFiles(prev => prev.map(f => f.id === fileItem.id ? { ...f, status: 'converting' } : f));
      
      try {
        const resultContent = await convertFile(fileItem);
        setFiles(prev => prev.map(f => 
          f.id === fileItem.id ? { ...f, status: 'success', resultContent } : f
        ));
      } catch (error) {
        console.error('Conversion error:', error);
        setFiles(prev => prev.map(f => 
          f.id === fileItem.id ? { ...f, status: 'error', errorMessage: error instanceof Error ? error.message : 'Unknown error' } : f
        ));
      }
    }));
    
    setIsConverting(false);
  };

  const handleReset = () => {
    setFiles([]);
  };

  const hasPendingFiles = files.some(f => f.status === 'pending');
  const hasCompletedFiles = files.some(f => f.status === 'success');

  return (
    <div className="min-h-screen bg-[#030b1c] text-sky-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-100 relative overflow-hidden flex">
      <SettingsDrawer 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        onValidationChange={setIsApiValid} 
      />
      
      <div className="flex-1 relative overflow-y-auto">
        {/* Atmospheric background gradients */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/20 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-900/20 blur-[120px] pointer-events-none" />
        
        {/* Settings Button & Status Pill */}
        <div className="absolute top-6 right-6 flex items-center gap-3 z-30">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium backdrop-blur-md transition-all ${
            isApiValid 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]' 
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.1)]'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isApiValid ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            {isApiValid ? 'API Ready' : 'No Key'}
          </div>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-2.5 bg-blue-950/40 hover:bg-blue-900/60 rounded-xl border border-blue-800/50 text-sky-300 hover:text-cyan-400 transition-all shadow-lg active:scale-95"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-20 md:py-28 relative z-10">
        
        {/* Header */}
        <div className="text-center mb-12">
          <img 
            src="/logo.png" 
            alt="OptiFile AI Converter" 
            className="mx-auto w-full max-w-3xl h-auto object-contain mb-8 drop-shadow-[0_0_25px_rgba(34,211,238,0.2)]"
          />
          <p className="text-lg text-sky-300/80 max-w-2xl mx-auto">
            Optimize your documents and images for LLMs. Convert JPG, PDF, DOCX, and more into clean HTML, Markdown, JSON, or TXT to save tokens and improve AI processing.
          </p>
        </div>

        {/* Main Content Area */}
        <div className="bg-[#0a1428]/60 backdrop-blur-xl rounded-3xl shadow-2xl shadow-cyan-500/10 p-6 md:p-10 border border-blue-900/50">
          
          <div className="flex justify-end mb-6">
            <label className="flex items-center space-x-3 cursor-pointer group">
              <Code2 className={`w-4 h-4 ${isDeveloperMode ? 'text-cyan-400' : 'text-sky-400/50'}`} />
              <span className={`text-sm font-medium transition-colors ${isDeveloperMode ? 'text-cyan-400' : 'text-sky-400/50 group-hover:text-sky-300'}`}>Developer Mode</span>
              <div className="relative">
                <input type="checkbox" className="sr-only" checked={isDeveloperMode} onChange={() => setIsDeveloperMode(!isDeveloperMode)} />
                <div className={`block w-10 h-6 rounded-full transition-colors ${isDeveloperMode ? 'bg-cyan-600' : 'bg-blue-900/50'}`}></div>
                <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isDeveloperMode ? 'translate-x-4' : ''}`}></div>
              </div>
            </label>
          </div>

          {!hasCompletedFiles && isApiValid && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Dropzone onFilesAdded={handleFilesAdded} />
            </motion.div>
          )}

          {!isApiValid && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }}
              className="py-12 px-6 text-center space-y-6"
            >
              <div className="inline-flex p-4 bg-rose-500/10 rounded-2xl border border-rose-500/20 mb-2">
                <AlertCircle className="w-10 h-10 text-rose-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-sky-100 mb-2">Configuration Required</h3>
                <p className="text-sky-400/70 max-w-sm mx-auto">
                  To convert files using our AI-optimized pipeline, you need to add your personal Gemini API key.
                </p>
              </div>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-xl shadow-cyan-900/40 active:scale-[0.98]"
              >
                <Key className="w-5 h-5" />
                Add API Key to Start
              </button>
            </motion.div>
          )}

          <AnimatePresence mode="popLayout">
            {files.length > 0 && !hasCompletedFiles && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <FileList 
                  files={files} 
                  onRemove={handleRemoveFile} 
                  onFormatChange={handleFormatChange} 
                  isDeveloperMode={isDeveloperMode}
                />
                
                {hasPendingFiles && (
                  <div className="mt-8 flex justify-end">
                    <button
                      onClick={handleConvert}
                      disabled={isConverting}
                      className="flex items-center space-x-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-blue-900/50 disabled:text-blue-400/50 text-white px-8 py-3.5 rounded-xl font-medium text-lg transition-all shadow-[0_0_15px_rgba(34,211,238,0.4)] hover:shadow-[0_0_25px_rgba(34,211,238,0.6)] active:scale-95 border border-cyan-500/50 disabled:border-blue-800/50 disabled:shadow-none"
                    >
                      <span>{isConverting ? 'Converting...' : 'Convert Files'}</span>
                      {!isConverting && <ArrowRight className="w-5 h-5" />}
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {hasCompletedFiles && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <ConversionResult files={files} onReset={handleReset} />
              </motion.div>
            )}
          </AnimatePresence>

          <PerformanceComparison />

          {/* Format Info Table */}
          <div className="mt-16 bg-[#0a1428]/40 border border-blue-900/50 rounded-3xl p-6 md:p-10 backdrop-blur-sm">
            <h3 className="text-xl font-bold text-sky-100 mb-6 flex items-center gap-2">
              <FileIcon className="w-6 h-6 text-cyan-400" />
              Format Guide
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-blue-900/50 text-sky-400/80 text-sm uppercase tracking-wider">
                    <th className="p-4 font-medium w-1/4">Format</th>
                    <th className="p-4 font-medium w-1/4">For whom?</th>
                    <th className="p-4 font-medium w-1/2">Why is it worth it?</th>
                  </tr>
                </thead>
                <tbody className="text-sky-100/90 text-sm divide-y divide-blue-900/30">
                  <tr className="hover:bg-blue-900/10 transition-colors">
                    <td className="p-4 font-semibold text-sky-100">TXT</td>
                    <td className="p-4">For everyone</td>
                    <td className="p-4">You can open it on a fridge, washing machine, and an old phone. The purest form of data.</td>
                  </tr>
                  <tr className="hover:bg-blue-900/10 transition-colors bg-emerald-950/10">
                    <td className="p-4 font-semibold text-emerald-400 flex items-center gap-2">
                      MD (Markdown)
                      <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30 uppercase tracking-wider">Best for LLMs</span>
                    </td>
                    <td className="p-4 text-emerald-100/80">Recommended default</td>
                    <td className="p-4 text-emerald-100/80">Lowest token footprint. Ideal input for ChatGPT, Claude, Gemini and any RAG pipeline. Also great for Notion, Obsidian, GitHub.</td>
                  </tr>
                  <tr className="hover:bg-blue-900/10 transition-colors bg-cyan-950/10">
                    <td className="p-4 font-semibold text-cyan-400 flex items-center gap-2">
                      JSON
                      <span className="text-[10px] px-2 py-0.5 bg-cyan-500/20 text-cyan-300 rounded-full border border-cyan-500/30 uppercase tracking-wider">Developer / API</span>
                    </td>
                    <td className="p-4 text-cyan-100/80">Backend &amp; pipelines</td>
                    <td className="p-4 text-cyan-100/80">Structured data format perfect for APIs, databases, and programmatic processing. Guaranteed pretty-print.</td>
                  </tr>
                  <tr className="hover:bg-blue-900/10 transition-colors bg-blue-950/10">
                    <td className="p-4 font-semibold text-blue-300 flex items-center gap-2">
                      HTML
                      <span className="text-[10px] px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-full border border-blue-500/30 uppercase tracking-wider">Browser-ready</span>
                    </td>
                    <td className="p-4 text-blue-100/80">Web rendering</td>
                    <td className="p-4 text-blue-100/80">Ready-to-use web markup preserving document structure for direct browser rendering. Heaviest format token-wise — pick MD if you plan to feed the output to an LLM.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Footer info */}
        <div className="mt-12 text-center text-sm text-sky-400/50 space-y-6">
          <div>
            <p>Files are processed locally or securely via Gemini API.</p>
            <p className="mt-1">Supported formats: JPG, PNG, PDF, DOCX, PPTX, XLSX, HEIC, RAW</p>
          </div>
          
          <div className="pt-6 border-t border-blue-900/30 flex flex-col items-center justify-center space-y-4">
            <p className="text-sky-300/80 font-medium tracking-wide uppercase text-xs">Created by HTNY Studios</p>
            <div className="flex items-center space-x-4">
              <a 
                href="https://www.instagram.com/hot_techno_near_you/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2.5 bg-blue-950/50 rounded-full text-cyan-500 hover:text-cyan-300 hover:bg-cyan-900/30 transition-all shadow-[0_0_10px_rgba(34,211,238,0.1)] hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] border border-blue-900/50 hover:border-cyan-500/50"
              >
                <Instagram className="w-5 h-5" />
                <span className="sr-only">Instagram</span>
              </a>
              <a 
                href="https://www.facebook.com/hottechnonearyou" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2.5 bg-blue-950/50 rounded-full text-cyan-500 hover:text-cyan-300 hover:bg-cyan-900/30 transition-all shadow-[0_0_10px_rgba(34,211,238,0.1)] hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] border border-blue-900/50 hover:border-cyan-500/50"
              >
                <Facebook className="w-5 h-5" />
                <span className="sr-only">Facebook</span>
              </a>
            </div>
          </div>
        </div>

        </div>
      </div>
    </div>
  );
}