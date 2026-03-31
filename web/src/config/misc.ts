import { ClipboardList, ShieldCheck } from "lucide-react";

export function getStatusConfig(status?: string) {
	const configs: Record<
		string,
		{
			label: string;
			dot: string;
			bg: string;
			text: string;
			icon: React.ComponentType<{ size?: number; className?: string }>;
		}
	> = {
		FULLY_REGISTERED: {
			label: "Fully Registered",
			dot: "bg-emerald-500",
			bg: "bg-emerald-50",
			text: "text-emerald-700",
			icon: ShieldCheck,
		},
		PENDING: {
			label: "Pending Approval",
			dot: "bg-amber-500 animate-pulse",
			bg: "bg-amber-50",
			text: "text-amber-700",
			icon: ClipboardList,
		},
		REJECTED: {
			label: "Registration Rejected",
			dot: "bg-red-500",
			bg: "bg-red-50",
			text: "text-red-700",
			icon: ShieldCheck,
		},
		NOT_STARTED: {
			label: "Not Started",
			dot: "bg-slate-400",
			bg: "bg-slate-100",
			text: "text-slate-600",
			icon: ClipboardList,
		},
	};

	return configs[status ?? "NOT_STARTED"];
}
