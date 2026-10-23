import { getMyStats, formatDuration } from "./statsService";
import api from "./api";

jest.mock("./api", () => ({ __esModule: true, default: { get: jest.fn() } }));
jest.mock("../utils/toast", () => ({ toast: { error: jest.fn() }, errorMessage: (e, m) => m }));

describe("getMyStats", () => {
    beforeEach(() => api.get.mockReset());

    it("operator uchun user_id yuborilmaydi", async () => {
        api.get.mockResolvedValue({ data: { status: true, period: "week" } });
        const data = await getMyStats("week");
        expect(api.get).toHaveBeenCalledWith("/my/stats", { params: { period: "week" } });
        expect(data.period).toBe("week");
    });

    it("admin operatorni user_id bilan so'raydi", async () => {
        api.get.mockResolvedValue({ data: { status: true } });
        await getMyStats("month", 7);
        expect(api.get.mock.calls[0][1].params).toEqual({ period: "month", user_id: 7 });
    });

    it("xato yoki status=false bo'lsa null", async () => {
        api.get.mockResolvedValueOnce({ data: { status: false } });
        expect(await getMyStats()).toBeNull();
        api.get.mockRejectedValueOnce(new Error("403"));
        expect(await getMyStats()).toBeNull();
    });
});

describe("formatDuration", () => {
    it.each([
        [null, "—"],
        [0, "0 s"],
        [45, "45 s"],
        [125, "2 daq 05 s"],
        [3900, "1 soat 05 daq"],
    ])("%s → %s", (sec, expected) => {
        expect(formatDuration(sec)).toBe(expected);
    });
});
