import React, { useRef, useEffect } from 'react';
import { ScriptLine, Speaker } from '../types';
import { User, Bot } from 'lucide-react';

interface ScriptViewerProps {
  script: ScriptLine[];
}

const ScriptViewer: React.FC<ScriptViewerProps> = ({ script }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [script]);

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden flex flex-col h-[500px]">
      <div className="p-4 border-b border-gray-800 bg-gray-900/90 backdrop-blur sticky top-0 z-10">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          Generated Script
          <span className="text-xs font-normal text-gray-500 px-2 py-0.5 bg-gray-800 rounded-full">
            {script.length} lines
          </span>
        </h3>
      </div>
      <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-6">
        {script.map((line, index) => (
          <div 
            key={index} 
            className={`flex gap-4 ${line.speaker === Speaker.Host ? 'flex-row' : 'flex-row-reverse'}`}
          >
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
              line.speaker === Speaker.Host ? 'bg-indigo-900/50 text-indigo-400' : 'bg-emerald-900/50 text-emerald-400'
            }`}>
              {line.speaker === Speaker.Host ? <User size={20} /> : <Bot size={20} />}
            </div>
            <div className={`flex flex-col max-w-[80%] ${line.speaker === Speaker.Host ? 'items-start' : 'items-end'}`}>
              <span className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">
                {line.speaker}
              </span>
              <div className={`p-3 rounded-2xl text-sm leading-relaxed ${
                line.speaker === Speaker.Host 
                  ? 'bg-gray-800 text-gray-200 rounded-tl-none' 
                  : 'bg-gray-800/50 text-gray-300 rounded-tr-none'
              }`}>
                {line.text}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScriptViewer;
