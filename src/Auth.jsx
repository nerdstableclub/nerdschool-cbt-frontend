import React, { useState } from 'react';
import LottiePackage from 'lottie-react';
const Lottie = LottiePackage.default || LottiePackage;
import animationData from './background-animation.json'; // Make sure this matches your JSON file name!

export default function Auth({ onLogin, onGoToAdmin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', phone: '', location: '', password: '' });
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
    
    try {
      const res = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Something went wrong');

      if (isLogin) {
        onLogin(data.user); // Send user data back to App.jsx
      } else {
        setSuccessMsg(`🎉 Success! Your Roll No is ${data.rollNumber}. Please log in.`);
        setIsLogin(true); // Switch to login screen
        setFormData({ ...formData, password: '' }); // Clear password for security
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans bg-gray-50">
      
      {/* LEFT SIDE - BRANDING */}
      <div className="hidden lg:flex w-1/2 bg-blue-900 p-12 flex-col justify-between relative overflow-hidden">
        
        {/* --- LOTTIE BACKGROUND ANIMATION --- */}
        <div className="absolute inset-0 z-0 opacity-15 pointer-events-none flex items-center justify-center">
          <Lottie 
            animationData={animationData} 
            loop={true} 
            className="w-[150%] h-[150%] max-w-none" 
          />
        </div>

        {/* --- NEW: MINIMALIST & DYNAMIC COPY --- */}
        <div className="relative z-10 max-w-lg mt-10">
          <h1 className="text-5xl font-black text-white mb-2 leading-tight">
            NerdSchool<br/>Premium CBT
          </h1>
          <h2 className="text-xl font-bold text-blue-300 mb-6">
            The all-in-one ecosystem for UGC NET English.
          </h2>

          {/* Pill Badges */}
          <div className="flex flex-wrap gap-2 mb-6">
            <span className="px-3 py-1 bg-blue-800/60 border border-blue-400 text-blue-100 text-xs font-bold rounded-full backdrop-blur-sm shadow-sm">✓ Video Lectures</span>
            <span className="px-3 py-1 bg-blue-800/60 border border-blue-400 text-blue-100 text-xs font-bold rounded-full backdrop-blur-sm shadow-sm">✓ 5000+ PYQs</span>
            <span className="px-3 py-1 bg-blue-800/60 border border-blue-400 text-blue-100 text-xs font-bold rounded-full backdrop-blur-sm shadow-sm">✓ PDF Notes</span>
            <span className="px-3 py-1 bg-blue-800/60 border border-blue-400 text-blue-100 text-xs font-bold rounded-full backdrop-blur-sm shadow-sm">✓ Smart Diagnostics</span>
          </div>

          <p className="text-blue-100 text-base font-medium leading-relaxed mb-8">
            Unlock the definitive library of study materials, meticulously crafted and strictly exam-oriented. Master literary theory, conquer Paper 1, and evaluate your readiness with rigorous daily assessments.
          </p>

          {/* Google Play Download Button */}
          <a 
            href="https://play.google.com/store/apps/details?id=com.nerdstables.nerdschool&pli=1" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-5 py-2.5 bg-black text-white rounded-xl hover:bg-gray-900 hover:scale-105 transition-all shadow-xl border border-gray-800 group"
          >
            {/* SVG Play Store Icon */}
            <svg className="w-8 h-8 group-hover:animate-pulse" viewBox="0 0 512 512" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM102 27.5c-5.3 4.6-8 11.2-8 20.3v397.6c0 9 2.6 15.6 7.8 20.2l.3.3L268.4 293l.3-.3-166.7-165.2zM337.5 246.5L274.6 309.4l16 9.1 113.8 64.6c11.6 6.5 16.7 13.5 16.7 20.6v-2c0-7-5.1-14.1-16.7-20.6l-66.9-38-66.9-38-33.1-33.1zM104.6 499l220.7-221.3 60.1 60.1L104.6 499z" fill="currentColor"/>
            </svg>
            <div className="text-left">
              <div className="text-[10px] uppercase tracking-wider text-gray-300 font-bold leading-none mb-1">Get it on</div>
              <div className="text-lg font-black leading-none">Google Play</div>
            </div>
          </a>
        </div>
        
        {/* Decorative Circles */}
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-800 rounded-full opacity-50 blur-3xl z-0"></div>
        <div className="absolute top-10 right-10 w-64 h-64 bg-blue-600 rounded-full opacity-20 blur-2xl z-0"></div>

        <div className="relative z-10 text-blue-300 font-medium">
          © {new Date().getFullYear()} NerdSchool Education
        </div>
      </div>

      {/* RIGHT SIDE - FORM */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center p-8 sm:p-16 relative">
        <div className="max-w-md w-full mx-auto">
          
          <h2 className="text-3xl font-black text-gray-800 mb-2">
            {isLogin ? 'Welcome Back 👋' : 'Create an Account 🚀'}
          </h2>
          <p className="text-gray-500 mb-8 font-medium">
            {isLogin ? 'Enter your details to access your mock tests.' : 'Sign up to get access to free mock tests.'}
          </p>

          {error && <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 font-medium rounded-r">{error}</div>}
          {successMsg && <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 font-medium rounded-r">{successMsg}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
                  <input type="text" name="name" required={!isLogin} value={formData.name} onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-800 outline-none transition-all" placeholder="Ankit Sharma" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">City / Location</label>
                  <input type="text" name="location" value={formData.location} onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-800 outline-none transition-all" placeholder="Thiruvananthapuram" />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Mobile Number</label>
              <input type="tel" name="phone" required value={formData.phone} onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-800 outline-none transition-all" placeholder="10-digit mobile number" />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
              <input type="password" name="password" required value={formData.password} onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-800 outline-none transition-all" placeholder="••••••••" />
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-4 mt-4 bg-blue-800 text-white font-black rounded-lg hover:bg-blue-900 transition-all shadow-md">
              {loading ? 'Processing...' : isLogin ? 'Login to Portal' : 'Register Now'}
            </button>
          </form>

          <div className="mt-8 text-center text-gray-600 font-medium">
            {isLogin ? "Don't have an account? " : "Already registered? "}
            <button onClick={() => { setIsLogin(!isLogin); setError(''); setSuccessMsg(''); }} className="text-blue-700 font-bold hover:underline">
              {isLogin ? 'Sign up for free' : 'Login here'}
            </button>
          </div>

        </div>

        {/* SECURE ADMIN BUTTON */}
        <button 
          onClick={async () => {
            const pin = prompt("🔒 Restricted Area. Enter Admin PIN:");
            if (!pin) return; // User clicked cancel

            try {
              // Ask the backend if the PIN is correct!
              const res = await fetch('http://localhost:5000/api/verify-admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin })
              });

              if (res.ok) {
                onGoToAdmin();
              } else {
                alert("❌ Incorrect PIN. Access Denied.");
              }
            } catch (err) {
              alert("❌ Error connecting to server.");
            }
          }} 
          className="absolute bottom-6 right-6 text-xs font-bold text-gray-400 hover:text-red-600 transition-colors uppercase tracking-widest"
        >
          Staff / Admin
        </button>

      </div>
    </div>
  );
}