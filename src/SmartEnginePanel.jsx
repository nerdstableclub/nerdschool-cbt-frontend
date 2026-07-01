import React, { useState, useEffect } from 'react';

// The canonical 20 NTA Syllabus strings
const SYLLABUS_UNITS = [
  "[P1] Unit-I: Teaching Aptitude", "[P1] Unit-II: Research Aptitude", "[P1] Unit-III: Comprehension",
  "[P1] Unit-IV: Communication", "[P1] Unit-V: Mathematical Reasoning and Aptitude", "[P1] Unit-VI: Logical Reasoning",
  "[P1] Unit-VII: Data Interpretation", "[P1] Unit-VIII: Information and Communication Technology (ICT)",
  "[P1] Unit-IX: People, Development and Environment", "[P1] Unit-X: Higher Education System",
  "[P2] Unit-I: Drama", "[P2] Unit-II: Poetry", "[P2] Unit-III: Fiction, short story",
  "[P2] Unit-IV: Non-Fictional Prose", "[P2] Unit-V: Language: Basic concepts, theories and pedagogy. English in Use.",
  "[P2] Unit-VI: English in India: history, evolution and futures", "[P2] Unit-VII: Cultural Studies",
  "[P2] Unit-VIII: Literary Criticism", "[P2] Unit-IX: Literary Theory post World War II",
  "[P2] Unit-X: Research Methods and Materials in English"
];

const SECTIONS = [
  "", "British Literature", "Literary Criticism, Theory and Culture", "Indian Writing in English",
  "American and World Literature", "Language and Linguistics", "Literary Research", "Reading Comprehension"
];

export default function SmartEnginePanel({ API_URL }) {
  const [activeTab, setActiveTab] = useState('quant'); // Defaulting to Tab D so you see the matrices instantly!
  const [dict, setDict] = useState({ macros: [], micros: [], concepts: [] });

  // =========================================================
  // STATE 1: YOUR EXACT 23-COLUMN MANUAL ENGINE
  // =========================================================
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedId, setLastSavedId] = useState(null);
  const [formData, setFormData] = useState({
    UID: '2009_JUNE_P2_Q01',
    Time_Index: 1,
    Exam_Session: '2009_June',
    Paper: 'P2',
    Syllabus_Unit: '[P2] Unit-I: Drama',
    Section: 'British Literature',
    Question_Text: '',
    Option_1: '', Option_2: '', Option_3: '', Option_4: '',
    Correct_Answer: '1',
    Question_Type: 'Standard_MCQ',
    Level: 'Moderate',
    Explanation: '',
    Entity_Macro: '', Entity_Micro: '', Entity_Concept: '',
    Chronology_Anchor: '',
    Overflow_Entities: '',
    Passage_Text: '',
    Question_Status: 'Active',
    Cognitive_Depth: 'Factual_Memory'
  });

  // =========================================================
  // STATE 2: AI BULK TRANSFORMER ENGINE
  // =========================================================
  const [bulkMeta, setBulkMeta] = useState({ session: '2004_Dec', paper: 'P2' });
  const [rawDump, setRawDump] = useState('');
  const [isAiParsing, setIsAiParsing] = useState(false);
  const [parsedRows, setParsedRows] = useState([]);
  const [isBulkCommitting, setIsBulkCommitting] = useState(false);

  // =========================================================
  // STATE 3: BANK INSPECTOR ENGINE
  // =========================================================
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSession, setSearchSession] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [inspectorRows, setInspectorRows] = useState([]);
  const [isUpdating, setIsUpdating] = useState(false);

  // =========================================================
  // STATE 4: QUANT SIMULATOR ENGINE (NEW)
  // =========================================================
  const [quantForm, setQuantForm] = useState({ trainEndYear: '2012', testYear: '2013', topK: '50', targetSection: 'All' });
  const [isSimulating, setIsSimulating] = useState(false);
  const [quantReport, setQuantReport] = useState(null);

  const fetchDictionary = () => {
    fetch(`${API_URL}/api/smart-dictionary`)
      .then(res => res.json())
      .then(data => setDict(data))
      .catch(err => console.error("Dict sync failed:", err));
  };

  useEffect(() => { fetchDictionary(); }, []);

  // --- TAB A HELPERS ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getNextUID = (currentUid) => {
    const match = currentUid.match(/(.*_Q)(\d+)$/);
    if (!match) return currentUid + "_NEXT";
    const prefix = match[1];
    const num = parseInt(match[2], 10) + 1;
    return `${prefix}${String(num).padStart(match[2].length, '0')}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.UID || !formData.Question_Text || !formData.Option_1 || !formData.Option_2) {
      alert("⚠️ UID, Question Text, and at least Options 1 & 2 are strictly required!");
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/smart-save`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        setLastSavedId(formData.UID);
        fetchDictionary(); 
        setFormData(prev => ({
          ...prev, UID: getNextUID(prev.UID), Question_Text: '',
          Option_1: '', Option_2: '', Option_3: '', Option_4: '', Explanation: '',
          Entity_Macro: '', Entity_Micro: '', Entity_Concept: '', Chronology_Anchor: '',
          Overflow_Entities: '', Passage_Text: ''
        }));
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else alert(`Save Error: ${data.error}`);
    } catch (err) { alert("Network failed while saving row!"); }
    setIsSaving(false);
  };

  // --- TAB B HELPERS ---
  const triggerAiParse = async () => {
    if (!rawDump.trim()) return alert("⚠️ Please paste the scraped exam text first!");
    setIsAiParsing(true); setParsedRows([]);
    try {
      const res = await fetch(`${API_URL}/api/ai-bulk-parse`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: rawDump, examSession: bulkMeta.session, paperType: bulkMeta.paper })
      });
      const data = await res.json();
      if (res.ok && data.questions) setParsedRows(data.questions);
      else alert(`AI Parsing Error: ${data.error || 'Invalid format'}`);
    } catch (err) { alert("Server connection timed out."); }
    setIsAiParsing(false);
  };

  const updateGridRow = (index, field, val) => {
    setParsedRows(prev => {
      const updated = [...prev]; updated[index] = { ...updated[index], [field]: val }; return updated;
    });
  };

  const commitBulkBatch = async () => {
    if (parsedRows.length === 0) return;
    setIsBulkCommitting(true);
    try {
      const cleanRows = parsedRows.map(({ AI_Confidence, ...rest }) => rest);
      const res = await fetch(`${API_URL}/api/smart-save-bulk`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rows: cleanRows })
      });
      if (res.ok) {
        alert(`🚀 Success! Committed ${cleanRows.length} questions!`);
        setParsedRows([]); setRawDump(''); fetchDictionary();
      } else alert("Bulk batch commit failed.");
    } catch (err) { alert("Network failed during upload."); }
    setIsBulkCommitting(false);
  };

  // --- TAB C HELPERS (SEARCH & EDIT) ---
  const executeSearch = async (e) => {
    if (e) e.preventDefault();
    setIsSearching(true); setInspectorRows([]);
    try {
      const p = new URLSearchParams();
      if (searchQuery.trim()) p.append('keyword', searchQuery.trim());
      if (searchSession.trim()) p.append('session', searchSession.trim());
      const res = await fetch(`${API_URL}/api/search-bank?${p.toString()}`);
      const data = await res.json();
      if (res.ok && data.questions) setInspectorRows(data.questions);
      else alert("Search query failed on server.");
    } catch (err) { alert("Network error during search."); }
    setIsSearching(false);
  };

  const updateInspectorCell = (idx, field, val) => {
    setInspectorRows(prev => {
      const u = [...prev]; u[idx] = { ...u[idx], [field]: val }; return u;
    });
  };

  const commitEditedInspectorRows = async () => {
    if (inspectorRows.length === 0) return;
    setIsUpdating(true);
    try {
      const res = await fetch(`${API_URL}/api/smart-save-bulk`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rows: inspectorRows })
      });
      if (res.ok) {
        alert(`🛡️ Successfully updated ${inspectorRows.length} live records in Google Sheets!`);
        fetchDictionary();
      } else alert("Push commit failed.");
    } catch (err) { alert("Network error during update."); }
    setIsUpdating(false);
  };

  // --- TAB D HELPERS (QUANT SIMULATOR) ---
  const runQuantSimulation = async (e) => {
    e.preventDefault();
    setIsSimulating(true);
    setQuantReport(null);
    try {
      const res = await fetch(`${API_URL}/api/run-backtest`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quantForm)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setQuantReport(data);
      } else {
        alert(data.error || "Simulation failed on server.");
      }
    } catch (err) {
      alert("Network error during simulation.");
    }
    setIsSimulating(false);
  };

  const flaggedCount = parsedRows.filter(r => r.AI_Confidence === 'FLAGGED_FOR_REVIEW').length;

  return (
    <div className="bg-slate-900 text-slate-100 p-6 md:p-10 rounded-3xl shadow-2xl border border-slate-800 max-w-[1500px] mx-auto animate-in fade-in duration-300">
      
      {/* MASTER TOP NAVIGATION BAR */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center border-b border-slate-800 pb-8 mb-8 gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-gradient-to-r from-amber-500 to-red-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">NerdSchool Archival Core</span>
            <span className="text-xs font-mono text-emerald-400">Widescreen UI Online</span>
          </div>
          <h1 className="text-3xl font-black text-white mt-2 tracking-tight">Time-Series Master Question Bank</h1>
          <p className="text-xs font-mono text-slate-400 mt-1">Target Sheet: <code className="text-purple-400">Past_Years_Data_Question_Bank</code></p>
        </div>

        {/* 4-WAY ENGINE TOGGLE SWITCHES */}
        <div className="bg-slate-950 p-1.5 rounded-2xl border border-slate-800 flex flex-wrap gap-2 w-full xl:w-auto">
          <button type="button" onClick={() => setActiveTab('single')} className={`flex-1 sm:flex-none px-5 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${activeTab === 'single' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
            ⚡ Speed Single-Form
          </button>
          <button type="button" onClick={() => setActiveTab('bulk')} className={`flex-1 sm:flex-none px-5 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${activeTab === 'bulk' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
            ✨ AI Bulk Map
          </button>
          <button type="button" onClick={() => setActiveTab('inspector')} className={`flex-1 sm:flex-none px-5 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${activeTab === 'inspector' ? 'bg-emerald-600 text-white shadow-lg ring-2 ring-emerald-400' : 'text-slate-400 hover:text-white'}`}>
            🔍 Bank Inspector
          </button>
          <button type="button" onClick={() => setActiveTab('quant')} className={`flex-1 sm:flex-none px-5 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${activeTab === 'quant' ? 'bg-gradient-to-r from-rose-600 to-orange-600 text-white shadow-lg ring-2 ring-rose-400' : 'text-slate-400 hover:text-white'}`}>
            📈 Quant Simulator
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB A: YOUR EXACT LEGACY MANUAL FORM (100% Verbatim) */}
      {/* ========================================================= */}
      {activeTab === 'single' && (
        <div className="bg-white text-slate-900 p-6 md:p-10 rounded-2xl shadow-xl border border-gray-200 max-w-5xl mx-auto animate-in fade-in duration-200">
          
          <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-6">
            <span className="text-xs font-black tracking-widest uppercase text-purple-800 bg-purple-100 px-3 py-1 rounded-full">Manual Precision Engine</span>
            {lastSavedId && <span className="text-xs font-mono font-bold bg-green-100 text-green-800 px-3 py-1 rounded-lg animate-bounce">🚀 Committed: {lastSavedId}</span>}
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* BOX 1: STICKY EXAM META */}
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 shadow-inner">
              <div className="text-xs font-black text-gray-400 uppercase tracking-wider mb-4">🔒 Sticky Exam Meta (Auto-retained for consecutive typing)</div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div><label className="block text-xs font-black text-gray-700 uppercase mb-1">Unique ID (UID)</label><input type="text" name="UID" value={formData.UID} onChange={handleChange} className="w-full p-2.5 bg-white border-2 border-purple-400 rounded-lg font-mono font-black text-purple-900 text-sm outline-none" /></div>
                <div><label className="block text-xs font-black text-gray-700 uppercase mb-1">Exam Session</label><input type="text" name="Exam_Session" value={formData.Exam_Session} onChange={handleChange} placeholder="e.g. 2009_June" className="w-full p-2.5 bg-white border border-gray-300 rounded-lg font-bold text-sm outline-none" /></div>
                <div><label className="block text-xs font-black text-gray-700 uppercase mb-1">Paper</label><select name="Paper" value={formData.Paper} onChange={handleChange} className="w-full p-2.5 bg-white border border-gray-300 rounded-lg font-bold text-sm outline-none"><option value="P1">Paper I (General)</option><option value="P2">Paper II (English)</option><option value="P3">Paper III (Old)</option></select></div>
                <div><label className="block text-xs font-black text-gray-700 uppercase mb-1">Time Index (Lag Sequence)</label><input type="number" name="Time_Index" value={formData.Time_Index} onChange={handleChange} className="w-full p-2.5 bg-white border border-gray-300 rounded-lg font-bold text-sm outline-none" /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div><label className="block text-xs font-black text-gray-700 uppercase mb-1">Official NTA Syllabus Unit</label><select name="Syllabus_Unit" value={formData.Syllabus_Unit} onChange={handleChange} className="w-full p-2.5 bg-white border border-gray-300 rounded-lg font-bold text-xs outline-none truncate">{SYLLABUS_UNITS.map(u => <option key={u} value={u}>{u}</option>)}</select></div>
                <div><label className="block text-xs font-black text-gray-700 uppercase mb-1">NerdSchool Section (Leave blank for P1)</label><select name="Section" value={formData.Section} onChange={handleChange} className="w-full p-2.5 bg-white border border-gray-300 rounded-lg font-bold text-xs outline-none">{SECTIONS.map(s => <option key={s} value={s}>{s || "-- Standard General Paper --"}</option>)}</select></div>
              </div>
            </div>

            {/* BOX 2: QUESTION & OPTIONS */}
            <div className="space-y-4">
              <div><label className="block text-xs font-black text-gray-800 uppercase tracking-wide mb-1">Question Prompt Text</label><textarea name="Question_Text" value={formData.Question_Text} onChange={handleChange} rows={4} placeholder="Type raw question..." className="w-full p-4 border-2 border-gray-300 rounded-xl font-mono text-sm focus:border-purple-600 outline-none shadow-sm" /></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100"><label className="block text-[11px] font-black text-blue-900 uppercase mb-1">Option 1</label><input type="text" name="Option_1" value={formData.Option_1} onChange={handleChange} className="w-full p-2 bg-white border rounded text-sm font-medium outline-none" /></div>
                <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100"><label className="block text-[11px] font-black text-blue-900 uppercase mb-1">Option 2</label><input type="text" name="Option_2" value={formData.Option_2} onChange={handleChange} className="w-full p-2 bg-white border rounded text-sm font-medium outline-none" /></div>
                <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100"><label className="block text-[11px] font-black text-blue-900 uppercase mb-1">Option 3</label><input type="text" name="Option_3" value={formData.Option_3} onChange={handleChange} className="w-full p-2 bg-white border rounded text-sm font-medium outline-none" /></div>
                <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100"><label className="block text-[11px] font-black text-blue-900 uppercase mb-1">Option 4</label><input type="text" name="Option_4" value={formData.Option_4} onChange={handleChange} className="w-full p-2 bg-white border rounded text-sm font-medium outline-none" /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
                <div><label className="block text-xs font-black text-green-700 uppercase mb-1">Correct Answer (Integer)</label><select name="Correct_Answer" value={formData.Correct_Answer} onChange={handleChange} className="w-full p-3 bg-green-50 border-2 border-green-500 text-green-900 rounded-xl font-black text-base outline-none"><option value="1">Option 1</option><option value="2">Option 2</option><option value="3">Option 3</option><option value="4">Option 4</option></select></div>
                <div><label className="block text-xs font-black text-gray-700 uppercase mb-1">Question Type</label><select name="Question_Type" value={formData.Question_Type} onChange={handleChange} className="w-full p-3 bg-white border border-gray-300 rounded-xl font-bold text-xs outline-none"><option value="Standard_MCQ">Standard MCQ</option><option value="Chronology">Chronology Order</option><option value="Match_Following">Match The Following</option><option value="Assertion_Reason">Assertion-Reason</option><option value="Comprehension">Reading Comprehension</option></select></div>
                <div><label className="block text-xs font-black text-gray-700 uppercase mb-1">Difficulty Level</label><select name="Level" value={formData.Level} onChange={handleChange} className="w-full p-3 bg-white border border-gray-300 rounded-xl font-bold text-xs outline-none"><option value="Easy">Easy</option><option value="Moderate">Moderate</option><option value="Difficult">Difficult</option></select></div>
                <div><label className="block text-xs font-black text-gray-700 uppercase mb-1">Cognitive Depth</label><select name="Cognitive_Depth" value={formData.Cognitive_Depth} onChange={handleChange} className="w-full p-3 bg-white border border-gray-300 rounded-xl font-bold text-xs outline-none"><option value="Factual_Memory">Factual Memory</option><option value="Conceptual_Deep">Conceptual Deep</option><option value="Analytical_Logic">Analytical Logic</option></select></div>
              </div>
            </div>

            {/* BOX 3: THE AI KNOWLEDGE GRAPH */}
            <div className="bg-purple-900 text-white p-6 rounded-2xl shadow-lg space-y-6">
              <div className="flex items-center justify-between border-b border-purple-700 pb-3"><span className="text-xs font-black uppercase tracking-widest text-purple-200">🧠 Asymmetric Graph Vectors (Select or Type New)</span><span className="text-[10px] bg-purple-800 px-2 py-1 rounded font-mono text-purple-300">Auto-learns on Submit</span></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div><label className="block text-xs font-black uppercase tracking-wider text-purple-200 mb-1">Entity Macro (Driver Author)</label><input list="macro-list" name="Entity_Macro" value={formData.Entity_Macro} onChange={handleChange} placeholder="Author..." className="w-full p-3 bg-purple-950 border border-purple-600 rounded-xl text-white font-bold text-sm outline-none" /></div>
                <div><label className="block text-xs font-black uppercase tracking-wider text-purple-200 mb-1">Entity Micro (Vessel Book/Work)</label><input list="micro-list" name="Entity_Micro" value={formData.Entity_Micro} onChange={handleChange} placeholder="Work..." className="w-full p-3 bg-purple-950 border border-purple-600 rounded-xl text-white font-bold text-sm outline-none" /></div>
                <div><label className="block text-xs font-black uppercase tracking-wider text-purple-200 mb-1">Entity Concept (Theory)</label><input list="concept-list" name="Entity_Concept" value={formData.Entity_Concept} onChange={handleChange} placeholder="Theory..." className="w-full p-3 bg-purple-950 border border-purple-600 rounded-xl text-white font-bold text-sm outline-none" /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                <div><label className="block text-xs font-black uppercase tracking-wider text-purple-200 mb-1">Chronology Anchor (Year)</label><input type="number" min="1000" max="2099" name="Chronology_Anchor" value={formData.Chronology_Anchor} onChange={handleChange} placeholder="e.g. 1817" className="w-full p-3 bg-purple-950 border border-purple-600 rounded-xl text-white font-mono font-bold text-sm outline-none" /></div>
                <div className="md:col-span-2"><label className="block text-xs font-black uppercase tracking-wider text-purple-200 mb-1">Overflow Entities (Backseat - Pipe Separated)</label><input type="text" name="Overflow_Entities" value={formData.Overflow_Entities} onChange={handleChange} placeholder="Wordsworth|Coleridge" className="w-full p-3 bg-purple-950 border border-purple-600 rounded-xl text-white font-mono text-sm outline-none" /></div>
              </div>
            </div>

            {/* BOX 4: EXPLANATION & PASSAGES */}
            <div className="space-y-4">
              <div><label className="block text-xs font-black text-gray-700 uppercase mb-1">Pedagogical Solution / Rationale</label><textarea name="Explanation" value={formData.Explanation} onChange={handleChange} rows={3} placeholder="Rationale..." className="w-full p-3 border border-gray-300 rounded-xl text-sm outline-none focus:border-purple-600" /></div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                <div className="md:col-span-3"><label className="block text-xs font-black text-gray-700 uppercase mb-1">Reading Passage Overflow (Paste full 300 words here if Q46)</label><input type="text" name="Passage_Text" value={formData.Passage_Text} onChange={handleChange} placeholder="[Or pointer tag: LINK: 2009_JUNE_P2_Q46]" className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-xs font-mono outline-none" /></div>
                <div><label className="block text-xs font-black text-gray-700 uppercase mb-1">Status</label><select name="Question_Status" value={formData.Question_Status} onChange={handleChange} className="w-full p-2.5 bg-white border border-gray-300 rounded-lg font-bold text-xs"><option value="Active">Active</option><option value="Dropped">Dropped (Bonus)</option><option value="Disputed">Disputed Key</option></select></div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-200 flex justify-end">
              <button type="submit" disabled={isSaving} className={`w-full md:w-auto px-16 py-5 rounded-2xl font-black text-xl text-white shadow-2xl transition-all ${isSaving ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-purple-700 to-blue-800 hover:scale-102 active:scale-98'}`}>
                {isSaving ? '⏳ Committing...' : '💾 Commit Row & Auto-Increment'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB B: AI BULK TRANSFORMER (SPACIOUS WORKBENCH) */}
      {/* ========================================================= */}
      {activeTab === 'bulk' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          
          <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div><label className="block text-xs font-black uppercase text-slate-400 mb-2">Target Exam Session</label><input type="text" value={bulkMeta.session} onChange={e => setBulkMeta(p => ({ ...p, session: e.target.value }))} className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl font-bold text-white font-mono outline-none text-sm" /></div>
              <div><label className="block text-xs font-black uppercase text-slate-400 mb-2">Paper Type</label><select value={bulkMeta.paper} onChange={e => setBulkMeta(p => ({ ...p, paper: e.target.value }))} className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl font-bold text-white outline-none text-sm"><option value="P1">Paper I</option><option value="P2">Paper II</option><option value="P3">Paper III</option></select></div>
              <div className="flex items-end"><button type="button" onClick={triggerAiParse} disabled={isAiParsing} className="w-full py-3.5 px-6 rounded-xl font-black text-sm uppercase tracking-wider text-white bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-600 shadow-xl transition-all">✨ Execute Bulk AI Map</button></div>
            </div>
            <div><textarea value={rawDump} onChange={e => setRawDump(e.target.value)} rows={6} placeholder="Paste raw exam copy here..." className="w-full p-4 bg-slate-900 border border-slate-800 rounded-xl font-mono text-xs text-slate-300 outline-none leading-relaxed" /></div>
          </div>

          {isAiParsing && <div className="bg-indigo-950/60 border border-indigo-500/30 p-8 rounded-2xl text-center space-y-3 animate-pulse"><div className="text-2xl">🧠</div><h3 className="text-lg font-black text-indigo-200">Enrichment in Progress (~15s)</h3></div>}

          {parsedRows.length > 0 && (
            <div className="space-y-6">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex justify-between items-center">
                <span className="text-emerald-400 font-mono text-sm font-bold">📦 Ready: {parsedRows.length} Rows</span>
                <button type="button" onClick={commitBulkBatch} disabled={isBulkCommitting} className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs uppercase tracking-widest shadow-xl">🚀 Batch Commit All</button>
              </div>

              {/* SPACIOUS WORKBENCH TABLE */}
              <div className="border border-slate-800 rounded-2xl overflow-hidden shadow-2xl bg-slate-950">
                <div className="overflow-x-auto max-h-[750px]">
                  <table className="w-full text-left border-collapse font-medium">
                    <thead className="bg-slate-900 text-slate-400 sticky top-0 z-10 uppercase font-black text-[11px] tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="p-4 w-40">Status / UID</th>
                        <th className="p-4 min-w-[340px]">Prompt Text</th>
                        <th className="p-4 w-24">Key</th>
                        <th className="p-4 w-48">Macro (Author)</th>
                        <th className="p-4 w-48">Micro (Work)</th>
                        <th className="p-4 w-28">Year</th>
                        <th className="p-4 min-w-[400px]">Cited Rationale</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-sm">
                      {parsedRows.map((row, idx) => {
                        const isFlagged = row.AI_Confidence === 'FLAGGED_FOR_REVIEW';
                        return (
                          <tr key={idx} className={isFlagged ? 'bg-amber-950/30' : 'hover:bg-slate-900/50'}>
                            <td className="p-4 font-mono align-top"><div className="font-bold text-white">{row.UID}</div>{isFlagged && <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-1.5 py-0.5 rounded mt-1 inline-block">⚠️ REVIEW</span>}</td>
                            <td className="p-3 align-top"><textarea rows={5} value={row.Question_Text} onChange={e => updateGridRow(idx, 'Question_Text', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-slate-100 outline-none focus:border-indigo-500 text-sm font-mono leading-relaxed resize-y" /></td>
                            <td className="p-3 align-top"><select value={row.Correct_Answer} onChange={e => updateGridRow(idx, 'Correct_Answer', e.target.value)} className="w-full bg-slate-900 border border-slate-700 font-mono font-bold text-amber-400 rounded-xl p-3"><option value="1">1 (A)</option><option value="2">2 (B)</option><option value="3">3 (C)</option><option value="4">4 (D)</option></select></td>
                            <td className="p-3 align-top"><input list="macro-list" value={row.Entity_Macro} onChange={e => updateGridRow(idx, 'Entity_Macro', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-purple-300 font-bold text-sm" /></td>
                            <td className="p-3 align-top"><input list="micro-list" value={row.Entity_Micro} onChange={e => updateGridRow(idx, 'Entity_Micro', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-indigo-300 font-bold text-sm" /></td>
                            <td className="p-3 align-top"><input type="text" value={row.Chronology_Anchor} onChange={e => updateGridRow(idx, 'Chronology_Anchor', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 font-mono text-center text-emerald-400 font-bold text-sm" /></td>
                            <td className="p-3 align-top"><textarea rows={5} value={row.Explanation} onChange={e => updateGridRow(idx, 'Explanation', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-slate-200 outline-none focus:border-indigo-500 text-sm leading-relaxed resize-y" /></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB C: CLOUD BANK INSPECTOR (SPACIOUS WORKBENCH) */}
      {/* ========================================================= */}
      {activeTab === 'inspector' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          
          <form onSubmit={executeSearch} className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
            <div className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
              <span>🔍 Deep Cloud Query Engine</span>
              <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded font-mono lowercase">pulls live from google sheets</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="block text-[11px] font-black uppercase text-slate-400 mb-1">Keyword / Author / Book / UID</label>
                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="e.g. Langland, Biographia Literaria, 2004_DEC..." className="w-full p-3.5 bg-slate-900 border border-slate-700 rounded-xl font-bold text-white text-sm outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-400 mb-1">Session Filter (Optional)</label>
                <input type="text" value={searchSession} onChange={e => setSearchSession(e.target.value)} placeholder="e.g. 2004_Dec" className="w-full p-3.5 bg-slate-900 border border-slate-700 rounded-xl font-bold text-white text-sm outline-none focus:border-emerald-500 font-mono" />
              </div>
              <div className="flex items-end">
                <button type="submit" disabled={isSearching} className="w-full py-3.5 px-6 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-black rounded-xl text-sm uppercase tracking-wider transition-all shadow-lg shadow-emerald-950 flex items-center justify-center gap-2">
                  {isSearching ? '⏳ Scanning Sheets...' : '🔍 Pull Cloud Rows'}
                </button>
              </div>
            </div>
          </form>

          {inspectorRows.length > 0 && (
            <div className="space-y-6">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-sm font-black px-4 py-2.5 rounded-xl">
                  📥 Retrieved: {inspectorRows.length} Matching Cloud Records
                </span>
                <button type="button" onClick={commitEditedInspectorRows} disabled={isUpdating} className={`w-full sm:w-auto px-10 py-4 rounded-xl font-black text-xs uppercase tracking-widest text-white shadow-xl transition-all ${isUpdating ? 'bg-slate-700 cursor-wait' : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95'}`}>
                  {isUpdating ? '⏳ Overwriting Cloud Cells...' : '💾 Push Edits to Google Sheets'}
                </button>
              </div>

              {/* SPACIOUS WORKBENCH TABLE */}
              <div className="border border-slate-800 rounded-2xl overflow-hidden shadow-2xl bg-slate-950">
                <div className="overflow-x-auto max-h-[750px]">
                  <table className="w-full text-left border-collapse font-medium">
                    <thead className="bg-slate-900 text-slate-400 sticky top-0 z-10 uppercase font-black text-[11px] tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="p-4 w-40">UID</th>
                        <th className="p-4 min-w-[340px]">Question Prompt</th>
                        <th className="p-4 w-24">Key</th>
                        <th className="p-4 w-48">Macro (Author)</th>
                        <th className="p-4 w-48">Micro (Work)</th>
                        <th className="p-4 w-28">Year</th>
                        <th className="p-4 min-w-[400px]">Academic Explanation</th>
                        <th className="p-4 w-32">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-sm">
                      {inspectorRows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/60 transition-colors">
                          <td className="p-4 font-mono font-bold text-purple-400 align-top">{row.UID}</td>
                          <td className="p-3 align-top"><textarea rows={5} value={row.Question_Text || ''} onChange={e => updateInspectorCell(idx, 'Question_Text', e.target.value)} className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-xl p-3 text-slate-100 outline-none text-sm font-mono leading-relaxed resize-y" /></td>
                          <td className="p-3 align-top"><select value={row.Correct_Answer || '1'} onChange={e => updateInspectorCell(idx, 'Correct_Answer', e.target.value)} className="w-full bg-slate-900 border border-slate-700 font-mono font-bold text-amber-400 rounded-xl p-3"><option value="1">1 (A)</option><option value="2">2 (B)</option><option value="3">3 (C)</option><option value="4">4 (D)</option></select></td>
                          <td className="p-3 align-top"><input list="macro-list" value={row.Entity_Macro || ''} onChange={e => updateInspectorCell(idx, 'Entity_Macro', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-purple-300 font-bold text-sm" /></td>
                          <td className="p-3 align-top"><input list="micro-list" value={row.Entity_Micro || ''} onChange={e => updateInspectorCell(idx, 'Entity_Micro', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-indigo-300 font-bold text-sm" /></td>
                          <td className="p-3 align-top"><input type="text" value={row.Chronology_Anchor || ''} onChange={e => updateInspectorCell(idx, 'Chronology_Anchor', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 font-mono text-center text-emerald-400 font-bold text-sm" /></td>
                          <td className="p-3 align-top"><textarea rows={5} value={row.Explanation || ''} onChange={e => updateInspectorCell(idx, 'Explanation', e.target.value)} className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-xl p-3 text-slate-200 outline-none text-sm leading-relaxed resize-y" /></td>
                          <td className="p-3 align-top"><select value={row.Question_Status || 'Active'} onChange={e => updateInspectorCell(idx, 'Question_Status', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-200"><option value="Active">Active</option><option value="Dropped">Dropped</option><option value="Disputed">Disputed</option></select></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {inspectorRows.length === 0 && !isSearching && (
            <div className="text-center py-20 border border-slate-800/60 rounded-2xl bg-slate-950/40 text-slate-500 text-sm font-mono">
              Enter a search keyword above to suck live cloud records onto your screen for editing.
            </div>
          )}

        </div>
      )}

      {/* ========================================================= */}
      {/* TAB D: QUANTITATIVE SIMULATOR (NEW) */}
      {/* ========================================================= */}
      {activeTab === 'quant' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          
          <form onSubmit={runQuantSimulation} className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
            <div className="text-xs font-black text-rose-400 uppercase tracking-widest flex items-center gap-2 mb-2">
              <span>🧮 Walk-Forward Backtester</span>
              <span className="text-[10px] bg-rose-950 text-rose-300 border border-rose-800 px-2 py-0.5 rounded font-mono">Bounded Elastic Drift Enabled</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-400 mb-2">Target Section</label>
                <select value={quantForm.targetSection} onChange={e => setQuantForm(p => ({ ...p, targetSection: e.target.value }))} className="w-full p-3.5 bg-slate-900 border border-slate-700 rounded-xl font-bold text-white text-sm outline-none focus:border-rose-500">
                  <option value="All">🌐 All (Global Stratified)</option>
                  <option value="British Literature">🇬🇧 British Literature</option>
                  <option value="Literary Criticism, Theory and Culture">🧠 Criticism & Theory</option>
                  <option value="Indian Writing in English">🇮🇳 Indian Writing</option>
                  <option value="Language and Linguistics">🗣️ Language & Linguistics</option>
                  <option value="American and World Literature">🌎 World Literature</option>
                  <option value="Literary Research">🔬 Literary Research</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-400 mb-2">Train End Year</label>
                <input type="number" value={quantForm.trainEndYear} onChange={e => setQuantForm(p => ({ ...p, trainEndYear: e.target.value }))} className="w-full p-3.5 bg-slate-900 border border-slate-700 rounded-xl font-bold text-white text-lg outline-none focus:border-rose-500 font-mono text-center" />
              </div>
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-400 mb-2">Target Vault</label>
                <input type="number" value={quantForm.testYear} onChange={e => setQuantForm(p => ({ ...p, testYear: e.target.value }))} className="w-full p-3.5 bg-slate-900 border-2 border-emerald-500/50 rounded-xl font-bold text-emerald-400 text-lg outline-none focus:border-emerald-500 font-mono text-center" />
              </div>
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-400 mb-2">Predictions</label>
                <select value={quantForm.topK} onChange={e => setQuantForm(p => ({ ...p, topK: e.target.value }))} className="w-full p-3.5 bg-slate-900 border border-slate-700 rounded-xl font-bold text-white outline-none focus:border-rose-500 text-center">
                  <option value="10">Top 10</option><option value="25">Top 25</option><option value="50">Top 50</option>
                </select>
              </div>
              <div className="flex items-end">
                <button type="submit" disabled={isSimulating} className={`w-full py-3.5 px-4 rounded-xl font-black text-sm uppercase tracking-wider text-white shadow-xl transition-all flex items-center justify-center gap-2 ${isSimulating ? 'bg-slate-800 text-slate-500 cursor-wait' : 'bg-gradient-to-r from-rose-600 to-orange-600 hover:opacity-95'}`}>
                  {isSimulating ? '⏳ Compiling...' : '🚀 Run'}
                </button>
              </div>
            </div>
          </form>

          {quantReport && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 flex flex-col items-center justify-center">
                  <div className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2">Vault Hits</div>
                  <div className="text-4xl font-black text-white font-mono">{quantReport.quantTelemetry.verifiedHits} <span className="text-lg text-slate-500">/ {quantReport.quantTelemetry.evaluatedTopK}</span></div>
                </div>
                <div className="bg-gradient-to-b from-emerald-900/40 to-slate-950 p-6 rounded-2xl border border-emerald-900/50 flex flex-col items-center justify-center shadow-lg shadow-emerald-900/20">
                  <div className="text-emerald-400/80 text-xs font-black uppercase tracking-widest mb-2">Empirical Precision</div>
                  <div className="text-5xl font-black text-emerald-400">{quantReport.quantTelemetry.empiricalPrecisionRate}</div>
                </div>
                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 flex flex-col items-center justify-center">
                  <div className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2">Sample Size (Q's)</div>
                  <div className="text-2xl font-black text-white font-mono">Train: {quantReport.sampleSizes.trainingBankRows}</div>
                  <div className="text-xs font-bold text-slate-500 mt-1">Vault: {quantReport.sampleSizes.vaultPaperRows}</div>
                </div>
              </div>

              <div className="border border-slate-800 rounded-2xl overflow-hidden shadow-2xl bg-slate-950">
                <div className="overflow-x-auto max-h-[700px]">
                  <table className="w-full text-left border-collapse font-medium">
                    <thead className="bg-slate-900 text-slate-400 sticky top-0 z-10 uppercase font-black text-[11px] tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="p-4 w-12 text-center">#</th>
                        <th className="p-4 min-w-[200px]">Entity Macro (Author)</th>
                        <th className="p-4 w-32 text-center">History (V)</th>
                        <th className="p-4 w-32 text-center">Last Seen</th>
                        <th className="p-4 w-32 text-center">Mean Gap (P)</th>
                        <th className="p-4 w-40 text-center">Quant Score</th>
                        <th className="p-4 min-w-[220px]">Regime Vector</th>
                        <th className="p-4 w-40 text-center">Vault Outcome</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-sm">
                      {quantReport.matrixLedger.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/60 transition-colors">
                          <td className="p-4 text-center text-slate-600 font-black">{idx + 1}</td>
                          <td className="p-4 font-bold text-purple-300">{row.author}</td>
                          <td className="p-4 text-center font-mono text-slate-300">{row.appearances}</td>
                          <td className="p-4 text-center font-mono text-slate-300">{row.lastSeenYear}</td>
                          <td className="p-4 text-center font-mono text-amber-200/70">{row.meanPeriodicity} yrs</td>
                          <td className="p-4 text-center font-mono font-black text-white text-lg">{row.finalQuantScore.toFixed(3)}</td>
                          <td className="p-4">
                            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${row.regimeStatus.includes('MAXIMUM') ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : row.regimeStatus.includes('DRIFT') ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-slate-800 text-slate-300 border border-slate-700'}`}>
                              {row.regimeStatus}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <span className={`font-black text-xs ${row.vaultOutcome.includes('HIT') ? 'text-emerald-400 bg-emerald-950/50 px-3 py-1.5 rounded-lg' : 'text-slate-500'}`}>
                              {row.vaultOutcome}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}
        </div>
      )}

      {/* SHARED DATALISTS */}
      <datalist id="macro-list">{dict.macros.map(m => <option key={m} value={m} />)}</datalist>
      <datalist id="micro-list">{dict.micros.map(m => <option key={m} value={m} />)}</datalist>
      <datalist id="concept-list">{dict.concepts.map(c => <option key={c} value={c} />)}</datalist>

    </div>
  );
}