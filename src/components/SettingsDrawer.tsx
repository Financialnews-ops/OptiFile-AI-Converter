import React, { useState, useEffect } from 'react';
import { X, Key, Eye, EyeOff, Shield, ExternalLink, Trash2, CheckCircle2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from '@google/genai';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onValidationChange: (isValid: boolean) => void;
}

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({ isOpen, onClose, onValidationChange }) => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [status, setStatus] = useState<{ type: 'idle' | 'success' | 'error', message: string }>({ type: 'idle', message: '' });
  const [savedKeyMasked, setSavedKeyMasked] = useState<string | null>(null);

  useEffect(() => {
    const localKey = localStorage.getItem('gemini_api_key');
    const sessionKey = sessionStorage.getItem('gemini_api_key');
    const existingKey = sessionKey || localKey;

    if (existingKey) {
      setApiKey(existingKey);
      setSavedKeyMasked(maskKey(existingKey));
      if (localKey) setRememberMe(true);
      validateKey(existingKey, true);
    }
  }, []);

  const maskKey = (key: string) => {
    if (key.length <= 10) return key;
    return `${key.substring(0, 7)}...${key.substring(key.length - 4)}`;
  };

  const validateKey = async (keyToTest: string, silent = false) => {
    if (!keyToTest.trim()) return;

    if (!silent) setIsChecking(true);
    setStatus({ type: 'idle', message: '' });

    try {
      const ai = new GoogleGenAI({ apiKey: keyToTest });
      // Minimal request to test
      await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: 'hi'
      });
      
      setStatus({ type: 'success', message: 'Success! Your key is active. You can now optimize files without limits.' });
      onValidationChange(true);
      setSavedKeyMasked(maskKey(keyToTest));

      if (rememberMe) {
        localStorage.setItem('gemini_api_key', keyToTest);
        sessionStorage.removeItem('gemini_api_key');
      } else {
        sessionStorage.setItem('gemini_api_key', keyToTest);
        localStorage.removeItem('gemini_api_key');
      }
      
      if (!silent) {
        setTimeout(() => onClose(), 1500);
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Invalid key or connection failed. Please check your key and try again.' });
      onValidationChange(false);
      setSavedKeyMasked(null);
      localStorage.removeItem('gemini_api_key');
      sessionStorage.removeItem('gemini_api_key');
    } finally {
      if (!silent) setIsChecking(false);
    }
  };

  const handleDelete = () => {
    localStorage.removeItem('gemini_api_key');
    sessionStorage.removeItem('gemini_api_key');
    setApiKey('');
    setSavedKeyMasked(null);
    onValidationChange(false);
    setStatus({ type: 'idle', message: '' });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-screen w-full max-w-md bg-[#030b1c] border-l border-blue-900/50 z-[101] shadow-2xl flex flex-col"
          >
            <div className="p-6 flex items-center justify-between border-b border-blue-900/30">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-500/20 rounded-lg">
                  <Key className="w-5 h-5 text-cyan-400" />
                </div>
                <h2 className="text-xl font-bold text-sky-100">API Settings</h2>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-full transition-colors text-sky-400"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Key Input Section */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-sky-300/80 mb-2">
                    {savedKeyMasked ? 'Active Key' : 'Gemini API Key'}
                  </label>
                  <div className="relative">
                    <input
                      type={showKey ? 'text' : 'password'}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder={savedKeyMasked || "Paste your API key here..."}
                      className="w-full bg-[#0a1428] border border-blue-800/50 rounded-xl pl-4 pr-12 py-3.5 text-sky-100 placeholder-sky-700/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all font-mono text-sm"
                    />
                    <button
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-sky-500 hover:text-sky-300 transition-colors"
                    >
                      {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {savedKeyMasked && !showKey && (
                    <p className="mt-2 text-xs text-sky-500 font-mono">
                      Current: {savedKeyMasked}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <label className="relative flex items-center cursor-pointer group">
                    <input 
                      type="checkbox" 
                      className="sr-only" 
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <div className={`w-5 h-5 rounded border transition-colors ${rememberMe ? 'bg-cyan-600 border-cyan-500' : 'bg-blue-950/50 border-blue-800/50'}`}>
                      {rememberMe && <CheckCircle2 className="w-full h-full text-white p-0.5" />}
                    </div>
                    <span className="ml-3 text-sm text-sky-300/80 group-hover:text-sky-200 transition-colors selection:bg-transparent">
                      Remember key in this browser
                    </span>
                  </label>
                </div>

                <button
                  onClick={() => validateKey(apiKey)}
                  disabled={isChecking || !apiKey.trim()}
                  className="w-full flex items-center justify-center gap-3 bg-cyan-600 hover:bg-cyan-500 disabled:bg-blue-950/50 disabled:text-sky-700 text-white px-6 py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-cyan-900/20 active:scale-[0.98]"
                >
                  {isChecking ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5" />
                  )}
                  {isChecking ? 'Checking Connection...' : 'Test & Save Connection'}
                </button>

                {status.message && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-xl text-sm leading-relaxed border ${
                      status.type === 'success' 
                        ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-400' 
                        : 'bg-rose-950/30 border-rose-500/30 text-rose-400'
                    }`}
                  >
                    {status.message}
                  </motion.div>
                )}
              </div>

              {/* Resources */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-sky-400 uppercase tracking-wider">Resources</h3>
                <a 
                  href="https://aistudio.google.com/app/apikey" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 bg-blue-900/20 border border-blue-800/30 rounded-xl hover:bg-blue-900/30 transition-all group"
                >
                  <div className="flex flex-col">
                    <span className="text-sky-100 font-medium">Where to get a key?</span>
                    <span className="text-xs text-sky-400/60">Google AI Studio Console</span>
                  </div>
                  <ExternalLink className="w-5 h-5 text-sky-500 group-hover:text-cyan-400 transition-colors" />
                </a>
              </div>

              {savedKeyMasked && (
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center justify-center gap-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all py-3 rounded-xl border border-transparent hover:border-rose-500/20"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Key (Reset)
                </button>
              )}
            </div>

            <div className="p-6 bg-blue-950/20 border-t border-blue-900/30">
              <div className="flex items-start gap-3 p-4 bg-[#0a1428] rounded-xl border border-blue-800/30">
                <Shield className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <p className="text-xs text-sky-400/60 leading-relaxed italic">
                  Key stored locally in your browser. We do not send it to our servers.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
