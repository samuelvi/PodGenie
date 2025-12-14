import React from 'react';
import { Mic2, Sparkles } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="py-6 px-4 md:px-8 max-w-7xl mx-auto flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg shadow-indigo-500/20">
          <Mic2 className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
          PodGenie
        </h1>
      </div>
      <div className="flex items-center gap-2 text-sm text-gray-400 border border-gray-800 rounded-full px-4 py-1.5 bg-gray-900/50">
        <Sparkles className="w-4 h-4 text-amber-400" />
        <span>Powered by Gemini 2.5</span>
      </div>
    </header>
  );
};

export default Header;
