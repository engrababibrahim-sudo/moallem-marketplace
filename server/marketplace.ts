import { listPublicTeachers } from "./teacher-db";

export type PublicMarketplaceTeacher = {
  id: number;
  name: string;
  avatarUrl: string | null;
  country: string | null;
  bio: string | null;
  qualification: string | null;
  specialization: string | null;
  yearsOfExperience: number;
  subjects: string[];
  educationStages: string[];
  grades: string[];
  teachingFormat: string | null;
  hourlyRate: number | null;
  availability: string[];
};

type MarketplaceCandidate = Omit<PublicMarketplaceTeacher, "country"> & { country?: string | null; role?: string; accountStatus?: string; verificationStatus?: string; userId?: number };

export function toPublicMarketplaceTeacher(candidate: MarketplaceCandidate): PublicMarketplaceTeacher {
  return {
    id: candidate.id,
    name: candidate.name,
    avatarUrl: candidate.avatarUrl,
    country: candidate.country ?? null,
    bio: candidate.bio,
    qualification: candidate.qualification,
    specialization: candidate.specialization,
    yearsOfExperience: candidate.yearsOfExperience,
    subjects: candidate.subjects,
    educationStages: candidate.educationStages,
    grades: candidate.grades,
    teachingFormat: candidate.teachingFormat,
    hourlyRate: candidate.hourlyRate,
    availability: candidate.availability,
  };
}

export function isPublicMarketplaceCandidate(candidate: MarketplaceCandidate) {
  return candidate.role === undefined || (candidate.role === "teacher" && candidate.accountStatus === "active" && candidate.verificationStatus === "approved");
}

export async function listPublicMarketplaceTeachers(page = 1, pageSize = 50) {
  const rows = await listPublicTeachers(page, pageSize);
  return rows.filter(isPublicMarketplaceCandidate).map(toPublicMarketplaceTeacher);
}
