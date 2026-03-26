"use client";

import { useAuthStore } from "@/store/auth.store";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
			} else if (!allowedRoles.includes(user.role.toLowerCase() as any)) {
				router.replace(`/${user.role.toLowerCase()}`);
			}
		}
	}, [user, isHydrated, router, allowedRoles]);

	if (!isHydrated || !user || !allowedRoles.includes(user.role.toLowerCase() as any)) {
		return null;
	}

	return <>{children}</>;
}