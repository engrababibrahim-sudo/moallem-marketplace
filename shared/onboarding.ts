export type OnboardingAnswers = Record<string, string>;

export function getOnboardingProgress(answers: OnboardingAnswers, totalSteps: number): number {
  if (totalSteps <= 0) return 0;
  return Math.min(100, Math.round((Object.values(answers).filter(Boolean).length / totalSteps) * 100));
}

export function getRecommendationSubjects(subject: string): string[] {
  return subject === "فيزياء" ? ["فيزياء", "رياضيات"] : [subject || "رياضيات", "لغة إنجليزية"];
}
