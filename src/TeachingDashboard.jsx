import React, { useState, useEffect, useRef } from 'react';

// ==========================================
// 1. SMART PYQ SEARCH ENGINE
// ==========================================
const PyqSearchEngine = ({ onSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!query || query.length < 3) {
      setResults([]);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const res = await fetch(`${API_URL}/api/pyq-search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (data.success) {
          setResults(data.data);
        }
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setIsSearching(false);
      }
    }, 400); 

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  return (
    <div className="w-full relative mb-3">
      <input 
        type="text" 
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search 1,000+ PYQs (e.g. 'Ondaatje', 'Derrida', '2018')...." 
        className="w-full p-2.5 bg-white border border-fuchsia-300 focus:border-fuchsia-600 rounded font-mono text-xs outline-none shadow-inner" 
      />
      {isSearching && <div className="absolute right-3 top-3 text-[10px] text-fuchsia-500 font-bold animate-pulse">SEARCHING...</div>}
      
      {results.length > 0 && (
        <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-300 rounded shadow-xl max-h-60 overflow-y-auto z-50 custom-scrollbar divide-y divide-slate-100">
          {results.map((q) => (
            <div 
              key={q.id} 
              onClick={() => {
                onSelect(q); 
                setQuery(''); 
                setResults([]); 
              }}
              className="p-3 hover:bg-fuchsia-50 cursor-pointer transition-colors"
            >
              <div className="flex justify-between items-start mb-1">
                <span className="text-[10px] font-black bg-fuchsia-100 text-fuchsia-700 px-1.5 py-0.5 rounded">{q.year}</span>
                <span className="text-[9px] font-mono text-slate-400">{q.id}</span>
              </div>
              <p className="text-xs text-slate-800 font-medium mb-1 line-clamp-2">{q.text}</p>
              <p className="text-[10px] font-bold text-emerald-600 truncate">Ans: {q.answer}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ==========================================
// 2. THE ELITE ACADEMIC WEBVIEW ENGINE
// ==========================================
const getIframeDoc = (payload) => {
  if (!payload) return '';
  const trimmed = payload.trim();
  const isSvg = trimmed.toLowerCase().startsWith('<svg');

  const premiumCSS = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&family=Merriweather:wght@400;700&family=Fira+Code:wght@500&display=swap');
      
      :root {
        --bg-color: #f1f5f9;
        --card-bg: #ffffff;
        --text-main: #0f172a;
        --text-muted: #64748b;
        --accent: #4f46e5;
        --border: #e2e8f0;
      }
      * { box-sizing: border-box; }
      
      body { 
        margin: 0; padding: 2rem; min-height: 100vh; background: var(--bg-color);
        display: flex; justify-content: center; align-items: flex-start;
        font-family: 'Inter', system-ui, sans-serif; color: var(--text-main);
        line-height: 1.7; -webkit-font-smoothing: antialiased;
      }
      
      .nerdschool-canvas {
        background: var(--card-bg); width: 100%; max-width: 1200px;
        padding: 4rem 5rem; border-radius: 24px; margin-top: auto; margin-bottom: auto;
        box-shadow: 0 20px 40px -15px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.05);
      }
      
      h1, h2, h3, h4 { font-family: 'Inter', sans-serif; font-weight: 900; letter-spacing: -0.025em; color: #0f172a; margin-top: 0; }
      h1 { font-size: 2.5rem; border-bottom: 4px solid #e0e7ff; padding-bottom: 0.5rem; margin-bottom: 2rem; display: inline-block; }
      h2 { font-size: 1.75rem; color: #1e293b; border-left: 4px solid var(--accent); padding-left: 1rem; margin-top: 2rem; margin-bottom: 1rem; }
      p, ul, ol { font-size: 1.15rem; color: #334155; margin-bottom: 1.5rem; font-family: 'Merriweather', serif; }
      ul, ol { padding-left: 1.5rem; }
      li { margin-bottom: 0.75rem; padding-left: 0.5rem; }
      li::marker { color: var(--accent); font-weight: bold; }
      code { font-family: 'Fira Code', monospace; background: #f1f5f9; color: #db2777; padding: 0.2rem 0.4rem; border-radius: 6px; font-size: 0.9em; }
      pre { background: #0f172a; color: #f8fafc; padding: 1.5rem; border-radius: 12px; overflow-x: auto; box-shadow: inset 0 2px 4px rgba(0,0,0,0.5); margin-bottom: 2rem; }
      pre code { background: transparent; color: inherit; padding: 0; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 2rem; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
      th, td { padding: 1rem 1.5rem; text-align: left; border-bottom: 1px solid var(--border); font-size: 1.05rem; }
      th { background: #f8fafc; font-weight: 700; text-transform: uppercase; font-size: 0.85rem; letter-spacing: 0.05em; color: var(--text-muted); }
      tr:hover td { background: #f1f5f9; }
      .svg-wrapper { display: flex; justify-content: center; align-items: flex-start; width: 100%; min-height: 100%; }
      svg { max-width: 100%; height: auto !important; max-height: 85vh; filter: drop-shadow(0 15px 25px rgba(0,0,0,0.05)); }
      @media (max-width: 768px) {
        body { padding: 1rem; } .nerdschool-canvas { padding: 2rem; }
        h1 { font-size: 2rem; } p, ul, ol { font-size: 1rem; }
      }
    </style>
  `;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        ${premiumCSS}
      </head>
      <body>
        <div class="nerdschool-canvas">
          ${isSvg ? `<div class="svg-wrapper">${trimmed}</div>` : trimmed}
        </div>
      </body>
    </html>
  `;
};

// ==========================================
// 3. PYQ INTERACTIVE BLOCK
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

  if (loading) return <div className="p-10 text-center text-sm font-mono text-indigo-400 animate-pulse">Fetching Exam Intel from Cloud...</div>;
  if (!qData) return <div className="p-10 text-center text-sm font-mono text-slate-500">Failed to load question data.</div>;

  const options = [qData.Option_1, qData.Option_2, qData.Option_3, qData.Option_4].filter(Boolean);
  const correctIdx = parseInt(qData.Correct_Answer) - 1;

  const handleSelect = (idx) => {
    if (selectedOpt !== null) return;
    setSelectedOpt(idx);
    setShowExplanation(true);
  };

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
            <button key={i} onClick={() => handleSelect(i)} disabled={selectedOpt !== null} className={`w-full text-left px-6 py-4 rounded-xl border-2 text-base md:text-lg font-bold transition-all ${btnStyle} flex gap-4 items-center`}>
              <span className="font-black opacity-40 shrink-0">({i + 1})</span><span>{opt}</span>
            </button>
          );
        })}
      </div>
      {showExplanation && qData.Explanation && (
        <div className="p-6 bg-indigo-50 border border-indigo-200 rounded-xl animate-fade-in shadow-sm">
          <span className="text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2 mb-2">
            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span> Expert Analysis
          </span>
          <p className="text-base md:text-lg text-indigo-900 leading-relaxed font-medium">{qData.Explanation}</p>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 4. CUSTOM MCQ BLOCK
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


// ==========================================
// 5. MASTER TEACHING DASHBOARD
// ==========================================
export default function TeachingDashboard() {
  const [lessonData, setLessonData] = useState([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Whiteboard & Synapse State
  const [inputText, setInputText] = useState('');
  const [inputTarget, setInputTarget] = useState('stage'); 
  const [stageList, setStageList] = useState([]); 
  const [synapseNotes, setSynapseNotes] = useState([]); 
  const [liveLinkingCode, setLiveLinkingCode] = useState('NONE');
  
  // THEATER & CHROMA STATE
  const [showLMS, setShowLMS] = useState(true);
  const [showSynapse, setShowSynapse] = useState(true);
  const [chromaMode, setChromaMode] = useState(false);
  const [splitViewMode, setSplitViewMode] = useState(false); 
  const [isEditingCode, setIsEditingCode] = useState(false); 
  
  // Pentab Ink State
  const [isDrawMode, setIsDrawMode] = useState(false);
  const [strokes, setStrokes] = useState([]);
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const currentPath = useRef([]);

  // Overlays, Podcast & Sync State
  const [activeOverlay, setActiveOverlay] = useState(null);
  const [activePodcast, setActivePodcast] = useState(null); // 🔥 NEW PODCAST STATE
  const [overlayZoom, setOverlayZoom] = useState(1); 
  const [revealedCount, setRevealedCount] = useState(0);
  const [saveStatus, setSaveStatus] = useState('idle'); 

  // SPAWN FORM STATE
  const [isSpawning, setIsSpawning] = useState(false);
  const [spawnForm, setSpawnForm] = useState({ 
    paper_id: 'Introduction', 
    chapter_title: '', 
    index_title: '', 
    required_plan: 'Free',
    master_video: '',
    video_timestamp: ''
  });
  
  // CLASSWORK CREATOR STATE & MANAGER
  const [isClassworkCreatorOpen, setIsClassworkCreatorOpen] = useState(false);
  const [classworkViewMode, setClassworkViewMode] = useState('manage'); 
  const [classworkList, setClassworkList] = useState([]);
  const [editingClassworkId, setEditingClassworkId] = useState(null);
  
  const [classworkForm, setClassworkForm] = useState({
    title: '',
    required_plan: 'Free',
    mission_directive: 'Synthesize the concept below.',
    keywords: '',
    mnemonic_code: '',
    magic_paragraph: '',
    extractor_text: '',  
    expansion: ''
  });

  const [editingSlide, setEditingSlide] = useState(null); 
  const [collapsedLMS, setCollapsedLMS] = useState({}); 
  const [isMediaBayOpen, setIsMediaBayOpen] = useState(false);
  const [isAssetMenuOpen, setIsAssetMenuOpen] = useState(false); 
  
  const [newAsset, setNewAsset] = useState({ title: '', type: 'image', payload: '' });
  const [mcqForm, setMcqForm] = useState({ question: '', optA: '', optB: '', optC: '', optD: '', correct: 'A', explanation: '' });
  const [newPrePoint, setNewPrePoint] = useState('');

  const ACCESS_PLANS = [
    { value: 'Free', label: '🟢 Free / Unlocked' },
    { value: 'Mocktest', label: '🟡 Mocktest' },
    { value: 'Premium', label: '🔵 Premium' },
    { value: 'JRF 200 Advance', label: '🟣 JRF 200 Advance' }
  ];

  const hydrateCanvas = (stepObj) => {
    if (!stepObj || !stepObj.stage_payload) return [];
    try {
      const parsed = JSON.parse(stepObj.stage_payload);
      return Array.isArray(parsed) ? parsed : []; 
    } catch { return []; }
  };

  const hydrateSynapse = (stepObj) => {
    if (!stepObj || !stepObj.synapse_notes) return [];
    try {
      const parsed = JSON.parse(stepObj.synapse_notes);
      return Array.isArray(parsed) ? parsed : []; 
    } catch { return []; }
  };

  const fetchLessonBank = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_URL}/api/lesson-data`);
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        setLessonData(data.data);
        const safeIdx = activeIdx >= data.data.length ? Math.max(0, data.data.length - 1) : activeIdx;
        setActiveIdx(safeIdx);
        setStageList(hydrateCanvas(data.data[safeIdx]));
        setSynapseNotes(hydrateSynapse(data.data[safeIdx]));
        setLiveLinkingCode(data.data[safeIdx]?.linking_code || 'NONE');
        setLoading(false);
      } else {
        setLessonData([]);
        setError('No rows found in sheet. Create one.');
        setLoading(false);
      }
    } catch {
      setError('Could not connect to Node backend.');
      setLoading(false);
    }
  };

  const fetchClassworks = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_URL}/api/classwork`);
      const data = await res.json();
      if (data.success) setClassworkList(data.data);
    } catch (err) { console.error("Failed to fetch classworks", err); }
  };

  useEffect(() => { fetchLessonBank(); }, []);

  useEffect(() => {
    if (isClassworkCreatorOpen) fetchClassworks();
  }, [isClassworkCreatorOpen]);

  const stateRef = useRef();
  useEffect(() => {
    stateRef.current = { activeIdx, lessonData, revealedCount, activeOverlay, stageList, synapseNotes, liveLinkingCode };
  });

  const syncSlideChange = (targetIdx) => {
    if (targetIdx < 0 || targetIdx >= lessonData.length) return;
    const nextStep = lessonData[targetIdx] || {};
    
    setActiveIdx(targetIdx);
    setStageList(hydrateCanvas(nextStep)); 
    setSynapseNotes(hydrateSynapse(nextStep));
    setLiveLinkingCode(nextStep.linking_code || 'NONE');
    setRevealedCount(0);
    setActiveOverlay(null);
    setActivePodcast(null); // Clear podcast on slide change
    setOverlayZoom(1); 
    setIsSpawning(false);
    setIsMediaBayOpen(false);
    setIsClassworkCreatorOpen(false); 
    setIsAssetMenuOpen(false); 
    setEditingSlide(null);
    setStrokes([]); 
    setSaveStatus('idle');
  };

  const commitToCloud = async (overrideAssets = null) => {
    const { activeIdx, lessonData, stageList, liveLinkingCode, synapseNotes } = stateRef.current || {};
    const currentStep = lessonData[activeIdx] || {};
    if (!currentStep.step_id) return;

    setSaveStatus('saving');
    const macroTriggerPayload = overrideAssets !== null ? JSON.stringify(overrideAssets) : currentStep.macro_trigger;

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_URL}/api/save-slide-state`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          step_id: currentStep.step_id, 
          stageList, 
          linkingCode: liveLinkingCode, 
          macroTrigger: macroTriggerPayload,
          synapseNotes: synapseNotes,
          masterVideo: currentStep.master_video || '',
          videoTimestamp: currentStep.video_timestamp || ''
        })
      });
      const data = await res.json();
      if (data.success) {
        setSaveStatus('saved');
        lessonData[activeIdx].stage_payload = JSON.stringify(stageList);
        lessonData[activeIdx].linking_code = liveLinkingCode;
        lessonData[activeIdx].synapse_notes = JSON.stringify(synapseNotes);
        if (overrideAssets !== null) lessonData[activeIdx].macro_trigger = macroTriggerPayload;
        setLessonData([...lessonData]);
        setTimeout(() => setSaveStatus('idle'), 2500);
      } else setSaveStatus('error');
    } catch { setSaveStatus('error'); }
  };

  const updatePrePoints = async (newPointsArray) => {
    const currentStep = lessonData[activeIdx] || {};
    if (!currentStep.step_id) return;
    setSaveStatus('saving');
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_URL}/api/save-pre-points`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step_id: currentStep.step_id, pre_points: newPointsArray })
      });
      if ((await res.json()).success) {
        setSaveStatus('saved');
        lessonData[activeIdx].pre_points = newPointsArray; 
        setLessonData([...lessonData]); 
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else setSaveStatus('error');
    } catch { setSaveStatus('error'); }
  };

  const handleDeleteSlide = async (step_id) => {
    if (!window.confirm(`WARNING: Permanently delete Slide [${step_id}] from the cloud?`)) return;
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_URL}/api/delete-slide`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ step_id })
      });
      if ((await res.json()).success) fetchLessonBank();
    } catch { alert("Failed to delete slide."); }
  };

  const handleEditSlide = async () => {
    if (!editingSlide) return;
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_URL}/api/edit-slide-meta`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          step_id: editingSlide.step_id, 
          new_chapter: editingSlide.chapter_title, 
          new_title: editingSlide.index_title,
          required_plan: editingSlide.Required_Plan || 'Free',
          master_video: editingSlide.master_video || '',
          video_timestamp: editingSlide.video_timestamp || ''
        })
      });
      if ((await res.json()).success) {
        setEditingSlide(null);
        fetchLessonBank();
      }
    } catch { alert("Failed to edit slide metadata."); }
  };

  const handleSpawnSlide = async (e) => {
    e.preventDefault();
    if (!spawnForm.paper_id || !spawnForm.chapter_title || !spawnForm.index_title) return;
    setSaveStatus('saving');
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_URL}/api/create-slide`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(spawnForm)
      });
      const data = await res.json();
      if (data.success) {
        await fetchLessonBank();
        setIsSpawning(false); setSaveStatus('idle');
      }
    } catch { setSaveStatus('error'); }
  };

  const handleSaveClasswork = async (e) => {
    e.preventDefault();
    if (!classworkForm.title) return alert("Assignment Title is required!");
    setSaveStatus('saving');
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const endpoint = editingClassworkId ? '/api/edit-classwork' : '/api/create-classwork';
      const payload = editingClassworkId ? { id: editingClassworkId, ...classworkForm } : classworkForm;

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (data.success) {
        alert(`Classwork ${editingClassworkId ? 'Updated' : 'Assigned'} Successfully!`);
        setClassworkForm({ title: '', required_plan: 'Free', mission_directive: 'Synthesize the concept below.', keywords: '', mnemonic_code: '', magic_paragraph: '', extractor_text: '', expansion: '' });
        setEditingClassworkId(null);
        setClassworkViewMode('manage');
        fetchClassworks();
        setSaveStatus('idle');
      } else setSaveStatus('error');
    } catch { setSaveStatus('error'); }
  };

  const handleEditClassworkClick = (task) => {
    setClassworkForm({
      title: task.title || '',
      required_plan: task.required_plan || 'Free',
      mission_directive: task.mission_directive || task.instructions || '',
      keywords: task.keywords || '',
      mnemonic_code: task.mnemonic_code || '',
      magic_paragraph: task.magic_paragraph || '',
      extractor_text: task.extractor_text || '',
      expansion: task.expansion || ''
    });
    setEditingClassworkId(task.id);
    setClassworkViewMode('create');
  };

  const handleDeleteClasswork = async (id) => {
    if (!window.confirm("Permanently delete this assignment?")) return;
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_URL}/api/delete-classwork`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ assignmentId: id })
      });
      if ((await res.json()).success) fetchClassworks();
    } catch { alert("Failed to delete."); }
  };

  const getYoutubeId = (url) => {
    if(!url) return null;
    if (url.length === 11 && !url.includes('/') && !url.includes('?')) return url;
    const regExp = /^.*(youtu.be\/|live\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const currentStep = lessonData[activeIdx] || {};
  
  const safePrePoints = (() => {
    const p = currentStep.pre_points;
    if (!p) return [];
    if (Array.isArray(p)) return p;
    try { return JSON.parse(p); } catch { return []; }
  })();

  const currentAssets = (() => {
    if (!currentStep.macro_trigger || currentStep.macro_trigger === 'none') return [];
    try { 
      const parsed = JSON.parse(currentStep.macro_trigger); 
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  })();

  const handleAddAsset = () => {
    let finalPayload = newAsset.payload;

    if (newAsset.type === 'custom_mcq') {
      if (!newAsset.title) return alert("Please provide a Button Label for this MCQ!");
      if (!mcqForm.question || !mcqForm.optA || !mcqForm.optB || !mcqForm.optC || !mcqForm.optD) {
        return alert("Please fill out the question text and all 4 options!");
      }
      finalPayload = JSON.stringify(mcqForm);
    } else {
      if (!newAsset.title || !newAsset.payload) return alert("Title and Content/UID are required!");
    }

    const updatedAssets = [...currentAssets, { id: Date.now().toString(), title: newAsset.title, type: newAsset.type, payload: finalPayload }];
    commitToCloud(updatedAssets);
    
    setNewAsset({ title: '', type: 'image', payload: '' });
    setMcqForm({ question: '', optA: '', optB: '', optC: '', optD: '', correct: 'A', explanation: '' });
  };

  const handleRemoveAsset = (idToRemove) => {
    if (!window.confirm("Delete this media asset?")) return;
    const updatedAssets = currentAssets.filter(a => a.id !== idToRemove);
    commitToCloud(updatedAssets);
    if (activeOverlay === idToRemove) setActiveOverlay(null);
    if (activePodcast === idToRemove) setActivePodcast(null);
  };

  const groupedLMS = lessonData.reduce((acc, slide, idx) => {
    if (!acc[slide.paper_id]) acc[slide.paper_id] = {};
    if (!acc[slide.paper_id][slide.chapter_title]) acc[slide.paper_id][slide.chapter_title] = [];
    acc[slide.paper_id][slide.chapter_title].push({ ...slide, originalIndex: idx });
    return acc;
  }, {});

  const toggleLMS = (key) => setCollapsedLMS(p => ({ ...p, [key]: !p[key] }));

  const getAssetIcon = (type) => {
    return type === 'podcast' ? '🎧' : type === 'svg' ? '🧬' : type === 'youtube' ? '▶️' : type === 'question' ? '❓' : type === 'custom_mcq' ? '📝' : type === 'code' ? '💻' : type === 'mnemonic' ? '🧠' : '🖼️';
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); commitToCloud(); return; }
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;

      const { activeIdx, lessonData, revealedCount } = stateRef.current || {};
      const totalPoints = safePrePoints.length;

      if (e.key === 'F10') { e.preventDefault(); setChromaMode(prev => !prev); }
      if (e.key === 'F9') { e.preventDefault(); setShowLMS(prev => !prev); }
      if (e.key === 'F8') { e.preventDefault(); setShowSynapse(prev => !prev); }
      if (e.key === 'ArrowRight') syncSlideChange(activeIdx + 1);
      if (e.key === 'ArrowLeft') syncSlideChange(activeIdx - 1);
      
      if (e.key === 'Escape') { 
        setActiveOverlay(null); 
        // Notice we do NOT clear activePodcast here, so it keeps playing!
        setOverlayZoom(1);
        setIsSpawning(false); 
        setIsMediaBayOpen(false); 
        setIsClassworkCreatorOpen(false); 
        setIsAssetMenuOpen(false); 
        setEditingSlide(null); 
        setIsDrawMode(false); 
      }
      
      if (e.key === ' ') {
        e.preventDefault(); 
        if (revealedCount < totalPoints) setRevealedCount(prev => prev + 1);
        else syncSlideChange(activeIdx + 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lessonData]); 

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = chromaMode ? '#00e5ff' : '#4f46e5';

    strokes.forEach(stroke => {
      if (stroke.path.length === 0) return;
      ctx.beginPath();
      ctx.moveTo(stroke.path[0].x * canvas.width, stroke.path[0].y * canvas.height);
      for (let i = 1; i < stroke.path.length; i++) {
        ctx.lineTo(stroke.path[i].x * canvas.width, stroke.path[i].y * canvas.height);
      }
      ctx.stroke();
    });
  }, [strokes, activeIdx, showLMS, showSynapse, chromaMode, splitViewMode, isEditingCode]);

  const handlePointerDown = (e) => {
    if (!isDrawMode) return;
    isDrawing.current = true;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;
    
    currentPath.current = [{ x: nx, y: ny }];
    
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(nx * canvas.width, ny * canvas.height);
  };

  const handlePointerMove = (e) => {
    if (!isDrawing.current || !isDrawMode) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;
    
    currentPath.current.push({ x: nx, y: ny });
    
    const ctx = canvas.getContext('2d');
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = chromaMode ? '#00e5ff' : '#4f46e5';
    ctx.lineTo(nx * canvas.width, ny * canvas.height);
    ctx.stroke();
  };

  const handlePointerUp = () => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    if (currentPath.current.length > 0) {
      setStrokes(prev => [...prev, { path: currentPath.current }]);
    }
    currentPath.current = [];
  };

  const handlePushText = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    if (inputTarget === 'stage') setStageList(prev => [...prev, inputText]);
    else setSynapseNotes(prev => [...prev, inputText]);
    setInputText(''); 
  };

  const handleAutoResize = (e) => {
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  };

  if (loading) return <div className="h-screen w-full bg-slate-50 text-indigo-600 flex items-center justify-center font-mono font-bold">BOOTING ELITE LIGHT COCKPIT...</div>;
  
  if (lessonData.length === 0) return (
    <div className="h-screen w-full bg-slate-900 flex items-center justify-center font-sans p-6 relative overflow-hidden">
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500 via-slate-900 to-slate-900"></div>
      <div className="bg-white p-10 rounded-3xl shadow-2xl max-w-lg w-full text-center relative z-10">
        <div className="text-5xl mb-4 animate-bounce">🚀</div>
        <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">System Initialized</h2>
        <form onSubmit={handleSpawnSlide} className="space-y-4 text-left">
          <div>
            <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Module Category</label>
            <input type="text" list="category-options" required value={spawnForm.paper_id} onChange={e => setSpawnForm({...spawnForm, paper_id: e.target.value})} className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm text-slate-800 outline-none focus:border-indigo-600" />
            <datalist id="category-options"><option value="Introduction" /><option value="Paper 1" /><option value="Paper 2" /><option value="Orientation" /><option value="Strategy" /></datalist>
          </div>
          <div><label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Module / Chapter Name</label><input type="text" required placeholder="e.g. Orientation" value={spawnForm.chapter_title} onChange={e => setSpawnForm({...spawnForm, chapter_title: e.target.value})} className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm text-slate-800 outline-none focus:border-indigo-600" /></div>
          <div><label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Slide Heading</label><input type="text" required placeholder="e.g. Welcome to NerdSchool" value={spawnForm.index_title} onChange={e => setSpawnForm({...spawnForm, index_title: e.target.value})} className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm text-slate-800 outline-none focus:border-indigo-600" /></div>
          
          <div>
            <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Access Plan Required</label>
            <select value={spawnForm.required_plan} onChange={e => setSpawnForm({...spawnForm, required_plan: e.target.value})} className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm text-slate-800 outline-none focus:border-indigo-600">
              {ACCESS_PLANS.map(plan => <option key={plan.value} value={plan.value}>{plan.label}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">YouTube Master VOD</label>
              <input type="text" placeholder="Paste YouTube Link" value={spawnForm.master_video} onChange={e => setSpawnForm({...spawnForm, master_video: e.target.value})} className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-800 outline-none focus:border-indigo-600" />
            </div>
            <div>
              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Timestamp</label>
              <input type="text" placeholder="1h2m3s" value={spawnForm.video_timestamp} onChange={e => setSpawnForm({...spawnForm, video_timestamp: e.target.value})} className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-sm text-indigo-700 outline-none focus:border-indigo-600 text-center" />
            </div>
          </div>
          
          <button type="submit" disabled={saveStatus === 'saving'} className="w-full mt-4 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-xl shadow-lg transition-all">{saveStatus === 'saving' ? 'SPAWNING...' : '⚡ CREATE GENESIS SLIDE'}</button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="h-screen w-full bg-white text-slate-900 flex flex-col overflow-hidden font-sans select-none relative">
      
      <div className="flex-1 flex overflow-hidden relative z-10">

        {/* ZONE 1: LMS NAVIGATOR (HIDES ON FULLSCREEN) */}
        <aside className={`bg-slate-50 border-r border-slate-200 flex flex-col z-20 transition-all duration-300 shrink-0 ${
          (!showLMS || splitViewMode) ? 'w-0 opacity-0 overflow-hidden border-none' : 'w-72 opacity-100'
        }`}>
          <div className="p-3 bg-slate-100/80 border-b border-slate-200 font-mono text-xs font-bold text-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>LMS INDEX</span>
              <span className="text-[10px] text-slate-400 font-normal">[{activeIdx + 1}/{lessonData.length}]</span>
            </div>
            <button 
              onClick={() => setSplitViewMode(true)} 
              className="px-2 py-1 text-[9px] font-black rounded border transition-colors bg-white hover:bg-slate-200 text-slate-600 border-slate-300 shadow-sm"
              title="Enter Fullscreen Focus Mode"
            >
              ◫ FULLSCREEN
            </button>
          </div>

          <div className="p-2 border-b border-slate-200 bg-white grid grid-cols-3 gap-1.5">
            <button onClick={() => { 
  // Get the current slide's data so we can pre-fill the Spawner Form!
  const currentSlide = lessonData[activeIdx] || {};
  setSpawnForm({
    paper_id: currentSlide.paper_id || 'Introduction',
    chapter_title: currentSlide.chapter_title || '',
    index_title: '', // Leave the new slide title blank for typing
    required_plan: currentSlide.Required_Plan || currentSlide.required_plan || 'Free',
    master_video: currentSlide.master_video || '',
    video_timestamp: '' // Leave timestamp blank
  });
  setIsSpawning(true); 
  setIsMediaBayOpen(false); 
  setIsClassworkCreatorOpen(false); 
}} className="py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 rounded text-[10px] font-bold flex items-center justify-center gap-1 transition-all shadow-sm"><span>⚡</span> SLIDE</button>
            <button onClick={() => { setIsMediaBayOpen(true); setIsSpawning(false); setIsClassworkCreatorOpen(false); }} className="py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200/80 rounded text-[10px] font-bold flex items-center justify-center gap-1 transition-all shadow-sm"><span>⚙️</span> MEDIA</button>
            <button onClick={() => { setIsClassworkCreatorOpen(true); setIsSpawning(false); setIsMediaBayOpen(false); setClassworkViewMode('manage'); }} className="py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 rounded text-[10px] font-bold flex items-center justify-center gap-1 transition-all shadow-sm"><span>✍️</span> TASK</button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-3 custom-scrollbar">
            {Object.entries(groupedLMS).map(([paper, chapters]) => (
              <div key={paper} className="space-y-1">
                <div onClick={() => toggleLMS(paper)} className="font-black text-[10px] text-slate-700 uppercase bg-slate-200/70 hover:bg-slate-200 px-2 py-1.5 rounded cursor-pointer flex justify-between items-center border border-slate-200">
                  <span>{paper}</span><span className="text-slate-400">{collapsedLMS[paper] ? '▼' : '▲'}</span>
                </div>
                
                {!collapsedLMS[paper] && Object.entries(chapters).map(([chapter, slides]) => {
                  const chapKey = `${paper}-${chapter}`;
                  return (
                    <div key={chapter} className="pl-1.5 space-y-1">
                      <div onClick={() => toggleLMS(chapKey)} className="font-bold text-[10px] text-indigo-900/60 hover:text-indigo-900 uppercase py-1 border-b border-indigo-100/50 cursor-pointer flex justify-between items-center"><span className="truncate pr-2">{chapter}</span><span className="text-slate-300 text-[8px]">{collapsedLMS[chapKey] ? '▼' : '▲'}</span></div>
                      {!collapsedLMS[chapKey] && slides.map(slide => {
                        const isActive = slide.originalIndex === activeIdx && !isSpawning && !isMediaBayOpen && !isClassworkCreatorOpen;
                        
                        if (editingSlide?.step_id === slide.step_id) {
                          return (
                            <div key={slide.step_id} className="ml-2 p-2 bg-indigo-50 border border-indigo-200 rounded-md shadow-sm mb-1">
                              <input type="text" value={editingSlide.chapter_title} onChange={e => setEditingSlide({...editingSlide, chapter_title: e.target.value})} className="w-full text-[10px] p-1 mb-1 border border-indigo-200 rounded outline-none" placeholder="Chapter Name" />
                              <input type="text" value={editingSlide.index_title} onChange={e => setEditingSlide({...editingSlide, index_title: e.target.value})} className="w-full text-[10px] p-1 mb-1 border border-indigo-200 rounded outline-none" placeholder="Slide Title" />
                              
                              <select 
                                value={editingSlide.Required_Plan || editingSlide.required_plan || 'Free'} 
                                onChange={e => setEditingSlide({...editingSlide, Required_Plan: e.target.value})} 
                                className="w-full text-[9px] font-bold p-1 mb-1 border border-indigo-200 rounded outline-none text-indigo-800"
                              >
                                {ACCESS_PLANS.map(plan => <option key={plan.value} value={plan.value}>{plan.label}</option>)}
                              </select>

                              <div className="flex gap-1 mb-1">
                                <input type="text" value={editingSlide.master_video || ''} onChange={e => setEditingSlide({...editingSlide, master_video: e.target.value})} className="flex-1 text-[9px] p-1 border border-indigo-200 rounded outline-none font-mono" placeholder="YouTube Link" />
                                <input type="text" value={editingSlide.video_timestamp || ''} onChange={e => setEditingSlide({...editingSlide, video_timestamp: e.target.value})} className="w-12 text-[9px] p-1 border border-indigo-200 rounded outline-none font-mono text-center font-bold" placeholder="0m0s" />
                              </div>

                              <div className="flex gap-1 mt-1">
                                <button onClick={() => setEditingSlide(null)} className="flex-1 text-[9px] bg-white border border-slate-200 rounded py-0.5 font-bold text-slate-500 hover:bg-slate-100">Cancel</button>
                                <button onClick={handleEditSlide} className="flex-1 text-[9px] bg-indigo-600 text-white rounded py-0.5 font-bold shadow-sm hover:bg-indigo-700">Save</button>
                              </div>
                            </div>
                          );
                        }

                        const isLocked = slide.Required_Plan && slide.Required_Plan.toLowerCase() !== 'free';

                        return (
                          <div key={slide.step_id} className="ml-2 flex items-center group relative">
                            <button onClick={() => syncSlideChange(slide.originalIndex)} className={`flex-1 text-left px-2 py-1.5 rounded font-mono text-xs transition-all flex items-center justify-between ${isActive ? 'bg-white text-indigo-600 font-bold shadow-sm border border-slate-200/80 z-10' : 'text-slate-500 hover:bg-slate-100/80 hover:text-slate-900'}`}>
                              <span className="truncate pr-4 flex items-center gap-1.5">
                                {isLocked && <span className="text-[8px] text-amber-500">🔒</span>}
                                {slide.master_video && <span className="text-[8px]">▶️</span>}
                                {slide.step_id} - {slide.index_title}
                              </span>
                              {isActive && <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse shrink-0" />}
                            </button>
                            <div className="absolute right-1 opacity-0 group-hover:opacity-100 flex items-center gap-1 bg-slate-50/90 pl-2 backdrop-blur-sm transition-opacity z-20"><button onClick={() => setEditingSlide(slide)} className="text-[10px] p-1 hover:bg-indigo-100 rounded text-indigo-500" title="Edit Meta">✏️</button><button onClick={() => handleDeleteSlide(slide.step_id)} className="text-[10px] p-1 hover:bg-rose-100 rounded text-rose-500" title="Delete Slide">🗑️</button></div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="p-2 bg-slate-100 border-t border-slate-200 text-[9px] font-mono text-center text-slate-400 font-semibold">
            [F10] CHROMA • [F9] INDEX • [F8] SYNAPSE
          </div>
        </aside>

        {/* ZONE 2: CENTER STAGE (THE WEBVIEW STUDIO) */}
        <main className={`flex-1 flex flex-col relative overflow-hidden transition-all duration-300 ${
          chromaMode ? 'bg-[#00FF00]' : 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950'
        } ${splitViewMode ? 'p-0' : 'p-4 md:p-6'}`}>
          
          <div className="w-full h-full flex flex-col relative">

            {/* FORMS OR STUDIO */}
            {isSpawning ? (
              <div className="flex-1 flex flex-col items-center justify-center w-full max-w-lg mx-auto py-2 relative z-50">
                <h2 className="text-xl font-black text-white mb-6 tracking-tight uppercase flex items-center gap-2"><span className="text-indigo-400">⚡</span> Spawn Sequential Slide</h2>
                <form onSubmit={handleSpawnSlide} className="w-full space-y-4 text-left bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-2xl">
                  <div>
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Module Category (Select or Type New)</label>
                    <input type="text" list="category-options" required value={spawnForm.paper_id} onChange={e => setSpawnForm({...spawnForm, paper_id: e.target.value})} className="w-full mt-1 p-3 bg-slate-900 border border-slate-600 rounded-lg font-bold text-sm text-white outline-none focus:border-indigo-500" />
                  </div>
                  <div><label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Module / Chapter Name</label><input type="text" required placeholder="e.g. Ch 3: Literary Theory" value={spawnForm.chapter_title} onChange={e => setSpawnForm({...spawnForm, chapter_title: e.target.value})} className="w-full mt-1 p-3 bg-slate-900 border border-slate-600 rounded-lg font-bold text-sm text-white outline-none focus:border-indigo-500" /></div>
                  <div><label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Slide Heading (Topic Title)</label><input type="text" required placeholder="e.g. Derrida & Panopticism" value={spawnForm.index_title} onChange={e => setSpawnForm({...spawnForm, index_title: e.target.value})} className="w-full mt-1 p-3 bg-slate-900 border border-slate-600 rounded-lg font-bold text-sm text-white outline-none focus:border-indigo-500" /></div>
                  
                  <div>
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Required Plan (Gatekeeper)</label>
                    <select value={spawnForm.required_plan} onChange={e => setSpawnForm({...spawnForm, required_plan: e.target.value})} className="w-full mt-1 p-3 bg-slate-900 border border-slate-600 rounded-lg font-bold text-sm text-white outline-none focus:border-indigo-500">
                      {ACCESS_PLANS.map(plan => <option key={plan.value} value={plan.value}>{plan.label}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">YouTube Master VOD</label>
                      <input type="text" placeholder="Paste YouTube Link" value={spawnForm.master_video} onChange={e => setSpawnForm({...spawnForm, master_video: e.target.value})} className="w-full mt-1 p-3 bg-slate-900 border border-slate-600 rounded-lg font-mono text-xs text-white outline-none focus:border-indigo-500" />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Timestamp</label>
                      <input type="text" placeholder="1h2m3s" value={spawnForm.video_timestamp} onChange={e => setSpawnForm({...spawnForm, video_timestamp: e.target.value})} className="w-full mt-1 p-3 bg-slate-900 border border-slate-600 rounded-lg font-mono font-bold text-sm text-indigo-400 outline-none focus:border-indigo-500 text-center" />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4"><button type="button" onClick={() => setIsSpawning(false)} className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs rounded-lg border border-slate-600">CANCEL</button><button type="submit" disabled={saveStatus === 'saving'} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg shadow-md">{saveStatus === 'saving' ? 'SPAWNING...' : '🚀 COMMIT SLIDE'}</button></div>
                </form>
              </div>

            ) : isMediaBayOpen ? (
              <div className="flex-1 flex flex-col items-center justify-start w-full max-w-3xl mx-auto py-2 h-full overflow-y-auto custom-scrollbar relative z-50 text-left bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-2xl">
                <h2 className="text-xl font-black text-white mb-6 tracking-tight uppercase flex items-center gap-2"><span className="text-amber-500">⚙️</span> Director's Bay: Assets</h2>
                
                <div className="w-full mb-8">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">1. Queued Media & Live Question Assets</h3>
                  <div className="w-full flex flex-col gap-3 mb-4">
                    {currentAssets.map(asset => (
                      <div key={asset.id} className="bg-slate-800 border border-slate-700 p-3 rounded-xl shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <span className="text-2xl">
                            {getAssetIcon(asset.type)}
                          </span>
                          <span className="font-bold text-slate-200 text-sm truncate">{asset.title}</span>
                        </div>
                        <button onClick={() => handleRemoveAsset(asset.id)} className="text-rose-400 hover:bg-slate-700 px-3 py-1.5 rounded text-xs font-bold border border-rose-500/30">Delete</button>
                      </div>
                    ))}
                    {currentAssets.length === 0 && <div className="w-full text-center p-6 bg-slate-800 border border-dashed border-slate-700 rounded-xl text-slate-500 font-mono text-xs">No media or question assets queued yet.</div>}
                  </div>

                  <div className="w-full bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-sm text-left overflow-visible relative">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Button Label</label>
                        <input type="text" placeholder="e.g. Concept Check" value={newAsset.title} onChange={e => setNewAsset(prev => ({...prev, title: e.target.value}))} className="w-full mt-1 p-3 bg-slate-900 border border-slate-600 text-white rounded-lg font-bold text-xs outline-none focus:border-indigo-500" />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Asset Type</label>
                        <select value={newAsset.type} onChange={e => setNewAsset(prev => ({...prev, type: e.target.value, payload: ''}))} className="w-full mt-1 p-3 bg-slate-900 border border-slate-600 text-white rounded-lg font-bold text-xs outline-none focus:border-indigo-500">
                          <option value="image">🖼️ Image (.jpg/.png URL)</option>
                          <option value="svg">🧬 Raw HTML / SVG Code</option>
                          <option value="youtube">▶️ YouTube Video URL</option>
                          <option value="podcast">🎧 Audio Podcast (YouTube URL)</option>
                          <option value="mnemonic">🧠 Memory Hack / Mnemonic</option>
                          <option value="code">💻 Syntax / Code Block</option>
                          <option value="custom_mcq">📝 Custom MCQ Test</option>
                          <option value="question">❓ Live PYQ Search</option>
                        </select>
                      </div>
                    </div>
                    
                    {newAsset.type === 'custom_mcq' ? (
                      <div className="mb-4 space-y-3 bg-slate-900 p-5 rounded-xl border border-slate-700 shadow-sm">
                        <label className="text-[10px] font-mono font-bold text-indigo-400 uppercase">MCQ Builder</label>
                        <textarea placeholder="Type your Question here..." value={mcqForm.question} onChange={e => setMcqForm({...mcqForm, question: e.target.value})} rows="2" className="w-full p-3 bg-slate-800 text-white border border-slate-700 rounded-lg font-semibold text-sm outline-none focus:border-indigo-500" />
                        
                        <div className="grid grid-cols-2 gap-3 mt-2">
                          <input type="text" placeholder="Option A" value={mcqForm.optA} onChange={e => setMcqForm({...mcqForm, optA: e.target.value})} className="w-full p-3 bg-slate-800 text-white border border-slate-700 rounded-lg text-xs font-semibold outline-none focus:border-indigo-500" />
                          <input type="text" placeholder="Option B" value={mcqForm.optB} onChange={e => setMcqForm({...mcqForm, optB: e.target.value})} className="w-full p-3 bg-slate-800 text-white border border-slate-700 rounded-lg text-xs font-semibold outline-none focus:border-indigo-500" />
                          <input type="text" placeholder="Option C" value={mcqForm.optC} onChange={e => setMcqForm({...mcqForm, optC: e.target.value})} className="w-full p-3 bg-slate-800 text-white border border-slate-700 rounded-lg text-xs font-semibold outline-none focus:border-indigo-500" />
                          <input type="text" placeholder="Option D" value={mcqForm.optD} onChange={e => setMcqForm({...mcqForm, optD: e.target.value})} className="w-full p-3 bg-slate-800 text-white border border-slate-700 rounded-lg text-xs font-semibold outline-none focus:border-indigo-500" />
                        </div>

                        <div className="grid grid-cols-1 gap-3 mt-3 pt-3 border-t border-slate-700">
                          <div>
                            <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Correct Answer</label>
                            <select value={mcqForm.correct} onChange={e => setMcqForm({...mcqForm, correct: e.target.value})} className="w-full mt-1 p-3 bg-emerald-900/30 border border-emerald-500/50 text-emerald-400 rounded-lg font-bold text-xs outline-none focus:border-emerald-500">
                              <option value="A">Option A</option>
                              <option value="B">Option B</option>
                              <option value="C">Option C</option>
                              <option value="D">Option D</option>
                            </select>
                          </div>
                          <div className="col-span-1">
                            <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Explanation (Optional)</label>
                            <input type="text" placeholder="Why is this correct?" value={mcqForm.explanation} onChange={e => setMcqForm({...mcqForm, explanation: e.target.value})} className="w-full mt-1 p-3 bg-slate-800 text-white border border-slate-700 rounded-lg font-mono text-xs outline-none focus:border-indigo-500" />
                          </div>
                        </div>
                      </div>

                    ) : newAsset.type === 'question' ? (
                      <PyqSearchEngine onSelect={(qObj) => {
                        setNewAsset(prev => ({
                          ...prev, 
                          payload: qObj.id, 
                          title: prev.title || `PYQ: ${qObj.year}`
                        }));
                      }} />
                    ) : (
                      <textarea 
                        rows="4" 
                        placeholder={newAsset.type === 'mnemonic' ? "Type memory trick here..." : ['youtube', 'podcast'].includes(newAsset.type) ? "Paste YouTube URL here..." : "Paste URL or Code here..."} 
                        value={newAsset.payload} 
                        onChange={e => setNewAsset(prev => ({...prev, payload: e.target.value}))} 
                        className="w-full p-3 bg-slate-900 text-white border border-slate-600 rounded-lg font-mono text-xs outline-none focus:border-indigo-500 mb-4" 
                      />
                    )}

                    <button onClick={handleAddAsset} className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-sm rounded-xl shadow-sm transition-colors">➕ SAVE ASSET TO CLOUD</button>
                  </div>
                </div>

              </div>

            ) : isClassworkCreatorOpen ? (
              <div className="flex-1 flex flex-col items-center justify-start w-full max-w-4xl mx-auto py-2 h-full overflow-hidden relative z-50">
                <div className="w-full flex justify-between items-center mb-6 shrink-0">
                  <h2 className="text-xl font-black text-white tracking-tight uppercase flex items-center gap-2">
                    <span className="text-emerald-500">✍️</span> Synthesis Lab Manager
                  </h2>
                  <div className="flex bg-slate-800 rounded-lg p-1">
                    <button onClick={() => { setClassworkViewMode('manage'); setEditingClassworkId(null); setClassworkForm({ title: '', required_plan: 'Free', mission_directive: 'Synthesize the concept below.', keywords: '', mnemonic_code: '', magic_paragraph: '', extractor_text: '', expansion: '' }); }} className={`px-4 py-2 rounded-md text-xs font-bold uppercase transition-all ${classworkViewMode === 'manage' ? 'bg-slate-700 shadow-sm text-white' : 'text-slate-400 hover:text-slate-300'}`}>Manage List</button>
                    <button onClick={() => setClassworkViewMode('create')} className={`px-4 py-2 rounded-md text-xs font-bold uppercase transition-all ${classworkViewMode === 'create' ? 'bg-slate-700 shadow-sm text-emerald-400' : 'text-slate-400 hover:text-slate-300'}`}>{editingClassworkId ? 'Editing Mode' : 'Create New'}</button>
                  </div>
                </div>
                
                {classworkViewMode === 'manage' ? (
                  <div className="w-full flex-1 overflow-y-auto custom-scrollbar pr-2">
                    {classworkList.length === 0 ? <p className="text-slate-500 font-mono text-sm py-10 text-center">No active classwork. Go create one!</p> : (
                      <div className="grid grid-cols-1 gap-4">
                        {classworkList.map(task => (
                          <div key={task.id} className="bg-slate-800 border border-slate-700 p-5 rounded-2xl shadow-sm flex flex-col justify-between text-left hover:border-emerald-500/50 transition-colors">
                            <div className="mb-3">
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-900 px-2 py-1 rounded mr-2">{task.required_plan || 'Free'}</span>
                              <span className="font-bold text-white text-lg">{task.title}</span>
                            </div>
                            <div className="flex items-center justify-between w-full">
                              <div className="text-xs text-slate-400 font-medium truncate max-w-sm">{task.mission_directive || task.instructions}</div>
                              <div className="flex items-center gap-2 shrink-0">
                                <button onClick={() => handleEditClassworkClick(task)} className="px-4 py-1.5 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 font-bold text-xs rounded-lg border border-blue-500/30">Edit</button>
                                <button onClick={() => handleDeleteClasswork(task.id)} className="px-4 py-1.5 bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 font-bold text-xs rounded-lg border border-rose-500/30">Delete</button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleSaveClasswork} className="w-full flex-1 overflow-y-auto custom-scrollbar pr-2 text-left bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-inner space-y-4">
                    <div>
                      <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Assignment Title</label>
                      <input type="text" required placeholder="e.g. Explain Derrida's Différance" value={classworkForm.title} onChange={e => setClassworkForm({...classworkForm, title: e.target.value})} className="w-full mt-1 p-3 bg-slate-900 border border-slate-600 rounded-xl font-bold text-sm text-white outline-none focus:border-emerald-500" />
                    </div>

                    <div className="border-t border-slate-700 pt-4 mt-2">
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Premium HTML Sandbox (Webview)</label>
                      </div>
                      <textarea rows="4" placeholder="<div class='p-4 bg-blue-100 rounded'>Hello World</div>" value={classworkForm.magic_paragraph} onChange={e => setClassworkForm({...classworkForm, magic_paragraph: e.target.value})} className="w-full p-4 bg-[#0a0f1c] text-cyan-400 border border-slate-600 rounded-xl font-mono text-sm outline-none focus:border-emerald-500 custom-scrollbar" />
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-slate-700">
                      <button type="button" onClick={() => setIsClassworkCreatorOpen(false)} className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white font-black text-xs uppercase tracking-widest rounded-xl border border-slate-600 transition-colors">CANCEL</button>
                      <button type="submit" disabled={saveStatus === 'saving'} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-md transition-all">{saveStatus === 'saving' ? 'SAVING...' : editingClassworkId ? 'UPDATE' : 'CREATE'}</button>
                    </div>
                  </form>
                )}
              </div>

            ) : (
              <div className={`flex-1 flex flex-col relative overflow-hidden bg-slate-100 shadow-2xl transition-all duration-500 ${splitViewMode ? 'rounded-none border-none' : 'rounded-2xl border border-slate-300'}`}>
                 
                 {/* STUDIO HEADER */}
                 <div className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-[70] shadow-sm">
                   <div className="flex items-center gap-4">
                     {splitViewMode && (
                       <button onClick={() => { setSplitViewMode(false); setShowLMS(true); setShowSynapse(true); }} className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-[10px] font-black tracking-widest uppercase transition-colors shadow-sm flex items-center gap-2">
                         ◫ EXIT FULLSCREEN
                       </button>
                     )}
                     <div className="flex flex-col justify-center">
                       <h1 className="text-base font-black text-slate-800 tracking-tight leading-none mb-0.5">{currentStep.index_title || 'Untitled Module'}</h1>
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{currentStep.chapter_title}</span>
                     </div>
                   </div>
                   <div className="flex items-center gap-3">
                     <button onClick={() => commitToCloud()} disabled={saveStatus === 'saving'} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-sm border ${saveStatus === 'saved' ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-700'}`}>
                       {saveStatus === 'saving' ? 'SYNCING...' : saveStatus === 'saved' ? 'SAVED!' : '☁️ COMMIT SLIDE'}
                     </button>
                     <span className={`text-[10px] font-black tracking-widest px-3 py-1.5 rounded-lg uppercase shadow-sm border mx-2 ${isDrawMode ? 'bg-amber-400 text-amber-950 border-amber-500' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                       {isDrawMode ? '🖋️ INK ACTIVE' : '🖱️ SCROLL ACTIVE'}
                     </span>
                     <button onClick={() => setIsEditingCode(!isEditingCode)} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-sm border ${isEditingCode ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-slate-50 hover:bg-slate-200 text-slate-600 border-slate-300'}`}>
                       {isEditingCode ? '👁️ PREVIEW HTML' : '💻 EDIT HTML'}
                     </button>
                   </div>
                 </div>

                 {/* STUDIO CANVAS / WEBVIEW */}
                 <div className="flex-1 relative overflow-hidden bg-[#f1f5f9]">
                   {isEditingCode ? (
                     <textarea 
                       value={stageList.join('\n')}
                       onChange={(e) => setStageList([e.target.value])}
                       className="w-full h-full p-8 md:p-12 bg-[#0a0f1c] text-cyan-400 font-mono text-base md:text-lg outline-none resize-none custom-scrollbar leading-relaxed"
                       placeholder="Paste your raw HTML/Tailwind code here..."
                     />
                   ) : (
                     <>
                       <canvas 
                         ref={canvasRef}
                         width={1920}
                         height={1080}
                         className={`absolute inset-0 w-full h-full z-[60] ${isDrawMode ? 'touch-none cursor-crosshair' : ''}`}
                         style={{ pointerEvents: isDrawMode ? 'auto' : 'none' }}
                         onPointerDown={handlePointerDown}
                         onPointerMove={handlePointerMove}
                         onPointerUp={handlePointerUp}
                         onPointerLeave={handlePointerUp}
                       />
                       {(() => {
                         let htmlContent = '';
                         if (stageList.length > 0 && stageList.join('\n').trim() !== '' && !stageList.join('\n').trim().startsWith('[')) {
                           htmlContent = stageList.join('\n');
                         } else if (currentStep.stage_payload && currentStep.stage_payload.trim() !== '' && !currentStep.stage_payload.trim().startsWith('[')) {
                           htmlContent = currentStep.stage_payload;
                         }
                         
                         if (htmlContent) {
                           return (
                             <iframe 
                               srcDoc={getIframeDoc(htmlContent)} 
                               className="w-full h-full border-none bg-slate-50 custom-scrollbar" 
                               sandbox="allow-scripts allow-same-origin" 
                             />
                           );
                         } else {
                           return (
                             <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 font-mono">
                               <span className="text-6xl mb-6">🔮</span>
                               <span className="text-2xl font-bold text-slate-600 mb-2">Glass Canvas Ready</span>
                               <span className="text-sm text-slate-500 max-w-md text-center leading-relaxed">Click 💻 EDIT HTML to paste your content, then toggle INK ON to draw over it.</span>
                             </div>
                           );
                         }
                       })()}
                     </>
                   )}
                 </div>
              </div>
            )}

            {/* OVERLAY RENDERER (Visuals Only - Not Podcasts) */}
            {activeOverlay && (() => {
              const triggerAsset = currentAssets.find(a => a.id === activeOverlay);
              // Safety fallback
              if (!triggerAsset) return null;
              
              return (
                <div className="absolute inset-0 flex items-center justify-center z-[100] animate-fade-in pointer-events-none p-4">
                  <div className="w-[96vw] max-w-[1400px] h-[90vh] flex flex-col pointer-events-auto transition-all duration-300 shadow-[0_0_80px_rgba(0,0,0,0.8)] rounded-2xl overflow-hidden bg-slate-100/95 backdrop-blur-xl border border-slate-300">
                    
                    <div className="flex justify-between items-center px-6 py-3 border-b bg-white border-slate-200 shadow-sm shrink-0">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-md bg-slate-100 text-slate-500 border border-slate-200">{getAssetIcon(triggerAsset.type)} PRESENTATION MODE</span>
                        <span className="text-sm font-bold truncate max-w-md text-slate-800">{triggerAsset.title || 'Resource Viewing'}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {['image', 'svg'].includes(triggerAsset.type) && (
                          <div className="flex items-center rounded-lg border text-xs font-mono font-black shadow-sm overflow-hidden bg-slate-50 border-slate-300 text-slate-800">
                            <button onClick={() => setOverlayZoom(z => Math.max(0.5, Number((z - 0.25).toFixed(2))))} className="px-3 py-1 hover:bg-slate-200 transition-colors">−</button>
                            <span className="px-3 py-1 select-none text-[10px] min-w-12 text-center">{Math.round(overlayZoom * 100)}%</span>
                            <button onClick={() => setOverlayZoom(z => Math.min(4, Number((z + 0.25).toFixed(2))))} className="px-3 py-1 hover:bg-slate-200 transition-colors">+</button>
                            {overlayZoom !== 1 && <button onClick={() => setOverlayZoom(1)} className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] font-bold tracking-tighter uppercase transition-colors">FIT</button>}
                          </div>
                        )}
                        <button onClick={() => { setActiveOverlay(null); setOverlayZoom(1); }} className="font-bold px-5 py-1.5 rounded-lg text-xs shadow-sm transition-all bg-rose-500 hover:bg-rose-600 text-white border border-rose-600">EXIT PRESENTATION ✕</button>
                      </div>
                    </div>
                    
                    <div className="flex-1 w-full h-full overflow-y-auto custom-scrollbar flex flex-col p-4 md:p-8 relative bg-slate-200/50">
                      {triggerAsset.type === 'youtube' && getYoutubeId(triggerAsset.payload) ? (
                        <div className="my-auto mx-auto w-full max-w-7xl shrink-0 shadow-2xl rounded-2xl overflow-hidden border border-slate-800 bg-black aspect-video"><iframe className="w-full h-full" src={`https://www.youtube.com/embed/${getYoutubeId(triggerAsset.payload)}?autoplay=1`} frameBorder="0" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen /></div>
                      ) : triggerAsset.type === 'image' ? (
                        <div className="my-auto mx-auto shrink-0 transition-transform duration-200" style={{ transform: `scale(${overlayZoom})`, transformOrigin: 'top center' }}><img src={triggerAsset.payload} alt={triggerAsset.title} className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl border border-slate-300 bg-white" /></div>
                      ) : triggerAsset.type === 'question' ? (
                        <div className="my-auto mx-auto w-full max-w-5xl bg-white p-8 md:p-14 rounded-3xl shadow-2xl border border-slate-200 shrink-0"><PyqInteractiveBlock questionTarget={triggerAsset.payload} /></div>
                      ) : triggerAsset.type === 'custom_mcq' ? (
                        <div className="my-auto mx-auto w-full max-w-5xl bg-white p-8 md:p-14 rounded-3xl shadow-2xl border border-slate-200 shrink-0"><CustomMcqBlock mcqPayload={triggerAsset.payload} /></div>
                      ) : triggerAsset.type === 'svg' ? (
                        <div className="my-auto mx-auto w-full max-w-6xl flex flex-col shrink-0 transition-transform" style={{ transform: `scale(${overlayZoom})`, transformOrigin: 'top center' }}>
                           <div className="w-full min-h-[80vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-300 overflow-hidden">
                             <div className="w-full h-10 bg-slate-100 border-b border-slate-200 flex items-center px-5 shrink-0"><div className="flex gap-2"><div className="w-3 h-3 rounded-full bg-rose-400"></div><div className="w-3 h-3 rounded-full bg-amber-400"></div><div className="w-3 h-3 rounded-full bg-emerald-400"></div></div><span className="ml-5 text-[11px] font-mono text-slate-400 font-bold uppercase tracking-widest">NerdSchool CodeWeb Canvas</span></div>
                             <iframe srcDoc={getIframeDoc(triggerAsset.payload)} className="w-full flex-1 min-h-[80vh] border-none bg-white" sandbox="allow-scripts allow-same-origin" />
                           </div>
                        </div>
                      ) : triggerAsset.type === 'mnemonic' ? (
                        <div className="my-auto mx-auto w-full max-w-5xl bg-gradient-to-br from-amber-400 to-orange-600 rounded-[3rem] p-12 md:p-20 shadow-2xl text-center relative overflow-hidden shrink-0">
                          <div className="absolute top-0 right-0 opacity-10 text-[250px] -mt-16 -mr-10 select-none pointer-events-none">🧠</div>
                          <h3 className="text-amber-100 font-black tracking-widest uppercase mb-6 text-xl drop-shadow-md">Memory Hack</h3>
                          <p className="text-4xl md:text-6xl font-black text-white leading-tight drop-shadow-xl">{triggerAsset.payload}</p>
                        </div>
                      ) : triggerAsset.type === 'code' ? (
                        <div className="my-auto mx-auto w-full max-w-5xl flex flex-col bg-[#0a0f1c] rounded-3xl shadow-2xl border border-slate-700 overflow-hidden shrink-0 max-h-[85vh]">
                            <div className="h-14 bg-slate-900 border-b border-slate-800 flex items-center px-6 shrink-0"><div className="flex gap-2"><div className="w-3.5 h-3.5 rounded-full bg-rose-500"></div><div className="w-3.5 h-3.5 rounded-full bg-amber-500"></div><div className="w-3.5 h-3.5 rounded-full bg-emerald-500"></div></div><span className="ml-6 font-mono text-sm text-slate-500 font-bold">syntax_expansion.sh</span></div>
                            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar"><pre className="font-mono text-cyan-400 text-xl md:text-2xl leading-relaxed tracking-wide whitespace-pre-wrap"><code>{triggerAsset.payload}</code></pre></div>
                        </div>
                      ) : <div className="my-auto mx-auto p-10 text-slate-500 font-mono">Unknown asset type.</div>}
                    </div>
                  </div>
                </div>
              );
            })()}

          </div>
        </main>

        {/* ZONE 3: SYNAPSE SIDEBAR (HIDES ON FULLSCREEN) */}
        <aside className={`bg-slate-900 border-l border-slate-800 flex flex-col z-10 shrink-0 transition-all duration-300 ${
          (!showSynapse || splitViewMode) ? 'w-0 opacity-0 overflow-hidden border-none' : 'w-80 opacity-100'
        }`}>
          <div className="p-4 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/80 backdrop-blur-sm z-10">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              Synapse & Resources
            </span>
            <span className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded text-[9px] font-bold">
              {currentAssets.length + synapseNotes.length + (liveLinkingCode !== 'NONE' ? 1 : 0) + (safePrePoints.length > 0 ? 1 : 0)}
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6 pb-12">
            
            {/* --- 0. ACTIVE RECALL ENGINE (PRE-POINTS) --- */}
            <div className="flex flex-col gap-2 pt-1 border-b border-slate-800 pb-5 mb-2">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-[9px] text-slate-500 font-bold uppercase tracking-widest pl-1 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span> Active Recall Engine
                </h4>
                <span className="text-[10px] font-black text-indigo-400">{revealedCount} / {safePrePoints.length}</span>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 shadow-inner flex flex-col">
                <div className="space-y-2 mb-3">
                  {safePrePoints.map((pt, i) => {
                    const isRevealed = i < revealedCount;
                    return (
                      <div key={i} onClick={() => !isRevealed && setRevealedCount(i + 1)} className={`p-2 rounded-md text-[10px] leading-snug transition-all duration-300 ${isRevealed ? 'bg-slate-800 border border-slate-700 text-white font-medium shadow-sm translate-x-0 opacity-100' : 'bg-slate-800/30 border border-slate-800/50 text-transparent cursor-pointer blur-[3px] hover:blur-[1px] -translate-x-1 opacity-60'}`}>
                        {pt}
                      </div>
                    );
                  })}
                  {safePrePoints.length === 0 && <div className="text-[9px] text-slate-600 font-mono italic px-1">No pre-points queued.</div>}
                </div>
                
                {revealedCount < safePrePoints.length && (
                  <button onClick={() => setRevealedCount(prev => prev + 1)} className="w-full py-1.5 border border-dashed border-indigo-500/30 rounded-lg text-indigo-400/80 hover:bg-indigo-500/10 font-bold text-[9px] uppercase tracking-widest transition-all mb-3">
                    Reveal Next [SPC]
                  </button>
                )}
                
                <form onSubmit={(e) => { e.preventDefault(); if (!newPrePoint.trim()) return; updatePrePoints([...safePrePoints, newPrePoint.trim()]); setNewPrePoint(''); }} className="mt-auto flex gap-1 border-t border-slate-800/80 pt-3">
                  <input type="text" value={newPrePoint} onChange={(e) => setNewPrePoint(e.target.value)} placeholder="Add point..." className="flex-1 bg-slate-900 border border-slate-700 px-2 py-1.5 rounded text-[10px] text-white outline-none focus:border-indigo-500 font-medium" />
                  <button type="submit" disabled={saveStatus === 'saving'} className="px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] rounded shadow-sm">+</button>
                </form>
              </div>
            </div>

            {/* --- 1. ACTIVE LINKING CODE --- */}
            {liveLinkingCode && liveLinkingCode !== 'NONE' && (
              <div className="flex flex-col gap-2">
                <h4 className="text-[9px] text-slate-500 font-bold uppercase tracking-widest pl-1 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> Active Linking Code
                </h4>
                <input type="text" value={liveLinkingCode} onChange={(e) => setLiveLinkingCode(e.target.value)} className="w-full text-center text-xl font-mono font-black text-indigo-400 tracking-wider bg-slate-950 rounded-xl p-3 border border-slate-800 shadow-inner outline-none focus:border-indigo-500" />
              </div>
            )}

            {/* --- 2. INTERACTIVE MEDIA SECTION --- */}
            {currentAssets.filter(a => ['youtube', 'podcast', 'question', 'custom_mcq', 'image', 'svg'].includes(a.type)).length > 0 && (
              <div className="flex flex-col gap-2">
                <h4 className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1 pl-1">Interactive Media</h4>
                {currentAssets.filter(a => ['youtube', 'podcast', 'question', 'custom_mcq', 'image', 'svg'].includes(a.type)).map(asset => (
                  <button key={asset.id} onClick={() => {
                    // Route podcasts to the new mini-player state, everything else to the overlay!
                    if (asset.type === 'podcast') {
                      setActivePodcast(activePodcast === asset.id ? null : asset.id);
                    } else {
                      setActiveOverlay(asset.id);
                    }
                  }} className={`w-full text-left p-3.5 border rounded-xl transition-all group flex items-start gap-3 shadow-sm hover:shadow-md ${(asset.type === 'podcast' ? activePodcast === asset.id : activeOverlay === asset.id) ? 'bg-indigo-900/30 border-indigo-500' : 'bg-slate-800/50 hover:bg-slate-800 border-slate-700 hover:border-indigo-500/50'}`}>
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
            {currentAssets.filter(a => a.type === 'mnemonic').length > 0 && (
              <div className="space-y-3">
                <h4 className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1 pl-1">Memory Hacks</h4>
                {currentAssets.filter(a => a.type === 'mnemonic').map(m => (
                  <div key={m.id} className="bg-amber-900/10 border border-amber-500/30 rounded-xl p-4 shadow-sm relative overflow-hidden group">
                     <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none transition-all group-hover:bg-amber-500/20"></div>
                     <h4 className="text-[10px] text-amber-500 font-black uppercase tracking-widest mb-2 flex items-center gap-1.5 relative z-10"><span className="text-sm">🧠</span> Trick</h4>
                     <p className="text-amber-100/90 text-sm font-semibold italic leading-relaxed relative z-10">{m.payload}</p>
                  </div>
                ))}
              </div>
            )}
            
            {/* --- 4. CORE DATA SECTION --- */}
            {currentAssets.filter(a => a.type === 'code').length > 0 && (
              <div className="space-y-3">
                <h4 className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1 pl-1">Core Data / Syntax</h4>
                {currentAssets.filter(a => a.type === 'code').map(c => (
                  <div key={c.id} className="bg-[#0f172a] border border-slate-700 rounded-xl p-4 shadow-sm relative group overflow-hidden">
                     <h4 className="text-[10px] text-cyan-400 font-black uppercase tracking-widest mb-2 flex items-center gap-1.5"><span className="text-sm">💻</span> Keyword Expansion</h4>
                     <div className="text-slate-300 font-mono text-xs whitespace-pre-wrap leading-relaxed custom-scrollbar overflow-x-auto">{c.payload}</div>
                  </div>
                ))}
              </div>
            )}

            {/* --- 5. TARGET SCRATCHPAD --- */}
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-800 mt-2">
              <h4 className="text-[9px] text-slate-500 font-bold uppercase tracking-widest pl-1 pt-2">Target Scratchpad</h4>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 shadow-inner space-y-3">
                {synapseNotes.map((note, i) => (
                  <div key={i} className="flex items-start gap-2 group">
                    <span className="text-amber-500 font-bold mt-0.5 text-[10px]">↳</span>
                    <textarea value={note} onChange={(e) => { const newNotes = [...synapseNotes]; newNotes[i] = e.target.value; setSynapseNotes(newNotes); }} onFocus={handleAutoResize} onInput={handleAutoResize} className="flex-1 bg-transparent text-slate-300 font-mono text-xs leading-relaxed resize-none overflow-hidden outline-none focus:bg-slate-800 p-1 rounded border border-transparent transition-colors" rows={1} />
                    <button onClick={() => setSynapseNotes(prev => prev.filter((_, idx) => idx !== i))} className="opacity-0 group-hover:opacity-100 text-rose-500 font-black px-1.5 py-0.5 hover:bg-rose-500/20 rounded text-[10px]">✕</button>
                  </div>
                ))}
                {synapseNotes.length === 0 && <div className="text-[10px] text-slate-600 font-mono italic">Scratchpad empty. Fire text from console.</div>}
                {synapseNotes.length > 0 && <button onClick={() => setSynapseNotes([])} className="mt-2 text-[9px] font-mono font-bold text-rose-400 self-end border border-rose-500/30 px-2.5 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 w-full transition-colors">CLEAR ALL</button>}
              </div>
            </div>

            {/* --- 6. EMPTY STATE --- */}
            {currentAssets.length === 0 && synapseNotes.length === 0 && (liveLinkingCode === 'NONE' || !liveLinkingCode) && safePrePoints.length === 0 && (
              <div className="text-center py-10 opacity-50">
                <span className="text-3xl block mb-2">📦</span>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Deck Empty</p>
              </div>
            )}

          </div>
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

      {/* ZONE 4: FOOTER CONSOLE */}
      <footer className="bg-white border-t border-slate-200 px-6 h-16 flex items-center justify-between gap-6 z-[100] relative shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-2">
          <button disabled={activeIdx === 0 || isSpawning || isMediaBayOpen || isClassworkCreatorOpen} onClick={() => syncSlideChange(activeIdx - 1)} className="px-4 py-2 bg-white hover:bg-slate-50 disabled:opacity-30 rounded-lg font-mono text-xs font-bold text-slate-700 border border-slate-300 shadow-sm">◄ PREV</button>
          <button disabled={activeIdx === lessonData.length - 1 || isSpawning || isMediaBayOpen || isClassworkCreatorOpen} onClick={() => syncSlideChange(activeIdx + 1)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-30 rounded-lg font-mono text-xs font-bold text-white shadow-sm">NEXT ►</button>
        </div>

        <form onSubmit={handlePushText} className="flex-1 max-w-2xl flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200/80">
          <div className="flex bg-white rounded-lg border border-slate-200 p-0.5 text-xs font-mono shadow-sm">
            <button type="button" onClick={() => setInputTarget('stage')} className={`px-3 py-1 rounded-md transition-all ${inputTarget === 'stage' ? 'bg-indigo-600 text-white font-black' : 'text-slate-500 hover:text-slate-900'}`}>STAGE</button>
            <button type="button" onClick={() => setInputTarget('linking')} className={`px-3 py-1 rounded-md transition-all ${inputTarget === 'linking' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-500 hover:text-slate-900'}`}>LINKING</button>
          </div>
          <input type="text" disabled={isSpawning || isMediaBayOpen || isClassworkCreatorOpen} value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder={`Type notes to push to ${inputTarget.toUpperCase()}...`} className="flex-1 bg-transparent border-none outline-none px-3 text-sm font-mono font-medium text-slate-900 placeholder:text-slate-400" />
          <button type="submit" disabled={isSpawning || isMediaBayOpen || isClassworkCreatorOpen} className="px-5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-mono text-xs font-bold rounded-lg transition-colors">FIRE ↵</button>
        </form>

        <div className="flex items-center gap-2 font-mono text-xs relative">
          <div className="flex border-r border-slate-300 pr-2 mr-1">
            <button onClick={() => setChromaMode(!chromaMode)} className={`whitespace-nowrap px-3 py-1.5 rounded-lg border font-black transition-all shadow-sm mr-2 ${chromaMode ? 'bg-[#00FF00] text-green-950 border-green-600 shadow-inner' : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700'}`}>{chromaMode ? '🟢 CHROMA: ON' : '🟢 CHROMA: OFF'}</button>
            <button onClick={() => setIsDrawMode(!isDrawMode)} className={`whitespace-nowrap px-3 py-1.5 rounded-lg border font-black transition-all shadow-sm ${isDrawMode ? 'bg-amber-400 text-amber-950 border-amber-500 shadow-inner' : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700'}`}>{isDrawMode ? '🖋️ INK: ON' : '🖋️ INK: OFF'}</button>
            {isDrawMode && strokes.length > 0 && <button onClick={() => setStrokes([])} className="ml-1 px-2 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg text-[10px] font-black">✕</button>}
          </div>

          {currentAssets.length > 0 && (
            <div className="relative">
              <button onClick={() => setIsAssetMenuOpen(!isAssetMenuOpen)} className={`whitespace-nowrap px-3 py-1.5 rounded-lg border font-black transition-all shadow-sm flex items-center gap-2 ${(activeOverlay || activePodcast) ? 'bg-slate-900 text-white border-slate-900 shadow-inner' : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700'}`}>{(activeOverlay || activePodcast) ? '🎬 MEDIA ACTIVE' : `📦 MEDIA (${currentAssets.length})`}<span className="text-[8px]">{isAssetMenuOpen ? '▼' : '▲'}</span></button>
              
              {isAssetMenuOpen && (
                <div className="absolute bottom-[calc(100%+12px)] right-0 w-64 bg-white border border-slate-200 rounded-xl shadow-2xl p-2 z-[110] flex flex-col gap-1 animate-fade-in">
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2 pb-1.5 border-b border-slate-100 mb-1">Queued Overlays</div>
                  {currentAssets.map(asset => (
                    <button key={asset.id} onClick={() => { 
                      if (asset.type === 'podcast') {
                        setActivePodcast(activePodcast === asset.id ? null : asset.id);
                      } else {
                        setActiveOverlay(activeOverlay === asset.id ? null : asset.id); 
                        setOverlayZoom(1); 
                      }
                      setIsAssetMenuOpen(false); 
                    }} className={`text-left px-3 py-2.5 rounded-lg font-bold text-xs transition-all flex items-center gap-2.5 ${(activeOverlay === asset.id || activePodcast === asset.id) ? 'bg-slate-900 text-white shadow-inner' : 'hover:bg-slate-50 text-slate-700'}`}><span className="text-sm shrink-0">{getAssetIcon(asset.type)}</span><span className="truncate leading-none pt-0.5">{asset.title}</span>{(activeOverlay === asset.id || activePodcast === asset.id) && <span className="ml-auto text-rose-400 text-[10px]">✕</span>}</button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}