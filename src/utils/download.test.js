import { filenameFromResponse, readBlobError } from "./download";

describe("filenameFromResponse", () => {
    it("oddiy filename'ni o'qiydi", () => {
        const res = { headers: { "content-disposition": 'attachment; filename="crm_funnel_month.xlsx"' } };
        expect(filenameFromResponse(res, "fallback.xlsx")).toBe("crm_funnel_month.xlsx");
    });

    it("UTF-8 filename*'ni dekodlaydi", () => {
        const res = {
            headers: { "content-disposition": "attachment; filename*=UTF-8''hisobot%20oy.xlsx" },
        };
        expect(filenameFromResponse(res, "fallback.xlsx")).toBe("hisobot oy.xlsx");
    });

    it("sarlavha bo'lmasa fallback qaytaradi", () => {
        expect(filenameFromResponse({ headers: {} }, "crm_calls_all.pdf")).toBe("crm_calls_all.pdf");
    });
});

describe("readBlobError", () => {
    it("blob ichidagi JSON xabarni chiqaradi", async () => {
        const blob = { text: async () => JSON.stringify({ message: "type noto'g'ri" }) };
        Object.setPrototypeOf(blob, Blob.prototype);
        const msg = await readBlobError({ response: { data: blob } });
        expect(msg).toBe("type noto'g'ri");
    });

    it("oddiy JSON javobdan ham o'qiydi", async () => {
        const msg = await readBlobError({ response: { data: { message: "403" } } });
        expect(msg).toBe("403");
    });
});
