import React, { useState, useEffect } from 'react';

export default function PyqEngine({ user, onBack, onBackToCourse }) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [availableQuestions, setAvailableQuestions] = useState([]);
  const [totalFound, setTotalFound] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);

  // Test State
  const [testMode, setTestMode] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [answers, setAnswers] = useState({}); // Stores user answers: { questionIndex: selectedOptionIndex }
  const [testFinished, setTestFinished] = useState(false);

  // Security & Trial State
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [searchesLeft, setSearchesLeft] = useState(3);

  // Check if student has unlimited JRF / Premium access
  const hasUnlimitedAccess = () => {
    if (!user) return false;
    const userPlans = Array.isArray(user.plans) ? user.plans : 
                      typeof user.ActivePlans === 'string' ? user.ActivePlans.split(',').map(p => p.trim()) : 
                      typeof user.plans === 'string' ? user.plans.split(',').map(p => p.trim()) :
                      [];
    return userPlans.some(p => {
      const lower = (p || '').toLowerCase();
      return lower.includes('premium') || lower.includes('jrf') || lower.includes('pyq');
    });
  };

  const isUnlimited = hasUnlimitedAccess();

  // Load remaining free searches from device memory on boot
  useEffect(() => {
    if (!isUnlimited) {
      const storageKey = `ns_pyq_trial_${user?.rollNumber || 'guest'}`;
      const savedCount = localStorage.getItem(storageKey);
      if (savedCount !== null) {
        setSearchesLeft(parseInt(savedCount, 10));
      } else {
        localStorage.setItem(storageKey, '3');
        setSearchesLeft(3);
      }
    }
  }, [user, isUnlimited]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    // BOUNCER CHECK: Block search if out of free trials!
    if (!isUnlimited && searchesLeft <= 0) {
      setShowUpgradeModal(true);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_URL}/api/generate-pyq-test?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.success) {
        setAvailableQuestions(data.data);
        setTotalFound(data.totalFound);
        
        // Decrement free search counter after a successful search
        if (!isUnlimited) {
          const newCount = Math.max(0, searchesLeft - 1);
          setSearchesLeft(newCount);
          localStorage.setItem(`ns_pyq_trial_${user?.rollNumber || 'guest'}`, String(newCount));
        }
      }
    } catch (err) {
      console.error("Failed to fetch PYQs", err);
    } finally {
      setIsSearching(false);
    }
  };

  const startTest = () => {
    setAnswers({});
    setActiveIdx(0);
    setTestFinished(false);
    setTestMode(true);
  };

  const getCorrectIndex = (ansString) => {
    if (!ansString) return 0;
    const clean = String(ansString).trim().toUpperCase();
    if (['1', 'A'].includes(clean)) return 0;
    if (['2', 'B'].includes(clean)) return 1;
    if (['3', 'C'].includes(clean)) return 2;
    if (['4', 'D'].includes(clean)) return 3;
    return parseInt(clean) - 1 || 0;
  };

  const handleSelectOption = (optIdx) => {
    if (answers[activeIdx] !== undefined) return; // Prevent changing answer
    setAnswers(prev => ({ ...prev, [activeIdx]: optIdx }));
  };

  const calculateScore = () => {
    let score = 0;
    availableQuestions.forEach((q, idx) => {
      if (answers[idx] === getCorrectIndex(q.Correct_Answer)) {
        score++;
      }
    });
    return score;
  };

  // -------------------------------------------------------------
  // VIEW 1: SEARCH DASHBOARD
  // -------------------------------------------------------------
  if (!testMode) {
    return (
      <div className="h-screen w-full bg-slate-950 text-slate-200 flex flex-col font-sans overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 relative">
        
        {/* Header */}
        <header className="h-16 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between px-6 shrink-0 z-20 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <span className="text-xl">♾️</span>
            <h1 className="font-black tracking-widest uppercase text-fuchsia-400">PYQ Infinity Engine</h1>
          </div>
          <div className="flex items-center gap-3">
            {/* Status Badge */}
            <div className={`hidden md:flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${isUnlimited ? 'bg-fuchsia-950/50 border-fuchsia-800/50 text-fuchsia-300' : searchesLeft > 0 ? 'bg-amber-950/50 border-amber-800/50 text-amber-300' : 'bg-rose-950/50 border-rose-800/50 text-rose-300'}`}>
              <span>{isUnlimited ? '👑 Unlimited Access' : `🎁 Free Trial: ${searchesLeft} / 3 Left`}</span>
            </div>
            <button onClick={onBackToCourse || (() => window.history.back())} className="px-4 py-1.5 bg-fuchsia-900/50 hover:bg-fuchsia-800 text-fuchsia-300 text-xs font-bold rounded-md transition-colors border border-fuchsia-700/50">📺 Course Hub</button>
            <button onClick={onBack} className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-md transition-colors border border-slate-700">← Hub</button>
          </div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center p-6 w-full max-w-4xl mx-auto text-center overflow-y-auto">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight drop-shadow-lg">
            Generate Custom Exams.
          </h2>
          <p className="text-slate-400 font-medium mb-8 text-lg">
            Search an author, movement, or concept to instantly compile a targeted PYQ test.
          </p>

          {/* Mobile Trial Counter Notice */}
          {!isUnlimited && (
            <div className="mb-6 inline-flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-2 rounded-full text-xs font-bold">
              <span className={searchesLeft > 0 ? "text-amber-400" : "text-rose-400"}>
                {searchesLeft > 0 ? `⚡ You have ${searchesLeft} free trial search${searchesLeft === 1 ? '' : 'es'} remaining.` : '🔒 Free trial exhausted.'}
              </span>
              {searchesLeft === 0 && (
                <button onClick={() => setShowUpgradeModal(true)} className="text-fuchsia-400 underline ml-1 font-black">Upgrade Now</button>
              )}
            </div>
          )}

          <form onSubmit={handleSearch} className="w-full relative max-w-3xl mb-12 group">
            <div className="absolute inset-0 bg-fuchsia-500 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
            <div className="relative flex items-center bg-slate-900 border-2 border-slate-700 rounded-2xl overflow-hidden shadow-2xl focus-within:border-fuchsia-500 transition-colors">
              <span className="pl-6 text-2xl">🔍</span>
              <input 
                type="text" 
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="e.g. Jacques Derrida, Post-Colonialism, 2018..." 
                className="flex-1 bg-transparent border-none outline-none p-6 text-xl font-bold text-white placeholder:text-slate-500"
              />
              <button 
                type="submit" 
                disabled={isSearching || !query.trim() || (!isUnlimited && searchesLeft <= 0)} 
                className={`px-10 py-6 font-black text-lg uppercase tracking-widest transition-colors disabled:opacity-50 ${!isUnlimited && searchesLeft <= 0 ? 'bg-rose-600 hover:bg-rose-500 text-white' : 'bg-fuchsia-600 hover:bg-fuchsia-500 text-white'}`}
              >
                {isSearching ? 'SCANNING...' : !isUnlimited && searchesLeft <= 0 ? '🔒 LOCKED' : 'GENERATE'}
              </button>
            </div>
          </form>

          {hasSearched && !isSearching && (
            <div className="animate-fade-in w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl mb-8">
              {availableQuestions.length > 0 ? (
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 bg-fuchsia-500/20 rounded-full flex items-center justify-center mb-4 border border-fuchsia-500/50">
                    <span className="text-3xl font-black text-fuchsia-400">{availableQuestions.length}</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Target Acquired</h3>
                  <p className="text-slate-400 mb-8 font-medium">Found {totalFound} total matches for "{query}". We've compiled the best {availableQuestions.length} questions into a custom exam.</p>
                  
                  <button onClick={startTest} className="w-full py-4 bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white font-black text-lg rounded-xl shadow-[0_0_30px_rgba(192,38,211,0.3)] transition-all hover:scale-[1.02]">
                    🚀 LAUNCH EXAM
                  </button>
                </div>
              ) : (
                <div className="py-8">
                  <span className="text-5xl block mb-4">👻</span>
                  <h3 className="text-xl font-bold text-slate-300">No signals found.</h3>
                  <p className="text-slate-500 mt-2">Try a different author, keyword, or year.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 🔥 HIGH-CONVERSION UPGRADE PAYWALL MODAL */}
        {showUpgradeModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
            <div className="bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-800 relative transform transition-all scale-100 animate-in zoom-in-95">
              
              <button 
                onClick={() => setShowUpgradeModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full w-8 h-8 flex items-center justify-center transition-colors z-10 font-bold"
              >
                ✕
              </button>

              <div className="bg-gradient-to-br from-fuchsia-900 via-purple-900 to-indigo-950 p-8 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent"></div>
                <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-white/20 shadow-lg">
                  <span className="text-4xl">👑</span>
                </div>
                <h2 className="text-3xl font-black text-white mb-2 relative z-10 tracking-tight">PYQ Infinity Engine Locked</h2>
                <p className="text-fuchsia-200 font-medium relative z-10 text-sm">You have used up your 3 free trial searches! Upgrade to unlock unlimited AI exam compilation.</p>
              </div>

              <div className="p-8 bg-slate-900">
                <div className="space-y-3 mb-8">
                  <div className="flex items-start gap-3 text-sm text-slate-300 font-medium">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>Generate unlimited PYQ tests by author, era, or keyword</span>
                  </div>
                  <div className="flex items-start gap-3 text-sm text-slate-300 font-medium">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>Access over 10,000+ historical NTA question archives</span>
                  </div>
                  <div className="flex items-start gap-3 text-sm text-slate-300 font-medium">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>Detailed expert solutions & cognitive depth breakdowns</span>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mb-6 text-center">
                  <span className="text-slate-400 text-xs font-semibold block mb-1 uppercase tracking-wider">Choose Your Package</span>
                  <span className="text-2xl font-black text-fuchsia-400">PDFs • Mocks • Full Course</span>
                </div>

                <div className="flex flex-col gap-3">
                  {/* 🔥 UPDATED: Direct redirect to all product plans! */}
                  <button 
                    onClick={() => {
                      window.open('https://notes.ugcnetenglish.in/products/', '_blank');
                    }}
                    className="w-full py-4 bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white font-black text-sm uppercase tracking-wider rounded-xl transition-all shadow-[0_0_25px_rgba(192,38,211,0.3)] flex items-center justify-center gap-2"
                  >
                    <span>View All Plans & Upgrade</span>
                    <span className="text-lg">🚀</span>
                  </button>

                  <button 
                    onClick={() => setShowUpgradeModal(false)}
                    className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors"
                  >
                    Maybe Later
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 2: FINAL RESULTS REPORT
  // -------------------------------------------------------------
  if (testFinished) {
    const finalScore = calculateScore();
    const percentage = Math.round((finalScore / availableQuestions.length) * 100);

    return (
      <div className="h-screen w-full bg-slate-950 text-slate-200 flex flex-col font-sans overflow-hidden">
        <header className="h-16 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between px-6 shrink-0 backdrop-blur-md">
          <h1 className="font-black tracking-widest uppercase text-fuchsia-400">Exam Diagnostic Report</h1>
          <button onClick={() => setTestMode(false)} className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-md border border-slate-700">Exit to Search</button>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10">
          <div className="max-w-4xl mx-auto">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center shadow-2xl mb-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-fuchsia-500/10 via-transparent to-transparent"></div>
              <h2 className="text-2xl font-bold text-slate-400 mb-6 relative z-10">Mission Complete: <span className="text-white">"{query}"</span></h2>
              
              <div className="flex justify-center items-center gap-8 relative z-10">
                <div className="flex flex-col items-center">
                  <span className={`text-7xl font-black ${percentage >= 70 ? 'text-emerald-400' : percentage >= 40 ? 'text-amber-400' : 'text-rose-400'}`}>
                    {percentage}%
                  </span>
                  <span className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-2">Accuracy</span>
                </div>
                <div className="w-px h-24 bg-slate-800"></div>
                <div className="flex flex-col items-center">
                  <span className="text-5xl font-black text-white">{finalScore} <span className="text-2xl text-slate-600">/ {availableQuestions.length}</span></span>
                  <span className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-2">Correct Answers</span>
                </div>
              </div>
            </div>

            <h3 className="text-lg font-black uppercase tracking-widest text-slate-500 mb-4 pl-2">Review Your Answers</h3>
            <div className="space-y-4">
              {availableQuestions.map((q, idx) => {
                const isCorrect = answers[idx] === getCorrectIndex(q.Correct_Answer);
                const options = [q.Option_1, q.Option_2, q.Option_3, q.Option_4].filter(Boolean);
                
                return (
                  <div key={idx} className={`p-6 rounded-2xl border ${isCorrect ? 'bg-emerald-900/10 border-emerald-900/30' : 'bg-rose-900/10 border-rose-900/30'}`}>
                    <div className="flex items-start gap-4">
                      <span className="text-2xl mt-1">{isCorrect ? '✅' : '❌'}</span>
                      <div>
                        <p className="text-lg font-bold text-slate-200 mb-3 whitespace-pre-wrap">{q.Question_Text}</p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                          {options.map((opt, oIdx) => {
                            const isThisCorrect = oIdx === getCorrectIndex(q.Correct_Answer);
                            const isSelected = answers[idx] === oIdx;
                            
                            let style = "bg-slate-900 border border-slate-800 text-slate-500";
                            if (isThisCorrect) style = "bg-emerald-500/20 border-emerald-500 text-emerald-400 font-bold";
                            else if (isSelected && !isThisCorrect) style = "bg-rose-500/20 border-rose-500 text-rose-400 line-through";

                            return <div key={oIdx} className={`px-4 py-2 rounded-lg text-sm ${style}`}>{opt}</div>;
                          })}
                        </div>
                        
                        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-sm text-indigo-300 font-medium leading-relaxed">
                          <strong className="text-indigo-400 block mb-1">Expert Analysis:</strong>
                          {q.Explanation || 'No detailed explanation provided for this question.'}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 3: ACTIVE TEST MODE
  // -------------------------------------------------------------
  const q = availableQuestions[activeIdx];
  if (!q) return null;

  const options = [q.Option_1, q.Option_2, q.Option_3, q.Option_4].filter(Boolean);
  const correctIdx = getCorrectIndex(q.Correct_Answer);
  const hasAnswered = answers[activeIdx] !== undefined;

  return (
    <div className="h-screen w-full bg-slate-950 text-slate-200 flex flex-col font-sans overflow-hidden">
      
      {/* Top Navbar */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 shrink-0 z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <span className="font-black text-xs uppercase tracking-widest bg-fuchsia-500 text-white px-3 py-1 rounded">LIVE EXAM</span>
          <span className="text-sm font-bold text-slate-400">Target: <span className="text-white">{query}</span></span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-xs font-bold text-slate-500 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
            Progress: {Object.keys(answers).length} / {availableQuestions.length}
          </span>
          <button onClick={() => { if(window.confirm("Abort this exam? Progress will be lost.")) setTestMode(false); }} className="text-xs font-bold text-rose-400 hover:text-rose-300 uppercase tracking-widest">Abort</button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar: Grid Navigator */}
        <aside className="w-20 md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-800 hidden md:block">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Map</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              {availableQuestions.map((_, i) => {
                const answered = answers[i] !== undefined;
                const isCurrent = activeIdx === i;
                
                let btnStyle = "bg-slate-800 text-slate-500 border-transparent hover:bg-slate-700";
                if (answered) {
                  const wasCorrect = answers[i] === getCorrectIndex(availableQuestions[i].Correct_Answer);
                  btnStyle = wasCorrect ? "bg-emerald-500/20 text-emerald-500 border-emerald-500/50" : "bg-rose-500/20 text-rose-500 border-rose-500/50";
                }
                if (isCurrent) btnStyle += " ring-2 ring-fuchsia-500 ring-offset-2 ring-offset-slate-900";

                return (
                  <button key={i} onClick={() => setActiveIdx(i)} className={`aspect-square flex items-center justify-center rounded-lg font-mono text-xs font-bold transition-all border ${btnStyle}`}>
                    {i + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Main Exam Canvas */}
        <main className="flex-1 flex flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 overflow-hidden relative">
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-12 flex flex-col">
            <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col">
              
              <div className="flex justify-between items-start mb-8 border-b border-slate-800 pb-6">
                <div>
                  <span className="text-xs font-black tracking-widest uppercase bg-slate-800 text-slate-400 px-3 py-1 rounded shadow-sm">
                    {q.Exam_Session || 'PYQ Archive'}
                  </span>
                  {q.Cognitive_Depth && (
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-3">
                      {q.Cognitive_Depth.replace('_', ' ')}
                    </span>
                  )}
                </div>
                <span className="font-mono text-xl font-black text-slate-300">Q {activeIdx + 1}</span>
              </div>

              <p className="text-2xl md:text-3xl font-bold text-white leading-relaxed mb-10 whitespace-pre-wrap">
                {q.Question_Text}
              </p>

              <div className="space-y-4 mb-10">
                {options.map((opt, i) => {
                  let btnStyle = "bg-slate-900 border-slate-700 text-slate-300 hover:border-fuchsia-500 hover:bg-slate-800 cursor-pointer";
                  
                  if (hasAnswered) {
                    btnStyle = "bg-slate-900 border-slate-800 text-slate-600 opacity-60 cursor-default"; // Default answered state
                    if (i === correctIdx) {
                      btnStyle = "bg-emerald-900/30 border-emerald-500 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)] z-10 relative font-bold"; 
                    } else if (i === answers[activeIdx]) {
                      btnStyle = "bg-rose-900/30 border-rose-500 text-rose-400"; 
                    }
                  }

                  return (
                    <button 
                      key={i} 
                      onClick={() => handleSelectOption(i)} 
                      disabled={hasAnswered} 
                      className={`w-full text-left px-6 py-5 rounded-2xl border-2 text-lg md:text-xl font-medium transition-all flex gap-4 items-center ${btnStyle}`}
                    >
                      <span className="font-black opacity-30 shrink-0 bg-slate-800 w-8 h-8 flex items-center justify-center rounded-lg text-sm">{['A','B','C','D'][i]}</span>
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>

              {hasAnswered && (
                <div className="p-8 bg-indigo-950/30 border border-indigo-500/30 rounded-2xl animate-fade-in shadow-xl mb-10">
                  <span className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span> Expert Analysis
                  </span>
                  <p className="text-lg md:text-xl text-indigo-100 leading-relaxed font-medium">
                    {q.Explanation || 'Review the core concepts regarding this question for better understanding.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div className="w-full shrink-0 border-t border-slate-800 bg-slate-950 p-4 flex justify-end items-center z-10">
            {activeIdx < availableQuestions.length - 1 ? (
              <button 
                onClick={() => setActiveIdx(activeIdx + 1)} 
                disabled={!hasAnswered} 
                className={`px-8 py-3 rounded-xl font-black text-sm uppercase tracking-widest transition-all ${hasAnswered ? 'bg-fuchsia-600 hover:bg-fuchsia-500 text-white shadow-[0_0_20px_rgba(192,38,211,0.3)]' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
              >
                Next Question →
              </button>
            ) : (
              <button 
                onClick={() => setTestFinished(true)} 
                disabled={!hasAnswered} 
                className={`px-8 py-3 rounded-xl font-black text-sm uppercase tracking-widest transition-all ${hasAnswered ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
              >
                Complete Exam & Get Results
              </button>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}