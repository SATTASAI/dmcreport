import test from "node:test";
import assert from "node:assert/strict";
import {
  parseImportFile,
  normalizeImportRows,
  workbookRows,
  sample,
  columns,
} from "../src/import-data.mjs";
import { readSheet } from "read-excel-file/node";
test("CSV and JSON preserve student-code zeroes and Thai headers normalize dates and years", async () => {
  const csv =
    'ประเภทการย้าย,เลขประจำตัว,ชื่อนักเรียน,ระดับชั้น,โรงเรียน,ปีการศึกษา,ภาคเรียน,วันที่ย้าย,เหตุผล\r\nย้ายเข้า,00012,"เด็กหญิง ก, ข",ป.1,โรงเรียนทดสอบ,2569,2,10/11/2569,ย้ายที่อยู่';
  const [row] = await parseImportFile(new File(["\uFEFF" + csv], "test.csv"));
  assert.equal(row.student_code, "00012");
  assert.equal(row.student_name, "เด็กหญิง ก, ข");
  assert.equal(row.move_date, "2026-11-10");
  assert.equal(row.direction, "in");
  const json = await parseImportFile(
    new File([JSON.stringify({ rows: [sample] })], "test.json"),
  );
  assert.deepEqual(json, [sample]);
  const year = normalizeImportRows([
    { ...sample, academic_year: 2026, move_date: "2569-11-10" },
  ]);
  assert.equal(year[0].academic_year, 2569);
  assert.equal(year[0].move_date, "2026-11-10");
});
test("XLSX fixture parses with real workbook reader and retains string student codes", async () => {
  const rows = workbookRows(
    await readSheet(new URL("./fixtures/import-sample.xlsx", import.meta.url)),
  );
  const [row] = normalizeImportRows(rows);
  assert.equal(row.student_code, "00025");
  assert.equal(row.move_date, "2026-11-10");
  assert.equal(row.student_name, "เด็กหญิงตัวอย่าง นำเข้า");
});
test("malformed files and duplicate headers are rejected instead of silently losing data", async () => {
  await assert.rejects(() => parseImportFile(new File(["[]"], "test.json")));
  await assert.rejects(() => parseImportFile(new File(["{}"], "test.json")));
  await assert.rejects(() =>
    parseImportFile(new File(["x,x\n1,2"], "test.csv")),
  );
  await assert.rejects(() =>
    parseImportFile(new File(["a,b\n1,2,3"], "test.csv")),
  );
  assert.throws(() =>
    workbookRows([
      ["student_code", "student_code"],
      ["1", "2"],
    ]),
  );
  assert.throws(() => normalizeImportRows(Array(201).fill(sample)));
  assert.equal(columns.length, 9);
});
