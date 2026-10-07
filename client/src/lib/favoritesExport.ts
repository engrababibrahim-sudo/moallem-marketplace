export type FavoriteExportItem = {
  favoriteType: "teacher" | "course";
  title: string;
  targetId: string;
  createdAt: string | Date;
};

const columns = ["النوع", "العنوان", "المعرف", "تاريخ الحفظ"];
const typeLabel = (value: FavoriteExportItem["favoriteType"]) => value === "teacher" ? "معلم" : "خطة تعلم";
const cell = (value: unknown) => {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
};
const rows = (items: FavoriteExportItem[]) => items.map(item => [
  typeLabel(item.favoriteType),
  item.title,
  item.targetId,
  new Date(item.createdAt).toLocaleDateString("ar-EG"),
]);

export function buildFavoritesCsv(items: FavoriteExportItem[]) {
  return "\uFEFF" + [columns, ...rows(items)].map(row => row.map(cell).join(",")).join("\r\n") + "\r\n";
}

export function buildFavoritesExcel(items: FavoriteExportItem[]) {
  const table = [columns, ...rows(items)].map(row => `<Row>${row.map(value => `<Cell><Data ss:Type="String">${escapeXml(value)}</Data></Cell>`).join("")}</Row>`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="المفضلة"><Table>${table}</Table></Worksheet></Workbook>`;
}

function escapeXml(value: unknown) {
  return String(value ?? "").replace(/[<>&'\"]/g, character => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[character] ?? character));
}

export function downloadTextFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
