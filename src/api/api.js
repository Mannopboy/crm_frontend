import axios from "axios";
import { API_BASE_URL } from "../config";

const BASE_URL = API_BASE_URL;

const api = axios.create({
    baseURL: BASE_URL,
});

// Har bir so'rovga access_token qo'shamiz
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Login sahifasiga qaytarish (bir marta)
function forceLogout() {
    localStorage.clear();
    if (window.location.pathname !== "/") {
        window.location.href = "/";
    }
}

// Token yangilashni bir vaqtning o'zida bir marta bajaramiz (parallel 401'lar uchun)
let refreshPromise = null;

async function refreshAccessToken() {
    const refresh_token = localStorage.getItem("refresh_token");
    if (!refresh_token) throw new Error("No refresh token");

    // interceptorli `api` emas, toza axios — aylanma (loop) bo'lmasligi uchun
    const res = await axios.post(
        `${BASE_URL}/refresh`,
        {},
        { headers: { Authorization: `Bearer ${refresh_token}` } }
    );

    const newAccess = res.data?.access_token || res.data?.token;
    if (!newAccess) throw new Error("No access_token in refresh response");

    localStorage.setItem("token", newAccess);
    if (res.data?.refresh_token) {
        localStorage.setItem("refresh_token", res.data.refresh_token);
    }
    return newAccess;
}

// 401 → tokenni yangilab, so'rovni bir marta qayta yuboramiz
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const original = error.config;
        const status = error.response?.status;

        // /login va /refresh 401 bermasin — cheksiz aylanmaning oldini olamiz
        const isAuthCall =
            original?.url?.includes("/login") || original?.url?.includes("/refresh");

        if (status === 401 && original && !original._retry && !isAuthCall) {
            original._retry = true;
            try {
                if (!refreshPromise) {
                    refreshPromise = refreshAccessToken().finally(() => {
                        refreshPromise = null;
                    });
                }
                const newAccess = await refreshPromise;
                original.headers = original.headers || {};
                original.headers.Authorization = `Bearer ${newAccess}`;
                return api(original);
            } catch (e) {
                forceLogout();
                return Promise.reject(e);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
