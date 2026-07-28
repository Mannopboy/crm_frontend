import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import CallAnalysisCard from "./CallAnalysisCard";

const ANALYSIS = {
    id: 5,
    call_id: 41,
    operator: "Ali Valiyev",
    status: "analyzed",
    total_score: 72,
    lead_status: "warm",
    criteria_scores: { greeting: 15, handling_objections: 22 },
    criteria_max: { greeting: 15, handling_objections: 30 },
    strengths: ["Yaxshi salomlashdi"],
    weaknesses: ["Sinov darsiga taklif qilmadi"],
    recommendation: "Aniq keyingi qadam kelishing",
    transcript: "Assalomu alaykum...",
    created_at: "2026-07-28T10:15:00",
};

describe("CallAnalysisCard", () => {
    it("ballni va mezonlarni criteria_max asosida ko'rsatadi", () => {
        render(<CallAnalysisCard analysis={ANALYSIS} defaultOpen />);

        expect(screen.getByText("72")).toBeInTheDocument();
        // progress bar qo'lda emas, javobdagi max'dan quriladi
        expect(screen.getByText("15/15")).toBeInTheDocument();
        expect(screen.getByText("22/30")).toBeInTheDocument();
        expect(screen.getByText(/Aniq keyingi qadam/)).toBeInTheDocument();
    });

    it("transkript faqat so'ralganda ochiladi", () => {
        render(<CallAnalysisCard analysis={ANALYSIS} defaultOpen />);

        expect(screen.queryByText("Assalomu alaykum...")).not.toBeInTheDocument();
        fireEvent.click(screen.getByText(/Transkriptni ko/));
        expect(screen.getByText("Assalomu alaykum...")).toBeInTheDocument();
    });

    it("pending holatda 'Tahlil qilinmoqda' yozadi", () => {
        render(<CallAnalysisCard analysis={{ ...ANALYSIS, status: "pending", total_score: null }} defaultOpen />);
        expect(screen.getByText(/Tahlil qilinmoqda/)).toBeInTheDocument();
    });

    it("failed holatda xato matnini ko'rsatadi", () => {
        render(
            <CallAnalysisCard
                analysis={{ ...ANALYSIS, status: "failed", total_score: null, error: "STT xatosi" }}
                defaultOpen
            />
        );
        expect(screen.getByText(/Tahlil qilinmadi/)).toBeInTheDocument();
        expect(screen.getByText("STT xatosi")).toBeInTheDocument();
    });

    it("analysis bo'lmasa hech nima chizmaydi", () => {
        const { container } = render(<CallAnalysisCard analysis={null} />);
        expect(container).toBeEmptyDOMElement();
    });
});
