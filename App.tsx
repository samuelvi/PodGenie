import React, { useState, useRef } from 'react';
import Header from './components/Header';
import Button from './components/Button';
import ScriptViewer from './components/ScriptViewer';
import AudioPlayer from './components/AudioPlayer';
import { generatePodcastScript, generatePodcastAudio } from './services/geminiService';
import { AppState, PodcastConfig, ScriptLine } from './types';
import { Wand2, FileText, Headphones, Upload, X, FileIcon, Link, AlignLeft } from 'lucide-react';

// Pre-fill text from the prompt for convenience
const DEMO_TEXT = `Preparation for Job Interviews
1. Appreciation: Immediately express appreciation to the hiring manager for the opportunity.
2. Honest and Succinct: Be honest, stick to the point, be positive.
3. Sales Pitch: Explain what you offer and why you should get the job.

Top 10 Interview Questions and Best Answers
1. Tell Me About Yourself: Talk about why you're an ideal candidate, not personal details. Share hobbies only if relevant or to show personality (e.g., charity walks).
2. Why Are You the Best Person for the Job?: Match qualifications to job posting. Emphasize unique skills.
3. Why Do You Want This Job?: Research the company. Explain how you fit the mission.
4. How Has Your Experience Prepared You?: Use the STAR method. Connect past responsibilities to new requirements.
5. Why Are You Leaving?: Be honest but positive. Don't badmouth previous employers.
6. What Is Your Greatest Strength?: Show, don't just tell. Use anecdotes.
7. What Is Your Greatest Weakness?: Mention non-essential skills or skills you've improved. Turn negatives into positives (e.g., perfectionism -> detail-oriented).
8. How Do You Handle Stress?: Give examples of handling pressure productively.
9. Salary Expectations?: Research beforehand. Offer a range. Be flexible but know your worth.
10. Future Goals?: Connect personal goals to the company's future.`;

type InputMode = 'text' | 'pdf' | 'url';

const App: React.FC = () => {
  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [text, setText] = useState<string>('');
  const [url, setUrl] = useState<string>('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  
  const [appState, setAppState] = useState<AppState>(AppState.Idle);
  const [script, setScript] = useState<ScriptLine[]>([]);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const config: PodcastConfig = {
    hostName: 'Kore',
    expertName: 'Fenrir',
    tone: 'Professional'
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
    } else if (file) {
      setError("Please select a valid PDF file.");
    }
  };

  const clearFile = () => {
    setPdfFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleGenerateScript = async () => {
    // Validation
    if (inputMode === 'text' && !text.trim()) return;
    if (inputMode === 'pdf' && !pdfFile) return;
    if (inputMode === 'url' && !url.trim()) return;
    
    setAppState(AppState.GeneratingScript);
    setError(null);
    try {
      let input: { text?: string; pdfBase64?: string; url?: string } = {};

      if (inputMode === 'pdf' && pdfFile) {
        const base64 = await fileToBase64(pdfFile);
        input.pdfBase64 = base64;
      } else if (inputMode === 'url') {
        input.url = url;
      } else {
        input.text = text;
      }

      const generatedScript = await generatePodcastScript(input, config);
      setScript(generatedScript);
      setAppState(AppState.ScriptReady);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate script. Please try again.");
      setAppState(AppState.Error);
    }
  };

  const handleGenerateAudio = async () => {
    if (script.length === 0) return;

    setAppState(AppState.GeneratingAudio);
    setError(null);
    try {
      const audio = await generatePodcastAudio(script, config);
      setAudioBase64(audio);
      setAppState(AppState.Playing);
    } catch (err: any) {
      console.error(err);
      setError("Failed to generate audio. The content might be too long for a single pass.");
      setAppState(AppState.Error);
    }
  };

  const handleLoadDemo = () => {
    setInputMode('text');
    setText(DEMO_TEXT);
  };

  const getButtonDisabledState = () => {
    if (appState === AppState.GeneratingScript || appState === AppState.GeneratingAudio) return true;
    if (inputMode === 'text') return !text.trim();
    if (inputMode === 'pdf') return !pdfFile;
    if (inputMode === 'url') return !url.trim();
    return true;
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 selection:bg-indigo-500/30">
      <Header />
      
      <main className="max-w-6xl mx-auto px-4 pb-20">
        
        {/* Intro / Hero */}
        <div className="text-center my-12">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            Turn Any Content into <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Podcasts</span>
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Paste text, upload a PDF, or drop a URL. Gemini will extract the main content, ignore the clutter, and create a lifelike audio show.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column: Input & Controls */}
          <div className="space-y-6">
            
            {/* Input Type Tabs */}
            <div className="flex p-1 bg-slate-900 rounded-xl border border-slate-800">
              <button
                onClick={() => setInputMode('text')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${
                  inputMode === 'text' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <AlignLeft size={16} /> Text
              </button>
              <button
                onClick={() => setInputMode('pdf')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${
                  inputMode === 'pdf' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <FileIcon size={16} /> PDF
              </button>
              <button
                onClick={() => setInputMode('url')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${
                  inputMode === 'url' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Link size={16} /> URL
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-1 shadow-xl overflow-hidden relative min-h-[400px]">
              
              {/* CONTENT: TEXT MODE */}
              {inputMode === 'text' && (
                <div className="relative h-full">
                  <textarea
                    className="w-full h-96 bg-slate-950/50 text-slate-300 p-6 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 border-none placeholder:text-slate-600 leading-relaxed custom-scrollbar"
                    placeholder="Paste your text here..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    disabled={appState !== AppState.Idle && appState !== AppState.ScriptReady && appState !== AppState.Error}
                  />
                  {text.length === 0 && (
                     <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleLoadDemo(); }} 
                          className="pointer-events-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-lg border border-slate-700 transition-colors shadow-lg"
                        >
                          Load "Job Interview Guide" Example
                        </button>
                     </div>
                  )}
                  <div className="absolute bottom-4 right-4 text-xs text-slate-600 bg-slate-900/80 px-2 py-1 rounded">
                    {text.length} chars
                  </div>
                </div>
              )}

              {/* CONTENT: PDF MODE */}
              {inputMode === 'pdf' && (
                <div className="h-96 flex flex-col items-center justify-center bg-slate-950/50 rounded-xl p-8 relative">
                   {pdfFile ? (
                      <>
                        <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mb-4">
                          <FileIcon className="w-8 h-8 text-indigo-400" />
                        </div>
                        <h3 className="text-lg font-medium text-white mb-1 truncate max-w-full px-4">{pdfFile.name}</h3>
                        <p className="text-sm text-slate-500 mb-6">{(pdfFile.size / 1024 / 1024).toFixed(2)} MB • PDF Document</p>
                        <button 
                          onClick={clearFile}
                          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors text-slate-300"
                        >
                          <X size={16} /> Remove
                        </button>
                      </>
                   ) : (
                      <>
                        <input
                          type="file"
                          accept="application/pdf"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                          <Upload className="w-8 h-8 text-slate-400" />
                        </div>
                        <p className="text-slate-300 mb-6 font-medium">Click to upload a PDF document</p>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-colors shadow-lg shadow-indigo-500/25"
                        >
                          Select File
                        </button>
                        <p className="mt-4 text-xs text-slate-500">Supported format: .pdf</p>
                      </>
                   )}
                </div>
              )}

              {/* CONTENT: URL MODE */}
              {inputMode === 'url' && (
                <div className="h-96 flex flex-col items-center justify-center bg-slate-950/50 rounded-xl p-8">
                  <div className="w-full max-w-md space-y-4">
                    <div className="text-center mb-6">
                      <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Link className="w-8 h-8 text-indigo-400" />
                      </div>
                      <h3 className="text-lg font-medium text-white">Enter Webpage URL</h3>
                      <p className="text-sm text-slate-500 mt-2">We'll ignore the navigation and footer.</p>
                    </div>
                    
                    <div className="relative">
                      <input 
                        type="url"
                        placeholder="https://example.com/article"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-slate-600"
                      />
                    </div>
                    
                    <div className="text-xs text-slate-500 text-center bg-slate-900/50 p-3 rounded-lg border border-slate-800/50">
                      Note: We use a public proxy to access the URL content. Some websites might block this.
                    </div>
                  </div>
                </div>
              )}

            </div>

            <div className="flex gap-4">
               <Button 
                onClick={handleGenerateScript} 
                disabled={getButtonDisabledState()}
                isLoading={appState === AppState.GeneratingScript}
                className="flex-1"
               >
                 <FileText size={18} />
                 {script.length > 0 ? 'Regenerate Script' : 'Generate Script'}
               </Button>
            </div>
            
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
                {error}
              </div>
            )}
          </div>

          {/* Right Column: Output */}
          <div className="space-y-6">
            
            {/* Step 1: Script View */}
            {script.length > 0 && (
              <div className="animate-fade-in-up">
                <ScriptViewer script={script} />
                
                <div className="mt-6 flex justify-end">
                   <Button 
                    onClick={handleGenerateAudio}
                    isLoading={appState === AppState.GeneratingAudio}
                    disabled={appState === AppState.GeneratingAudio}
                    variant="primary"
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/20"
                   >
                     <Headphones size={18} />
                     Generate Audio (Podcast)
                   </Button>
                </div>
              </div>
            )}

            {/* Step 2: Audio Player */}
            {audioBase64 && (
              <div className="animate-fade-in-up">
                 <div className="h-px bg-slate-800 my-8" />
                 <h3 className="text-xl font-semibold text-white mb-4">Your Podcast</h3>
                 <AudioPlayer base64Audio={audioBase64} />
              </div>
            )}

            {appState === AppState.Idle && script.length === 0 && (
               <div className="h-full flex flex-col items-center justify-center text-slate-600 border-2 border-dashed border-slate-800 rounded-2xl p-12 bg-slate-900/30">
                  <Wand2 size={48} className="mb-4 opacity-50" />
                  <p>Your podcast script and audio will appear here.</p>
               </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
};

export default App;