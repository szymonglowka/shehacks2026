// f-care · /help smoke: emergency line from API renders once as the hero
// (no duplicated 112), trusted contact appears when logged in.
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (key === "hours") return `Hours: ${opts?.hours}`;
      if (key === "call") return "Call";
      return key;
    },
    i18n: { language: "en" },
  }),
}));

let contacts: Array<{ id: number; name: string; phone: string }> = [];

vi.mock("../../api/support", () => ({
  useHelplines: () => ({
    data: [
      {
        code: "112",
        label: "Emergency 112",
        number: "112",
        number_href: "tel:112",
        hours: "24/7",
        verify: false,
        is_emergency: true,
      },
      {
        code: "crisis",
        label: "Crisis line",
        number: "116 123",
        number_href: "tel:+48116123",
        hours: "14-22",
        verify: false,
        is_emergency: false,
      },
    ],
  }),
  useContacts: () => ({ data: contacts }),
}));

import { HelpPage } from "./HelpPage";

function renderHelp() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <HelpPage />
    </QueryClientProvider>,
  );
}

describe("HelpPage", () => {
  it("renders 112 once (hero) and lists other lines", () => {
    contacts = [];
    renderHelp();
    expect(screen.getByText("Emergency 112")).toBeTruthy();
    expect(screen.getByText("Crisis line")).toBeTruthy();
    expect(screen.getAllByText("112", { exact: false }).length).toBeLessThan(3);
    expect(
      document.querySelector('a[href="tel:112"]'),
    ).toBeTruthy();
  });

  it("shows the trusted contact when logged in", () => {
    contacts = [{ id: 1, name: "Tomek", phone: "+48600111222" }];
    renderHelp();
    const link = document.querySelector('a[href="tel:+48600111222"]');
    expect(link).toBeTruthy();
    expect(link?.textContent).toContain("Tomek");
    contacts = [];
  });
});
