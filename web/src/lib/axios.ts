import axios from "axios";
import { useAuthStore } from "@/store/auth.store";

const api = axios.create({
	baseURL: process.env.NEXT_PUBLIC_API_URL,
});

// Request interceptor: Attach the current access token
api.interceptors.request.use((config) => {
	const token = useAuthStore.getState().accessToken;
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}
	return config;
});

// Response interceptor: Handle 401 errors and refresh tokens
api.interceptors.response.use(
	(response) => response,
	async (error) => {
		const originalRequest = error.config;
		console.log(originalRequest);
		

		// If error is 401 and we haven't retried this request yet
		if (error.response?.status === 401 && !originalRequest._retry) {
			originalRequest._retry = true;

			try {
				const { refreshToken, setAccessToken, logout } =
					useAuthStore.getState();

				if (!refreshToken)
					throw new Error("No refresh token available");

				// Attempt to get a new access token
				// Use a base axios instance to avoid interceptor recursion
				const res = await axios.post(
					`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh/`,
					{
						refreshToken,
					},
				);

				const { accessToken, refreshToken: newRefreshToken } = res.data;

				// Update the Zustand store
				setAccessToken(accessToken, newRefreshToken);

				// Update headers and retry the original request
				originalRequest.headers.Authorization = `Bearer ${accessToken}`;
				return api(originalRequest);
			} catch (refreshError) {
				// If refresh fails, log the user out
				useAuthStore.getState().logout();
				return Promise.reject(refreshError);
			}
		}

		return Promise.reject(error);
	},
);

export default api;
