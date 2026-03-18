export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen w-full bg-[#f4f7f5] flex items-center justify-center p-4 md:p-8">
      {/* Main Container */}
      <div className="max-w-5xl w-full bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/60 overflow-hidden grid grid-cols-1 md:grid-cols-2">
        
        {/* Left Section: Branding & App Info */}
        <section className="hidden md:flex flex-col items-center justify-center p-12 bg-[#e8f3ec] border-r border-slate-100">
          <div className="w-48 h-48 bg-[#800000] rounded-3xl flex items-center justify-center shadow-2xl mb-8">
            <span className="text-6xl font-black text-white tracking-tighter">S.</span>
          </div>
          <h2 className="text-2xl font-bold text-[#800000] text-center mb-4">
            Student Tracking & <br/> Academic Results System
          </h2>
          <p className="text-slate-600 text-center text-sm max-w-xs leading-relaxed">
            Access your student portal to manage courses, view results, and track your academic journey.
          </p>
          <div className="mt-12 pt-8 border-t border-slate-200 w-full text-center">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">UENR Official Portal</p>
          </div>
        </section>

        {/* Right Section: Form Content */}
        <section className="p-8 md:p-16 flex flex-col justify-center bg-white">
          {children}
        </section>

      </div>
    </main>
  );
}