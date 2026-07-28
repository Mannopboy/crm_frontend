import { describeAudit, AUDIT_ACTIONS } from "./auditService";

describe("describeAudit", () => {
    it("status_change uchun 'eski → yangi' ko'rinishini beradi", () => {
        const d = describeAudit({ action: "status_change", old_value: "Yangi", new_value: "Sifatsiz" });
        expect(d.icon).toBe(AUDIT_ACTIONS.status_change.icon);
        expect(d.text).toBe("Yangi → Sifatsiz");
    });

    it("old_value bo'lmasa faqat new_value'ni ko'rsatadi", () => {
        const d = describeAudit({ action: "call", old_value: null, new_value: "998901234567" });
        expect(d.text).toBe("998901234567");
    });

    it("qiymat bo'lmasa amal nomini ko'rsatadi", () => {
        const d = describeAudit({ action: "create", old_value: null, new_value: null });
        expect(d.text).toBe(AUDIT_ACTIONS.create.label);
    });

    it("noma'lum amalni ham xatosiz qaytaradi", () => {
        const d = describeAudit({ action: "unknown_action" });
        expect(d.label).toBe("unknown_action");
        expect(d.icon).toBe("•");
    });
});
