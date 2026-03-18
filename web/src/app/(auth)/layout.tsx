// components/auth/AuthLayout.tsx
import Image from 'next/image';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-900 p-4 md:p-8">
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 bg-white rounded-[--radius-portal] overflow-hidden shadow-2xl">
        
        {/* Left Side: The Form */}
        <section className="p-8 md:p-16 flex flex-col justify-center">
          <div className="w-full max-w-sm mx-auto">
             {/* Logo would go here */}
             <div className="mb-8 font-bold text-2xl text-primary tracking-tighter">STARS.</div>
             {children}
          </div>
        </section>

        {/* Right Side: The Branding (Hidden on mobile) */}
        <section className="hidden md:block relative bg-uenr-green overflow-hidden p-12">
          <div className="relative z-10 h-full flex flex-col justify-end text-white">
            <h2 className="text-4xl font-bold mb-4">Knowledge, Integrity, Impact.</h2>
            <p className="text-uenr-gold/90 text-lg max-w-md">
              The official Student Tracking and Academic Results System for the University of Energy and Natural Resources.
            </p>
          </div>
          {/* Background Decorative Element */}
          <div className="absolute inset-0 opacity-20 pointer-events-none flex items-center justify-center">
             <img src="/logo.png" alt="UENR" className="w-3/4 grayscale brightness-200" />
          </div>
        </section>
        
      </div>
    </main>
  );
}