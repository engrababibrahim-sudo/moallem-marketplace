import { describe, expect, it } from "vitest";
import { buildFavoritesCsv, buildFavoritesExcel } from "./favoritesExport";

describe("student favorites exports", () => {
  const items = [{ favoriteType: "teacher" as const, title: "أ. أحمد", targetId: "12", createdAt: "2026-09-16T00:00:00.000Z" }];

  it("builds UTF-8 CSV with clear Arabic columns and escaped values", () => {
    const csv = buildFavoritesCsv(items);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain("النوع");
    expect(csv).toContain("أ. أحمد");
    expect(csv).toContain("\r\n");
  });

  it("builds an Excel-compatible Arabic workbook", () => {
    const excel = buildFavoritesExcel(items);
    expect(excel).toContain("<?xml version=\"1.0\"");
    expect(excel).toContain("المفضلة");
    expect(excel).toContain("أ. أحمد");
  });
});
