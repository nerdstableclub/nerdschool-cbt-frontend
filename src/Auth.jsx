import React, { useState } from 'react';
import LottiePackage from 'lottie-react';
import animationData from './background-animation.json';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const Lottie = LottiePackage.default || LottiePackage;

export default function Auth({ onLogin, onGoToAdmin }) {
  const [isLogin, setIsLogin] = useState(true);
  
  // 🔥 UPGRADED: Added email and unified loginId for Email/Phone login
  const [formData, setFormData] = useState({ 
    name: '', phone: '', email: '', location: '', password: '', loginId: '' 
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); 
    setError(''); 
    setSuccessMsg('');

    const endpoint = isLogin ? '/api/login' : '/api/register';
    
    // Send specific payload based on action to avoid clutter
    const payload = isLogin 
      ? { loginId: formData.loginId, password: formData.password }
      : { name: formData.name, phone: formData.phone, email: formData.email, location: formData.location, password: formData.password };

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Something went wrong');

      if (isLogin) {
        onLogin(data.user); // The backend will now return user.activePlans
      } else {
        setSuccessMsg(`🎉 Success! Your Roll No is ${data.rollNumber}. Please log in.`);
        setIsLogin(true); 
        setFormData({ ...formData, password: '', loginId: formData.email || formData.phone }); 
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      
      {/* LEFT SIDE - IMMERSIVE BRANDING */}
      <div className="hidden lg:flex w-1/2 p-12 flex-col justify-between relative overflow-hidden border-r border-slate-800/50">
        
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600 rounded-full opacity-20 blur-[128px] pointer-events-none"></div>
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-blue-600 rounded-full opacity-10 blur-[100px] pointer-events-none"></div>

        <div className="absolute inset-0 z-0 opacity-[0.08] pointer-events-none flex items-center justify-center mix-blend-screen">
          <Lottie animationData={animationData} loop={true} className="w-[150%] h-[150%] max-w-none grayscale" />
        </div>

        <div className="relative z-10 max-w-xl mt-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-[10px] font-black tracking-widest uppercase mb-6 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
            System Online
          </div>
          
          <h1 className="text-5xl lg:text-6xl font-black text-white mb-4 leading-tight tracking-tight drop-shadow-lg">
            NerdSchool<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Premium Portal</span>
          </h1>
          
          <h2 className="text-lg font-medium text-slate-400 mb-8 leading-relaxed max-w-md">
            The all-in-one ecosystem for UGC NET English. Master literary theory, conquer Paper 1, and evaluate your readiness.
          </h2>

          <div className="flex flex-wrap gap-2 mb-10">
            {['Video Lectures', '5000+ PYQs', 'PDF Notes', 'Smart Diagnostics'].map((badge, i) => (
              <span key={i} className="px-3.5 py-1.5 bg-slate-900/80 border border-slate-700 text-slate-300 text-xs font-bold rounded-lg backdrop-blur-md shadow-sm">
                <span className="text-indigo-400 mr-1.5">✓</span>{badge}
              </span>
            ))}
          </div>

          <a href="https://play.google.com/store/apps/details?id=com.nerdstables.nerdschool&pli=1" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-6 py-3 bg-slate-900/50 backdrop-blur-xl border border-slate-700 text-white rounded-2xl hover:bg-slate-800 hover:border-indigo-500 hover:scale-105 transition-all duration-300 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] group">
            <svg className="w-8 h-8 text-indigo-400 group-hover:text-cyan-400 transition-colors" viewBox="0 0 512 512" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM102 27.5c-5.3 4.6-8 11.2-8 20.3v397.6c0 9 2.6 15.6 7.8 20.2l.3.3L268.4 293l.3-.3-166.7-165.2zM337.5 246.5L274.6 309.4l16 9.1 113.8 64.6c11.6 6.5 16.7 13.5 16.7 20.6v-2c0-7-5.1-14.1-16.7-20.6l-66.9-38-66.9-38-33.1-33.1zM104.6 499l220.7-221.3 60.1 60.1L104.6 499z" fill="currentColor"/>
            </svg>
            <div className="text-left">
              <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold leading-none mb-1">Get it on</div>
              <div className="text-lg font-black leading-none tracking-wide">Google Play</div>
            </div>
          </a>
        </div>
        
        <div className="relative z-10 text-slate-500 text-sm font-semibold tracking-wide">
          © {new Date().getFullYear()} NerdSchool Education
        </div>
      </div>

      {/* RIGHT SIDE - GLASS FORM */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center p-6 sm:p-12 lg:p-16 relative bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">
        
        <div className="max-w-md w-full mx-auto relative z-10">
          <div className="bg-slate-900/40 backdrop-blur-2xl border border-slate-800 p-8 sm:p-10 rounded-3xl shadow-[0_0_50px_-12px_rgba(0,0,0,0.8)] relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50"></div>

            <h2 className="text-3xl font-black text-white mb-2 tracking-tight">
              {isLogin ? 'Welcome Back.' : 'Initialize Profile.'}
            </h2>
            <p className="text-slate-400 mb-8 font-medium text-sm">
              {isLogin ? 'Enter your credentials to access the ecosystem.' : 'Secure your spot in the premium portal.'}
            </p>

            {error && <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/50 text-rose-400 text-sm font-bold rounded-xl animate-fade-in">{error}</div>}
            {successMsg && <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 text-sm font-bold rounded-xl animate-fade-in">{successMsg}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {!isLogin ? (
                // REGISTRATION FIELDS
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Full Name</label>
                    <input type="text" name="name" required value={formData.name} onChange={handleChange} className="w-full p-3.5 bg-slate-950/50 border border-slate-800 text-white rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-600 font-medium" placeholder="e.g. Aswathy V P" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Mobile Number</label>
                      <input type="tel" name="phone" required value={formData.phone} onChange={handleChange} className="w-full p-3.5 bg-slate-950/50 border border-slate-800 text-white rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-600 font-medium" placeholder="10-digit number" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">City / Location</label>
                      <input type="text" name="location" value={formData.location} onChange={handleChange} className="w-full p-3.5 bg-slate-950/50 border border-slate-800 text-white rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-600 font-medium" placeholder="e.g. Trivandrum" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Email Address</label>
                    <input type="email" name="email" required value={formData.email} onChange={handleChange} className="w-full p-3.5 bg-slate-950/50 border border-slate-800 text-white rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-600 font-medium" placeholder="student@example.com" />
                  </div>
                </div>
              ) : (
                // LOGIN FIELD
                <div className="animate-fade-in">
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Email or Mobile Number</label>
                  <input type="text" name="loginId" required value={formData.loginId} onChange={handleChange} className="w-full p-3.5 bg-slate-950/50 border border-slate-800 text-white rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-600 font-medium" placeholder="Enter Email or Phone..." />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Password</label>
                <input type="password" name="password" required value={formData.password} onChange={handleChange} className="w-full p-3.5 bg-slate-950/50 border border-slate-800 text-white rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-600 font-medium" placeholder="••••••••" />
              </div>

              <button type="submit" disabled={loading} className="w-full py-4 mt-6 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-black text-sm uppercase tracking-widest rounded-xl hover:from-indigo-500 hover:to-blue-500 transition-all shadow-[0_0_20px_rgba(79,70,229,0.4)] hover:shadow-[0_0_30px_rgba(79,70,229,0.6)] disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? 'Processing...' : isLogin ? 'Access Portal' : 'Initialize Account'}
              </button>
            </form>
          </div>

          <div className="mt-8 text-center text-slate-500 font-medium text-sm">
            {isLogin ? "Don't have access? " : "Already initialized? "}
            <button onClick={() => { setIsLogin(!isLogin); setError(''); setSuccessMsg(''); }} className="text-indigo-400 font-bold hover:text-indigo-300 hover:underline transition-colors">
              {isLogin ? 'Register now' : 'Login here'}
            </button>
          </div>
        </div>

        <button 
          onClick={async () => {
            const pin = prompt("🔒 Restricted Area. Enter Admin PIN:");
            if (!pin) return;
            try {
              const res = await fetch(`${API_URL}/api/verify-admin`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pin })
              });
              if (res.ok) onGoToAdmin();
              else alert("❌ Incorrect PIN. Access Denied.");
            } catch (err) { alert("❌ Error connecting to server."); }
          }} 
          className="absolute bottom-6 right-6 text-[10px] font-black text-slate-600 hover:text-rose-500 transition-colors uppercase tracking-widest flex items-center gap-2"
        >
          <span>Staff / Admin</span>
          <span className="w-1.5 h-1.5 bg-rose-500/50 rounded-full"></span>
        </button>
      </div>
    </div>
  );
}