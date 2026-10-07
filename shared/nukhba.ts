export type NukhbaRole = "student" | "parent" | "teacher" | "admin" | "super_admin" | "support";
export type TeacherVerificationStatus = "pending" | "under_review" | "approved" | "rejected" | "suspended";
export type BookingStatus = "requested" | "confirmed" | "completed" | "cancelled" | "no_show";

export type SmartMatchInput = {
  studentId: number;
  gradeId: number;
  subjectId: number;
  curriculumId: number;
  level: "beginner" | "intermediate" | "advanced";
  goal: string;
  budgetMax: number;
  timezone: string;
};

export type SmartMatchResult = {
  teacherId: number;
  score: number;
  reasons: string[];
};

export type BookingRequest = {
  studentId: number;
  parentId?: number;
  teacherId: number;
  startsAtUtc: number;
  durationMinutes: 30 | 45 | 60 | 90;
  currencyCode: string;
  paymentStatus: "not_configured" | "pending" | "paid" | "refunded";
};

export type PaymentProviderAdapter = {
  createCheckoutSession: (input: BookingRequest) => Promise<{ externalId: string; checkoutUrl: string }>;
  refund: (externalId: string) => Promise<void>;
};

export type VideoProviderAdapter = {
  createRoom: (bookingId: number) => Promise<{ externalRoomId: string; joinUrl: string }>;
  closeRoom: (externalRoomId: string) => Promise<void>;
};

export const rolePermissions: Record<NukhbaRole, readonly string[]> = {
  student: ["teacher:search", "booking:create", "report:read:own"],
  parent: ["teacher:search", "booking:create", "report:read:children", "children:manage"],
  teacher: ["profile:manage:own", "availability:manage:own", "booking:manage:students", "report:create"],
  admin: ["teacher:review", "users:read", "analytics:read"],
  super_admin: ["*"],
  support: ["booking:read", "support:manage"],
};
