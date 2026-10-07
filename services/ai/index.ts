export type LearningProfileInput = { subject: string; grade: string; goal: string; level: string; needs: string[]; availability: string };
export type TeacherMatch = { teacherId: string; score: number; reasons: string[] };

export interface NukhbaAIProvider {
  createLearningProfile(input: LearningProfileInput): Promise<{ summary: string; strengths: string[]; focusAreas: string[] }>;
  recommendTeachers(input: LearningProfileInput, teacherIds: string[]): Promise<TeacherMatch[]>;
  generateAdaptiveQuiz(input: { subject: string; level: string; topic: string }): Promise<{ status: "preview" | "ready"; questions: unknown[] }>;
  buildLearningPlan(input: LearningProfileInput): Promise<{ status: "preview" | "ready"; actions: string[] }>;
}

export const aiFeatureStatus = {
  tutor: "preview",
  learningProfile: "preview",
  adaptiveQuiz: "coming_soon",
  masteryTracking: "coming_soon",
  personalizedLearningPlan: "preview",
  teacherRecommendation: "demo_algorithm",
} as const;

export function demoTeacherMatch(profile: LearningProfileInput, candidates: Array<{ id: string; subject: string; stage: string; availability: string; score: number }>): TeacherMatch[] {
  return candidates.map(candidate => {
    let score = candidate.score;
    if (candidate.subject === profile.subject) score += 8;
    if (candidate.stage === profile.grade || candidate.stage === profile.level) score += 3;
    if (candidate.availability === profile.availability) score += 3;
    return { teacherId: candidate.id, score: Math.min(99, score), reasons: [candidate.subject === profile.subject ? "تطابق المادة" : "تخصص قريب", candidate.availability === profile.availability ? "يناسب وقتك" : "مواعيد بديلة متاحة"] };
  }).sort((a, b) => b.score - a.score);
}
