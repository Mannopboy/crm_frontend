import { setLeadTemperature } from "./leadService";
import { getAdminLeadTemperature, getAdminBadLeads, getLeadJourney } from "./adminService";
import api from "./api";

jest.mock("./api", () => ({
    __esModule: true,
    default: { get: jest.fn(), post: jest.fn() },
}));

describe("Issiq/sovuq — operator", () => {
    beforeEach(() => {
        api.post.mockReset();
    });

    it("harorat POST /lead_temperature ga yuboriladi", async () => {
        api.post.mockResolvedValue({ data: { status: true, temperature: "issiq" } });

        const res = await setLeadTemperature(12, "issiq");
        expect(api.post).toHaveBeenCalledWith("/lead_temperature", {
            user_lead_id: 12,
            temperature: "issiq",
        });
        expect(res.temperature).toBe("issiq");
    });

    it("null yuborilsa tanlov bekor qilinadi", async () => {
        api.post.mockResolvedValue({ data: { status: true, temperature: null } });

        await setLeadTemperature(12, null);
        expect(api.post.mock.calls[0][1].temperature).toBeNull();
    });

    it("xatoda status:false qaytadi (throw qilmaydi)", async () => {
        api.post.mockRejectedValue({ response: { data: { status: false, message: "Ruxsat yo'q" } } });

        const res = await setLeadTemperature(9, "sovuq");
        expect(res.status).toBe(false);
        expect(res.message).toBe("Ruxsat yo'q");
    });
});

describe("Issiq/sovuq + Sifatsiz — admin", () => {
    beforeEach(() => {
        api.get.mockReset();
    });

    it("lead_temperature: user_id faqat berilganda yuboriladi", async () => {
        api.get.mockResolvedValue({ data: { status: true, leads: [] } });

        await getAdminLeadTemperature({ type: "issiq", period: "week" });
        expect(api.get.mock.calls[0][1].params).toEqual({ type: "issiq", period: "week" });

        await getAdminLeadTemperature({ type: "all", period: "all", user_id: 2 });
        expect(api.get.mock.calls[1][1].params).toEqual({ type: "all", period: "all", user_id: 2 });
    });

    it("bad_leads: limit default 200, user_id ixtiyoriy", async () => {
        api.get.mockResolvedValue({ data: { status: true, leads: [] } });

        await getAdminBadLeads({ period: "month" });
        expect(api.get.mock.calls[0][1].params).toEqual({ period: "month", limit: 200 });
    });

    it("lead_journey: id bilan chaqiriladi", async () => {
        api.get.mockResolvedValue({ data: { status: true, journey: [] } });

        await getLeadJourney(12);
        expect(api.get).toHaveBeenCalledWith("/lead_journey/12");
    });

    it("xatoda null qaytadi", async () => {
        api.get.mockRejectedValue(new Error("network"));

        expect(await getAdminLeadTemperature({})).toBeNull();
        expect(await getAdminBadLeads({})).toBeNull();
        expect(await getLeadJourney(1)).toBeNull();
    });
});
