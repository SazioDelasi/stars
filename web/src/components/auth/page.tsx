"use client";

import { Unauthorized } from "@/components/auth/unauthorized";

export default function UnauthorizedPage() {
	return (
		<div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
			<Unauthorized />
		</div>
	);
}