import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import SourcesAnalytics from "./SourcesAnalytics";
import { getAdminSources } from "../../../api/leadService";

jest.mock("recharts", () => {
    const Box = ({ children }) => <div>{children}</div>;
    const Nothing = () => null;
    return {
        ResponsiveContainer: Box, BarChart: Box, PieChart: Box, Pie: Box,
        Bar: Nothing, Cell: Nothing, XAxis: Nothing, YAxis: Nothing, Tooltip: Nothing, Legend: Nothing, CartesianGrid: Nothing,
    };
});
jest.mock("../../../api/leadService", () => ({ getAdminSources: jest.fn() }));
jest.mock("../../../components/ExportButton", () => () => null);
jest.mock("./PeriodFilter", () => () => null);

const SAMPLE = {
    status: true,
    sources: [
        { id: 1, name: "Instagram", total_leads: 5, contracts: 2, conversion_rate: 40 },
        { id: 2, name: "Og'izdan og'izga", total_leads: 3, contracts: 0, conversion_rate: 0 },
    ],
    no_source_leads: 0,
    systems: [{ id: 7, name: "Turon Chirchiq" }, { id: 8, name: "Gennis Chorvoq" }],
    by_system: [
        { id: 7, name: "Turon Chirchiq", total_leads: 6, contracts: 2, conversion_rate: 33.3, no_source_leads: 0,
          sources: [{ id: 1, total_leads: 4, contracts: 2 }, { id: 2, total_leads: 2, contracts: 0 }] },
        { id: 8, name: "Gennis Chorvoq", total_leads: 0, contracts: 0, conversion_rate: 0, no_source_leads: 0,
          sources: [{ id: 1, total_leads: 0, contracts: 0 }, { id: 2, total_leads: 0, contracts: 0 }] },
        { id: null, name: "Filialsiz", total_leads: 2, contracts: 0, conversion_rate: 0, no_source_leads: 0,
          sources: [{ id: 1, total_leads: 1, contracts: 0 }, { id: 2, total_leads: 1, contracts: 0 }] },
    ],
};

describe("SourcesAnalytics", () => {
    beforeEach(() => {
        getAdminSources.mockReset();
        getAdminSources.mockResolvedValue(SAMPLE);
    });

    it("filiallar jadvali: leadi bor filiallar, manba kesimi va shartnomalar", async () => {
        render(<SourcesAnalytics />);
        expect(await screen.findByRole("heading", { name: /Filiallar bo‘yicha/ })).toBeInTheDocument();
        expect(getAdminSources).toHaveBeenCalledWith("all", "");

        const row = screen.getByRole("row", { name: /Turon Chirchiq/ });
        expect(within(row).getByText("2 shartnoma")).toBeInTheDocument();
        expect(within(row).getByText("33.3%")).toBeInTheDocument();
        expect(screen.getByRole("row", { name: /Filialsiz/ })).toBeInTheDocument();
        // leadsiz filial jadvalda yo'q, lekin tanlash ro'yxatida bor
        expect(screen.queryByRole("row", { name: /Gennis Chorvoq/ })).not.toBeInTheDocument();
        expect(screen.getByRole("option", { name: "Gennis Chorvoq" })).toBeInTheDocument();
    });

    it("filial tanlansa so'rov system_id bilan ketadi va jadval yashiriladi", async () => {
        render(<SourcesAnalytics />);
        await screen.findByRole("option", { name: "Turon Chirchiq" });   // filiallar ro'yxati yuklandi
        fireEvent.change(screen.getByRole("combobox", { name: "Filial" }), { target: { value: "7" } });
        expect(getAdminSources).toHaveBeenLastCalledWith("all", "7");
        await screen.findByRole("heading", { name: "Lead va shartnoma" });
        expect(screen.queryByRole("heading", { name: /Filiallar bo‘yicha/ })).not.toBeInTheDocument();
    });

    it("jadvaldagi filial nomini bosish filtrni qo'yadi (filialsiz → none)", async () => {
        render(<SourcesAnalytics />);
        fireEvent.click(await screen.findByRole("button", { name: "Filialsiz" }));
        expect(getAdminSources).toHaveBeenLastCalledWith("all", "none");
    });
});
