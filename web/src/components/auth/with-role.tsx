"use client";

import { RoleGuard } from "./role-guard";

export function withRole<P extends object>(
  Component: React.ComponentType<P>,
  allowedRoles: Array<"student" | "teacher" | "admin">
) {
  return function ProtectedComponent(props: P) {
    return (
      <RoleGuard allowedRoles={allowedRoles}>
        <Component {...props} />
      </RoleGuard>
    );
  };
}