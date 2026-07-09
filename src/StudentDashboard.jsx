import React, { useState, useEffect, useRef } from 'react';

// ==========================================
// 1. SMART VIDEO PLAYER
// ==========================================
const SmartVideoPlayer = ({ videoId, timestampText }) => {
  const iframeRef = useRef(null);
  const [mountedVideoId, setMountedVideoId] = useState(videoId);

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

    if (!hMatch && !mMatch && !sMatch && !cleanTs.includes(':') && !isNaN(cleanTs)) return parseInt(cleanTs);
    return seconds;
  };

  useEffect(() => {
    if (videoId !== mountedVideoId) {
      setMountedVideoId(videoId); 
    } else if (iframeRef.current) {
      const seconds = parseTimestamp(timestampText);
      iframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'seekTo', args: [seconds, true] }), '*');
      iframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'playVideo', args: [] }), '*');
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
  const [selectedOpt, setSelectedOpt] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);

  useEffect(() => {
    const fetchQ = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const res = await fetch(`${API_URL}/api/pyq/${encodeURIComponent(questionTarget)}`);
        const result = await res.json();
        if (result.success) setQData(result.data);
      } catch (err) {} finally { setLoading(false); }
    };
    fetchQ();
  }, [questionTarget]);

  if (loading) return <div className="p-10 text-center text-sm font-mono text-indigo-400 animate-pulse">Fetching Exam Intel from Cloud...</div>;
  if (!qData) return <div className="p-10 text-center text-sm font-mono text-slate-500">Failed to load question data.</div>;

  const options = [qData.Option_1, qData.Option_2, qData.Option_3, qData.Option_4].filter(Boolean);
  const correctIdx = parseInt(qData.Correct_Answer) - 1;

  return (
    <div className="flex flex-col w-full text-left">
      <div className="flex justify-between items-start mb-6 border-b border-slate-200 pb-4">
        <span className="text-xs font-black tracking-widest uppercase bg-indigo-50 text-indigo-600 px-3 py-1 rounded border border-indigo-200 shadow-sm">{qData.Exam_Session}</span>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 py-1 bg-slate-100 rounded">{qData.Cognitive_Depth?.replace('_', ' ')}</span>
      </div>
      <p className="text-slate-800 text-xl md:text-2xl font-bold leading-relaxed mb-8">{qData.Question_Text}</p>
      
      <div className="space-y-4 mb-8">
        {options.map((opt, i) => {
          let btnStyle = "bg-slate-50 border-slate-200 text-slate-700 hover:border-indigo-400 hover:bg-white";
          if (selectedOpt !== null) {
            if (i === correctIdx) btnStyle = "bg-emerald-50 border-emerald-400 text-emerald-800 shadow-sm"; 
            else if (i === selectedOpt) btnStyle = "bg-rose-50 border-rose-400 text-rose-800"; 
            else btnStyle = "bg-slate-100 border-slate-200 text-slate-400 opacity-50"; 
          }
          return (
            <button key={i} onClick={() => { if (selectedOpt === null) { setSelectedOpt(i); setShowExplanation(true); } }} disabled={selectedOpt !== null} className={`w-full text-left px-6 py-4 rounded-xl border-2 text-base md:text-lg font-bold transition-all ${btnStyle} flex gap-4 items-center`}>
              <span className="font-black opacity-40 shrink-0">({i + 1})</span><span>{opt}</span>
            </button>
          );
        })}
      </div>
      {showExplanation && qData.Explanation && (
        <div className="p-6 bg-indigo-50 border border-indigo-200 rounded-xl animate-fade-in shadow-sm">
          <span className="text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2 mb-2"><span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span> Expert Analysis</span>
          <p className="text-base md:text-lg text-indigo-900 leading-relaxed font-medium">{qData.Explanation}</p>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 3. CUSTOM MCQ BLOCK
// ==========================================
const CustomMcqBlock = ({ mcqPayload }) => {
  const [selectedOpt, setSelectedOpt] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  let mcqData = {};
  try { mcqData = JSON.parse(mcqPayload || '{}'); } catch (e) { return <div className="p-10 text-center text-sm font-mono text-slate-500">Failed to load MCQ data.</div>; }

  const options = ['A', 'B', 'C', 'D'];
  const correctAns = mcqData.correct;

  return (
    <div className="flex flex-col w-full text-left">
      <div className="flex justify-between items-start mb-6 border-b border-slate-200 pb-4">
        <span className="text-xs font-black tracking-widest uppercase bg-amber-100 text-amber-800 px-3 py-1 rounded border border-amber-200 shadow-sm">CONCEPT CHECK</span>
      </div>
      <p className="text-slate-800 text-xl md:text-2xl font-bold leading-relaxed mb-8 whitespace-pre-wrap">{mcqData.question}</p>
      
      <div className="space-y-4 mb-8">
        {options.map((opt) => {
          if (!mcqData[`opt${opt}`]) return null;
          let btnStyle = "bg-slate-50 border-slate-200 text-slate-700 hover:border-amber-400 hover:bg-white";
          if (selectedOpt !== null) {
            if (opt === correctAns) btnStyle = "bg-emerald-50 border-emerald-400 text-emerald-800 shadow-sm"; 
            else if (opt === selectedOpt) btnStyle = "bg-rose-50 border-rose-400 text-rose-800"; 
            else btnStyle = "bg-slate-100 border-slate-200 text-slate-400 opacity-50"; 
          }
          return (
            <button key={opt} onClick={() => { if(selectedOpt===null){ setSelectedOpt(opt); setShowExplanation(true); } }} disabled={selectedOpt !== null} className={`w-full text-left px-6 py-4 rounded-xl border-2 text-base md:text-lg font-bold transition-all ${btnStyle} flex gap-4 items-center`}>
              <span className="font-black opacity-40 shrink-0">({opt})</span><span>{mcqData[`opt${opt}`]}</span>
            </button>
          );
        })}
      </div>
      {showExplanation && mcqData.explanation && (
        <div className="p-6 bg-indigo-50 border border-indigo-200 rounded-xl animate-fade-in shadow-sm">
          <span className="text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2 mb-2"><span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span> Teacher's Note</span>
          <p className="text-base md:text-lg text-indigo-900 leading-relaxed font-medium">{mcqData.explanation}</p>
        </div>
      )}
    </div>
  );
};

const getIframeDoc = (payload) => {
  if (!payload) return '';
  const trimmed = payload.trim();
  const isSvg = trimmed.toLowerCase().startsWith('<svg');
  const premiumCSS = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&family=Merriweather:wght@400;700&family=Fira+Code:wght@500&display=swap');
      :root { --bg-color: #f1f5f9; --card-bg: #ffffff; --text-main: #0f172a; --text-muted: #64748b; --accent: #4f46e5; --border: #e2e8f0; }
      * { box-sizing: border-box; }
      body { margin: 0; padding: 2rem; min-height: 100vh; background: var(--bg-color); display: flex; justify-content: center; align-items: flex-start; font-family: 'Inter', system-ui, sans-serif; color: var(--text-main); line-height: 1.7; -webkit-font-smoothing: antialiased; }
      .nerdschool-canvas { background: var(--card-bg); width: 100%; max-width: 1200px; padding: 4rem 5rem; border-radius: 24px; margin-top: auto; margin-bottom: auto; box-shadow: 0 20px 40px -15px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.05); }
      h1, h2, h3, h4 { font-family: 'Inter', sans-serif; font-weight: 900; letter-spacing: -0.025em; color: #0f172a; margin-top: 0; }
      h1 { font-size: 2.5rem; border-bottom: 4px solid #e0e7ff; padding-bottom: 0.5rem; margin-bottom: 2rem; display: inline-block; }
      h2 { font-size: 1.75rem; color: #1e293b; border-left: 4px solid var(--accent); padding-left: 1rem; margin-top: 2rem; margin-bottom: 1rem; }
      p, ul, ol { font-size: 1.15rem; color: #334155; margin-bottom: 1.5rem; font-family: 'Merriweather', serif; }
      ul, ol { padding-left: 1.5rem; } li { margin-bottom: 0.75rem; padding-left: 0.5rem; } li::marker { color: var(--accent); font-weight: bold; }
      code { font-family: 'Fira Code', monospace; background: #f1f5f9; color: #db2777; padding: 0.2rem 0.4rem; border-radius: 6px; font-size: 0.9em; }
      pre { background: #0f172a; color: #f8fafc; padding: 1.5rem; border-radius: 12px; overflow-x: auto; box-shadow: inset 0 2px 4px rgba(0,0,0,0.5); margin-bottom: 2rem; }
      pre code { background: transparent; color: inherit; padding: 0; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 2rem; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
      th, td { padding: 1rem 1.5rem; text-align: left; border-bottom: 1px solid var(--border); font-size: 1.05rem; }
      th { background: #f8fafc; font-weight: 700; text-transform: uppercase; font-size: 0.85rem; letter-spacing: 0.05em; color: var(--text-muted); }
      tr:hover td { background: #f1f5f9; }
      .svg-wrapper { display: flex; justify-content: center; align-items: flex-start; width: 100%; min-height: 100%; }
      svg { max-width: 100%; height: auto !important; max-height: 85vh; filter: drop-shadow(0 15px 25px rgba(0,0,0,0.05)); }
      @media (max-width: 768px) { body { padding: 1rem; } .nerdschool-canvas { padding: 2rem; } h1 { font-size: 2rem; } p, ul, ol { font-size: 1rem; } }
    </style>
  `;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">${premiumCSS}</head><body><div class="nerdschool-canvas">${isSvg ? `<div class="svg-wrapper">${trimmed}</div>` : trimmed}</div></body></html>`;
};

// ==========================================
// 4. MASTER STUDENT DASHBOARD
// ==========================================
export default function StudentDashboard({ user, onBack, onOpenLab, onOpenPyq }) {
  const [lessonData, setLessonData] = useState([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [revealedPoints, setRevealedPoints] = useState(0);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true); 
  const [splitViewMode, setSplitViewMode] = useState(false);
  const [collapsedLMS, setCollapsedLMS] = useState({});
  const [activeResource, setActiveResource] = useState(null);
  const [activePodcast, setActivePodcast] = useState(null); // 🔥 NEW PODCAST STATE
  const [overlayZoom, setOverlayZoom] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const resLessons = await fetch(`${API_URL}/api/lesson-data`);
        const dataLessons = await resLessons.json();
        if (dataLessons.success && dataLessons.data.length > 0) setLessonData(dataLessons.data);
      } catch (err) { console.error("Fetch failed", err); } finally { setLoading(false); }
    };
    fetchData();
    if (window.innerWidth < 1280) setRightSidebarOpen(false);
  }, [user]);

  const parseJSON = (str, fallback = []) => { if (!str || str === 'none') return fallback; try { return JSON.parse(str); } catch { return fallback; } };
  const getYoutubeId = (url) => {
    if (!url) return null;
    if (url.length === 11 && !url.includes('/') && !url.includes('?')) return url;
    const regExp = /^.*(youtu.be\/|live\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const currentStep = lessonData[activeIdx] || {};
  const reqPlan = currentStep.Required_Plan || currentStep.required_plan || 'Free';
  const hasAccess = reqPlan.toLowerCase() === 'free' || reqPlan === '' || (user?.plans && user.plans.some(p => p.toLowerCase() === reqPlan.toLowerCase() || p.toLowerCase() === 'premium'));

  const prePoints = parseJSON(currentStep.pre_points);
  const currentAssets = parseJSON(currentStep.macro_trigger);
  const synapseNotes = parseJSON(currentStep.synapse_notes);
  const linkingCode = currentStep.linking_code || 'NONE';
  
  const masterVideoId = getYoutubeId(currentStep.master_video);
  const masterVideoTimestamp = currentStep.video_timestamp || '0';

  // 🔥 UPDATE: Added 'podcast' to interactiveMedia
  const interactiveMedia = currentAssets.filter(a => ['youtube', 'podcast', 'question', 'custom_mcq', 'image', 'svg'].includes(a.type));
  const mnemonics = currentAssets.filter(a => a.type === 'mnemonic');
  const codes = currentAssets.filter(a => a.type === 'code');
  
  const goToSlide = (idx) => { 
    if (idx >= 0 && idx < lessonData.length) { 
      setActiveIdx(idx); 
      setRevealedPoints(0); 
      setActiveResource(null); 
      setActivePodcast(null); // Clear podcast on slide change
      setOverlayZoom(1); 
    }
  };

  const groupedLMS = lessonData.reduce((acc, slide, idx) => {
    if (!acc[slide.paper_id]) acc[slide.paper_id] = {};
    if (!acc[slide.paper_id][slide.chapter_title]) acc[slide.paper_id][slide.chapter_title] = [];
    acc[slide.paper_id][slide.chapter_title].push({ ...slide, originalIndex: idx });
    return acc;
  }, {});
  const toggleLMS = (key) => setCollapsedLMS(p => ({ ...p, [key]: !p[key] }));
  
  // 🔥 UPDATE: Added podcast icon mapping
  const getAssetIcon = (type) => { return type === 'podcast' ? '🎧' : type === 'svg' ? '🧬' : type === 'youtube' ? '▶️' : type === 'question' ? '❓' : type === 'custom_mcq' ? '📝' : type === 'code' ? '💻' : type === 'mnemonic' ? '🧠' : '🖼️'; };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
      if (e.key === 'Escape') { 
        setActiveResource(null); 
        setOverlayZoom(1); 
        return; 
      }
      if (activeResource) return; 
      if (e.key === 'ArrowRight') goToSlide(activeIdx + 1);
      if (e.key === 'ArrowLeft') goToSlide(activeIdx - 1);
      if (e.key === ' ' && prePoints.length > 0 && hasAccess) { e.preventDefault(); if (revealedPoints < prePoints.length) setRevealedPoints(prev => prev + 1); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIdx, lessonData.length, prePoints.length, revealedPoints, hasAccess, activeResource]);

  if (loading) return <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center font-sans"><div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div><div className="text-indigo-400 font-bold tracking-widest uppercase text-sm animate-pulse">Loading Module...</div></div>;
  if (lessonData.length === 0) return <div className="h-screen w-full bg-slate-950 flex items-center justify-center text-slate-500 font-bold">No course data found.</div>;

  return (
    <div className="h-screen w-full bg-slate-950 text-slate-200 flex flex-col font-sans overflow-hidden">
      
      {/* GLOBAL TOP NAVIGATION */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 shrink-0 z-20 shadow-sm relative">
        <div className="flex items-center gap-4">
          <button onClick={() => setLeftSidebarOpen(!leftSidebarOpen)} className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors ${leftSidebarOpen ? 'bg-indigo-500/20 text-indigo-400' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}>☰</button>
          
          <div className="flex bg-slate-950 rounded-lg border border-slate-800 p-1 text-xs font-black shadow-inner hidden md:flex">
            <button className={`px-4 py-1.5 rounded-md transition-all uppercase tracking-widest flex items-center gap-2 bg-indigo-600 text-white shadow-sm`}>
              <span className="text-sm">📺</span> Video Hub
            </button>
            <button onClick={onOpenLab} className={`px-4 py-1.5 rounded-md transition-all uppercase tracking-widest flex items-center gap-2 text-slate-500 hover:text-slate-300`}>
              <span className="text-sm">✍️</span> Synthesis Lab
            </button>
            <button onClick={onOpenPyq} className={`px-4 py-1.5 rounded-md transition-all uppercase tracking-widest flex items-center gap-2 text-slate-500 hover:text-fuchsia-400`}>
              <span className="text-sm">♾️</span> PYQ Engine
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden sm:flex items-center gap-2 mr-2 border-r border-slate-700 pr-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Student:</span>
            <span className="text-xs font-bold text-emerald-400">{user?.name || 'Guest'}</span>
          </div>

          <button 
            onClick={() => {
              const newState = !splitViewMode;
              setSplitViewMode(newState);
              if (newState) {
                setLeftSidebarOpen(false);
                setRightSidebarOpen(false);
              } else {
                setLeftSidebarOpen(true);
                setRightSidebarOpen(true);
              }
            }} 
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors border flex items-center gap-2 ${splitViewMode ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'}`}
          >
            ◫ <span className="hidden sm:inline">{splitViewMode ? 'Exit Split View' : 'Split View'}</span>
          </button>

          <button onClick={() => setRightSidebarOpen(!rightSidebarOpen)} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors border flex items-center gap-2 ${rightSidebarOpen ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'}`}>📦 <span className="hidden sm:inline">Resources & Synapse</span></button>
          <button onClick={onBack} className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-md transition-colors border border-slate-700">Exit Hub</button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        
        {/* THEATER MODE OVERLAY POPUP */}
        {activeResource && (() => {
          // If the active resource is a dynamic one (like Full Screen notes), it won't be in the DB array, so handle both!
          const resourceObj = currentAssets.find(a => a.id === activeResource) || activeResource;
          if (!resourceObj || !resourceObj.type) return null;
          
          return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in pointer-events-none">
              <div className={`w-[96vw] max-w-[1600px] h-[94vh] flex flex-col pointer-events-auto transition-all duration-300 shadow-[0_0_80px_rgba(0,0,0,0.8)] rounded-2xl overflow-hidden bg-slate-100/95 backdrop-blur-xl border border-slate-300`}>
                
                <div className="flex justify-between items-center px-6 py-3 border-b bg-white border-slate-200 shadow-sm shrink-0">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-md bg-slate-100 text-slate-500 border border-slate-200">{getAssetIcon(resourceObj.type)} PRESENTATION MODE</span>
                    <span className="text-sm font-bold truncate max-w-md text-slate-800">{resourceObj.title || 'Resource Viewing'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {['image', 'svg'].includes(resourceObj.type) && (
                      <div className="flex items-center rounded-lg border text-xs font-mono font-black shadow-sm overflow-hidden bg-slate-50 border-slate-300 text-slate-800">
                        <button onClick={() => setOverlayZoom(z => Math.max(0.5, Number((z - 0.25).toFixed(2))))} className="px-3 py-1 hover:bg-slate-200 transition-colors">−</button>
                        <span className="px-3 py-1 select-none text-[10px] min-w-12 text-center">{Math.round(overlayZoom * 100)}%</span>
                        <button onClick={() => setOverlayZoom(z => Math.min(4, Number((z + 0.25).toFixed(2))))} className="px-3 py-1 hover:bg-slate-200 transition-colors">+</button>
                        {overlayZoom !== 1 && <button onClick={() => setOverlayZoom(1)} className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] font-bold tracking-tighter uppercase transition-colors">FIT</button>}
                      </div>
                    )}
                    <button onClick={() => { setActiveResource(null); setOverlayZoom(1); }} className="font-bold px-5 py-1.5 rounded-lg text-xs shadow-sm transition-all bg-rose-500 hover:bg-rose-600 text-white border border-rose-600">EXIT PRESENTATION ✕</button>
                  </div>
                </div>
                
                <div className="flex-1 w-full h-full overflow-y-auto custom-scrollbar flex flex-col p-4 md:p-8 relative bg-slate-200/50">
                  {resourceObj.type === 'youtube' && getYoutubeId(resourceObj.payload) ? (
                    <div className="my-auto mx-auto w-full max-w-7xl shrink-0 shadow-2xl rounded-2xl overflow-hidden border border-slate-800 bg-black aspect-video"><iframe className="w-full h-full" src={`https://www.youtube.com/embed/${getYoutubeId(resourceObj.payload)}?autoplay=1`} frameBorder="0" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen /></div>
                  ) : resourceObj.type === 'image' ? (
                    <div className="my-auto mx-auto shrink-0 transition-transform duration-200" style={{ transform: `scale(${overlayZoom})`, transformOrigin: 'top center' }}><img src={resourceObj.payload} alt={resourceObj.title} className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl border border-slate-300 bg-white" /></div>
                  ) : resourceObj.type === 'question' ? (
                    <div className="my-auto mx-auto w-full max-w-5xl bg-white p-8 md:p-14 rounded-3xl shadow-2xl border border-slate-200 shrink-0"><PyqInteractiveBlock questionTarget={resourceObj.payload} /></div>
                  ) : resourceObj.type === 'custom_mcq' ? (
                    <div className="my-auto mx-auto w-full max-w-5xl bg-white p-8 md:p-14 rounded-3xl shadow-2xl border border-slate-200 shrink-0"><CustomMcqBlock mcqPayload={resourceObj.payload} /></div>
                  ) : resourceObj.type === 'svg' ? (
                    <div className="my-auto mx-auto w-full max-w-6xl flex flex-col shrink-0 transition-transform" style={{ transform: `scale(${overlayZoom})`, transformOrigin: 'top center' }}>
                       <div className="w-full min-h-[80vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-300 overflow-hidden">
                         <div className="w-full h-10 bg-slate-100 border-b border-slate-200 flex items-center px-5 shrink-0"><div className="flex gap-2"><div className="w-3 h-3 rounded-full bg-rose-400"></div><div className="w-3 h-3 rounded-full bg-amber-400"></div><div className="w-3 h-3 rounded-full bg-emerald-400"></div></div><span className="ml-5 text-[11px] font-mono text-slate-400 font-bold uppercase tracking-widest">NerdSchool CodeWeb Canvas</span></div>
                         <iframe srcDoc={getIframeDoc(resourceObj.payload)} className="w-full flex-1 min-h-[80vh] border-none bg-white" sandbox="allow-scripts allow-same-origin" />
                       </div>
                    </div>
                  ) : resourceObj.type === 'mnemonic' ? (
                    <div className="my-auto mx-auto w-full max-w-5xl bg-gradient-to-br from-amber-400 to-orange-600 rounded-[3rem] p-12 md:p-20 shadow-2xl text-center relative overflow-hidden shrink-0">
                      <div className="absolute top-0 right-0 opacity-10 text-[250px] -mt-16 -mr-10 select-none pointer-events-none">🧠</div>
                      <h3 className="text-amber-100 font-black tracking-widest uppercase mb-6 text-xl drop-shadow-md">Memory Hack</h3>
                      <p className="text-4xl md:text-6xl font-black text-white leading-tight drop-shadow-xl">{resourceObj.payload}</p>
                    </div>
                  ) : resourceObj.type === 'code' ? (
                    <div className="my-auto mx-auto w-full max-w-5xl flex flex-col bg-[#0a0f1c] rounded-3xl shadow-2xl border border-slate-700 overflow-hidden shrink-0 max-h-[85vh]">
                        <div className="h-14 bg-slate-900 border-b border-slate-800 flex items-center px-6 shrink-0"><div className="flex gap-2"><div className="w-3.5 h-3.5 rounded-full bg-rose-500"></div><div className="w-3.5 h-3.5 rounded-full bg-amber-500"></div><div className="w-3.5 h-3.5 rounded-full bg-emerald-500"></div></div><span className="ml-6 font-mono text-sm text-slate-500 font-bold">syntax_expansion.sh</span></div>
                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar"><pre className="font-mono text-cyan-400 text-xl md:text-2xl leading-relaxed tracking-wide whitespace-pre-wrap"><code>{resourceObj.payload}</code></pre></div>
                    </div>
                  ) : <div className="my-auto mx-auto p-10 text-slate-500 font-mono">Unknown asset type.</div>}
                </div>
              </div>
            </div>
          );
        })()}

        {/* LEFT SIDEBAR: COURSE SYLLABUS */}
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
                        <span className="truncate pr-2 flex items-center gap-1.5">{isChapterLocked && <span>🔒</span>} {chapter}</span>
                        <span className="text-slate-600 text-[8px]">{collapsedLMS[chapKey] ? '▼' : '▲'}</span>
                      </div>
                      {!collapsedLMS[chapKey] && slides.map(slide => {
                        const isActive = slide.originalIndex === activeIdx;
                        return (
                          <button key={slide.step_id} onClick={() => goToSlide(slide.originalIndex)} className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all flex items-center gap-2 ${isActive ? 'bg-indigo-600 text-white font-bold shadow-md' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isActive ? 'bg-white' : 'bg-slate-600'}`}></div><span className="truncate">{slide.index_title}</span>
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

        {/* CENTER STAGE */}
        <main className="flex-1 flex flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 overflow-hidden relative">
          
          <div className={`flex-1 flex ${splitViewMode ? 'flex-row' : 'flex-col'} overflow-hidden relative`}>
            
            {/* LEFT SIDE (Video + Title + Active Recall) */}
            <div className={`${splitViewMode ? 'w-1/2 border-r border-slate-800 flex flex-col bg-slate-950/50' : 'max-w-5xl mx-auto w-full flex flex-col shrink-0'} p-6 md:p-10 overflow-y-auto custom-scrollbar transition-all duration-500`}>
              
              <div className="mb-6 flex items-start justify-between shrink-0">
                <div>
                  <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight drop-shadow-lg mb-2">{currentStep.index_title || 'Untitled Module'}</h1>
                  <p className="text-slate-400 font-medium text-sm">Use Spacebar or arrow keys to navigate.</p>
                </div>
                {!hasAccess && <span className="px-3 py-1 bg-rose-500/10 border border-rose-500/50 text-rose-400 text-xs font-black uppercase tracking-widest rounded shadow-sm">🔒 Locked</span>}
              </div>

              {hasAccess ? (
                <>
                  {/* VIDEO STAYS LOCKED IN ITS COLUMN */}
                  {masterVideoId && <SmartVideoPlayer videoId={masterVideoId} timestampText={masterVideoTimestamp} />}
                  
                  {/* ACTIVE RECALL ENGINE (Only shows here if NOT in Split View) */}
                  {!splitViewMode && prePoints.length > 0 && (
                    <div className="mb-8 bg-slate-900/50 rounded-2xl border border-indigo-500/20 p-6 shadow-xl backdrop-blur-sm shrink-0 mt-6">
                      <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-2">
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>Active Recall Engine</span>
                        <span className="text-xs font-bold text-slate-500">Revealed: {revealedPoints} / {prePoints.length}</span>
                      </div>
                      <div className="space-y-3">
                        {prePoints.map((pt, i) => {
                          const isRevealed = i < revealedPoints;
                          return <div key={i} onClick={() => !isRevealed && setRevealedPoints(i + 1)} className={`p-4 rounded-xl text-sm md:text-base transition-all duration-500 ${isRevealed ? 'bg-slate-800 border border-slate-700 text-white font-semibold shadow-md translate-x-0 opacity-100' : 'bg-slate-800/30 border border-slate-800/50 text-transparent cursor-pointer blur-[6px] hover:blur-[4px] -translate-x-2 opacity-70'}`}>{pt}</div>;
                        })}
                      </div>
                      {revealedPoints < prePoints.length && <button onClick={() => setRevealedPoints(prev => prev + 1)} className="w-full mt-4 py-3 border-2 border-dashed border-indigo-500/30 rounded-xl text-indigo-400/70 hover:text-indigo-300 hover:border-indigo-500/60 hover:bg-indigo-500/10 font-bold text-xs uppercase tracking-widest transition-all">Press [Space] to Reveal Next</button>}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center bg-slate-900/50 border border-slate-800 rounded-2xl p-10 text-center relative overflow-hidden mt-6">
                  <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500 via-transparent to-transparent"></div>
                  <div className="text-6xl mb-6 relative z-10">🔒</div>
                  <h2 className="text-2xl font-black text-white mb-2 relative z-10">Premium Content Locked</h2>
                  <p className="text-slate-400 mb-8 max-w-md relative z-10 font-medium">This chapter requires the <span className="text-indigo-400 font-bold">"{reqPlan}"</span> access plan. Upgrade your account to unlock this module, embedded resources, and exam analytics.</p>
                  <a href="#" className="relative z-10 px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-black text-sm uppercase tracking-widest rounded-xl hover:scale-105 transition-transform shadow-[0_0_20px_rgba(79,70,229,0.3)]">Upgrade Plan</a>
                </div>
              )}
            </div>

            {/* RIGHT SIDE (HTML Notes) */}
            {hasAccess && (
              <div className={`${splitViewMode ? 'w-1/2 flex flex-col bg-slate-900/30' : 'max-w-5xl mx-auto w-full flex flex-col px-6 md:px-10'} transition-all duration-500 overflow-hidden`}>
                <div className={`w-full flex-1 flex flex-col pb-6 ${splitViewMode ? 'p-6 h-full' : 'min-h-[60vh]'} ${revealedPoints >= prePoints.length ? 'opacity-100 translate-y-0 blur-none' : 'opacity-30 translate-y-4 blur-sm pointer-events-none'}`}>
                  
                  <div className="flex-1 bg-slate-100 border border-slate-300 rounded-2xl shadow-2xl relative overflow-hidden flex flex-col h-full min-h-[500px]">
                    
                    {/* Top Header Bar for Notes */}
                    <div className="h-12 bg-white border-b border-slate-200 flex items-center justify-between px-5 shrink-0 z-10 shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="flex gap-1.5">
                          <div className="w-3 h-3 rounded-full bg-rose-400"></div>
                          <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                          <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                        </div>
                        <span className="text-[11px] font-mono text-slate-400 font-bold uppercase tracking-widest">
                          Interactive Course Notes
                        </span>
                      </div>
                      
                      <button 
                        onClick={() => {
                          let payloadData = currentStep.stage_payload;
                          try {
                            const parsed = JSON.parse(currentStep.stage_payload);
                            if (Array.isArray(parsed)) payloadData = parsed.join('\n');
                          } catch {}
                          
                          setActiveResource({ 
                            type: 'svg', 
                            title: `${currentStep.index_title} - Extended Notes`,
                            payload: payloadData
                          });
                        }}
                        className="px-4 py-1.5 bg-slate-50 hover:bg-indigo-600 text-slate-600 hover:text-white border border-slate-200 hover:border-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-sm"
                      >
                        <span>⛶</span> Full Screen
                      </button>
                    </div>

                    {/* Iframe Canvas */}
                    {currentStep.stage_payload && currentStep.stage_payload.trim() !== '' && currentStep.stage_payload !== '[]' ? (
                      <iframe 
                        srcDoc={getIframeDoc(
                          (() => {
                            try {
                              const parsed = JSON.parse(currentStep.stage_payload);
                              return Array.isArray(parsed) ? parsed.join('\n') : currentStep.stage_payload;
                            } catch {
                              return currentStep.stage_payload;
                            }
                          })()
                        )} 
                        className="w-full flex-1 h-full min-h-[500px] border-none bg-slate-50 custom-scrollbar" 
                        sandbox="allow-scripts allow-same-origin" 
                      />
                    ) : (
                      <div className="w-full flex-1 flex items-center justify-center text-slate-400 font-medium bg-slate-50 min-h-[300px]">
                        No primary content generated for this slide.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="w-full shrink-0 border-t border-slate-800 bg-slate-950 p-4 flex justify-between items-center z-10 shadow-[0_-10px_30px_rgba(0,0,0,0.3)]">
             <button onClick={() => goToSlide(activeIdx - 1)} disabled={activeIdx === 0} className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-30 rounded-lg font-bold transition-all border border-slate-700 text-sm">← Previous</button>
             <button onClick={() => goToSlide(activeIdx + 1)} disabled={activeIdx === lessonData.length - 1} className="px-8 py-2 bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-30 rounded-lg font-black tracking-wide transition-all shadow-[0_0_15px_rgba(79,70,229,0.4)] text-sm">Next Module →</button>
          </div>
        </main>

        {/* RIGHT SIDEBAR: SYNAPSE & MEDIA INTEL */}
        <aside className={`bg-slate-900 border-l border-slate-800 flex flex-col shrink-0 overflow-hidden transition-all duration-300 ${rightSidebarOpen ? 'w-80 opacity-100' : 'w-0 opacity-0 border-none'}`}>
          <div className="p-4 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/80 backdrop-blur-sm z-10">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              Synapse & Resources
            </span>
            <span className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded text-[9px] font-bold">
              {interactiveMedia.length + mnemonics.length + codes.length + (synapseNotes.length > 0 ? 1 : 0) + (linkingCode !== 'NONE' ? 1 : 0) + (prePoints.length > 0 ? 1 : 0)}
            </span>
          </div>
          
          {!hasAccess ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center opacity-50">
              <span className="text-3xl block mb-2">🔒</span>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Resources locked<br/>with this chapter.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6 pb-12">
              
              {/* --- 1. ACTIVE LINKING CODE (Kept at top as a badge) --- */}
              {linkingCode && linkingCode !== 'NONE' && (
                <div className="flex flex-col gap-2">
                  <h4 className="text-[9px] text-slate-500 font-bold uppercase tracking-widest pl-1 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> Active Linking Code
                  </h4>
                  <div className="w-full text-center text-xl font-mono font-black text-indigo-400 tracking-wider bg-slate-950 rounded-xl p-3 border border-slate-800 shadow-inner">
                    {linkingCode}
                  </div>
                </div>
              )}

              {/* --- 2. INTERACTIVE MEDIA SECTION --- */}
              {interactiveMedia.length > 0 && (
                <div className="flex flex-col gap-2">
                  <h4 className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1 pl-1">Interactive Media</h4>
                  {interactiveMedia.map(asset => (
                    <button key={asset.id} onClick={() => {
                      // 🔥 UPDATE: Route podcasts to the new mini-player state
                      if (asset.type === 'podcast') {
                        setActivePodcast(activePodcast === asset.id ? null : asset.id);
                      } else {
                        setActiveResource(asset.id);
                      }
                    }} className={`w-full text-left p-3.5 border rounded-xl transition-all group flex items-start gap-3 shadow-sm hover:shadow-md ${(asset.type === 'podcast' ? activePodcast === asset.id : activeResource === asset.id) ? 'bg-indigo-900/30 border-indigo-500' : 'bg-slate-800/50 hover:bg-slate-800 border-slate-700 hover:border-indigo-500/50'}`}>
                      <div className="text-xl shrink-0 group-hover:scale-110 transition-transform">{getAssetIcon(asset.type)}</div>
                      <div className="flex flex-col overflow-hidden w-full">
                        <span className="text-xs font-bold text-slate-200 truncate pr-2 group-hover:text-indigo-300 transition-colors">{asset.title || 'Attached Media'}</span>
                        <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mt-0.5">
                          {asset.type === 'podcast' ? (activePodcast === asset.id ? 'Playing...' : 'Play Audio') : `Launch ${asset.type.replace('_', ' ')}`}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              
              {/* --- 3. MEMORY HACKS SECTION --- */}
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
              
              {/* --- 4. CORE DATA SECTION --- */}
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

              {/* --- 5. TARGET SCRATCHPAD --- */}
              {synapseNotes && synapseNotes.length > 0 && (
                <div className="flex flex-col gap-2 pt-2">
                  <h4 className="text-[9px] text-slate-500 font-bold uppercase tracking-widest pl-1">Target Scratchpad</h4>
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 shadow-inner space-y-3">
                    {synapseNotes.map((note, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-amber-500 font-bold mt-0.5 text-[10px]">↳</span>
                        <p className="flex-1 text-slate-300 font-mono text-xs leading-relaxed">
                          {note}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* --- 6. ACTIVE RECALL ENGINE --- */}
              {prePoints.length > 0 && (
                <div className="flex flex-col gap-2 pt-2">
                  <h4 className="text-[9px] text-slate-500 font-bold uppercase tracking-widest pl-1 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span> Active Recall Engine
                  </h4>
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 shadow-inner flex flex-col gap-3">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Progress</span>
                      <span className="text-[10px] font-black text-indigo-400">{revealedPoints} / {prePoints.length}</span>
                    </div>
                    
                    <div className="space-y-2">
                      {prePoints.map((pt, i) => {
                        const isRevealed = i < revealedPoints;
                        return (
                          <div key={i} onClick={() => !isRevealed && setRevealedPoints(i + 1)} className={`p-3 rounded-lg text-xs leading-relaxed transition-all duration-500 ${isRevealed ? 'bg-slate-800 border border-slate-700 text-white font-medium shadow-sm translate-x-0 opacity-100' : 'bg-slate-800/30 border border-slate-800/50 text-transparent cursor-pointer blur-[4px] hover:blur-[2px] -translate-x-2 opacity-60'}`}>
                            {pt}
                          </div>
                        );
                      })}
                    </div>
                    
                    {revealedPoints < prePoints.length && (
                      <button onClick={() => setRevealedPoints(prev => prev + 1)} className="w-full mt-1 py-2.5 border border-dashed border-indigo-500/30 rounded-lg text-indigo-400/80 hover:text-indigo-300 hover:border-indigo-500/60 hover:bg-indigo-500/10 font-bold text-[10px] uppercase tracking-widest transition-all">
                        Reveal Next [SPC]
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* --- 7. EMPTY STATE --- */}
              {currentAssets.length === 0 && synapseNotes.length === 0 && linkingCode === 'NONE' && prePoints.length === 0 && (
                <div className="text-center py-10 opacity-50">
                  <span className="text-3xl block mb-2">📦</span>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Deck Empty</p>
                </div>
              )}

            </div>
          )}
        </aside>
      </div>

      {/* 🔥 THE NEW PODCAST MINI-PLAYER 🔥 */}
      {activePodcast && (() => {
        const podcastAsset = currentAssets.find(a => a.id === activePodcast);
        if (!podcastAsset || !getYoutubeId(podcastAsset.payload)) return null;
        return (
          <div className="fixed bottom-20 right-8 w-80 bg-slate-900 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-slate-700 overflow-hidden z-[200] animate-fade-in flex flex-col">
            <div className="flex justify-between items-center px-4 py-2.5 bg-slate-950 border-b border-slate-800">
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="text-emerald-400 animate-pulse">🎧</span>
                <span className="text-[10px] font-bold text-white truncate uppercase tracking-wider">{podcastAsset.title}</span>
              </div>
              <button onClick={() => setActivePodcast(null)} className="text-rose-500 hover:text-rose-400 font-black text-sm px-2">✕</button>
            </div>
            {/* The YouTube iframe container */}
            <div className="w-full aspect-video bg-black">
              <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${getYoutubeId(podcastAsset.payload)}?autoplay=1`} frameBorder="0" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
            </div>
          </div>
        );
      })()}

    </div>
  );
}