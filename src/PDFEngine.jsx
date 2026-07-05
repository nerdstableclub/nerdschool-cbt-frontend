import React, { useState, useEffect } from 'react';

export default function PDFEngine({ user, onBack, onBackToCourse }) {
  const [pdfs, setPdfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePDF, setActivePDF] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Hierarchy & Filter States (Defaulting to 'All Folders' so they see everything!)
  const [activePaper, setActivePaper] = useState('All Folders');
  const [collapsedSections, setCollapsedSections] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchPDFs = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const res = await fetch(`${API_URL}/api/pdfs`);
        const data = await res.json();
        
        if (data.success && data.data && data.data.length > 0) {
          // CRASH-PROOF SANITIZER: Automatically filter out empty/trailing CSV rows!
          const validPdfs = data.data.filter(p => p && p.title && p.title.trim() !== '');
          
          setPdfs(validPdfs);
          
          // Default to 'All Folders' so all 20+ appear vertically without hiding!
          setActivePaper('All Folders');
          
          if (validPdfs.length > 0) {
            setActivePDF(validPdfs[0]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch PDFs:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPDFs();
  }, []);

  // BOUNCER LOGIC: Strictly for Premium, PDF, and JRF (including JRF 200 Advance)
  const canAccess = (item) => {
    if (!item) return false;
    const isPremiumItem = String(item.is_premium || '').toLowerCase() === 'true';
    if (!isPremiumItem) return true; // Free items are always accessible
    
    if (!user) return false;
    
    const userPlans = Array.isArray(user.plans) ? user.plans : 
                      typeof user.ActivePlans === 'string' ? user.ActivePlans.split(',').map(p => p.trim()) : 
                      typeof user.plans === 'string' ? user.plans.split(',').map(p => p.trim()) :
                      [];
                      
    return userPlans.some(p => {
      const lower = (p || '').toLowerCase();
      return lower.includes('premium') || 
             lower.includes('pdf') || 
             lower.includes('jrf');
    });
  };

  const isLocked = (item) => !canAccess(item);

  const toggleSection = (key) => {
    setCollapsedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center font-sans">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <div className="text-emerald-400 font-bold tracking-widest uppercase text-sm animate-pulse">Loading Study Materials...</div>
      </div>
    );
  }

  // Derived Data for the Dropdown Selector (Includes 'All Folders' option!)
  const uniquePapers = ['All Folders', ...new Set(pdfs.map(p => p.paper_name).filter(Boolean))];
  
  // Filter PDFs by selected folder AND search query
  const filteredPDFs = pdfs.filter(p => {
    const matchesPaper = activePaper === 'All Folders' || p.paper_name === activePaper;
    const titleText = (p.title || '').toLowerCase();
    const sectionText = (p.section_name || '').toLowerCase();
    const query = (searchQuery || '').toLowerCase();
    
    const matchesSearch = titleText.includes(query) || sectionText.includes(query);
    return matchesPaper && matchesSearch;
  });

  // Group the filtered PDFs by section / subfolder
  const sections = filteredPDFs.reduce((acc, pdf) => {
    const sec = pdf.section_name || 'General Notes';
    if (!acc[sec]) acc[sec] = [];
    acc[sec].push(pdf);
    return acc;
  }, {});

  return (
    <div className="h-screen w-full bg-slate-950 text-slate-200 flex flex-col font-sans overflow-hidden">
      
      {/* GLOBAL HEADER */}
      <header className="h-16 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between px-6 shrink-0 z-50 backdrop-blur-md relative">
        <div className="flex items-center gap-4">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors ${sidebarOpen ? 'bg-emerald-500/20 text-emerald-400' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}>☰</button>
          <div className="flex items-center gap-2">
            <span className="text-xl">📚</span>
            <h1 className="font-black tracking-widest uppercase text-emerald-400 hidden sm:block">PDF Study Vault</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-[10px] font-bold">
            <span>🛡️ View-Only Protected</span>
          </div>
          <button onClick={onBackToCourse || (() => window.history.back())} className="px-4 py-1.5 bg-emerald-900/50 hover:bg-emerald-800 text-emerald-300 text-xs font-bold rounded-md transition-colors border border-emerald-700/50">📺 Course Hub</button>
          <button onClick={onBack} className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-md transition-colors border border-slate-700">← Hub</button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT SIDEBAR: Folder & File Navigation */}
        <aside className={`bg-slate-900/90 backdrop-blur-md border-r border-slate-800 flex flex-col transition-all duration-300 shrink-0 z-40 relative ${sidebarOpen ? 'w-80 opacity-100' : 'w-0 opacity-0 overflow-hidden border-none'}`}>
          
          {/* LEVEL 1: SLEEK CATEGORY DROPDOWN (Perfect for 20+ Folders!) */}
          <div className="p-3 border-b border-slate-800 bg-slate-950/80 shrink-0">
            <label className="block text-[10px] font-black tracking-widest uppercase text-slate-400 mb-1.5 flex items-center justify-between">
              <span>📂 Filter By Folder:</span>
              <span className="text-emerald-400">{uniquePapers.length - 1} Categories</span>
            </label>
            <select 
              value={activePaper} 
              onChange={(e) => { setActivePaper(e.target.value); setSearchQuery(''); }}
              className="w-full bg-slate-900 border-2 border-slate-700 hover:border-emerald-500/50 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer shadow-inner"
            >
              {uniquePapers.map(paper => (
                <option key={paper} value={paper} className="bg-slate-900 text-white font-medium py-1">
                  {paper === 'All Folders' ? '🌐 All 20+ Folders (View Everything)' : `📁 ${paper}`}
                </option>
              ))}
            </select>
          </div>

          {/* SEARCH BAR */}
          <div className="p-3 border-b border-slate-800 bg-slate-900 shrink-0">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">🔍</span>
              <input 
                type="text" 
                placeholder="Search notes across all folders..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-xs font-medium text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* LEVEL 2 & 3: VERTICAL FOLDERS & PDF FILES */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
            {Object.keys(sections).length === 0 ? (
              <div className="text-center p-6 text-slate-500 text-xs font-medium">No study notes found.</div>
            ) : (
              Object.entries(sections).map(([section, items]) => {
                const isCollapsed = collapsedSections[section];
                
                return (
                  <div key={section} className="bg-slate-950/30 rounded-xl border border-slate-800/50 overflow-hidden">
                    {/* SECTION FOLDER HEADER */}
                    <button 
                      onClick={() => toggleSection(section)}
                      className="w-full text-left px-4 py-3 flex justify-between items-center hover:bg-slate-800/50 transition-colors"
                    >
                      <div className="flex flex-col min-w-0 pr-2">
                        <span className="font-bold text-[11px] text-slate-300 uppercase tracking-wider truncate">{section}</span>
                        <span className="text-[9px] text-slate-500 font-mono mt-0.5">{items.length} Files</span>
                      </div>
                      <span className="text-slate-600 text-[10px] bg-slate-800 w-5 h-5 flex items-center justify-center rounded-full shrink-0">
                        {isCollapsed ? '▼' : '▲'}
                      </span>
                    </button>

                    {/* PDF FILE LIST */}
                    {!isCollapsed && (
                      <div className="flex flex-col gap-1 p-2 bg-slate-900/50 border-t border-slate-800/50">
                        {items.map(pdf => {
                          const active = activePDF?.id === pdf.id;
                          const locked = isLocked(pdf);
                          
                          return (
                            <button 
                              key={pdf.id}
                              onClick={() => setActivePDF(pdf)}
                              className={`w-full text-left p-2.5 rounded-lg transition-all flex gap-3 group relative overflow-hidden ${
                                active ? 'bg-emerald-600 shadow-[0_0_15px_rgba(5,150,105,0.3)]' : 
                                'hover:bg-slate-800 border border-transparent hover:border-slate-700'
                              }`}
                            >
                              {active && <div className="absolute top-0 left-0 w-1 h-full bg-white"></div>}
                              
                              <div className={`w-8 h-8 rounded-md shrink-0 flex items-center justify-center text-[10px] shadow-inner ${active ? 'bg-white/20 text-white' : 'bg-slate-950 text-slate-400 group-hover:bg-slate-800'}`}>
                                {locked ? '🔒' : active ? '📖' : '📄'}
                              </div>
                              
                              <div className="flex flex-col min-w-0 justify-center flex-1">
                                <span className={`text-[11px] font-bold truncate ${active ? 'text-white' : locked ? 'text-slate-500' : 'text-slate-300'}`}>
                                  {pdf.title}
                                </span>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className={`text-[8px] font-black uppercase tracking-widest ${locked ? 'text-rose-500/70' : active ? 'text-emerald-200' : String(pdf.is_premium || '').toLowerCase() === 'true' ? 'text-amber-500' : 'text-emerald-500'}`}>
                                    {locked ? 'Restricted Access' : String(pdf.is_premium || '').toLowerCase() === 'true' ? 'Premium Vault' : 'Free Access'}
                                  </span>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* MAIN DOCUMENT VIEWER CANVAS */}
        <main className="flex-1 relative flex flex-col bg-slate-950 overflow-hidden p-4 md:p-6">
          
          {activePDF ? (
            <div className="w-full h-full flex flex-col rounded-2xl bg-slate-900/40 border border-slate-800/80 overflow-hidden shadow-2xl">
              
              {/* TOP TITLE BAR FOR ACTIVE DOCUMENT */}
              <div className="h-14 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-lg">📄</span>
                  <div className="flex flex-col min-w-0">
                    <h2 className="text-sm font-bold text-white truncate">{activePDF.title}</h2>
                    <span className="text-[10px] text-slate-400 font-medium truncate">{activePDF.paper_name} • {activePDF.section_name}</span>
                  </div>
                </div>
                
                {/* Status Badge */}
                <div className="shrink-0 ml-4">
                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${isLocked(activePDF) ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                    {isLocked(activePDF) ? '🔒 Locked' : '✅ Access Granted'}
                  </span>
                </div>
              </div>

              {/* PDF VIEWER OR RESTRICTED LOCK SCREEN */}
              <div className="flex-1 w-full h-full relative bg-slate-950 flex items-center justify-center overflow-hidden">
                {isLocked(activePDF) ? (
                  <div className="max-w-md w-full mx-auto p-8 bg-slate-900/90 border border-slate-800 rounded-3xl text-center shadow-2xl relative overflow-hidden m-4">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent"></div>
                    <div className="text-5xl mb-6 relative z-10">🛡️</div>
                    <h3 className="text-2xl font-black text-white mb-2 relative z-10">Study Vault Restricted</h3>
                    <p className="text-slate-400 font-medium text-xs md:text-sm mb-6 leading-relaxed relative z-10">
                      This PDF note is exclusive to <span className="text-emerald-400 font-bold">NerdSchool Premium</span> and <span className="text-emerald-400 font-bold">JRF 200 Advance</span> scholars. Your current plan does not include PDF study material access.
                    </p>
                    
                    <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 mb-6 text-left space-y-2 relative z-10">
                      <div className="text-[11px] font-bold text-slate-300 flex items-center gap-2">
                        <span className="text-emerald-400">✓</span> Unlock all 20+ Exclusive Chapter Notes
                      </div>
                      <div className="text-[11px] font-bold text-slate-300 flex items-center gap-2">
                        <span className="text-emerald-400">✓</span> Full Access to Paper I & Paper II Cheatsheets
                      </div>
                      <div className="text-[11px] font-bold text-slate-300 flex items-center gap-2">
                        <span className="text-emerald-400">✓</span> High-Resolution View-Only Vault Access
                      </div>
                    </div>

                    {/* 🔥 NEW: Direct redirect to Razorpay checkout! */}
                    <button 
                      onClick={() => {
                        window.open('https://pages.razorpay.com/ugc-net-english-complete-pdf', '_blank');
                      }}
                      className="w-full relative z-10 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm uppercase tracking-wider rounded-xl transition-all shadow-[0_0_25px_rgba(5,150,105,0.3)]"
                    >
                      Request Vault Access Now
                    </button>
                  </div>
                ) : (
                  <iframe 
                    src={activePDF.embed_url} 
                    className="w-full h-full border-0 bg-slate-900"
                    allow="autoplay"
                    title={activePDF.title}
                  />
                )}
              </div>

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full opacity-50 select-none">
              <span className="text-6xl mb-4">📚</span>
              <h2 className="text-xl font-bold text-slate-400">Select a document from the left to begin studying.</h2>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}