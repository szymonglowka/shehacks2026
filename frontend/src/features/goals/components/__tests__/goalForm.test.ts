import { describe, expect, it } from "vitest";
import { reminderSentence, validateGoalForm, type GoalFormValues } from "@/api/goals";

const t = (key: string) => key;

function base(): GoalFormValues {
  return {
    title: "Szklanka wody rano",
    category: "nutrition",
    frequency: "daily",
    target_count: 1,
    reminder_enabled: false,
    reminder_time: null,
    reminder_weekdays: [],
  };
}

describe("validateGoalForm", () => {
  it("accepts a minimal valid goal without reminder", () => {
    expect(validateGoalForm(base(), t)).toEqual({});
  });

  it("requires a title", () => {
    const errors = validateGoalForm({ ...base(), title: "   " }, t);
    expect(errors.title).toBe("form.errorTitleRequired");
  });

  it("rejects titles over 120 chars", () => {
    const errors = validateGoalForm({ ...base(), title: "x".repeat(121) }, t);
    expect(errors.title).toBe("form.errorTitleTooLong");
  });

  it("accepts exactly 120 chars", () => {
    expect(validateGoalForm({ ...base(), title: "x".repeat(120) }, t)).toEqual({});
  });

  it("rejects weekly target outside 1..7", () => {
    const weekly = { ...base(), frequency: "weekly" as const, target_count: 0 };
    expect(validateGoalForm(weekly, t).target_count).toBe("form.errorTargetRange");
    expect(
      validateGoalForm({ ...weekly, target_count: 8 }, t).target_count,
    ).toBe("form.errorTargetRange");
    expect(validateGoalForm({ ...weekly, target_count: 3 }, t)).toEqual({});
  });

  it("requires time and at least one day when reminder is on", () => {
    const values: GoalFormValues = {
      ...base(),
      reminder_enabled: true,
      reminder_time: null,
      reminder_weekdays: [],
    };
    const errors = validateGoalForm(values, t);
    expect(errors.reminder_time).toBe("form.errorTimeRequired");
    expect(errors.reminder_weekdays).toBe("form.errorDaysRequired");
  });

  it("accepts a complete reminder", () => {
    const values: GoalFormValues = {
      ...base(),
      reminder_enabled: true,
      reminder_time: "18:00",
      reminder_weekdays: [1, 3],
    };
    expect(validateGoalForm(values, t)).toEqual({});
  });
});

describe("reminderSentence", () => {
  const days = ["pon.", "wt.", "śr.", "czw.", "pt.", "sob.", "niedz."];

  it("returns null without time or days", () => {
    expect(
      reminderSentence({ reminder_time: null, reminder_weekdays: [1] }, days, "x {days} {time}"),
    ).toBeNull();
    expect(
      reminderSentence({ reminder_time: "18:00", reminder_weekdays: [] }, days, "x {days} {time}"),
    ).toBeNull();
  });

  it("sorts weekdays Monday-first and interpolates", () => {
    expect(
      reminderSentence(
        { reminder_time: "18:00", reminder_weekdays: [5, 1, 3] },
        days,
        "We will remind you on {days} at {time}.",
      ),
    ).toBe("We will remind you on wt., czw., sob. at 18:00.");
  });
});
