"use client";

import { useAuthStore } from "@/store/auth.store";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Unauthorized } from "./unauthorized";

interface RoleGuardProps {
	children: React.ReactNode;
	allowedRoles: Array<"student" | "teacher" | "admin">;
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
	const { user } = useAuthStore();
	const router = useRouter();
	const [isHydrated, setIsHydrated] = useState(false);

	useEffect(() => {
		setIsHydrated(true);
	}, []);

	useEffect(() => {
		if (isHydrated) {
			if (!user) {
				router.replace("/login");
			}
		}
	}, [user, isHydrated, router, allowedRoles]);

	if (!isHydrated) return null;

	if (!user) return null;

	if (!allowedRoles.includes(user.role.toLowerCase() as any)) {
		return <Unauthorized />;
	}

	return <>{children}</>;
}