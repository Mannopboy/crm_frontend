import React from "react";
import { render, screen, act } from "@testing-library/react";
import ToastHost from "./ToastHost";
import { toast } from "../utils/toast";

describe("ToastHost", () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it("boshida hech nima ko'rsatmaydi", () => {
        const { container } = render(<ToastHost />);
        expect(container).toBeEmptyDOMElement();
    });

    it("toast chiqaradi va vaqti tugagach o'chiradi", () => {
        render(<ToastHost />);

        act(() => {
            toast.success("Saqlandi", 3000);
        });
        expect(screen.getByText("Saqlandi")).toBeInTheDocument();

        act(() => {
            jest.advanceTimersByTime(3100);
        });
        expect(screen.queryByText("Saqlandi")).not.toBeInTheDocument();
    });
});
