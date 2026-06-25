import React, { useEffect, useRef } from 'react';
import { OcrLog } from '../types';
import { Terminal, ShieldAlert, CheckCircle, Flame, Clock } from 'lucide-react';

interface TerminalLogProps {
  logs: OcrLog[];
  onClear: () => void;
}

export default function TerminalLog({ logs, onClear }: TerminalLogProps) {
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden font-mono text-xs flex flex-col h-[320px] shadow-2xl">
      {/* Terminal Header */}
      <div className="bg-slate-950 px-4 py-2 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-green-500/80 inline-block"></span>
          </div>
          <span className="text-slate-400 font-semibold flex items-center gap-1.5 ml-2">
            <Terminal size={14} className="text-blue-400" />
            سجل العمليات الفوري (Activity Log)
          </span>
        </div>
        <button
          onClick={onClear}
          className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors bg-slate-900 px-2 py-1 rounded border border-slate-800 hover:border-slate-700"
        >
          مسح السجل
        </button>
      </div>

      {/* Logs Body */}
      <div className="p-4 overflow-y-auto flex-1 space-y-2.5 custom-scrollbar text-right" dir="rtl">
        {logs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-2">
            <Clock size={20} className="animate-pulse" />
            <span>في انتظار بدء المراقبة... قم بتشغيل الملتقط للبدء</span>
          </div>
        ) : (
          logs.map((log) => {
            let icon = <Clock size={12} className="text-blue-400" />;
            let textClass = 'text-slate-300';
            
            if (log.type === 'success') {
              icon = <CheckCircle size={12} className="text-emerald-400 shrink-0" />;
              textClass = 'text-emerald-400 font-medium bg-emerald-950/20 px-1.5 py-0.5 rounded border border-emerald-900/30';
            } else if (log.type === 'warning') {
              icon = <Flame size={12} className="text-amber-400 shrink-0" />;
              textClass = 'text-amber-300 font-semibold bg-amber-950/30 px-1.5 py-0.5 rounded border border-amber-800/20 animate-pulse';
            } else if (log.type === 'error') {
              icon = <ShieldAlert size={12} className="text-rose-400 shrink-0" />;
              textClass = 'text-rose-400 bg-rose-950/20 px-1.5 py-0.5 rounded border border-rose-900/20';
            } else if (log.type === 'info') {
              icon = <Terminal size={12} className="text-slate-400 shrink-0" />;
              textClass = 'text-slate-300';
            }

            return (
              <div key={log.id} className="flex gap-2 items-start justify-start border-b border-slate-800/40 pb-1.5">
                <span className="text-slate-500 select-none text-[10px] min-w-[70px] text-left pt-0.5">
                  [{log.timestamp}]
                </span>
                <span className="pt-0.5">{icon}</span>
                <div className={`flex-1 ${textClass} break-all leading-relaxed`}>
                  {log.message}
                  {log.extractedText !== undefined && (
                    <span className="text-[10px] text-slate-400 block mt-1">
                      📄 النص المستخرج: "{log.extractedText}"
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={terminalEndRef} />
      </div>
    </div>
  );
}
