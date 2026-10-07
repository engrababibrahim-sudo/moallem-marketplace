import { describe, expect, it } from "vitest";
import { getOnboardingProgress, getRecommendationSubjects } from "../shared/onboarding";

describe("Smart Onboarding helpers", () => {
  it("calculates progressive completion without exceeding 100", () => {
    expect(getOnboardingProgress({ role: "طالب", stage: "ثانوي" }, 9)).toBe(22);
    expect(getOnboardingProgress({ a: "1", b: "2" }, 1)).toBe(100);
    expect(getOnboardingProgress({}, 0)).toBe(0);
  });

  it("prioritizes the selected subject in recommendations", () => {
    expect(getRecommendationSubjects("فيزياء")[0]).toBe("فيزياء");
    expect(getRecommendationSubjects("رياضيات")[0]).toBe("رياضيات");
  });
});
