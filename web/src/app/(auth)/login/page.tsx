"use client";

import { Checkbox, TextInput } from "@/components/ui/inputs";
import api from "@/lib/axios";
import { LoginSchema, type LoginInput } from "@/schemas/auth.schema";
import { useAuthStore } from "@/store/auth.store";
import { useProfileStore } from "@/store/profile.store";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput & { rememberMe?: boolean }>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const setProfile = useProfileStore((state) => state.setProfile);

  const onSubmit = async (data: LoginInput & { rememberMe?: boolean }) => {
    setIsLoading(true);
    try {
      const response = await api.post("/auth/login/", { email: data.email, password: data.password });
      const { user, tokens } = response.data;

      setAuth(user, tokens.access, tokens.refresh, !!data.rememberMe);
      const profileResponse = await api.get("/accounts/me/", {
        headers: { Authorization: `Bearer ${tokens.access}` }
      });
      setProfile(profileResponse.data.profile);

      toast.success(`Welcome back, ${user.username}`);
      router.push(`/${user.role.toLowerCase()}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Header Area */}
      <div className="flex flex-col items-center mb-10">
        <div className="w-16 h-16 relative mb-4">
          <Image src="/logo.png" alt="UENR Crest" fill className="object-contain" priority />
        </div>
        <h1 className="text-2xl font-bold text-uenr-brown font-lato">Login</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Username Input */}
        <TextInput
          label="Email"
          type="email"
          placeholder="xxxx@uenr.edu.gh"
          error={errors.email?.message}
          {...register("email")}
        />

        {/* Password Input with Forgot Link Integration */}
        <div className="relative">
          <div className="absolute right-1 top-0 z-10">
            <Link
              href="/forgot-password"
              className="text-[10px] font-bold text-uenr-brown hover:underline uppercase font-roboto tracking-tight"
            >
              Forgot?
            </Link>
          </div>
          <TextInput
            label="Password"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register("password")}
          />
        </div>

        {/* Options Area */}
        <div className="flex items-center justify-between px-1">
          <Checkbox label="Remember me" {...register("rememberMe")} />
        </div>

        {/* Log In Button */}
        <button
          disabled={isLoading}
          className="w-full bg-uenr-brown disabled:bg-slate-300 text-white py-4 rounded-xl font-bold shadow-lg shadow-maroon-900/20 hover:bg-uenr-brown-hover transition-all active:scale-[0.98] mt-4 font-roboto tracking-wide uppercase text-sm"
        >
          {isLoading ? "Authenticating..." : "Log In"}
        </button>
      </form>

      {/* Support Footer */}
      <footer className="mt-12 text-center space-y-4 font-roboto">
        <p className="text-slate-400 text-[11px] font-medium leading-relaxed px-4">
          Having issues accessing your portal? <br />
          <a href="#" className="text-uenr-green font-bold hover:underline">
            Create a support ticket
          </a>
        </p>
      </footer>
    </div>
  );
}