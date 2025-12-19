import React from 'react';
import { Target, Activity } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 p-6 sticky top-0 z-10 bg-opacity-90 backdrop-blur-md">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
            <Activity className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              ELITE QUANT <span className="text-emerald-500 text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">BETA</span>
            </h1>
            <p className="text-xs text-slate-400">Otomatik Futbol Olasılık Analisti</p>
          </div>
        </div>
        
        <div className="hidden sm:flex items-center gap-4 text-xs font-mono text-slate-500">
          <span className="flex items-center gap-1">
            <Target className="w-3 h-3" />
            HEDEF: 0.5 GOL ÜST
          </span>
          <span className="flex items-center gap-1 text-slate-600">|</span>
          <span>ORAN: 1.60 - 3.00</span>
        </div>
      </div>
    </header>
  );
};

export default Header;