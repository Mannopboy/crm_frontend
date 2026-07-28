import { isAdmin, isAuthenticated, homePathForRole, getStoredUser } from "./auth";

beforeEach(() => {
    localStorage.clear();
});

describe("rollar", () => {
    it("backend 'manager' qaytarsa ham admin deb hisoblanadi", () => {
        localStorage.setItem("role", "manager");
        expect(isAdmin()).toBe(true);
        expect(homePathForRole()).toBe("/admin");
    });

    it("hujjatdagi 'admin' ham qabul qilinadi", () => {
        localStorage.setItem("role", "ADMIN");
        expect(isAdmin()).toBe(true);
    });

    it("operator admin emas", () => {
        localStorage.setItem("role", "operator");
        expect(isAdmin()).toBe(false);
        expect(homePathForRole()).toBe("/dashboard");
    });
});

describe("isAuthenticated", () => {
    it("token bo'lmasa false", () => {
        expect(isAuthenticated()).toBe(false);
    });

    it("token bo'lsa true", () => {
        localStorage.setItem("token", "abc");
        expect(isAuthenticated()).toBe(true);
    });
});

describe("getStoredUser", () => {
    it("buzilgan JSON'da yiqilmaydi", () => {
        localStorage.setItem("user", "{buzilgan");
        expect(getStoredUser()).toBeNull();
    });

    it("to'g'ri JSON'ni qaytaradi", () => {
        localStorage.setItem("user", JSON.stringify({ id: 2, name: "Ali" }));
        expect(getStoredUser()).toEqual({ id: 2, name: "Ali" });
    });
});
