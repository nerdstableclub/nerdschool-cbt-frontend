import React, { useState, useEffect, useRef } from 'react';

// ==========================================
// 1. SMART VIDEO PLAYER (Seamless Timestamp Jumper)
// ==========================================
const SmartVideoPlayer = ({ videoId, timestampText }) => {
  console.log("DEBUG: Video ID received:", videoId);
  const iframeRef = useRef(null);
  const [mountedVideoId, setMountedVideoId] = useState(videoId);

  // Parse "1h2m3s" or "14:20" or "860" into raw seconds
  const parseTimestamp = (ts) => {
    if (ts === undefined || ts === null || ts === '') return 0;
    const cleanTs = String(ts).trim().toLowerCase();
    
    if (cleanTs.includes(':')) {
      const parts = cleanTs.split(':').map(Number);
      if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
      if (parts.length === 2) return parts[0] * 60 + parts[1];
    }
    
    let seconds = 0;
    const hMatch = cleanTs.match(/(\d+)h/);
    const mMatch = cleanTs.match(/(\d+)m/);
    const sMatch = cleanTs.match(/(\d+)s/);
    if (hMatch) seconds += parseInt(hMatch[1]) * 3600;
    if (mMatch) seconds += parseInt(mMatch[1]) * 60;
    if (sMatch) seconds += parseInt(sMatch[1]);

    if (!hMatch && !mMatch && !sMatch && !cleanTs.includes(':') && !isNaN(cleanTs)) {
      return parseInt(cleanTs);
    }
    return seconds;
  };

  useEffect(() => {
    if (videoId !== mountedVideoId) {
      setMountedVideoId(videoId); // Hard reload if it's a completely different video
    } else if (iframeRef.current) {
      // THE MAGIC: If it's the same video, just send a stealth command to jump to the new timestamp!
      const seconds = parseTimestamp(timestampText);
      iframeRef.current.contentWindow.postMessage(JSON.stringify({
        event: 'command',
        func: 'seekTo',
        args: [seconds, true]
      }), '*');
      iframeRef.current.contentWindow.postMessage(JSON.stringify({
        event: 'command',
        func: 'playVideo',
        args: []
      }), '*');
    }
  }, [videoId, timestampText]);

  const startSeconds = parseTimestamp(timestampText);

  return (
    <div className="w-full h-[45vh] md:h-[55vh] shrink-0 mb-6 rounded-2xl overflow-hidden shadow-2xl border border-slate-700 bg-black relative">
      <iframe
        ref={iframeRef}
        key={mountedVideoId}
        src={`https://www.youtube.com/embed/${mountedVideoId}?enablejsapi=1&autoplay=1&start=${startSeconds}&rel=0`}
        className="absolute inset-0 w-full h-full"
        frameBorder="0"
        allow="autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
};

// ==========================================
// 2. PYQ INTERACTIVE BLOCK
// ==========================================
const PyqInteractiveBlock = ({ questionTarget }) => {
  const [qData, setQData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOpt, setSelectedOpt] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);

  useEffect(() => {
    const fetchQ = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const res = await fetch(`${API_URL}/api/pyq/${encodeURIComponent(questionTarget)}`);
        const result = await res.json();
        if (result.success) setQData(result.data);
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchQ();
  }, [questionTarget]);

  if (loading) return <div className="p-10 text-center text-sm font-mono text-fuchsia-400 animate-pulse">Fetching Exam Intel from Cloud...</div>;
  if (!qData) return <div className="p-10 text-center text-sm font-mono text-slate-500">Failed to load question data.</div>;

  const options = [qData.Option_1, qData.Option_2, qData.Option_3, qData.Option_4].filter(Boolean);
  const correctIdx = parseInt(qData.Correct_Answer) - 1;

  const handleSelect = (idx) => {
    if (selectedOpt !== null) return;
    setSelectedOpt(idx);
    setShowExplanation(true);
  };

  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto text-left">
      <div className="flex justify-between items-start mb-4 border-b border-slate-800 pb-3">
        <span className="text-xs font-black tracking-widest uppercase bg-fuchsia-900/30 text-fuchsia-400 px-3 py-1 rounded border border-fuchsia-500/20 shadow-sm">{qData.Exam_Session}</span>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 py-1 bg-slate-900 rounded">{qData.Cognitive_Depth?.replace('_', ' ')}</span>
      </div>
      <p className="text-slate-200 text-lg md:text-xl font-medium leading-relaxed mb-6">{qData.Question_Text}</p>
      
      <div className="space-y-3 mb-6">
        {options.map((opt, i) => {
          let btnStyle = "bg-slate-900 border-slate-700 text-slate-300 hover:border-fuchsia-500/50 hover:bg-slate-800";
          if (selectedOpt !== null) {
            if (i === correctIdx) btnStyle = "bg-emerald-900/20 border-emerald-500/50 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.1)]"; 
            else if (i === selectedOpt) btnStyle = "bg-rose-900/20 border-rose-500/50 text-rose-300"; 
            else btnStyle = "bg-slate-900/50 border-slate-800 text-slate-600 opacity-50"; 
          }
          return (
            <button key={i} onClick={() => handleSelect(i)} disabled={selectedOpt !== null} className={`w-full text-left px-5 py-4 rounded-xl border text-sm md:text-base font-medium transition-all ${btnStyle} flex gap-4 items-center`}>
              <span className="font-black opacity-40 shrink-0 text-lg">({i + 1})</span><span>{opt}</span>
            </button>
          );
        })}
      </div>
      {showExplanation && qData.Explanation && (
        <div className="p-5 bg-gradient-to-br from-fuchsia-900/20 to-purple-900/10 border border-fuchsia-500/30 rounded-xl animate-fade-in shadow-inner">
          <span className="text-xs font-black text-fuchsia-400 uppercase tracking-widest flex items-center gap-2 mb-2">
            <span className="w-1.5 h-1.5 bg-fuchsia-500 rounded-full animate-pulse"></span> Expert Analysis
          </span>
          <p className="text-sm md:text-base text-slate-300 leading-relaxed">{qData.Explanation}</p>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 3. MASTER STUDENT DASHBOARD
// ==========================================
export default function StudentDashboard({ user, onBack }) {
  const [lessonData, setLessonData] = useState([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  // Active Recall State
  const [revealedPoints, setRevealedPoints] = useState(0);
  
  // UI State
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true); 
  const [collapsedLMS, setCollapsedLMS] = useState({});
  const [activeResource, setActiveResource] = useState(null);

  useEffect(() => {
    const fetchLessonBank = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const res = await fetch(`${API_URL}/api/lesson-data`);
        const data = await res.json();
        
        if (data.success && data.data.length > 0) {
          setLessonData(data.data);
        } else {
          setLessonData([]);
        }
      } catch (err) {
        setLessonData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLessonBank();
    
    if (window.innerWidth < 1280) setRightSidebarOpen(false);
  }, []);

  const parseJSON = (str, fallback = []) => {
    if (!str || str === 'none') return fallback;
    try { return JSON.parse(str); } catch { return fallback; }
  };

  const getYoutubeId = (url) => {
    if (!url) return null;
    
    // 🔥 NEW: If it's already a clean 11-character ID, just use it!
    if (url.length === 11 && !url.includes('/') && !url.includes('?')) {
      return url;
    }

    const regExp = /^.*(youtu.be\/|live\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const currentStep = lessonData[activeIdx] || {};
  
  const reqPlan = currentStep.Required_Plan || currentStep.required_plan || 'Free';
  const hasAccess = 
    reqPlan.toLowerCase() === 'free' || 
    reqPlan === '' || 
    (user?.plans && user.plans.some(p => p.toLowerCase() === reqPlan.toLowerCase() || p.toLowerCase() === 'premium'));

  const stageContent = parseJSON(currentStep.stage_payload);
  const prePoints = parseJSON(currentStep.pre_points);
  const currentAssets = parseJSON(currentStep.macro_trigger);
  const synapseNotes = parseJSON(currentStep.synapse_notes);

  // Video Data
  const masterVideoId = getYoutubeId(currentStep.master_video);
  const masterVideoTimestamp = currentStep.video_timestamp || '0';

  // Split assets based on how they should be displayed
  const interactiveMedia = currentAssets.filter(a => ['youtube', 'question', 'image', 'svg'].includes(a.type));
  const mnemonics = currentAssets.filter(a => a.type === 'mnemonic');
  const codes = currentAssets.filter(a => a.type === 'code');
  
  const goToSlide = (idx) => {
    if (idx >= 0 && idx < lessonData.length) {
      setActiveIdx(idx);
      setRevealedPoints(0); 
      setActiveResource(null); 
    }
  };

  const groupedLMS = lessonData.reduce((acc, slide, idx) => {
    if (!acc[slide.paper_id]) acc[slide.paper_id] = {};
    if (!acc[slide.paper_id][slide.chapter_title]) acc[slide.paper_id][slide.chapter_title] = [];
    acc[slide.paper_id][slide.chapter_title].push({ ...slide, originalIndex: idx });
    return acc;
  }, {});

  const toggleLMS = (key) => setCollapsedLMS(p => ({ ...p, [key]: !p[key] }));

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
      if (e.key === 'Escape') { setActiveResource(null); return; }
      if (activeResource) return; 

      if (e.key === 'ArrowRight') goToSlide(activeIdx + 1);
      if (e.key === 'ArrowLeft') goToSlide(activeIdx - 1);
      if (e.key === ' ' && prePoints.length > 0 && hasAccess) {
        e.preventDefault();
        if (revealedPoints < prePoints.length) setRevealedPoints(prev => prev + 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIdx, lessonData.length, prePoints.length, revealedPoints, hasAccess, activeResource]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center font-sans">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <div className="text-indigo-400 font-bold tracking-widest uppercase text-sm animate-pulse">Loading Module...</div>
      </div>
    );
  }

  if (lessonData.length === 0) return <div className="h-screen w-full bg-slate-950 flex items-center justify-center text-slate-500 font-bold">No course data found.</div>;

  return (
    <div className="h-screen w-full bg-slate-950 text-slate-200 flex flex-col font-sans overflow-hidden">
      
      {/* THEATER MODE OVERLAY POPUP */}
      {activeResource && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-10 bg-slate-950/90 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800 bg-slate-950/50 shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-indigo-400 font-black uppercase tracking-widest text-[10px] bg-indigo-500/10 border border-indigo-500/30 px-2.5 py-1 rounded shadow-inner">
                  {activeResource.type}
                </span>
                <h3 className="text-sm font-bold text-slate-200 truncate pr-4">{activeResource.title || 'Resource Viewing'}</h3>
              </div>
              <button onClick={() => setActiveResource(null)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-rose-500 text-slate-400 hover:text-white transition-all shadow-sm">✕</button>
            </div>
            
            <div className="p-4 sm:p-8 overflow-y-auto custom-scrollbar flex-1 flex flex-col items-center justify-center relative bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 to-slate-950">
              {activeResource.type === 'youtube' && getYoutubeId(activeResource.payload) && (
                 <div className="w-full h-full flex items-center justify-center">
                   <iframe className="w-full aspect-video max-h-full rounded-xl shadow-2xl border border-slate-800 bg-black" src={`https://www.youtube.com/embed/${getYoutubeId(activeResource.payload)}?autoplay=1&rel=0`} frameBorder="0" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen></iframe>
                 </div>
              )}
              {activeResource.type === 'question' && (
                 <div className="w-full h-full flex items-center justify-center py-4">
                   <PyqInteractiveBlock questionTarget={activeResource.payload} />
                 </div>
              )}
              {activeResource.type === 'image' && (
                 <img src={activeResource.payload} alt={activeResource.title} className="max-w-full max-h-full rounded-xl object-contain shadow-2xl border border-slate-800" />
              )}
              {activeResource.type === 'svg' && (
                 <div className="w-full max-w-4xl bg-white/5 border border-slate-700/50 p-6 rounded-2xl shadow-xl flex justify-center items-center overflow-auto custom-scrollbar [&_svg]:max-w-full [&_svg]:h-auto" dangerouslySetInnerHTML={{ __html: activeResource.payload }} />
              )}
            </div>
          </div>
        </div>
      )}

      {/* TOP NAVIGATION */}
      <header className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 shrink-0 z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => setLeftSidebarOpen(!leftSidebarOpen)} className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors ${leftSidebarOpen ? 'bg-indigo-500/20 text-indigo-400' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}>☰</button>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded border border-indigo-500/30 uppercase tracking-wider">{currentStep.paper_id}</span>
            <span className="font-bold text-slate-300 text-sm hidden sm:block">{currentStep.chapter_title}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden sm:flex items-center gap-2 mr-2 border-r border-slate-700 pr-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Student:</span>
            <span className="text-xs font-bold text-emerald-400">{user?.name || 'Guest'}</span>
          </div>
          <button onClick={() => setRightSidebarOpen(!rightSidebarOpen)} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors border flex items-center gap-2 ${rightSidebarOpen ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'}`}>📦 <span className="hidden sm:inline">Resources</span></button>
          <button onClick={onBack} className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-md transition-colors border border-slate-700">Exit Hub</button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        
        {/* LEFT SIDEBAR: LMS NAVIGATOR */}
        <aside className={`bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-300 shrink-0 ${leftSidebarOpen ? 'w-64 opacity-100' : 'w-0 opacity-0 overflow-hidden border-none'}`}>
          <div className="p-3 border-b border-slate-800 font-mono text-[10px] font-bold text-slate-500 uppercase tracking-widest">Course Syllabus</div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
            {Object.entries(groupedLMS).map(([paper, chapters]) => (
              <div key={paper} className="space-y-1">
                <div onClick={() => toggleLMS(paper)} className="font-bold text-[11px] text-slate-300 uppercase bg-slate-800/50 hover:bg-slate-800 px-3 py-2 rounded-lg cursor-pointer flex justify-between items-center transition-colors">
                  <span>{paper}</span><span className="text-slate-500">{collapsedLMS[paper] ? '▼' : '▲'}</span>
                </div>
                
                {!collapsedLMS[paper] && Object.entries(chapters).map(([chapter, slides]) => {
                  const chapKey = `${paper}-${chapter}`;
                  const firstSlideReq = slides[0].Required_Plan || slides[0].required_plan || 'Free';
                  const isChapterLocked = firstSlideReq.toLowerCase() !== 'free' && firstSlideReq !== '' && !(user?.plans && user.plans.some(p => p.toLowerCase() === firstSlideReq.toLowerCase() || p.toLowerCase() === 'premium'));

                  return (
                    <div key={chapter} className="pl-2 space-y-1 mt-1">
                      <div onClick={() => toggleLMS(chapKey)} className={`font-semibold text-[10px] hover:text-indigo-300 uppercase py-1.5 px-2 cursor-pointer flex justify-between items-center ${isChapterLocked ? 'text-slate-500' : 'text-indigo-400'}`}>
                        <span className="truncate pr-2 flex items-center gap-1.5">
                          {isChapterLocked && <span>🔒</span>} {chapter}
                        </span>
                        <span className="text-slate-600 text-[8px]">{collapsedLMS[chapKey] ? '▼' : '▲'}</span>
                      </div>
                      
                      {!collapsedLMS[chapKey] && slides.map(slide => {
                        const isActive = slide.originalIndex === activeIdx;
                        return (
                          <button key={slide.step_id} onClick={() => goToSlide(slide.originalIndex)} className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all flex items-center gap-2 ${isActive ? 'bg-indigo-600 text-white font-bold shadow-md' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isActive ? 'bg-white' : 'bg-slate-600'}`}></div>
                            <span className="truncate">{slide.index_title}</span>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </aside>

        {/* CENTER STAGE: CINEMATIC SPLIT */}
        <main className="flex-1 flex flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 overflow-hidden relative">
          
          <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar p-6 md:p-10">
            <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col relative">
              
              {/* Header Title */}
              <div className="mb-6 flex items-start justify-between shrink-0">
                <div>
                  <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight drop-shadow-lg mb-2">{currentStep.index_title || 'Untitled Module'}</h1>
                  <p className="text-slate-400 font-medium text-sm">Use Spacebar or arrow keys to navigate.</p>
                </div>
                {!hasAccess && (
                  <span className="px-3 py-1 bg-rose-500/10 border border-rose-500/50 text-rose-400 text-xs font-black uppercase tracking-widest rounded shadow-sm">🔒 Locked</span>
                )}
              </div>

              {hasAccess ? (
                <>
                  {/* 🔥 THE CINEMATIC TOP HALF (IF VIDEO EXISTS) */}
                  {masterVideoId && (
                    <SmartVideoPlayer videoId={masterVideoId} timestampText={masterVideoTimestamp} />
                  )}

                  {/* 🔥 THE INTERACTIVE BOTTOM HALF */}
                  <div className="flex-1 flex flex-col w-full">
                    {prePoints.length > 0 && (
                      <div className="mb-8 bg-slate-900/50 rounded-2xl border border-indigo-500/20 p-6 shadow-xl backdrop-blur-sm shrink-0">
                        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-2">
                          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                            Active Recall Engine
                          </span>
                          <span className="text-xs font-bold text-slate-500">Revealed: {revealedPoints} / {prePoints.length}</span>
                        </div>
                        
                        <div className="space-y-3">
                          {prePoints.map((pt, i) => {
                            const isRevealed = i < revealedPoints;
                            return (
                              <div key={i} onClick={() => !isRevealed && setRevealedPoints(i + 1)} className={`p-4 rounded-xl text-sm md:text-base transition-all duration-500 ${isRevealed ? 'bg-slate-800 border border-slate-700 text-white font-semibold shadow-md translate-x-0 opacity-100' : 'bg-slate-800/30 border border-slate-800/50 text-transparent cursor-pointer blur-[6px] hover:blur-[4px] -translate-x-2 opacity-70'}`}>
                                {pt}
                              </div>
                            );
                          })}
                        </div>
                        
                        {revealedPoints < prePoints.length && (
                          <button onClick={() => setRevealedPoints(prev => prev + 1)} className="w-full mt-4 py-3 border-2 border-dashed border-indigo-500/30 rounded-xl text-indigo-400/70 hover:text-indigo-300 hover:border-indigo-500/60 hover:bg-indigo-500/10 font-bold text-xs uppercase tracking-widest transition-all">
                            Press [Space] to Reveal Next
                          </button>
                        )}
                      </div>
                    )}

                    <div className={`transition-all duration-700 w-full flex-1 shrink-0 pb-10 ${revealedPoints >= prePoints.length ? 'opacity-100 translate-y-0 blur-none' : 'opacity-30 translate-y-4 blur-sm pointer-events-none'}`}>
                      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden h-full min-h-[300px]">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-blue-500 to-indigo-600"></div>
                        {stageContent.length > 0 ? (
                          <ul className="space-y-6 pl-4">
                            {stageContent.map((item, i) => (
                              <li key={i} className="flex items-start gap-4 text-slate-200">
                                <span className="text-blue-500 text-xl font-black shrink-0 mt-0.5">▪</span>
                                <div className="text-lg md:text-xl font-medium leading-relaxed">{item}</div>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-500 font-medium">No primary content generated for this slide.</div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center bg-slate-900/50 border border-slate-800 rounded-2xl p-10 text-center relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500 via-transparent to-transparent"></div>
                  <div className="text-6xl mb-6 relative z-10">🔒</div>
                  <h2 className="text-2xl font-black text-white mb-2 relative z-10">Premium Content Locked</h2>
                  <p className="text-slate-400 mb-8 max-w-md relative z-10 font-medium">
                    This chapter requires the <span className="text-indigo-400 font-bold">"{reqPlan}"</span> access plan. Upgrade your account to unlock this module, embedded resources, and exam analytics.
                  </p>
                  <a href="#" className="relative z-10 px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-black text-sm uppercase tracking-widest rounded-xl hover:scale-105 transition-transform shadow-[0_0_20px_rgba(79,70,229,0.3)]">
                    Upgrade Plan
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="w-full shrink-0 border-t border-slate-800 bg-slate-950 p-4 flex justify-between items-center z-10 shadow-[0_-10px_30px_rgba(0,0,0,0.3)]">
             <button onClick={() => goToSlide(activeIdx - 1)} disabled={activeIdx === 0} className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-30 rounded-lg font-bold transition-all border border-slate-700 text-sm">← Previous</button>
             <button onClick={() => goToSlide(activeIdx + 1)} disabled={activeIdx === lessonData.length - 1} className="px-8 py-2 bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-30 rounded-lg font-black tracking-wide transition-all shadow-[0_0_15px_rgba(79,70,229,0.4)] text-sm">Next Module →</button>
          </div>
        </main>

        {/* RIGHT SIDEBAR: INTELLIGENCE PANEL */}
        <aside className={`bg-slate-900 border-l border-slate-800 flex flex-col shrink-0 overflow-hidden transition-all duration-300 ${rightSidebarOpen ? 'w-80 opacity-100' : 'w-0 opacity-0 border-none'}`}>
          <div className="p-4 border-b border-slate-800 flex items-center justify-between shrink-0">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Media & Intel</span>
            <span className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded text-[9px] font-bold">{currentAssets.length + synapseNotes.length}</span>
          </div>

          {!hasAccess ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center opacity-50">
              <span className="text-3xl block mb-2">🔒</span>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Resources locked<br/>with this chapter.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-5">
              {interactiveMedia.length > 0 && (
                <div className="flex flex-col gap-2">
                  <h4 className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1 pl-1">Interactive Media</h4>
                  {interactiveMedia.map(asset => {
                    let icon = '🖼️';
                    if (asset.type === 'youtube') icon = '▶️';
                    if (asset.type === 'question') icon = '🎯';
                    if (asset.type === 'svg') icon = '🧬';

                    return (
                      <button key={asset.id} onClick={() => setActiveResource(asset)} className="w-full text-left p-3.5 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-indigo-500/50 rounded-xl transition-all group flex items-start gap-3 shadow-sm hover:shadow-md">
                        <div className="text-xl shrink-0 group-hover:scale-110 transition-transform">{icon}</div>
                        <div className="flex flex-col overflow-hidden w-full">
                          <span className="text-xs font-bold text-slate-200 truncate pr-2 group-hover:text-indigo-300 transition-colors">{asset.title || 'Attached Media'}</span>
                          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mt-0.5">Open {asset.type}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {mnemonics.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1 pl-1">Memory Hacks</h4>
                  {mnemonics.map(m => (
                    <div key={m.id} className="bg-amber-900/10 border border-amber-500/30 rounded-xl p-4 shadow-sm relative overflow-hidden group">
                       <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none transition-all group-hover:bg-amber-500/20"></div>
                       <h4 className="text-[10px] text-amber-500 font-black uppercase tracking-widest mb-2 flex items-center gap-1.5 relative z-10"><span className="text-sm">🧠</span> Trick</h4>
                       <p className="text-amber-100/90 text-sm font-semibold italic leading-relaxed relative z-10">{m.payload}</p>
                    </div>
                  ))}
                </div>
              )}

              {codes.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1 pl-1">Core Data / Syntax</h4>
                  {codes.map(c => (
                    <div key={c.id} className="bg-[#0f172a] border border-slate-700 rounded-xl p-4 shadow-sm relative group overflow-hidden">
                       <h4 className="text-[10px] text-cyan-400 font-black uppercase tracking-widest mb-2 flex items-center gap-1.5"><span className="text-sm">💻</span> Keyword Expansion</h4>
                       <div className="text-slate-300 font-mono text-xs whitespace-pre-wrap leading-relaxed custom-scrollbar overflow-x-auto">{c.payload}</div>
                    </div>
                  ))}
                </div>
              )}

              {synapseNotes.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1 pl-1">Module Takeaways</h4>
                  <div className="bg-emerald-900/10 border border-emerald-500/30 rounded-xl p-4 shadow-sm">
                     <h4 className="text-[10px] text-emerald-400 font-black uppercase tracking-widest mb-3 flex items-center gap-1.5"><span className="text-sm">📝</span> Synapse Summary</h4>
                     <ul className="space-y-2">
                       {synapseNotes.map((note, i) => (
                         <li key={i} className="flex items-start gap-2 text-slate-300 text-xs font-medium leading-relaxed">
                           <span className="text-emerald-500 font-bold shrink-0">↳</span><span>{note}</span>
                         </li>
                       ))}
                     </ul>
                  </div>
                </div>
              )}

              {currentAssets.length === 0 && synapseNotes.length === 0 && (
                <div className="text-center py-10 opacity-50">
                  <span className="text-3xl block mb-2">📦</span><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Deck Empty</p>
                </div>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}