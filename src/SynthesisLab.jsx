import React, { useState, useEffect } from 'react';

// ==========================================
// 🔥 THE CONCEPT EXTRACTOR GAME (NATIVE)
// ==========================================
const ConceptExtractor = ({ text }) => {
  if (!text) return null;
  
  // Parse the text to find words wrapped in **asterisks**
  const wordRegex = /\*\*(.*?)\*\*/g;
  const parts = text.split(wordRegex);
  
  const targetWords = [];
  let match;
  while ((match = wordRegex.exec(text)) !== null) {
    targetWords.push(match[1]);
  }

  const [extracted, setExtracted] = useState([]);
  const [animatingWord, setAnimatingWord] = useState(null);

  const handleExtract = (word) => {
    if (!extracted.includes(word)) {
      setExtracted([...extracted, word]);
      // Trigger a quick pop animation for the specific box
      setAnimatingWord(word);
      setTimeout(() => setAnimatingWord(null), 300);
    }
  };

  return (
    <div className="w-full bg-white p-6 md:p-10 rounded-3xl shadow-xl border border-slate-200 mt-2">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
        <h3 className="text-xl font-black text-slate-800 tracking-tight">🔍 Extract the Concepts</h3>
        <span className="px-4 py-1.5 bg-indigo-100 text-indigo-800 font-bold rounded-full text-sm shadow-inner">
          {extracted.length} / {targetWords.length} Extracted
        </span>
      </div>

      {/* The Empty Boxes at the Top */}
      <div className="flex flex-wrap gap-4 mb-10">
        {targetWords.map((target, idx) => {
          const isFilled = idx < extracted.length;
          const wordInBox = isFilled ? extracted[idx] : 'Empty Box';
          const isAnimating = animatingWord === wordInBox;

          return (
            <div 
              key={idx} 
              className={`flex-1 min-w-[150px] h-16 border-2 rounded-2xl flex items-center justify-center font-black transition-all duration-300 ${
                isFilled 
                  ? 'border-indigo-500 text-indigo-900 bg-indigo-100' 
                  : 'border-dashed border-slate-300 text-slate-400 bg-slate-50'
              } ${isAnimating ? 'transform scale-110 shadow-lg' : 'shadow-sm'}`}
            >
              {wordInBox}
            </div>
          );
        })}
      </div>

      {/* The Reading Paragraph */}
      <div className="text-xl leading-[2.2] text-slate-700 font-medium bg-slate-50 p-8 rounded-2xl border border-slate-200 shadow-inner font-serif">
        {parts.map((part, i) => {
          if (i % 2 !== 0) {
            const isExtracted = extracted.includes(part);
            return (
              <button 
                key={i}
                disabled={isExtracted}
                onClick={() => handleExtract(part)}
                className={`inline-block relative -top-0.5 mx-1 px-3 py-1 font-black border-2 rounded-xl transition-all duration-300 ${
                  isExtracted 
                    ? 'bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed opacity-50' 
                    : 'bg-white text-indigo-700 border-indigo-300 shadow-sm hover:bg-indigo-50 hover:-translate-y-1 hover:shadow-md active:scale-95 cursor-pointer'
                }`}
              >
                {part}
              </button>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </div>

      {/* Success Message */}
      {extracted.length === targetWords.length && targetWords.length > 0 && (
        <div className="mt-8 p-6 bg-emerald-100 border border-emerald-300 rounded-2xl text-center animate-bounce shadow-sm">
          <h4 className="text-2xl font-black text-emerald-800">🎉 Excellent Synthesis!</h4>
          <p className="text-emerald-700 font-medium mt-1">You've successfully extracted all the core concepts.</p>
        </div>
      )}
    </div>
  );
};


// ==========================================
// 🔥 THE ELITE HTML WEBVIEW CANVAS
// ==========================================
const PremiumHTMLCanvas = ({ htmlContent }) => {
  if (!htmlContent) return null;
  const isFullHtml = htmlContent.toLowerCase().includes('<html');
  const srcDoc = isFullHtml ? htmlContent : `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        body { font-family: 'Inter', sans-serif; margin: 0; padding: 1.5rem; background-color: transparent; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      </style>
    </head>
    <body><div id="nerdschool-widget-root">${htmlContent}</div></body>
    </html>
  `;
  return (
    <div className="w-full flex flex-col bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden min-h-[450px] lg:min-h-[550px] relative mt-2">
      <div className="h-12 bg-slate-50 border-b border-slate-200 flex items-center px-6 shrink-0 justify-between">
        <div className="flex gap-2"><div className="w-3 h-3 rounded-full bg-rose-400 shadow-inner"></div><div className="w-3 h-3 rounded-full bg-amber-400 shadow-inner"></div><div className="w-3 h-3 rounded-full bg-emerald-400 shadow-inner"></div></div>
        <span className="font-black text-[10px] uppercase tracking-widest text-indigo-500 flex items-center gap-2"><span>⚡</span> Interactive Sandbox</span>
      </div>
      <iframe srcDoc={srcDoc} className="w-full flex-1 border-none bg-slate-50/50" sandbox="allow-scripts allow-same-origin" />
    </div>
  );
};


// ==========================================
// MASTER SYNTHESIS LAB COMPONENT
// ==========================================
export default function SynthesisLab({ user, onBack, onBackToCourse }) { // <-- 🔥 Added onBackToCourse here!
  const [classworkData, setClassworkData] = useState([]);
  const [mySubmissions, setMySubmissions] = useState({});
  const [activeClasswork, setActiveClasswork] = useState(null);
  const [draftText, setDraftText] = useState('');
  const [saveStatus, setSaveStatus] = useState('idle');
  const [loading, setLoading] = useState(true);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const resClasswork = await fetch(`${API_URL}/api/classwork`);
        const dataClasswork = await resClasswork.json();
        if (dataClasswork.success) setClassworkData(dataClasswork.data);

        if (user?.rollNumber) {
          const resSubs = await fetch(`${API_URL}/api/my-classwork?rollNumber=${user.rollNumber}`);
          const dataSubs = await resSubs.json();
          if (dataSubs.success) setMySubmissions(dataSubs.data);
        }
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchData();
  }, [user]);

  const saveClasswork = async () => {
    if (!draftText.trim()) return;
    setSaveStatus('saving');
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_URL}/api/submit-classwork`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rollNumber: user.rollNumber, assignmentId: activeClasswork.id, submissionText: draftText })
      });
      if ((await res.json()).success) {
        setMySubmissions(prev => ({ ...prev, [activeClasswork.id]: draftText }));
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else setSaveStatus('error');
    } catch { setSaveStatus('error'); }
  };

  if (loading) return <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center font-sans"><div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div><div className="text-indigo-400 font-bold tracking-widest uppercase text-sm animate-pulse">Loading Lab...</div></div>;

  return (
    <div className="h-screen w-full bg-slate-950 text-slate-200 flex flex-col font-sans overflow-hidden">
      
      {/* HEADER */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 shrink-0 z-20 shadow-sm relative">
        <div className="flex items-center gap-4">
          <button onClick={() => setLeftSidebarOpen(!leftSidebarOpen)} className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors ${leftSidebarOpen ? 'bg-amber-500/20 text-amber-400' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}>☰</button>
          <div className="flex bg-slate-950 rounded-lg border border-slate-800 p-1 text-xs font-black shadow-inner hidden sm:flex">
            <span className="px-4 py-1.5 rounded-md bg-amber-500 text-slate-950 shadow-sm uppercase tracking-widest flex items-center gap-2">
              <span className="text-sm">✍️</span> Synthesis Lab
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* 🔥 Properly wired back to course button */}
          <button onClick={onBackToCourse || (() => window.history.back())} className="px-4 py-1.5 bg-indigo-900/50 hover:bg-indigo-800 text-indigo-300 text-xs font-bold rounded-md transition-colors border border-indigo-700">📺 Course Hub</button>
          <button onClick={onBack} className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-md transition-colors border border-slate-700">← Hub</button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden bg-slate-950 relative">
        
        {/* LEFT SIDEBAR: Assignment List */}
        <aside className={`bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-300 shrink-0 ${leftSidebarOpen ? 'w-80 opacity-100' : 'w-0 opacity-0 overflow-hidden border-none'}`}>
          <div className="p-4 border-b border-slate-800 shrink-0">
            <h2 className="text-xs font-black text-amber-500 uppercase tracking-widest mb-1">Homework Queue</h2>
            <p className="text-[10px] font-medium text-slate-400">Complete assignments to build memory.</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
            {classworkData.length === 0 ? (
              <div className="text-center py-10 opacity-50 font-mono text-xs text-slate-500">No assignments posted yet.</div>
            ) : (
              classworkData.map(task => {
                const taskPlan = task.required_plan || 'Free';
                const taskAccess = taskPlan.toLowerCase() === 'free' || taskPlan === '' || (user?.plans && user.plans.some(p => p.toLowerCase() === taskPlan.toLowerCase() || p.toLowerCase() === 'premium'));
                const isCompleted = !!mySubmissions[task.id];
                const isActive = activeClasswork?.id === task.id;

                return (
                  <button 
                    key={task.id}
                    onClick={() => {
                      if (taskAccess) {
                        setActiveClasswork(task);
                        setDraftText(mySubmissions[task.id] || '');
                        setSaveStatus('idle');
                      }
                    }}
                    className={`w-full text-left p-4 rounded-xl border transition-all flex flex-col gap-2 relative overflow-hidden ${
                      isActive ? 'bg-amber-500/10 border-amber-500/50 shadow-inner' : 
                      taskAccess ? 'bg-slate-800/50 border-slate-700 hover:bg-slate-800 hover:border-slate-600' : 
                      'bg-slate-900 border-slate-800 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,1)]"></div>}
                    
                    <div className="flex items-start justify-between w-full">
                      <span className={`text-[10px] font-black tracking-widest uppercase px-2 py-0.5 rounded ${taskAccess ? 'bg-slate-950 text-slate-400' : 'bg-rose-950 text-rose-500'}`}>
                        {taskAccess ? 'Active' : '🔒 Locked'}
                      </span>
                      {isCompleted && <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">✓ Done</span>}
                    </div>
                    
                    <h3 className={`font-bold text-sm truncate w-full ${isActive ? 'text-amber-400' : taskAccess ? 'text-slate-200' : 'text-slate-500'}`}>
                      {task.title}
                    </h3>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* RIGHT SIDE: The Lab Workspace */}
        <main className="flex-1 flex flex-col h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">
          {!activeClasswork ? (
            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center opacity-50 select-none">
              <span className="text-6xl mb-6 drop-shadow-xl block">✍️</span>
              <h2 className="text-2xl font-black text-slate-300 uppercase tracking-widest mb-2">Synthesis Lab</h2>
              <p className="font-mono text-sm text-slate-500 max-w-md">Select an assignment from the queue to begin active recall training.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 lg:p-8">
              <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 pb-20">
                
                {/* 1. Header & Instructions */}
                <div className="flex flex-col gap-4">
                  <h2 className="text-3xl font-black text-white tracking-tight">{activeClasswork.title}</h2>
                  
                  <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-lg flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-3 flex items-center gap-2"><span>🎯</span> Mission Directive</span>
                    <p className="text-base text-slate-300 font-medium leading-relaxed z-10">{activeClasswork.instructions || activeClasswork.mission_directive}</p>
                    
                    {/* The small Mnemonic Code Block */}
                    {activeClasswork.mnemonic_code && (
                      <div className="mt-4 pt-4 border-t border-slate-800 flex items-center gap-4 z-10">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Mnemonic Code:</span>
                        <span className="px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/50 rounded-lg font-black tracking-widest shadow-inner">{activeClasswork.mnemonic_code}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Target Keywords (If provided) */}
                {activeClasswork.keywords && (
                  <div className="flex flex-wrap gap-2">
                    {activeClasswork.keywords.split(',').map((kw, idx) => (
                      <span key={idx} className="px-3 py-1.5 bg-slate-900 rounded-lg border border-slate-700 text-xs font-mono text-cyan-400 font-bold shadow-sm">{kw.trim()}</span>
                    ))}
                  </div>
                )}

                {/* 3. Student Text Editor (Your Synthesis) */}
                <div className="flex flex-col min-h-[450px] lg:min-h-[500px] bg-white rounded-3xl shadow-2xl border border-slate-300 overflow-hidden relative mt-2">
                  <div className="h-12 bg-slate-100 border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
                    <span className="font-black text-[11px] text-slate-400 uppercase tracking-widest flex items-center gap-2"><span>✍️</span> Your Synthesis</span>
                    <span className="font-mono text-[10px] font-bold text-slate-400">{draftText.split(/\s+/).filter(w => w.length > 0).length} Words</span>
                  </div>
                  
                  <textarea 
                    value={draftText}
                    onChange={(e) => { setDraftText(e.target.value); setSaveStatus('idle'); }}
                    placeholder="Synthesize the concept here in your own words..."
                    className="flex-1 w-full p-8 resize-none outline-none text-slate-800 text-lg md:text-xl font-medium leading-relaxed custom-scrollbar placeholder:text-slate-300"
                    style={{ fontFamily: "'Merriweather', serif" }}
                  />
                  
                  <div className="h-16 bg-slate-50 border-t border-slate-200 flex items-center justify-end px-6 shrink-0">
                    <button 
                      onClick={saveClasswork}
                      disabled={saveStatus === 'saving' || !draftText.trim()}
                      className={`px-8 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-sm transition-all flex items-center gap-2 ${
                        saveStatus === 'saved' ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 
                        saveStatus === 'saving' ? 'bg-amber-100 text-amber-500 cursor-wait' :
                        !draftText.trim() ? 'bg-slate-200 text-slate-400 cursor-not-allowed' :
                        'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20 hover:-translate-y-0.5 hover:shadow-md'
                      }`}
                    >
                      {saveStatus === 'saved' ? '✓ SAVED TO CLOUD' : saveStatus === 'saving' ? 'SAVING...' : '☁️ COMMIT TO MEMORY'}
                    </button>
                  </div>
                </div>

                {/* 4. CONCEPT EXTRACTOR GAME */}
                {activeClasswork.extractor_text && (
                  <ConceptExtractor text={activeClasswork.extractor_text} />
                )}

                {/* 5. THE MAGIC HTML SANDBOX! */}
                {activeClasswork.magic_paragraph && (
                  <PremiumHTMLCanvas htmlContent={activeClasswork.magic_paragraph} />
                )}

                {/* 6. STANDARD CODE EXPANSION (Fallback if no sandbox) */}
                {!activeClasswork.magic_paragraph && activeClasswork.expansion && (
                  <div className="bg-[#0a0f1c] border border-slate-700 rounded-2xl shadow-xl flex flex-col overflow-hidden max-h-[40vh] mt-2">
                    <div className="h-10 bg-slate-900 border-b border-slate-800 flex items-center px-4 shrink-0">
                      <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-rose-500"></div><div className="w-3 h-3 rounded-full bg-amber-500"></div><div className="w-3 h-3 rounded-full bg-emerald-500"></div></div>
                      <span className="ml-4 font-mono text-[10px] uppercase tracking-widest text-slate-500 font-bold">Source_Material.txt</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                      <pre className="font-mono text-slate-300 text-sm md:text-base leading-relaxed whitespace-pre-wrap">
                        <code>{activeClasswork.expansion}</code>
                      </pre>
                    </div>
                  </div>
                )}
                
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}