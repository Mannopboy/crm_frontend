import { scoreClass, scoreColor } from "./aiService";

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
