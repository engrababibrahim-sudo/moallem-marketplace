import { describe, expect, it } from "vitest";
import { demoTeacherMatch } from "../services/ai";

describe("Demo teacher matching", () => {
  it("ranks exact subject and availability matches first", () => {
    const result = demoTeacherMatch({ subject: "رياضيات", grade: "ثانوي", goal: "رفع الدرجة", level: "متوسط", needs: ["مسائل"], availability: "مساءً" }, [
      { id: "physics", subject: "فيزياء", stage: "ثانوي", availability: "مساءً", score: 80 },
      { id: "math", subject: "رياضيات", stage: "ثانوي", availability: "مساءً", score: 80 },
    ]);
    expect(result[0]?.teacherId).toBe("math");
    expect(result[0]?.reasons).toContain("تطابق المادة");
  });
});
