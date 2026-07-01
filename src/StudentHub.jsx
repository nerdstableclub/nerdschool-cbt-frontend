import React from 'react';

export default function StudentHub({ user, onSelectPath, onLogout }) {
  // Fallback name just in case the database doesn't return one
  const studentName = user?.name || 'Scholar';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white relative overflow-hidden flex flex-col">
      
      {/* DEEP GLOW BACKGROUNDS */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-96 bg-indigo-600 rounded-full opacity-10 blur-[128px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-600 rounded-full opacity-5 blur-[128px] pointer-events-none"></div>

      {/* TOP NAVIGATION BAR */}
      <header className="w-full px-8 py-6 flex items-center justify-between relative z-20 border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-500/20">
            N
          </div>
          <span className="text-xl font-black tracking-tight">NerdSchool<span className="text-indigo-400">Hub</span></span>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Logged In As</div>
            <div className="text-sm font-bold text-slate-200">{studentName}</div>
          </div>
          <button 
            onClick={onLogout}
            className="px-4 py-2 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors shadow-sm"
          >
            LOGOUT
          </button>
        </div>
      </header>

      {/* MAIN VIEWPORT */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight drop-shadow-md">
            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">{studentName}</span>.
          </h1>
          <p className="text-slate-400 font-medium max-w-lg mx-auto">
            Select your destination. Enter the premium course modules or test your knowledge in the live exam engine.
          </p>
        </div>

        {/* THE PORTALS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl w-full">
          
          {/* PORTAL 1: THE NEW LMS */}
          <button 
            onClick={() => onSelectPath('lms')}
            className="group relative flex flex-col items-start p-8 rounded-3xl bg-slate-900/40 backdrop-blur-xl border border-slate-800 hover:border-indigo-500/50 transition-all duration-500 text-left overflow-hidden hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(79,70,229,0.3)]"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all"></div>
            
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-3xl mb-6 group-hover:scale-110 group-hover:bg-indigo-500 text-indigo-400 group-hover:text-white transition-all duration-300 shadow-inner">
              📚
            </div>
            
            <h2 className="text-2xl font-black text-white mb-3">Premium Course & LMS</h2>
            <p className="text-sm font-medium text-slate-400 leading-relaxed mb-8 flex-1">
              Access interactive study modules, active recall flashcards, video lectures, mnemonics, and high-yield PDF notes.
            </p>
            
            <div className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2 group-hover:text-cyan-400 transition-colors">
              Enter Dashboard <span className="text-lg leading-none">→</span>
            </div>
          </button>

          {/* PORTAL 2: THE EXISTING CBT ENGINE */}
          <button 
            onClick={() => onSelectPath('cbt')}
            className="group relative flex flex-col items-start p-8 rounded-3xl bg-slate-900/40 backdrop-blur-xl border border-slate-800 hover:border-blue-500/50 transition-all duration-500 text-left overflow-hidden hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(59,130,246,0.3)]"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all"></div>
            
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-3xl mb-6 group-hover:scale-110 group-hover:bg-blue-500 text-blue-400 group-hover:text-white transition-all duration-300 shadow-inner">
              📝
            </div>
            
            <h2 className="text-2xl font-black text-white mb-3">Live CBT Mock Tests</h2>
            <p className="text-sm font-medium text-slate-400 leading-relaxed mb-8 flex-1">
              Enter the exam simulation engine. Test your readiness against our 10,000+ PYQ database with strict timers and diagnostics.
            </p>
            
            <div className="text-xs font-black text-blue-400 uppercase tracking-widest flex items-center gap-2 group-hover:text-cyan-400 transition-colors">
              Start Simulation <span className="text-lg leading-none">→</span>
            </div>
          </button>

        </div>
      </main>

    </div>
  );
}