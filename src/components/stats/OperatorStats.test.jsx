import React from "react";
import { render, screen } from "@testing-library/react";
import OperatorStats from "./OperatorStats";
import { getMyStats } from "../../api/statsService";

jest.mock("recharts", () => {
    const Box = ({ children }) => <div>{children}</div>;
    const Nothing = () => null;
    return {
        ResponsiveContainer: Box, BarChart: Box, Bar: Nothing, XAxis: Nothing,
        YAxis: Nothing, Tooltip: Nothing, Legend: Nothing, CartesianGrid: Nothing,
    };
});
jest.mock("../../api/statsService", () => ({
    getMyStats: jest.fn(),
    formatDuration: (s) => (s == null ? "—" : `${s}s`),
}));

const SAMPLE = {
    status: true,
    period: "month",
    operator: { id: 7, name: "Ali Valiyev", system: "Turon" },
    pipeline: {
        total: 10, active: 7, contracts: 3, came: 4, deleted: 1, conversion_rate: 30, came_rate: 40,
        avg_attempts: 2.5,
        by_status: [{ filter_id: 1, name: "Keladi", count: 4 }, { filter_id: 2, name: "Sifatsiz", count: 3 }],
        temperature: { issiq: 2, sovuq: 1, none: 4 },
        by_source: [{ name: "Instagram", count: 10 }],
        reminders: { overdue: 2, today: 1, upcoming: 4 },
    },
    period_stats: { new_leads: 6, contracts: 2, came: 3, conversion_rate: 33.3 },
    activity: {
        by_action: { status_change: 5, contract: 2 }, contracts: 2, uncontracts: 0, came: 3, transfers: 1,
        status_changes: 5, moved_to: [{ name: "Keladi", count: 3 }], sla_breaches: 1,
    },
    calls: { total: 12, with_audio: 9, with_comment: 4, unique_leads: 8 },
    ats: {
        available: true, total: 15, inbound: 5, outbound: 10, answered: 12, missed: 3, missed_rate: 20,
        talk_time_sec: 3600, avg_duration_sec: 300, avg_wait_sec: 8, avg_rating: 4.5, rated_calls: 6,
    },
    ai: {
        enabled: true, analyzed_calls: 2, avg_score: 70, criteria_avg: { greeting: 8 }, criteria_max: { greeting: 10 },
        lead_status: { hot: 1 }, sentiment: { positive: 2 }, rank: 2, ranked_operators: 5,
        recent: [{ id: 1, call_id: 3, total_score: 80, lead_status: "hot", created_at: "2026-10-23T10:00:00" }],
    },
    rank: { operators: 5, by_calls: 1, by_contracts: 3 },
    daily: [{ date: "2026-10-23", calls: 2, new_leads: 1, contracts: 1, came: 0 }],
};

describe("OperatorStats", () => {
    beforeEach(() => getMyStats.mockReset());

    it("barcha bo'limlarni ko'rsatadi", async () => {
        getMyStats.mockResolvedValue(SAMPLE);
        render(<OperatorStats />);

        expect(await screen.findByText(/Ali Valiyev/)).toBeInTheDocument();
        expect(getMyStats).toHaveBeenCalledWith("month", null);
        for (const title of [/Kunlik dinamika/, /joriy holat/, /Eslatmalar va harorat/, /Qo'ng'iroqlar$/,
            /Faoliyat/, /AI qo'ng'iroq tahlili/]) {
            expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
        }
        expect(screen.getByText("Salomlashish")).toBeInTheDocument();
        expect(screen.getByText("33.3%")).toBeInTheDocument();
    });

    it("admin uchun userId uzatiladi, ATS yo'q bo'lsa xabar chiqadi", async () => {
        getMyStats.mockResolvedValue({ ...SAMPLE, ats: { available: false }, ai: { ...SAMPLE.ai, analyzed_calls: 0 } });
        render(<OperatorStats userId={7} />);

        expect(await screen.findByText(/ATS logini biriktirilmagan/)).toBeInTheDocument();
        expect(getMyStats).toHaveBeenCalledWith("month", 7);
        expect(screen.getByText(/tahlil qilingan qo'ng'iroq yo'q/)).toBeInTheDocument();
    });

    it("yuklab bo'lmasa xabar ko'rsatadi", async () => {
        getMyStats.mockResolvedValue(null);
        render(<OperatorStats />);
        expect(await screen.findByText(/Statistikani yuklab bo'lmadi/)).toBeInTheDocument();
    });
});
