"use client";

import { TextInput } from "@/components/ui/inputs";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import * as z from "zod";

const forgotSchema = z.object({
	email: z.string().email("Please enter a valid university email"),
});

export default function ForgotPasswordPage() {
	const { register, handleSubmit, formState: { errors } } = useForm({
		resolver: zodResolver(forgotSchema),
	});

	return (
		<div className="w-full max-w-sm mx-auto">
			<header className="mb-10 text-center md:text-left">
				<h1 className="text-3xl font-bold text-uenr-brown font-lato mb-2">Forgot Password?</h1>
				<p className="text-slate-500 text-sm font-roboto font-normal">
					No worries! Enter your university email and we&lquot;ll send you a link to reset your password.
				</p>
			</header>

			<form onSubmit={handleSubmit((data) => console.log(data))} className="space-y-6">
				<TextInput
					label="University Email"
					placeholder="e.g. j.doe@uenr.edu.gh"
					error={errors.email?.message as string}
					{...register("email")}
				/>

				<button className="w-full bg-uenr-brown text-white py-4 rounded-xl font-bold shadow-lg shadow-maroon-900/20 hover:bg-uenr-brown-hover transition-all active:scale-[0.98] font-roboto">
					Send Reset Link
				</button>

				<div className="text-center">
					<Link href="/login" className="inline-flex items-center gap-2 text-slate-400 text-xs font-bold hover:text-uenr-brown transition-colors font-roboto uppercase tracking-tighter">
						<ArrowLeft size={14} /> Return to Sign In
					</Link>
				</div>
			</form>
		</div>
	);
}