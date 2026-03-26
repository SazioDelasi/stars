"use client";

import { useAuthStore } from "@/store/auth.store";
import { ArrowLeft, Home, ShieldAlert } from "lucide-react";
import Link from "next/link";

export function Unauthorized() {
	const { user } = useAuthStore();

	return (
		<div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-500">
			<div className="bg-red-50 p-6 rounded-4xl mb-8 border border-red-100 shadow-sm">
				<ShieldAlert size={48} className="text-red-600" />
			</div>

			<div className="space-y-3 mb-10">
				<h1 className="text-3xl font-black text-slate-900 font-lato uppercase tracking-tight">
					Access Denied
				</h1>
				<p className="text-slate-500 max-w-sm mx-auto font-roboto leading-relaxed text-sm">
					You don&apos;t have permission to access this section.
					This area is restricted to authorized roles only.
				</p>
			</div>

			<div className="flex flex-col sm:flex-row items-center gap-4">
				<button
					onClick={() => window.history.back()}
					className="flex items-center justify-center gap-2 px-8 py-3.5 bg-white border border-slate-200 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all font-lato text-[11px] uppercase tracking-widest shadow-sm active:scale-95"
				>
					<ArrowLeft size={16} /> Go Back
				</button>

				{user && (
					<Link
						href={`/${user.role.toLowerCase()}`}
						className="flex items-center justify-center gap-2 px-8 py-3.5 bg-uenr-brown text-white rounded-2xl font-bold hover:bg-uenr-brown-hover transition-all font-lato text-[11px] uppercase tracking-widest shadow-lg shadow-maroon-900/20 active:scale-95"
					>
						<Home size={16} /> My Dashboard
					</Link>
				)}
			</div>
		</div>
	);
}