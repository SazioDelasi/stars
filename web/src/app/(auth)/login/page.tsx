// lib/validations/auth.ts
import * as z from "zod";

export const loginSchema = z.object({
  indexNumber: z
    .string()
    .min(5, { message: "Index number is too short" })
    .regex(/^[A-Z0-9/]+$/, { message: "Invalid characters in Index Number" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" }),
  rememberMe: z.boolean().default(false).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;