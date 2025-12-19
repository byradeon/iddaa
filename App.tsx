import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import FileUpload from './components/FileUpload';
import AnalysisView from './components/AnalysisView';
import { analyzeScreenshot, analyzeDailyBulletin } from './services/geminiService';
import { AnalysisResult, AppState } from './types';
import { AlertCircle, Globe, X, Play, Image as ImageIcon, Plus } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  // Generate previews for selected files
  useEffect(() => {
    const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
    setPreviews(newPreviews);

    // Cleanup URLs to avoid memory leaks
    return () => {
      newPreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [selectedFiles]);

  const handleFileSelect = (newFiles: File[]) => {
    setErrorMsg(null);
    setSelectedFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (indexToRemove: number) => {
    setSelectedFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const startAnalysis = async () => {
    if (selectedFiles.length === 0) return;

    setAppState(AppState.ANALYZING);
    setErrorMsg(null);
    try {
      const analysis = await analyzeScreenshot(selectedFiles);
      setResult(analysis);
      setAppState(AppState.SUCCESS);
    } catch (err: any) {
      console.error(err);
      setAppState(AppState.ERROR);
      setErrorMsg(err.message || "Analiz sırasında beklenmedik bir hata oluştu.");
    }
  };

  const handleWebSearch = async () => {
    setAppState(AppState.ANALYZING);
    setErrorMsg(null);
    // Clear files if switching to web search
    setSelectedFiles([]); 
    try {
      const analysis = await analyzeDailyBulletin();
      setResult(analysis);
      setAppState(AppState.SUCCESS);
    } catch (err: any) {
      console.error(err);
      setAppState(AppState.ERROR);
      setErrorMsg(err.message || "Web taraması sırasında beklenmedik bir hata oluştu. Lütfen tekrar deneyin.");
    }
  };

  const handleReset = () => {
    setResult(null);
    setAppState(AppState.IDLE);
    setErrorMsg(null);
    setSelectedFiles([]);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans selection:bg-emerald-500/30">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-12">
        {appState === AppState.IDLE && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
            
            {/* Hero / Intro */}
            {selectedFiles.length === 0 && (
              <div className="text-center mb-10">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  Futbol Piyasalarını Analiz Et
                </h2>
                <p className="text-lg text-slate-400 max-w-xl mx-auto">
                  Bahis bülteni ekran görüntülerini yükleyin veya yapay zekanın web'i taramasına izin verin.
                </p>
              </div>
            )}

            {/* Main Action Area */}
            <div className="flex flex-col gap-8">
              
              {/* File Upload Section */}
              <div className={`${selectedFiles.length > 0 ? 'bg-slate-800/30 p-6 rounded-2xl border border-slate-700' : ''}`}>
                 
                 {/* Header if files exist */}
                 {selectedFiles.length > 0 && (
                   <div className="flex items-center justify-between mb-4">
                     <h3 className="text-xl font-bold text-white flex items-center gap-2">
                       <ImageIcon className="w-5 h-5 text-emerald-500" />
                       Seçilen Görseller <span className="text-slate-500 text-sm font-normal">({selectedFiles.length})</span>
                     </h3>
                     <button 
                       onClick={() => setSelectedFiles([])}
                       className="text-xs text-red-400 hover:text-red-300 transition-colors"
                     >
                       Tümünü Temizle
                     </button>
                   </div>
                 )}

                 {/* Grid of selected images */}
                 {selectedFiles.length > 0 && (
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                     {previews.map((src, idx) => (
                       <div key={idx} className="relative group aspect-[3/4] rounded-xl overflow-hidden bg-slate-800 border border-slate-700 shadow-lg">
                         <img src={src} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                         <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                           <button 
                             onClick={() => removeFile(idx)}
                             className="p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-full backdrop-blur-sm transition-transform hover:scale-110"
                           >
                             <X className="w-5 h-5" />
                           </button>
                         </div>
                         <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/60 text-[10px] text-white truncate">
                           {selectedFiles[idx].name}
                         </div>
                       </div>
                     ))}
                     
                     {/* Mini Upload Button in Grid */}
                     <div className="relative aspect-[3/4] rounded-xl border-2 border-dashed border-slate-700 hover:border-emerald-500/50 hover:bg-slate-800/50 transition-all group flex flex-col items-center justify-center cursor-pointer overflow-hidden">
                       <FileUpload onFileSelect={handleFileSelect} isAnalyzing={false} isMini={true} />
                     </div>
                   </div>
                 )}

                 {/* Default Big Upload Area (Only if no files selected) */}
                 {selectedFiles.length === 0 && (
                    <div className="bg-slate-800/50 p-1 rounded-2xl border border-slate-700 shadow-2xl relative overflow-hidden group">
                      <FileUpload onFileSelect={handleFileSelect} isAnalyzing={false} />
                    </div>
                 )}

                 {/* Actions Footer */}
                 {selectedFiles.length > 0 && (
                   <div className="flex flex-col sm:flex-row gap-4 items-center justify-end border-t border-slate-700/50 pt-6">
                     <p className="text-sm text-slate-500 mr-auto hidden sm:block">
                       Toplam {selectedFiles.length} görsel analiz edilecek.
                     </p>
                     <button
                       onClick={startAnalysis}
                       className="w-full sm:w-auto px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-transform active:scale-95"
                     >
                       <Play className="w-5 h-5 fill-current" />
                       Analizi Başlat
                     </button>
                   </div>
                 )}
              </div>

              {/* Web Search Alternative (Only show if no files selected to avoid clutter) */}
              {selectedFiles.length === 0 && (
                <div className="flex items-center justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-emerald-500 blur-xl opacity-20 rounded-full"></div>
                    <button
                      onClick={handleWebSearch}
                      className="relative flex items-center gap-3 px-8 py-4 bg-slate-800 hover:bg-slate-700 border border-emerald-500/30 hover:border-emerald-500 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-emerald-500/20 group"
                    >
                      <Globe className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                      <span>Güncel Bülteni Web'den Tara (Otomatik)</span>
                    </button>
                  </div>
                </div>
              )}
              
              {selectedFiles.length === 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center mt-4">
                  <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-800">
                    <div className="text-emerald-400 font-bold mb-2">1. Oran Filtresi</div>
                    <div className="text-sm text-slate-500">Değer için 1.50 - 3.00 aralığını hedefler.</div>
                  </div>
                  <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-800">
                    <div className="text-emerald-400 font-bold mb-2">2. Form Kontrolü</div>
                    <div className="text-sm text-slate-500">Son skor istikrarını doğrular.</div>
                  </div>
                  <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-800">
                    <div className="text-emerald-400 font-bold mb-2">3. Zayıflık Analizi</div>
                    <div className="text-sm text-slate-500">Rakip savunma istatistiklerini değerlendirir.</div>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {appState === AppState.ANALYZING && (
          <div className="max-w-xl mx-auto mt-16 text-center">
             <div className="relative w-24 h-24 mx-auto mb-8">
               <div className="absolute inset-0 border-4 border-emerald-900 rounded-full"></div>
               <div className="absolute inset-0 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
               <ImageIcon className="absolute inset-0 m-auto w-8 h-8 text-emerald-500 animate-pulse" />
             </div>
             <h3 className="text-2xl font-bold text-white mb-2">Analiz Ediliyor...</h3>
             <p className="text-slate-400">
               {selectedFiles.length > 0 
                 ? `${selectedFiles.length} adet görsel işleniyor.` 
                 : "Web bülteni taranıyor."}
             </p>
             <div className="mt-8 p-4 bg-slate-800/50 rounded-lg inline-block text-sm text-emerald-400 font-mono">
               QUANT MODEL RUNNING...
             </div>
          </div>
        )}

        {appState === AppState.ERROR && (
           <div className="max-w-xl mx-auto mt-8 p-6 bg-red-950/30 border border-red-500/50 rounded-xl text-center animate-in fade-in zoom-in-95">
             <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
             <h3 className="text-xl font-bold text-white mb-2">Analiz Başarısız</h3>
             <p className="text-slate-300 mb-6">{errorMsg}</p>
             <button 
               onClick={handleReset}
               className="px-6 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-white font-medium transition-colors"
             >
               Tekrar Dene
             </button>
           </div>
        )}

        {appState === AppState.SUCCESS && result && (
          <AnalysisView result={result} onReset={handleReset} />
        )}
      </main>
    </div>
  );
};

export default App;