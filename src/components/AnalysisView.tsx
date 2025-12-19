import React, { useState } from 'react';
import { AnalysisResult, AnalysisStep, MatchAnalysis } from '../types';
import { CheckCircle2, XCircle, AlertTriangle, ChevronRight, TrendingUp, ShieldAlert, BadgeDollarSign, ChevronDown, ChevronUp, Download } from 'lucide-react';

interface AnalysisViewProps {
  result: AnalysisResult;
  onReset: () => void;
}

const StatusIcon: React.FC<{ status: AnalysisStep['status'] }> = ({ status }) => {
  switch (status) {
    case 'PASS': return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
    case 'FAIL': return <XCircle className="w-5 h-5 text-red-400" />;
    case 'WARNING': return <AlertTriangle className="w-5 h-5 text-amber-400" />;
    default: return <AlertTriangle className="w-5 h-5 text-slate-400" />;
  }
};

const StepRow: React.FC<{ step: AnalysisStep, title: string, icon: React.ElementType }> = ({ step, title, icon: Icon }) => {
  const statusColor = step.status === 'PASS' ? 'text-emerald-400' : step.status === 'FAIL' ? 'text-red-400' : 'text-slate-400';
  
  return (
    <div className="flex items-start gap-3 py-2 border-b border-slate-700/50 last:border-0">
      <div className="mt-0.5">
        <StatusIcon status={step.status} />
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-center mb-1">
          <h5 className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <Icon className="w-3.5 h-3.5 opacity-70" /> {title}
          </h5>
          <span className={`text-xs font-mono ${statusColor}`}>{step.value}</span>
        </div>
        <p className="text-xs text-slate-500 leading-snug">{step.details}</p>
      </div>
    </div>
  );
};

const MatchCard: React.FC<{ match: MatchAnalysis }> = ({ match }) => {
  const [expanded, setExpanded] = useState(false);
  const isEligible = match.finalVerdict.eligible;

  return (
    <div className={`rounded-xl border transition-all duration-300 overflow-hidden mb-4
      ${isEligible 
        ? "border-emerald-500/50 bg-slate-800/40 hover:border-emerald-500" 
        : "border-slate-700 bg-slate-800/20 hover:border-slate-600"
      }`}>
      
      {/* Card Header */}
      <div 
        className="p-4 flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
             {isEligible && (
               <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/20">
                 Önerilen
               </span>
             )}
             <span className="text-xs text-slate-500">{match.predictionTarget}</span>
          </div>
          <h3 className="text-lg font-bold text-white leading-tight">{match.matchName}</h3>
          <p className="text-sm text-slate-400 mt-0.5">Odak: <span className="text-slate-200">{match.selectedTeam}</span></p>
        </div>

        <div className="flex items-center gap-4">
           <div className="text-right hidden sm:block">
              <div className={`text-lg font-bold ${isEligible ? 'text-emerald-400' : 'text-slate-500'}`}>
                {match.finalVerdict.confidenceScore}%
              </div>
              <div className="text-[10px] text-slate-600 uppercase">Güven</div>
           </div>
           {expanded ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-4 pb-4 pt-0 animate-in slide-in-from-top-2">
           <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50 mb-3">
             <p className="text-sm text-slate-300 italic">"{match.finalVerdict.reasoning}"</p>
           </div>
           
           <div className="space-y-1">
             <StepRow title="Oran Değerlemesi" step={match.step1_OddsFilter} icon={BadgeDollarSign} />
             <StepRow title="Hücum Gücü" step={match.step2_OffensivePower} icon={TrendingUp} />
             <StepRow title="Rakip Savunma" step={match.step3_DefensiveWeakness} icon={ShieldAlert} />
           </div>
        </div>
      )}
    </div>
  );
};

const AnalysisView: React.FC<AnalysisViewProps> = ({ result, onReset }) => {
  const eligibleMatches = result.matches.filter(m => m.finalVerdict.eligible);
  const otherMatches = result.matches.filter(m => !m.finalVerdict.eligible);

  const handleDownload = () => {
    const lines = [];
    lines.push("════════════════════════════════════════════════════");
    lines.push("          ELITE QUANT FOOTBALL ANALYST RAPORU       ");
    lines.push("════════════════════════════════════════════════════");
    lines.push(`Tarih: ${new Date().toLocaleString('tr-TR')}`);
    lines.push(`Toplam Taranan Maç: ${result.matches.length}`);
    lines.push(`Önerilen Fırsatlar: ${eligibleMatches.length}`);
    lines.push("");

    if (eligibleMatches.length > 0) {
      lines.push("✅ ÖNERİLEN MAÇLAR");
      lines.push("────────────────────────────────────────────────────");
      eligibleMatches.forEach(m => {
        lines.push(`MAÇ: ${m.matchName}`);
        lines.push(`SEÇİM: ${m.selectedTeam} -> ${m.predictionTarget}`);
        lines.push(`GÜVEN: %${m.finalVerdict.confidenceScore}`);
        lines.push(`NEDEN: ${m.finalVerdict.reasoning}`);
        lines.push(`DETAYLAR:`);
        lines.push(`  - Oran: ${m.step1_OddsFilter.value}`);
        lines.push(`  - Hücum: ${m.step2_OffensivePower.value}`);
        lines.push(`  - Savunma: ${m.step3_DefensiveWeakness.value}`);
        lines.push("----------------------------------------------------");
      });
      lines.push("");
    }

    if (otherMatches.length > 0) {
      lines.push("❌ ELENEN / RİSKLİ MAÇLAR");
      lines.push("────────────────────────────────────────────────────");
      otherMatches.forEach(m => {
        lines.push(`MAÇ: ${m.matchName}`);
        lines.push(`DURUM: ${m.finalVerdict.reasoning}`);
        lines.push(`ORAN: ${m.step1_OddsFilter.value}`);
        lines.push("");
      });
    }

    lines.push("\nGenerated by Elite Quant Analyst");

    const content = lines.join("\n");
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Elite_Quant_Analiz_${new Date().toISOString().slice(0,10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto">
      
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white">Bülten Analizi</h2>
        <p className="text-slate-400 text-sm mt-1">Görüntüde {result.matches.length} maç bulundu</p>
      </div>

      {/* Eligible Section */}
      {eligibleMatches.length > 0 && (
        <div className="mb-8">
          <h3 className="text-emerald-400 font-bold uppercase tracking-wider text-xs mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> En İyi Seçimler ({eligibleMatches.length})
          </h3>
          {eligibleMatches.map((match, idx) => (
            <MatchCard key={`eligible-${idx}`} match={match} />
          ))}
        </div>
      )}

      {/* Others Section */}
      {otherMatches.length > 0 && (
        <div className="mb-8">
          <h3 className="text-slate-500 font-bold uppercase tracking-wider text-xs mb-3 flex items-center gap-2">
            <XCircle className="w-4 h-4" /> Düşük Değer / Atlananlar ({otherMatches.length})
          </h3>
          {otherMatches.map((match, idx) => (
            <MatchCard key={`other-${idx}`} match={match} />
          ))}
        </div>
      )}

      {result.matches.length === 0 && (
        <div className="text-center p-8 border border-slate-700 rounded-xl bg-slate-800/30 mb-8">
          <p className="text-slate-400">Görüntüde tanımlanabilir maç bulunamadı.</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-center gap-4 pb-12">
        <button 
          onClick={handleDownload}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition-colors shadow-lg flex items-center justify-center gap-2"
        >
          <Download className="w-5 h-5" />
          Raporu İndir
        </button>
        <button 
          onClick={onReset}
          className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg transition-colors border border-slate-700 flex items-center justify-center gap-2 shadow-lg"
        >
          Başka Bir Görüntü Analiz Et
        </button>
      </div>

    </div>
  );
};

export default AnalysisView;