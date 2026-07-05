import React, { useState, useEffect } from 'react';

export default function PodcastEngine({ user, onBack, onBackToCourse }) {
  const [podcasts, setPodcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeEpisode, setActiveEpisode] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Hierarchy & Filter States
  const [activePaper, setActivePaper] = useState('');
  const [activeLanguage, setActiveLanguage] = useState('All'); // Language Toggle State
  const [collapsedSections, setCollapsedSections] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchPodcasts = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const res = await fetch(`${API_URL}/api/podcasts`);
        const data = await res.json();
        
        if (data.success && data.data && data.data.length > 0) {
          // CRASH-PROOF SANITIZER: Filter out empty/trailing CSV rows
          const validPodcasts = data.data.filter(p => p && p.title && p.title.trim() !== '');
          
          setPodcasts(validPodcasts);
          
          // Figure out the papers and set the first one as active
          const uniquePapers = [...new Set(validPodcasts.map(p => p.paper_name).filter(Boolean))];
          if (uniquePapers.length > 0) {
            setActivePaper(uniquePapers[0]);
          }
          
          if (validPodcasts.length > 0) {
            setActiveEpisode(validPodcasts[0]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch podcasts", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPodcasts();
  }, []);

  // 🔥 UPDATED BOUNCER LOGIC
  const hasPlan = (planName) => {
    if (!user || !user.plans) return false;
    
    // Ensure we handle both string and array formats defensively
    const userPlans = Array.isArray(user.plans) ? user.plans : 
                      typeof user.ActivePlans === 'string' ? user.ActivePlans.split(',').map(p => p.trim()) : 
                      typeof user.plans === 'string' ? user.plans.split(',').map(p => p.trim()) :
                      [];

    return userPlans.some(p => {
      const lower = (p || '').toLowerCase();
      return lower.includes(planName.toLowerCase()) || 
             lower.includes('premium') || 
             lower.includes('jrf');
    });
  };

  const isLocked = (pod) => {
    if (!pod) return false;
    const isPremiumItem = String(pod.is_premium || '').toLowerCase() === 'true';
    if (!isPremiumItem) return false; // Free items are never locked
    
    // Explicitly check for Podcast plan along with Premium/JRF
    return !hasPlan('podcast') && !hasPlan('premium') && !hasPlan('jrf');
  };

  const toggleSection = (key) => {
    setCollapsedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center font-sans">
        <div className="w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <div className="text-violet-400 font-bold tracking-widest uppercase text-sm animate-pulse">Tuning Frequencies...</div>
      </div>
    );
  }

  // Derived Data for the UI Hierarchy
  const uniquePapers = [...new Set(podcasts.map(p => p.paper_name).filter(Boolean))];
  
  // Dynamically extract all unique languages from the database!
  const uniqueLanguages = ['All', ...new Set(podcasts.map(p => p.language).filter(Boolean))];
  
  // Filter podcasts by active paper, selected language, AND search query
  const filteredPodcasts = podcasts.filter(p => {
    const matchesPaper = p.paper_name === activePaper;
    const matchesLanguage = activeLanguage === 'All' || p.language === activeLanguage;
    
    const titleText = (p.title || '').toLowerCase();
    const sectionText = (p.section_name || '').toLowerCase();
    const query = (searchQuery || '').toLowerCase();
    
    const matchesSearch = titleText.includes(query) || sectionText.includes(query);
    
    return matchesPaper && matchesLanguage && matchesSearch;
  });

  // Group the filtered podcasts by section
  const sections = filteredPodcasts.reduce((acc, pod) => {
    const sec = pod.section_name || 'Uncategorized';
    if (!acc[sec]) acc[sec] = [];
    acc[sec].push(pod);
    return acc;
  }, {});

  const activeThumb = activeEpisode?.youtube_id 
    ? `https://img.youtube.com/vi/${activeEpisode.youtube_id}/maxresdefault.jpg` 
    : 'https://via.placeholder.com/640x360/1e293b/4c1d95?text=NerdSchool+Audio';

  return (
    <div className="h-screen w-full bg-slate-950 text-slate-200 flex flex-col font-sans overflow-hidden">
      
      {/* GLOBAL HEADER */}
      <header className="h-16 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between px-6 shrink-0 z-50 backdrop-blur-md relative">
        <div className="flex items-center gap-4">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors ${sidebarOpen ? 'bg-violet-500/20 text-violet-400' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}>☰</button>
          <div className="flex items-center gap-2">
            <span className="text-xl">🎧</span>
            <h1 className="font-black tracking-widest uppercase text-violet-400 hidden sm:block">Audiobook Library</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onBackToCourse || (() => window.history.back())} className="px-4 py-1.5 bg-violet-900/50 hover:bg-violet-800 text-violet-300 text-xs font-bold rounded-md transition-colors border border-violet-700/50">📺 Course Hub</button>
          <button onClick={onBack} className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-md transition-colors border border-slate-700">← Hub</button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT SIDEBAR: Premium Navigation Hierarchy */}
        <aside className={`bg-slate-900/90 backdrop-blur-md border-r border-slate-800 flex flex-col transition-all duration-300 shrink-0 z-40 relative ${sidebarOpen ? 'w-80 opacity-100' : 'w-0 opacity-0 overflow-hidden border-none'}`}>
          
          {/* LEVEL 1: PAPER TABS */}
          <div className="p-3 border-b border-slate-800 bg-slate-950/50 overflow-x-auto custom-scrollbar flex gap-2 shrink-0">
            {uniquePapers.map(paper => (
              <button 
                key={paper}
                onClick={() => { setActivePaper(paper); setSearchQuery(''); }}
                className={`whitespace-nowrap px-4 py-2 rounded-lg text-[10px] font-black tracking-widest uppercase transition-all flex-1 ${
                  activePaper === paper 
                    ? 'bg-violet-600 text-white shadow-md' 
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {paper}
              </button>
            ))}
          </div>

          {/* LEVEL 1.5: DYNAMIC LANGUAGE TOGGLE BAR */}
          {uniqueLanguages.length > 1 && (
            <div className="px-3 py-2 border-b border-slate-800/80 bg-slate-950/30 flex gap-1.5 overflow-x-auto custom-scrollbar shrink-0">
              {uniqueLanguages.map(lang => (
                <button
                  key={lang}
                  onClick={() => setActiveLanguage(lang)}
                  className={`px-3 py-1 rounded-md text-[9px] font-black tracking-widest uppercase transition-all whitespace-nowrap ${
                    activeLanguage === lang
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {lang === 'All' ? '🌐 All Langs' : lang}
                </button>
              ))}
            </div>
          )}

          {/* SEARCH BAR */}
          <div className="p-3 border-b border-slate-800 bg-slate-900 shrink-0">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">🔍</span>
              <input 
                type="text" 
                placeholder="Search episodes..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-xs font-medium text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
          </div>

          {/* LEVEL 2 & 3: SECTIONS & EPISODES */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
            {Object.keys(sections).length === 0 ? (
              <div className="text-center p-6 text-slate-500 text-xs font-medium">No episodes found for this filter.</div>
            ) : (
              Object.entries(sections).map(([section, episodes]) => {
                const isCollapsed = collapsedSections[section];
                
                return (
                  <div key={section} className="bg-slate-950/30 rounded-xl border border-slate-800/50 overflow-hidden">
                    {/* SECTION FOLDER */}
                    <button 
                      onClick={() => toggleSection(section)}
                      className="w-full text-left px-4 py-3 flex justify-between items-center hover:bg-slate-800/50 transition-colors"
                    >
                      <div className="flex flex-col">
                        <span className="font-bold text-[11px] text-slate-300 uppercase tracking-wider">{section}</span>
                        <span className="text-[9px] text-slate-500 font-mono mt-0.5">{episodes.length} Episodes</span>
                      </div>
                      <span className="text-slate-600 text-[10px] bg-slate-800 w-5 h-5 flex items-center justify-center rounded-full">
                        {isCollapsed ? '▼' : '▲'}
                      </span>
                    </button>

                    {/* EPISODE LIST */}
                    {!isCollapsed && (
                      <div className="flex flex-col gap-1 p-2 bg-slate-900/50 border-t border-slate-800/50">
                        {episodes.map(ep => {
                          const active = activeEpisode?.id === ep.id;
                          const locked = isLocked(ep);
                          
                          return (
                            <button 
                              key={ep.id}
                              onClick={() => setActiveEpisode(ep)}
                              className={`w-full text-left p-2.5 rounded-lg transition-all flex gap-3 group relative overflow-hidden ${
                                active ? 'bg-violet-600 shadow-[0_0_15px_rgba(124,58,237,0.3)]' : 
                                'hover:bg-slate-800 border border-transparent hover:border-slate-700'
                              }`}
                            >
                              {active && <div className="absolute top-0 left-0 w-1 h-full bg-white"></div>}
                              
                              <div className={`w-8 h-8 rounded-md shrink-0 flex items-center justify-center text-[10px] shadow-inner ${active ? 'bg-white/20 text-white' : 'bg-slate-950 text-slate-400 group-hover:bg-slate-800'}`}>
                                {locked ? '🔒' : active ? '🔊' : '▶'}
                              </div>
                              
                              <div className="flex flex-col min-w-0 justify-center flex-1">
                                <span className={`text-[11px] font-bold truncate ${active ? 'text-white' : locked ? 'text-slate-500' : 'text-slate-300'}`}>
                                  {ep.title}
                                </span>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className={`text-[8px] font-black uppercase tracking-widest ${locked ? 'text-rose-500/70' : active ? 'text-violet-200' : String(ep.is_premium || '').toLowerCase() === 'true' ? 'text-amber-500' : 'text-emerald-500'}`}>
                                    {locked ? 'Restricted' : String(ep.is_premium || '').toLowerCase() === 'true' ? 'Premium' : 'Free Trial'}
                                  </span>
                                  {ep.language && (
                                    <>
                                      <span className="text-slate-600 text-[8px]">•</span>
                                      <span className={`text-[8px] font-bold uppercase tracking-widest ${active ? 'text-violet-300' : 'text-slate-500'}`}>
                                        {ep.language}
                                      </span>
                                    </>
                                  )}
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

        {/* MAIN PLAYER CANVAS */}
        <main className="flex-1 relative flex flex-col bg-slate-950 overflow-hidden">
          
          {/* Ambient Blurred Background (Spotify Style) */}
          {activeEpisode && (
            <>
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-30 blur-[100px] scale-125 transition-all duration-1000 ease-in-out" 
                style={{ backgroundImage: `url(${activeThumb})` }}
              ></div>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/30"></div>
            </>
          )}

          {activeEpisode ? (
            <div className="relative z-10 flex flex-col items-center justify-center w-full h-full p-6 md:p-12 overflow-y-auto custom-scrollbar">
              
              <div className="w-full max-w-4xl flex flex-col items-center text-center mb-10">
                {/* Cover Art Image */}
                <div className="w-48 h-48 md:w-64 md:h-64 rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.6)] border-4 border-white/10 overflow-hidden mb-8 relative group">
                  <img src={activeThumb} alt="Podcast Cover" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  {isLocked(activeEpisode) && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                      <span className="text-6xl drop-shadow-2xl">🔒</span>
                    </div>
                  )}
                </div>

                {/* Language Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-[10px] font-black uppercase tracking-widest mb-4 backdrop-blur-md">
                  <span>{activeEpisode.paper_name}</span> <span>•</span> <span>{activeEpisode.section_name || 'General'}</span>
                  {activeEpisode.language && (
                    <>
                      <span>•</span> <span className="text-violet-300">{activeEpisode.language}</span>
                    </>
                  )}
                </div>
                
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight mb-4 drop-shadow-lg max-w-3xl">
                  {activeEpisode.title}
                </h2>
                {activeEpisode.description && (
                  <p className="text-slate-300 font-medium text-sm md:text-base max-w-2xl leading-relaxed drop-shadow bg-slate-900/50 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
                    {activeEpisode.description}
                  </p>
                )}
              </div>

              {/* MEDIA PLAYER OR LOCK SCREEN */}
              <div className="w-full max-w-4xl mt-auto">
                {isLocked(activeEpisode) ? (
                  <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700 rounded-3xl p-10 text-center shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent"></div>
                    <div className="text-5xl mb-6 relative z-10">👑</div>
                    <h3 className="text-2xl font-black text-white mb-2 relative z-10">Premium Episode Locked</h3>
                    <p className="text-slate-400 font-medium mb-8 max-w-lg mx-auto relative z-10">
                      This audio chapter is exclusive to NerdSchool Premium & JRF members. Upgrade your account to unlock the full library.
                    </p>
                    
                    {/* 🔥 UPDATED: Direct redirect to the podcast checkout! */}
                    <button 
                      onClick={() => {
                        window.open('https://notes.ugcnetenglish.in/products/complete-podcast-package', '_blank');
                      }}
                      className="relative z-10 px-10 py-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-black text-lg rounded-xl transition-all hover:scale-105 shadow-[0_0_30px_rgba(245,158,11,0.3)]"
                    >
                      Unlock Full Access Now
                    </button>
                  </div>
                ) : (
                  <div className="bg-black rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-slate-800 ring-4 ring-white/5 aspect-video w-full">
                    {activeEpisode.youtube_id ? (
                      <iframe 
                        className="w-full h-full" 
                        src={`https://www.youtube.com/embed/${activeEpisode.youtube_id}?autoplay=1&rel=0`} 
                        frameBorder="0" 
                        allow="autoplay; encrypted-media" 
                        allowFullScreen 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-500 font-mono">
                        Audio source not available for this episode.
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="relative z-10 flex flex-col items-center justify-center h-full opacity-50 select-none">
              <span className="text-6xl mb-4">🎧</span>
              <h2 className="text-xl font-bold text-slate-400">Select an episode to begin playing.</h2>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}