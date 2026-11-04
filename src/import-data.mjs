export const columns = [
  "direction",
  "student_code",
  "student_name",
  "grade_level",
  "school_name",
  "school_code",
  "academic_year",
  "term",
  "move_date",
  "reason",
];
const aliases = {
  ประเภทการย้าย: "direction",
  ประเภท: "direction",
  เลขประจำตัวนักเรียน: "student_code",
  เลขประจำตัว: "student_code",
  "ชื่อ–สกุลนักเรียน": "student_name",
  ชื่อนักเรียน: "student_name",
  ระดับชั้น: "grade_level",
  โรงเรียน: "school_name",
  โรงเรียนเดิม: "school_name",
  โรงเรียนปลายทาง: "school_name",
  รหัสสถานศึกษา: "school_code",
  รหัสโรงเรียน: "school_code",
  ปีการศึกษา: "academic_year",
  ภาคเรียน: "term",
  วันที่ย้าย: "move_date",
  วันที่ต้องการย้าย: "move_date",
  เหตุผล: "reason",
  เหตุผลในการย้าย: "reason",
};
export function normalizeImportRows(rows) {
  if (!Array.isArray(rows) || !rows.length || rows.length > 200)
    throw new Error("เลือกไฟล์ที่มีข้อมูล 1–200 รายการ");
  return rows.map((row, i) => {
    if (!row || Array.isArray(row) || typeof row !== "object")
      throw new Error(`รายการที่ ${i + 1} ไม่ใช่ข้อมูลแบบ object`);
    const out = {};
    for (const [raw, value] of Object.entries(row)) {
      const header = raw.replace(/^\uFEFF/, "").trim(),
        key = aliases[header] || header;
      if (columns.includes(key)) out[key] = value;
    }
    for (const key of columns) if (out[key] === undefined) out[key] = "";
    out.direction =
      { ย้ายเข้า: "in", ย้ายออก: "out", เข้า: "in", ออก: "out" }[
        String(out.direction).trim()
      ] || String(out.direction).trim().toLowerCase();
    for (const key of [
      "student_code",
      "student_name",
      "grade_level",
      "school_name",
      "reason",
    ])
      out[key] = String(out[key] ?? "").trim();
    out.school_code = String(out.school_code ?? "").replace(/\D/g, "");
    out.academic_year = Number(out.academic_year);
    if (out.academic_year >= 1900 && out.academic_year < 2400)
      out.academic_year += 543;
    out.term = Number(out.term);
    if (out.move_date instanceof Date)
      out.move_date = out.move_date.toISOString().slice(0, 10);
    else {
      const value = String(out.move_date ?? "").trim();
      let m = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (m) {
        const y = Number(m[3]) > 2400 ? Number(m[3]) - 543 : Number(m[3]);
        out.move_date = `${y}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
      } else {
        m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        out.move_date =
          m && Number(m[1]) > 2400
            ? `${Number(m[1]) - 543}-${m[2]}-${m[3]}`
            : value;
      }
    }
    return out;
  });
}
export function workbookRows(matrix) {
  if (!Array.isArray(matrix) || matrix.length < 2)
    throw new Error("ไฟล์ XLSX ต้องมีแถวชื่อคอลัมน์และข้อมูล");
  const headers = matrix[0].map((v) => String(v ?? "").trim());
  if (new Set(headers.filter(Boolean)).size !== headers.filter(Boolean).length)
    throw new Error("ชื่อคอลัมน์ซ้ำกัน");
  return matrix
    .slice(1)
    .filter((r) =>
      r.some((v) => v !== null && v !== undefined && String(v).trim() !== ""),
    )
    .map((row) =>
      Object.fromEntries(
        headers.filter(Boolean).map((h) => [h, row[headers.indexOf(h)]]),
      ),
    );
}
export async function parseImportFile(file) {
  if (!file || file.size > 5 * 1024 * 1024)
    throw new Error("เลือกไฟล์ขนาดไม่เกิน 5 MB");
  const ext = file.name.split(".").pop().toLowerCase();
  let rows;
  if (ext === "json") {
    const data = JSON.parse((await file.text()).replace(/^\uFEFF/, ""));
    rows = Array.isArray(data) ? data : data.rows;
  } else if (ext === "csv") {
    const { default: Papa } = await import("papaparse");
    const result = Papa.parse(await file.text(), {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: (h) => h.replace(/^\uFEFF/, "").trim(),
    });
    if (result.errors.length || result.meta.renamedHeaders)
      throw new Error(
        "ไฟล์ CSV มีจำนวนคอลัมน์ไม่ตรงกัน ชื่อคอลัมน์ซ้ำ หรือรูปแบบไม่ถูกต้อง",
      );
    rows = result.data;
  } else if (ext === "xlsx") {
    const { readSheet } = await import("read-excel-file/browser");
    rows = workbookRows(await readSheet(file, { sheet: 1 }));
  } else throw new Error("รองรับเฉพาะ .xlsx, .csv และ .json");
  return normalizeImportRows(rows);
}
export const sample = {
  direction: "in",
  student_code: "EXAMPLE-001",
  student_name: "เด็กหญิงตัวอย่าง ทะเบียน",
  grade_level: "ประถมศึกษาปีที่ 1",
  school_name: "โรงเรียนตัวอย่าง",
  school_code: "",
  academic_year: 2569,
  term: 2,
  move_date: "2026-11-10",
  reason: "ย้ายที่อยู่ตามผู้ปกครอง",
};
