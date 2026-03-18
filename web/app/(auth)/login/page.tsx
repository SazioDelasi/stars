"use client";

import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";

export default function LoginPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Top Logo - Similar to AIM Portal */}
      <div className="flex flex-col items-center mb-10">
        <div className="w-16 h-16 relative mb-4">
           {/* Your UENR Crest goes here */}
           <div className="bg-slate-100 rounded-full w-full h-full flex items-center justify-center border-2 border-slate-50">🎓</div>
        </div>
        <h1 className="text-2xl font-bold text-[#00873c]">Login</h1>
      </div>
      
      <form onSubmit={handleSubmit((data) => console.log(data))} className="space-y-6">
        {/* Username/Index */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase ml-1">Username / Index No.</label>
          <input 
            {...register("indexNumber")}
            placeholder="eg. UENR/ST/22/0001" 
            className="w-full px-4 py-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#00873c]/10 focus:border-[#00873c] transition-all outline-none"
          />
          {errors.indexNumber && <p className="text-[10px] text-red-500 font-medium">{errors.indexNumber.message}</p>}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex justify-between">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Password</label>
            <button className="text-[10px] font-bold text-[#00873c] hover:underline uppercase">Forgot?</button>
          </div>
          <input 
            {...register("password")}
            type="password"
            placeholder="••••••••" 
            className="w-full px-4 py-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#00873c]/10 focus:border-[#00873c] transition-all outline-none"
          />
          {errors.password && <p className="text-[10px] text-red-500 font-medium">{errors.password.message}</p>}
        </div>

        {/* Log In Button - UENR Green as used in AIM */}
        <button className="w-full bg-[#00873c] text-white py-4 rounded-xl font-bold shadow-lg shadow-green-900/20 hover:bg-[#007032] transition-all active:scale-[0.98] mt-4">
          Log In
        </button>
      </form>

      <footer className="mt-12 text-center space-y-4">
        <p className="text-slate-400 text-[11px] font-medium leading-relaxed px-4">
          Having issues accessing your portal? <br/>
          <a href="#" className="text-[#00873c] font-bold hover:underline">Create a support ticket</a>
        </p>
      </footer>
    </div>
  );
}