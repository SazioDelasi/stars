import z from "zod";

export const LoginSchema = z.object({
	email: z.email("Invalid email address"),
	password: z.string().min(6, "Password must be at least 6 characters long"),
})

export type LoginInput = z.infer<typeof LoginSchema>;

export const TokenResponseSchema = z.object({
	accessToken: z.string(),
	refreshToken: z.string(),
})

export type TokenResponse = z.infer<typeof TokenResponseSchema>;

export const UserSchema = z.object({
	username: z.string(),
	role: z.enum(["student", "teacher", "admin"]),
})

export type User = z.infer<typeof UserSchema>;