// Rol nomlari bo'yicha yagona manba.
// Backend tarixan "manager" qaytaradi, hujjatlarda "admin" deyiladi —
// shuning uchun ikkalasini ham admin deb qabul qilamiz (qarang: Frontend.md "ROL" bandi).
export const ADMIN_ROLES = ["admin", "manager"];

export function getRole() {
    return (localStorage.getItem("role") || "").trim().toLowerCase();
}

export function isAdmin() {
    return ADMIN_ROLES.includes(getRole());
}

export function isAuthenticated() {
    return Boolean(localStorage.getItem("token"));
}

export function getStoredUser() {
    try {
        return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
        return null;
    }
}

export function getToken() {
    return localStorage.getItem("token") || "";
}

// Rolga mos bosh sahifa
export function homePathForRole() {
    return isAdmin() ? "/admin" : "/dashboard";
}
