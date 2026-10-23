import React from "react";
import { render, screen, within } from "@testing-library/react";
import OperatorStats from "./OperatorStats";
import { getMyStats } from "../../api/statsService";

jest.mock("recharts", () => {
    const Box = ({ children }) => <div>{children}</div>;
    const Nothing = () => null;
    return {
        ResponsiveContainer: Box, ComposedChart: Box, PieChart: Box, RadarChart: Box, RadialBarChart: Box,
        Area: Nothing, Bar: Nothing, Line: Nothing, Pie: Box, Cell: Nothing, Radar: Nothing, RadialBar: Nothing,
        XAxis: Nothing, YAxis: Nothing, Tooltip: Nothing, Legend: Nothing, CartesianGrid: Nothing,
        PolarGrid: Nothing, PolarAngleAxis: Nothing, PolarRadiusAxis: Nothing,
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
    sources: [
        { id: 2, name: "Instagram", total: 6, new: 3, contracts: 3, came: 2, bad: 1, conversion_rate: 50 },
        { id: 5, name: "Flayer", total: 4, new: 1, contracts: 0, came: 1, bad: 2, conversion_rate: 0 },
        { id: 4, name: "Tashqi reklama", total: 0, new: 0, contracts: 0, came: 0, bad: 0, conversion_rate: 0 },
    ],
    period_stats: { new_leads: 6, contracts: 2, came: 3, conversion_rate: 33.3 },
    activity: {
        by_action: { status_change: 5, contract: 2 }, contracts: 2, uncontracts: 0, came: 3, transfers: 1,
        status_changes: 5, moved_to: [{ name: "Keladi", count: 3 }], sla_breaches: 1,
    },
    calls: { total: 12, with_audio: 9, with_comment: 4, unique_leads: 8 },
    ats: {
        available: true, total: 15, inbound: 5, outbound: 10, answered: 12, missed: 3, missed_rate: 20,
        talk_time_sec: 3600, avg_duration_sec: 300, avg_wait_sec: 8, avg_rating: 4.5, rated_calls: 6,
        statuses: [{ status: "Success", count: 12 }, { status: "missed", count: 3 }],
    },
    ai: {
        enabled: true, analyzed_calls: 2, avg_score: 70, criteria_avg: { greeting: 8 }, criteria_max: { greeting: 10 },
        lead_status: { hot: 1 }, sentiment: { positive: 2 }, rank: 2, ranked_operators: 5,
        recent: [{ id: 1, call_id: 3, total_score: 80, lead_status: "hot", created_at: "2026-10-23T10:00:00" }],
    },
    rank: { operators: 5, by_calls: 1, by_contracts: 3 },
    daily: [{ date: "2026-10-23", calls: 2, new_leads: 1, contracts: 1, came: 0 }],
    compare: {
        current: { new_leads: 6, calls: 12, contracts: 2, came: 3, conversion_rate: 33.3, talk_time_sec: 3600 },
        previous: { new_leads: 4, calls: 16, contracts: 0, came: 3, conversion_rate: 25, talk_time_sec: 1800 },
    },
    funnel: [
        { key: "leads", name: "Leadlar", count: 10, rate: 100 },
        { key: "called", name: "Qo'ng'iroq qilingan", count: 8, rate: 80 },
        { key: "interested", name: "Qiziqish bildirgan", count: 5, rate: 50 },
        { key: "came", name: "Keldi", count: 4, rate: 40 },
        { key: "contract", name: "Shartnoma", count: 3, rate: 30 },
    ],
    speed: { leads: 10, called: 8, not_called: 2, avg_minutes: 45, median_minutes: 30, within_hour_rate: 75 },
    heatmap: {
        cells: Array.from({ length: 7 }, (_, d) => Array.from({ length: 24 }, (_, h) => (d === 2 && h === 10 ? 5 : 0))),
        max: 5,
        busiest: { weekday: 2, hour: 10, count: 5 },
    },
    team: {
        operators: 5,
        metrics: [
            { key: "calls", me: 12, team_avg: 9.5, best: 14 },
            { key: "contracts", me: 2, team_avg: 3, best: 5 },
        ],
    },
    records: {
        active_days: 9, avg_calls_per_active_day: 4.2,
        best_calls_day: { date: "2026-10-11", count: 7 }, best_contracts_day: null,
    },
};

describe("OperatorStats", () => {
    beforeEach(() => getMyStats.mockReset());

    it("barcha bo'limlarni ko'rsatadi", async () => {
        getMyStats.mockResolvedValue(SAMPLE);
        render(<OperatorStats />);

        expect(await screen.findByRole("heading", { name: "Ali Valiyev" })).toBeInTheDocument();
        expect(getMyStats).toHaveBeenCalledWith("month", null);
        for (const title of [/Kunlik dinamika/, /Rekordlar/, /Voronka/, /Javob tezligi/, /Lead manbalari/,
            /joriy holat/, /Eslatmalar va harorat/, /Faollik xaritasi/, /^Qo'ng'iroqlar$/, /Jamoa bilan/,
            /Faoliyat/, /AI qo'ng'iroq tahlili/]) {
            expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
        }
        expect(screen.getByText("Salomlashish: 80%")).toBeInTheDocument();
    });

    it("o'tgan davr bilan solishtirish belgilari", async () => {
        getMyStats.mockResolvedValue(SAMPLE);
        render(<OperatorStats />);
        await screen.findByRole("heading", { name: "Ali Valiyev" });

        expect(screen.getByText(/\+50%/)).toBeInTheDocument();          // yangi lead 4 → 6
        expect(screen.getByText(/-25%/)).toBeInTheDocument();           // qo'ng'iroq 16 → 12
        expect(screen.getByText("yangi")).toBeInTheDocument();          // shartnoma 0 → 2
        expect(screen.getByText("o'zgarishsiz")).toBeInTheDocument();   // keldi 3 → 3
    });

    it("voronka, tezlik, xarita va rekordlar", async () => {
        getMyStats.mockResolvedValue(SAMPLE);
        render(<OperatorStats />);
        await screen.findByRole("heading", { name: "Ali Valiyev" });

        expect(screen.getAllByText(/80% o'tdi/)).toHaveLength(2);       // 10 → 8 va 5 → 4
        expect(screen.getByText(/63% o'tdi/)).toBeInTheDocument();      // 8 → 5
        expect(screen.getByText(/75% o'tdi/)).toBeInTheDocument();      // 4 → 3
        expect(screen.getByText("75%")).toBeInTheDocument();            // 1 soat ichida
        expect(screen.getByText(/Eng faol: Ch 10:00 — 5 ta/)).toBeInTheDocument();
        expect(screen.getByText("7 ta")).toBeInTheDocument();           // eng ko'p qo'ng'iroq kuni
        expect(screen.getByText("2 ta")).toBeInTheDocument();           // hali qo'ng'iroq qilinmagan
        expect(screen.getByText("o'rtachadan yuqori")).toBeInTheDocument(); // faqat qo'ng'iroqda
    });

    it("lead manbalari jadvali: har manba, ulush va jami qatori", async () => {
        getMyStats.mockResolvedValue(SAMPLE);
        render(<OperatorStats />);

        expect(await screen.findByRole("heading", { name: /Lead manbalari/ })).toBeInTheDocument();
        const insta = screen.getByRole("row", { name: /Instagram/ });
        expect(within(insta).getByText("60%")).toBeInTheDocument();      // 6 / 10 ulush
        expect(within(insta).getByText("50%")).toBeInTheDocument();      // konversiya
        const empty = screen.getByRole("row", { name: /Tashqi reklama/ });
        expect(empty).toHaveClass("ost-table__row--empty");
        const footer = screen.getByRole("row", { name: /^Jami/ });
        expect(within(footer).getByText("10")).toBeInTheDocument();
        expect(within(footer).getByText("30%")).toBeInTheDocument();     // 3 shartnoma / 10 lead
    });

    it("eski backend javobi (yangi maydonlarsiz) ham yiqilmaydi", async () => {
        const { compare, funnel, speed, heatmap, team, records, sources, ...old } = SAMPLE;
        getMyStats.mockResolvedValue({ ...old, ats: { ...SAMPLE.ats, statuses: undefined } });
        render(<OperatorStats />);
        expect(await screen.findByRole("heading", { name: /Voronka/ })).toBeInTheDocument();
        expect(screen.queryByRole("heading", { name: /Faollik xaritasi/ })).not.toBeInTheDocument();
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
