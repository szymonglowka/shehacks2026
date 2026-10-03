import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import ReportPage from "../ReportPage";

vi.mock("@/api/visit", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/visit")>();
  return {
    ...actual,
    useVisitReport: () => ({
      data: {
        profile: {
          display_name: "Marta",
          mode: "postpartum",
          postpartum_day: 39,
          postpartum_week: 6,
          delivery_type: "cesarean",
          feeding: "breast",
        },
        weeks: 4,
        range: { from: "2026-04-16", to: "2026-05-14" },
        mood_sleep_series: [
          { date: "2026-05-10", mood: 3, sleep_hours: 4.5 },
          { date: "2026-05-11", mood: 4, sleep_hours: 6.5 },
          { date: "2026-05-12", mood: 4, sleep_hours: 7.0 },
        ],
        epds_history: [{ date: "2026-05-12", total: 8 }],
        symptom_frequency: [{ code: "back_pain", count: 6 }],
        red_flags: [],
        questions: [{ id: 1, text: "Czy to krwawienie jest w normie?", done: false, created_at: "2026-05-10" }],
      },
      isLoading: false,
      isError: false,
    }),
    useAddVisitQuestion: () => ({ mutate: vi.fn() }),
    useToggleVisitQuestion: () => ({ mutate: vi.fn() }),
  };
});

vi.mock("react-i18next", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-i18next")>();
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string, opts?: Record<string, unknown>) => {
        if (!opts) return key;
        return `${key} ${Object.values(opts).join(" ")}`;
      },
      i18n: { language: "pl", changeLanguage: vi.fn() },
    }),
  };
});

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <ReportPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("ReportPage print view", () => {
  it("renders the A4 sheet with all toggled sections", () => {
    const { container } = renderPage();
    expect(container.querySelector(".report-sheet")).not.toBeNull();
    expect(screen.getByText(/section.moodSleep/)).not.toBeNull();
    expect(screen.getByText(/section.epds/)).not.toBeNull();
    expect(screen.getByText(/Czy to krwawienie jest w normie?/)).not.toBeNull();
    expect(screen.getByText(/disclaimer/)).not.toBeNull();
  });

  it("calls window.print from the print button", () => {
    const spy = vi.fn();
    Object.defineProperty(window, "print", { value: spy, writable: true });
    renderPage();
    const btn = screen.getByText(/print/);
    btn.click();
    expect(spy).toHaveBeenCalledOnce();
  });
});
