"use client";

import { createContext, useContext, useReducer, useEffect, ReactNode } from "react";
import { User, UserRole } from "@/lib/types/user";
import { LoginRequest } from "@/lib/types/requests";

interface AuthState {
	user: User | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	error: string | null;
}

type AuthAction =
	| { type: "LOGIN_START" }
	| { type: "LOGIN_SUCCESS"; payload: User }
	| { type: "LOGIN_FAILURE"; payload: string }
	| { type: "LOGOUT" }
	| { type: "UPDATE_USER"; payload: Partial<User> };

const initialState: AuthState = {
	user: null,
	isAuthenticated: false,
	isLoading: true,
	error: null,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
	switch (action.type) {
		case "LOGIN_START":
			return { ...state, isLoading: true, error: null };
		case "LOGIN_SUCCESS":
			return { ...state, user: action.payload, isAuthenticated: true, isLoading: false };
		case "LOGIN_FAILURE":
			return { ...state, isLoading: false, error: action.payload };
		case "LOGOUT":
			return { ...initialState, isLoading: false };
		case "UPDATE_USER":
			return { ...state, user: state.user ? { ...state.user, ...action.payload } : null };
		default:
			return state;
	}
};

const AuthContext = createContext<{
	state: AuthState;
	login: (credentials: LoginRequest) => Promise<void>;
	logout: () => void;
} | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
	const [state, dispatch] = useReducer(authReducer, initialState);

	useEffect(() => {
		const checkSession = async () => {
			try {
				const savedUser = localStorage.getItem("stars_user");
				if (savedUser) {
					dispatch({ type: "LOGIN_SUCCESS", payload: JSON.parse(savedUser) });
				} else {
					dispatch({ type: "LOGOUT" });
				}
			} catch {
				dispatch({ type: "LOGOUT" });
			}
		};
		checkSession();
	}, []);

	const login = async (credentials: LoginRequest) => {
		dispatch({ type: "LOGIN_START" });
		try {
			// Logic for UENR LDAP or STARS DB Auth
			const mockUser: User = {
				id: "usr_01",
				indexNumber: "20004055",
				name: "ADAMS MAXWELL OWUSU",
				role: UserRole.STUDENT,
				personalInfo: {
					lastName: "OWUSU",
					otherNames: "ADAMS MAXWELL",
					email: "m.owusu@uenr.edu.gh",
					phone: "+233 54 000 0000",
				},
				academicContext: {
					department: {
						id: "dept_01",
						name: "Computer Science",
					},
					programmeId: "BSc. Computer Science",
					level: 300,
					enrolledSemesters: ["2025_SEM1"]
				},
				status: "ACTIVE"
			};

			localStorage.setItem("stars_user", JSON.stringify(mockUser));
			dispatch({ type: "LOGIN_SUCCESS", payload: mockUser });
		} catch (err) {
			dispatch({ type: "LOGIN_FAILURE", payload: "Invalid Index Number or Password" });
		}
	};

	const logout = () => {
		localStorage.removeItem("stars_user");
		dispatch({ type: "LOGOUT" });
	};

	return (
		<AuthContext.Provider value={{ state, login, logout }}>
			{children}
		</AuthContext.Provider>
	);
};

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (!context) throw new Error("useAuth must be used within an AuthProvider");
	return context;
};