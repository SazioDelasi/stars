import React, { forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
	label: string;
	error?: string;
}

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
	label: string;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
	({ label, ...props }, ref) => {
		return (
			<label className="flex items-center gap-2 cursor-pointer group">
				<input
					type="checkbox"
					ref={ref}
					{...props}
					className="w-4 h-4 rounded border-slate-300 text-uenr-brown focus:ring-uenr-brown/20 transition-all cursor-pointer"
				/>
				<span className="text-xs font-medium text-slate-600 group-hover:text-slate-900 transition-colors font-roboto">
					{label}
				</span>
			</label>
		);
	},
);

Checkbox.displayName = "Checkbox";

const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
	({ label, error, type, ...props }, ref) => {
		const [showPassword, setShowPassword] = useState(false);
		const isPassword = type === "password";
		const inputType = isPassword
			? showPassword
				? "text"
				: "password"
			: type;

		return (
			<div className="space-y-1.5 w-full font-roboto">
				<div className="flex justify-between items-end">
					<label className="text-[11px] font-bold text-slate-500 uppercase ml-1 tracking-widest">
						{label}
					</label>
				</div>

				<div className="relative group">
					<input
						{...props}
						ref={ref}
						type={inputType}
						className={`
              w-full px-4 py-3.5 border rounded-xl transition-all outline-none text-sm font-normal
              bg-white text-slate-700 placeholder:text-slate-300
              ${error
								? "border-red-500 focus:ring-2 focus:ring-red-100"
								: "border-slate-200 focus:border-uenr-brown focus:ring-2 focus:ring-uenr-brown/10"
							}
            `}
					/>

					{isPassword && (
						<button
							type="button"
							onClick={() => setShowPassword(!showPassword)}
							className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-uenr-brown transition-colors"
							aria-label={
								showPassword ? "Hide password" : "Show password"
							}>
							{showPassword ? (
								<EyeOff size={18} />
							) : (
								<Eye size={18} />
							)}
						</button>
					)}
				</div>

				{error && (
					<p className="text-[10px] text-red-600 font-medium ml-1 animate-in fade-in slide-in-from-top-1">
						{error}
					</p>
				)}
			</div>
		);
	},
);

TextInput.displayName = "TextInput";

export { TextInput, Checkbox };
