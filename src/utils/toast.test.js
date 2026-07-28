import { errorMessage, toast, subscribeToasts } from "./toast";

describe("errorMessage", () => {
    it("serverdagi message'ni ustun qo'yadi", () => {
        const err = { response: { status: 400, data: { message: "Telefon noto'g'ri" } } };
        expect(errorMessage(err)).toBe("Telefon noto'g'ri");
    });

    it("status kodlarini o'zbekcha matnga o'giradi", () => {
        expect(errorMessage({ response: { status: 403, data: {} } })).toMatch(/403/);
        expect(errorMessage({ response: { status: 409, data: {} } })).toMatch(/409/);
        expect(errorMessage({ response: { status: 413, data: {} } })).toMatch(/413/);
    });

    it("tarmoq xatosini aniqlaydi", () => {
        expect(errorMessage({ code: "ERR_NETWORK" })).toBe("Serverga ulanib bo'lmadi");
    });

    it("noma'lum xatoda fallback qaytaradi", () => {
        expect(errorMessage({}, "Nimadir bo'ldi")).toBe("Nimadir bo'ldi");
    });
});

describe("toast shinasi", () => {
    it("obunachiga xabarni yetkazadi", () => {
        const received = [];
        const unsubscribe = subscribeToasts((item) => received.push(item));

        toast.success("Saqlandi");
        toast.error("Xato");

        expect(received).toHaveLength(2);
        expect(received[0]).toMatchObject({ type: "success", message: "Saqlandi" });
        expect(received[1]).toMatchObject({ type: "error", message: "Xato" });

        unsubscribe();
        toast.info("bu yetib bormaydi");
        expect(received).toHaveLength(2);
    });

    it("bo'sh xabarni yubormaydi", () => {
        const received = [];
        const unsubscribe = subscribeToasts((item) => received.push(item));
        toast.info("");
        unsubscribe();
        expect(received).toHaveLength(0);
    });
});
