import React, { useCallback, useState, useEffect } from 'react';
import { Upload, FileImage, Loader2, ClipboardPaste, Images, Plus } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (files: File[]) => void;
  isAnalyzing: boolean;
  isMini?: boolean; // New prop for mini mode
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, isAnalyzing, isMini = false }) => {
  const [dragActive, setDragActive] = useState(false);

  // Handle Global Paste Event
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (isAnalyzing) return;
      
      const items = e.clipboardData?.items;
      if (!items) return;

      const files: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) files.push(file);
        }
      }

      if (files.length > 0) {
        onFileSelect(files);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [onFileSelect, isAnalyzing]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      onFileSelect(filesArray);
    }
  }, [onFileSelect]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      onFileSelect(filesArray);
    }
  }, [onFileSelect]);

  // Mini mode render (for the grid "Add" button)
  if (isMini) {
    return (
      <div
        className={`w-full h-full flex flex-col items-center justify-center text-slate-500 hover:text-emerald-400 transition-colors
          ${dragActive ? "bg-emerald-500/20" : ""}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
          onChange={handleChange}
          accept="image/*"
        />
        <Plus className="w-8 h-8 mb-1" />
        <span className="text-[10px] uppercase font-bold tracking-wider">Ekle</span>
      </div>
    );
  }

  if (isAnalyzing) {
    return (
      <div className="w-full h-64 border-2 border-dashed border-emerald-500/30 rounded-2xl bg-slate-900/50 flex flex-col items-center justify-center animate-pulse">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
        <h3 className="text-lg font-semibold text-white">Maçlar Analiz Ediliyor...</h3>
        <p className="text-slate-400 text-sm mt-2 text-center max-w-xs">Bülten taranıyor ve quant modeli uygulanıyor...</p>
      </div>
    );
  }

  return (
    <div
      className={`relative w-full h-64 border-2 border-dashed rounded-2xl transition-all duration-300 ease-in-out flex flex-col items-center justify-center overflow-hidden group
        ${dragActive 
          ? "border-emerald-500 bg-emerald-500/10 shadow-[0_0_30px_rgba(16,185,129,0.2)]" 
          : "border-slate-700 bg-slate-800/30 hover:bg-slate-800/50 hover:border-slate-600"
        }`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        type="file"
        id="file-upload"
        multiple
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
        onChange={handleChange}
        accept="image/*"
      />
      
      <div className="flex flex-col items-center text-center p-6 pointer-events-none z-10">
        <div className={`p-4 rounded-full mb-4 transition-colors flex items-center gap-2 ${dragActive ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
          {dragActive ? <Images className="w-8 h-8" /> : <Upload className="w-8 h-8" />}
        </div>
        
        <h3 className="text-lg font-semibold text-white mb-2">
          {dragActive ? "Görüntüleri Bırak" : "Görüntü Yükle veya Yapıştır"}
        </h3>
        
        <div className="flex flex-col gap-2 items-center">
          <p className="text-sm text-slate-400 max-w-xs">
            Birden fazla ekran görüntüsü seçebilir veya sürükleyebilirsiniz.
          </p>
          
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/50 rounded-lg border border-slate-700/50 mt-2">
            <ClipboardPaste className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-mono text-slate-400">Ctrl + V ile Yapıştır</span>
          </div>
        </div>

        <div className="mt-4 px-3 py-1 bg-slate-800 rounded text-xs text-slate-500 font-mono">
          Desteklenenler: PNG, JPG, WEBP (Çoklu Seçim)
        </div>
      </div>
    </div>
  );
};

export default FileUpload;