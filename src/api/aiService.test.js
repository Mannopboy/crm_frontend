import { scoreClass, scoreColor, getAiLowScores, getAnalysisById } from "./aiService";
import api from "./api";

jest.mock("./api", () => ({ __esModule: true, default: { get: jest.fn() } }));

// Qo'llanmadagi qoida: ≥80 yashil · 50–79 sariq · <50 qizil
describe("AI ball rangi", () => {
    it.each([
        [100, "ai-score--good"],
        [80, "ai-score--good"],
        [79, "ai-score--mid"],
        [50, "ai-score--mid"],
        [49, "ai-score--bad"],
        [0, "ai-score--bad"],
    ])("%i → %s", (score, expected) => {
        expect(scoreClass(score)).toBe(expected);
    });

    it("ball yo'q bo'lsa neytral rang", () => {
        expect(scoreClass(null)).toBe("ai-score--none");
        expect(scoreColor(null)).toBe("#94a3b8");
    });

    it("chegaralarda rang mos keladi", () => {
        expect(scoreColor(80)).toBe("#16a34a");
        expect(scoreColor(50)).toBe("#d97706");
        expect(scoreColor(49)).toBe("#dc2626");
    });
});

describe("AI so'rovlari", () => {
    beforeEach(() => {
        api.get.mockReset();
    });

    it("with_transcript faqat so'ralganda yuboriladi", async () => {
        api.get.mockResolvedValue({ data: { count: 0, analyses: [] } });

        await getAiLowScores({ below: 40, period: "month" });
        expect(api.get.mock.calls[0][1].params).toEqual({ below: 40, period: "month" });

        await getAiLowScores({ below: 20, period: "month", withTranscript: true });
        expect(api.get.mock.calls[1][1].params).toEqual({
            below: 20,
            period: "month",
            with_transcript: 1,
        });
    });

    it("tahlil call_id emas, o'z id'si bo'yicha olinadi", async () => {
        api.get.mockResolvedValue({ data: { analysis: { id: 7, transcript: "salom" } } });

        const res = await getAnalysisById(7);
        expect(api.get).toHaveBeenCalledWith("/ai/analysis/7");
        expect(res.transcript).toBe("salom");
    });

    it("javob envelopesiz kelsa ham ishlaydi", async () => {
        api.get.mockResolvedValue({ data: { id: 7, transcript: null } });

        const res = await getAnalysisById(7);
        expect(res).toEqual({ id: 7, transcript: null });
    });
});
