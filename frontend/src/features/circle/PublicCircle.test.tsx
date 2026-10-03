// f-care · Public circle page test: renders without auth, claim flow works,
// invalid token shows the revoked-link state.
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (key === "publicTitle") return `${opts?.name} would love help:`;
      if (key === "thanks") return `Thanks, ${opts?.name}!`;
      if (key === "takenBy") return `On it: ${opts?.name}`;
      return key;
    },
    i18n: { language: "en" },
  }),
}));

const mutateClaim = vi.fn();
const mutateDone = vi.fn();

const publicData = {
  mom_name: "Marta",
  mood_color: "#e8d9b5",
  mood_word: "a mixed day",
  requests: [
    {
      id: 1,
      title: "Dinner for Thursday",
      category: "meal",
      when_label: "Thursday afternoon",
      status: "open",
      claimed_by: null,
    },
    {
      id: 2,
      title: "Take over the 2 a.m. feeding",
      category: "night",
      when_label: "tonight",
      status: "claimed",
      claimed_by: "Tomek",
    },
  ],
};

let publicError: false | { status: number } = false;

vi.mock("../../api/circle", () => ({
  usePublicCircle: () => ({
    data: publicError ? undefined : publicData,
    isPending: false,
    isError: publicError !== false,
    error: publicError !== false ? publicError : null,
  }),
  useClaimRequest: () => ({
    mutate: (
      body: unknown,
      opts?: { onSuccess?: () => void },
    ) => {
      mutateClaim(body);
      opts?.onSuccess?.();
    },
    isPending: false,
  }),
  useMarkRequestDone: () => ({ mutate: mutateDone }),
}));

import { PublicCirclePage } from "./PublicCirclePage";

function renderPublic(token = "marta-krag-7f3k9") {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[`/c/${token}`]}>
        <Routes>
          <Route path="/c/:token" element={<PublicCirclePage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("PublicCirclePage (no auth)", () => {
  it("renders mum's list without any token in storage", () => {
    localStorage.clear();
    publicError = false;
    renderPublic();
    expect(screen.getByText("Marta would love help:")).toBeTruthy();
    expect(screen.getByText("Dinner for Thursday")).toBeTruthy();
    expect(screen.getByText("Take over the 2 a.m. feeding")).toBeTruthy();
    expect(screen.getByText("On it: Tomek")).toBeTruthy();
  });

  it("claim flow asks for a name and thanks", async () => {
    publicError = false;
    renderPublic();
    fireEvent.click(screen.getByRole("button", { name: "takeIt" }));
    fireEvent.change(screen.getByPlaceholderText("yourNamePh"), {
      target: { value: "Ola" },
    });
    fireEvent.click(screen.getByRole("button", { name: "claim" }));
    await waitFor(() =>
      expect(mutateClaim).toHaveBeenCalledWith({ id: 1, name: "Ola" }),
    );
    await waitFor(() => expect(screen.getByText("Thanks, Ola!")).toBeTruthy());
  });

  it("invalid token shows the revoked-link state", () => {
    publicError = { status: 404 };
    renderPublic("dead-token");
    expect(screen.getByText("invalidTitle")).toBeTruthy();
    publicError = false;
  });

  it("rate limit shows the friendly slow-down state", () => {
    publicError = { status: 429 };
    renderPublic();
    expect(screen.getByText("rateTitle")).toBeTruthy();
    expect(screen.getByText("rateText")).toBeTruthy();
    publicError = false;
  });
});
