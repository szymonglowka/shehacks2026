// f-care · Tough-day flow test: intensity 5 → /help, otherwise breath step,
// feedback PATCH on finish.
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts?.returnObjects) {
        if (key === "intensityLabels")
          return ["Lekko", "Jakoś", "Ciężko", "Bardzo ciężko", "Nie daję rady"];
        if (key === "senses") return ["a", "b", "c", "d", "e"];
        return [];
      }
      if (typeof opts?.count === "number") return `${key} ${opts.count}`;
      if (opts && "helped" in opts)
        return `helped ${opts.helped} of ${opts.total}`;
      return key;
    },
    i18n: { language: "pl" },
  }),
}));

const mutateCreate = vi.fn();
const mutateUpdate = vi.fn();

vi.mock("../../api/support", () => ({
  useToolkit: () => ({
    data: {
      strategies: [
        {
          code: "rest-no-phone",
          title: "Rest",
          description: "d",
          category: "rest",
          duration_minutes: 10,
          steps: ["Step one", "Step two"],
          icon: "moon",
          score: 0.9,
          helped_count: 4,
          total_count: 5,
        },
      ],
    },
    isPending: false,
    isError: false,
  }),
  useCreateSession: () => ({
    mutate: (
      body: unknown,
      opts?: { onSuccess?: (r: unknown) => void; onError?: () => void },
    ) => {
      mutateCreate(body);
      opts?.onSuccess?.({ session: { id: 101 }, risk: null });
    },
    isPending: false,
  }),
  useUpdateSession: () => ({
    mutate: (body: unknown, opts?: { onSettled?: () => void }) => {
      mutateUpdate(body);
      opts?.onSettled?.();
    },
  }),
  useContacts: () => ({ data: [], isPending: false }),
  useSupportMessage: () => ({ data: null }),
}));

vi.mock("../../api/wins", () => ({
  useWins: () => ({ data: [], isPending: false, isError: false }),
  useRandomWin: () => ({ data: null, isPending: false, isError: false }),
  useAddWin: () => ({ mutate: vi.fn(), isPending: false }),
}));

import { ToughDayFlow } from "./ToughDayFlow";

function renderFlow(initial = "/tough-day") {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[initial]}>
        <Routes>
          <Route path="/tough-day" element={<ToughDayFlow />} />
          <Route path="/help" element={<div>HELP_PAGE</div>} />
          <Route path="/today" element={<div>TODAY_PAGE</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("ToughDayFlow", () => {
  beforeEach(() => {
    mutateCreate.mockClear();
    mutateUpdate.mockClear();
  });

  it("posts intensity and moves to the breathing step", async () => {
    renderFlow();
    expect(screen.getByText("intensityTitle")).toBeTruthy();
    fireEvent.click(screen.getByRole("radio", { name: /3:/ }));
    expect(mutateCreate).toHaveBeenCalledWith({ intensity: 3 });
    await waitFor(() => expect(screen.getByText("breathTitle")).toBeTruthy());
  });

  it("intensity 5 redirects to /help", async () => {
    renderFlow();
    fireEvent.click(screen.getByRole("radio", { name: /5:/ }));
    expect(mutateCreate).toHaveBeenCalledWith({ intensity: 5 });
    await waitFor(() => expect(screen.getByText("HELP_PAGE")).toBeTruthy());
  });

  it("finishing sends helped + mood_after via PATCH", async () => {
    renderFlow();
    fireEvent.click(screen.getByRole("radio", { name: /2:/ }));
    await waitFor(() => expect(screen.getByText("breathTitle")).toBeTruthy());
    fireEvent.click(screen.getByText("breathSkip"));
    await waitFor(() => expect(screen.getByText("strategiesTitle")).toBeTruthy());
    fireEvent.click(screen.getByText("finish"));
    await waitFor(() => expect(screen.getByText("didItHelp")).toBeTruthy());
    fireEvent.click(screen.getByRole("radio", { name: "helpedYes" }));
    fireEvent.click(screen.getByRole("radio", { name: "4" }));
    fireEvent.click(screen.getByRole("button", { name: "finish" }));
    await waitFor(() =>
      expect(mutateUpdate).toHaveBeenCalledWith({
        helped: "yes",
        mood_after: 4,
      }),
    );
    await waitFor(() => expect(screen.getByText("closing")).toBeTruthy());
  });
});
