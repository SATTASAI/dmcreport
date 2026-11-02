import { useState, useEffect, useRef } from "react";
import {
  MagnifyingGlass,
  ArrowClockwise,
  UploadSimple,
  DownloadSimple,
  ShieldCheck,
  CheckCircle,
} from "@phosphor-icons/react";
import { parseImportFile, columns, sample } from "./import-data.mjs";
const base = "/api/student-transfers";
async function request(path, options = {}) {
  const res = await fetch(base + path, {
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.error || "ไม่สามารถดำเนินการได้");
    err.details = data.errors;
    throw err;
  }
  return data;
}
export function StudentsFrame({ onRegister, loading, error }) {
  const frame = useRef(null);
  useEffect(() => {
    function select(event) {
      if (
        event.origin !== window.location.origin ||
        event.source !== frame.current?.contentWindow ||
        event.data?.type !== "student-transfer:select"
      )
        return;
      const id = event.data.student_id;
      if (Number.isSafeInteger(id) && id > 0) onRegister(id);
    }
    window.addEventListener("message", select);
    return () => window.removeEventListener("message", select);
  }, [onRegister]);
  return (
    <main className="workspace-page students-page">
      <header className="workspace-heading">
        <div>
          <div className="breadcrumb">งานทะเบียน / นักเรียน</div>
          <h1>ข้อมูลนักเรียน</h1>
          <p>
            ข้อมูลจากทะเบียนกลางโรงเรียนบ้านป่าเด็ง ·
            กดชื่อนักเรียนเพื่อลงทะเบียนย้าย
          </p>
        </div>
      </header>
      {loading && (
        <p className="muted" role="status">
          กำลังเปิดแบบฟอร์มลงทะเบียน…
        </p>
      )}
      {error && (
        <p className="alert error" role="alert">
          {error}
        </p>
      )}
      <iframe
        ref={frame}
        title="ข้อมูลนักเรียนจากทะเบียนกลาง"
        src="/dmcreport/?view=students-frame"
        className="students-frame"
      />
    </main>
  );
}
export function StudentDirectory() {
  function selectStudent(student) {
    if (window.parent === window) {
      window.location.assign("/dmcreport/?register_student=" + student.id);
      return;
    }
    window.parent.postMessage(
      { type: "student-transfer:select", student_id: student.id },
      window.location.origin,
    );
  }
  const [query, Q] = useState(""),
    [status, S] = useState("enrolled"),
    [offset, O] = useState(0),
    [data, D] = useState({ students: [], total: 0 }),
    [error, E] = useState(""),
    [loading, L] = useState(false),
    [refresh, R] = useState(0);
  const sequence = useRef(0);
  useEffect(() => {
    const seq = ++sequence.current;
    const timer = setTimeout(async () => {
      L(true);
      try {
        const d = await request(
          "/students?" +
            new URLSearchParams({ q: query, status, offset: String(offset) }),
        );
        if (seq === sequence.current) {
          D(d);
          E("");
        }
      } catch (e) {
        if (seq === sequence.current) E(e.message);
      } finally {
        if (seq === sequence.current) L(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query, status, offset, refresh]);
  const statuses = {
    enrolled: "กำลังศึกษา",
    transferred: "ย้ายโรงเรียน",
    graduated: "จบการศึกษา",
    withdrawn: "ออกกลางคัน",
  };
  return (
    <main className="directory">
      <div className="directory-tools">
        <label className="search">
          <MagnifyingGlass />
          <input
            type="search"
            aria-label="ค้นหานักเรียน"
            placeholder="ค้นหาชื่อ เลขประจำตัว ระดับชั้น หรือห้อง"
            value={query}
            onChange={(e) => {
              Q(e.target.value);
              O(0);
            }}
          />
        </label>
        <select
          aria-label="สถานะนักเรียน"
          value={status}
          onChange={(e) => {
            S(e.target.value);
            O(0);
          }}
        >
          <option value="">ทุกสถานะ</option>
          {Object.entries(statuses).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <button
          className="icon-button"
          aria-label="อัปเดตรายชื่อนักเรียน"
          disabled={loading}
          onClick={() => R((n) => n + 1)}
        >
          <ArrowClockwise />
        </button>
      </div>
      <p className="muted">
        นักเรียน {data.total.toLocaleString("th-TH")} คน · ข้อมูลจากทะเบียนกลาง
      </p>
      {error && (
        <p className="alert error" role="alert">
          {error}
        </p>
      )}
      <div className="data-table-wrap" aria-busy={loading}>
        <table className="data-table">
          <thead>
            <tr>
              <th>เลขประจำตัว</th>
              <th>ชื่อ–สกุลนักเรียน</th>
              <th>ระดับชั้น</th>
              <th>ห้อง</th>
              <th>สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {data.students.map((s) => (
              <tr key={s.id}>
                <td>{s.student_code}</td>
                <td>
                  <button
                    className="student-register-link"
                    onClick={() => selectStudent(s)}
                    title="ลงทะเบียนย้ายให้นักเรียนคนนี้"
                  >
                    {s.full_name}
                  </button>
                </td>
                <td>{s.grade_level || "—"}</td>
                <td>{s.classroom || "—"}</td>
                <td>{statuses[s.status] || s.status}</td>
              </tr>
            ))}
            {!data.students.length && (
              <tr>
                <td colSpan={5}>
                  {loading ? "กำลังโหลดข้อมูล…" : "ไม่พบข้อมูลนักเรียน"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="pagination">
        <button
          disabled={!offset || loading}
          onClick={() => O((n) => Math.max(0, n - 100))}
        >
          ก่อนหน้า
        </button>
        <span>
          {data.total ? offset + 1 : 0}–{Math.min(offset + 100, data.total)} /{" "}
          {data.total}
        </span>
        <button
          disabled={offset + 100 >= data.total || loading}
          onClick={() => O((n) => n + 100)}
        >
          ถัดไป
        </button>
      </div>
    </main>
  );
}
export function Permissions() {
  const [users, U] = useState([]),
    [q, Q] = useState(""),
    [error, E] = useState(""),
    [busy, B] = useState(null),
    [notice, N] = useState("");
  useEffect(() => {
    request("/permissions")
      .then((d) => U(d.users))
      .catch((e) => E(e.message));
  }, []);
  async function setAccess(user, allowed) {
    B(user.id);
    E("");
    N("");
    try {
      await request("/permissions/" + user.id, {
        method: "PUT",
        body: { allowed },
      });
      U((rows) =>
        rows.map((row) =>
          row.id === user.id ? { ...row, allowed: allowed ? 1 : 0 } : row,
        ),
      );
      N("บันทึกสิทธิ์เรียบร้อยแล้ว");
    } catch (e) {
      E(e.message);
    } finally {
      B(null);
    }
  }
  const roles = {
    superadmin: "แอดมิน",
    executive: "ผู้บริหาร",
    staff: "เจ้าหน้าที่",
    teacher: "ครู",
  };
  return (
    <main className="workspace-page">
      <header className="workspace-heading">
        <div>
          <div className="breadcrumb">งานทะเบียน / ตั้งค่าสิทธิ์</div>
          <h1>
            <ShieldCheck />
            สิทธิ์เข้าใช้งาน
          </h1>
          <p>
            เลือกครูหรือบุคลากรที่ใช้ทะเบียนย้าย ข้อมูลนักเรียน
            และนำเข้าข้อมูลได้
          </p>
        </div>
      </header>
      <p className="permission-hint">
        แอดมินเข้าใช้งานได้เสมอ บัญชีอื่นต้องได้รับสิทธิ์รายบุคคล ·
        การอนุมัติคำร้องยังใช้สิทธิ์ผู้บริหาร/แอดมิน
      </p>
      <label className="search permission-search">
        <MagnifyingGlass />
        <input
          type="search"
          aria-label="ค้นหาครูเพื่อตั้งค่าสิทธิ์"
          placeholder="ค้นหาชื่อครูหรือบุคลากร"
          value={q}
          onChange={(e) => Q(e.target.value)}
        />
      </label>
      {error && (
        <p className="alert error" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="alert success" role="status">
          {notice}
        </p>
      )}
      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>ชื่อ–สกุล</th>
              <th>บทบาท</th>
              <th>สิทธิ์ทะเบียนย้าย</th>
            </tr>
          </thead>
          <tbody>
            {users
              .filter((u) => u.full_name.includes(q.trim()))
              .map((u) => (
                <tr key={u.id}>
                  <td>{u.full_name}</td>
                  <td>{roles[u.role]}</td>
                  <td>
                    <label className="access-toggle">
                      <input
                        type="checkbox"
                        aria-label={`อนุญาต ${u.full_name}`}
                        checked={!!u.allowed}
                        disabled={u.role === "superadmin" || busy !== null}
                        onChange={(e) => setAccess(u, e.target.checked)}
                      />
                      {u.role === "superadmin"
                        ? "มีสิทธิ์เสมอ"
                        : u.allowed
                          ? "อนุญาตแล้ว"
                          : "ยังไม่อนุญาต"}
                    </label>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
function downloadTemplate(format) {
  const text =
    format === "json"
      ? JSON.stringify([sample], null, 2)
      : "\uFEFF" +
        columns.join(",") +
        "\r\n" +
        columns
          .map((k) => '"' + String(sample[k]).replaceAll('"', '""') + '"')
          .join(",");
  const url = URL.createObjectURL(
    new Blob([text], {
      type: format === "json" ? "application/json" : "text/csv;charset=utf-8",
    }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = "transfer-template." + format;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function ImportPanel({ onImported }) {
  const [rows, R] = useState([]),
    [preview, P] = useState(null),
    [busy, B] = useState(false),
    [error, E] = useState(""),
    [issues, ISS] = useState([]),
    [name, N] = useState(""),
    [done, D] = useState(null);
  const batch = useRef(crypto.randomUUID());
  async function selectFile(file) {
    if (!file) return;
    B(true);
    E("");
    ISS([]);
    P(null);
    D(null);
    R([]);
    N(file.name);
    batch.current = crypto.randomUUID();
    try {
      const data = await parseImportFile(file);
      R(data);
      const checked = await request("/import/preview", {
        method: "POST",
        body: { rows: data, batch_ref: batch.current },
      });
      P(checked);
      ISS(checked.errors || []);
    } catch (e) {
      E(e.message);
    } finally {
      B(false);
    }
  }
  async function commit() {
    B(true);
    E("");
    try {
      const d = await request("/import", {
        method: "POST",
        body: { rows, batch_ref: batch.current },
      });
      D(d.imported);
      P(null);
      R([]);
      onImported();
    } catch (e) {
      E(e.message);
      ISS(e.details || []);
    } finally {
      B(false);
    }
  }
  return (
    <main className="workspace-page import-page">
      <header className="workspace-heading">
        <div>
          <div className="breadcrumb">งานทะเบียน / นำเข้าข้อมูล</div>
          <h1>นำเข้าข้อมูลย้ายเข้า–ย้ายออก</h1>
          <p>
            รองรับ XLSX, CSV และ JSON · ตรวจสอบก่อนบันทึกลงฐานข้อมูลโรงเรียน
          </p>
        </div>
      </header>
      <div className="import-guidance">
        <strong>1. เตรียมข้อมูลตามแบบฟอร์ม</strong>
        <p>
          ใช้แถวแรกเป็นชื่อคอลัมน์ XLSX อ่านชีตแรก · สูงสุด 200 รายการ / ไฟล์ 5
          MB · เลขประจำตัวควรเก็บเป็นข้อความเพื่อรักษาเลขศูนย์ด้านหน้า
        </p>
        <div className="template-actions">
          <button
            className="button secondary"
            onClick={() => downloadTemplate("csv")}
          >
            <DownloadSimple />
            แบบฟอร์ม CSV
          </button>
          <button
            className="button secondary"
            onClick={() => downloadTemplate("json")}
          >
            <DownloadSimple />
            แบบฟอร์ม JSON
          </button>
        </div>
        <details>
          <summary>คอลัมน์ที่ต้องใช้</summary>
          <p className="column-help">{columns.join(" · ")}</p>
          <p>
            direction: in / out หรือ ย้ายเข้า / ย้ายออก · academic_year: พ.ศ. ·
            term: 1 หรือ 2 · move_date: YYYY-MM-DD หรือ วว/ดด/ปปปป
          </p>
        </details>
      </div>
      <label className={"import-drop " + (busy ? "disabled" : "")}>
        <UploadSimple size={30} />
        <strong>
          {busy ? "กำลังตรวจสอบข้อมูล…" : "2. เลือกไฟล์เพื่อดูตัวอย่าง"}
        </strong>
        <span>{name || ".xlsx, .csv หรือ .json"}</span>
        <input
          type="file"
          accept=".xlsx,.csv,.json"
          aria-label="เลือกไฟล์นำเข้าข้อมูล"
          disabled={busy}
          onChange={(e) => {
            selectFile(e.target.files[0]);
            e.target.value = "";
          }}
        />
      </label>
      {error && (
        <p className="alert error" role="alert">
          {error}
        </p>
      )}
      {done !== null && (
        <div className="alert success" role="status">
          <CheckCircle />
          นำเข้าสำเร็จ {done} รายการ ข้อมูลปรากฏในคำร้องและ dashboard แล้ว
        </div>
      )}
      {preview && (
        <>
          <div className="import-result">
            <h2>3. ตรวจสอบและยืนยัน</h2>
            <p>
              ทั้งหมด {preview.total} รายการ · ผ่าน {preview.valid} · ต้องแก้ไข{" "}
              {issues.length}
            </p>
          </div>
          {issues.length > 0 && (
            <div className="import-errors" role="alert">
              <strong>ยังไม่มีการบันทึกข้อมูล</strong>
              <ul>
                {issues.map((e, i) => (
                  <li key={i}>
                    รายการที่ {e.row}: {e.error}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ประเภท</th>
                  <th>เลขประจำตัว</th>
                  <th>ชื่อนักเรียน</th>
                  <th>ระดับชั้น</th>
                  <th>วันที่ย้าย</th>
                </tr>
              </thead>
              <tbody>
                {preview.preview.map((r, i) => (
                  <tr key={i}>
                    <td>{r.direction === "in" ? "ย้ายเข้า" : "ย้ายออก"}</td>
                    <td>{r.student_code}</td>
                    <td>{r.student_name}</td>
                    <td>{r.grade_level}</td>
                    <td>{r.move_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="import-confirm">
            <p>
              นำเข้าเป็นคำร้องรอตรวจสอบ เอกสารและการอนุมัติดำเนินการในหน้าคำร้อง
            </p>
            <button
              className="button primary"
              disabled={busy || issues.length > 0 || !preview.valid}
              onClick={commit}
            >
              {busy ? "กำลังบันทึก…" : `ยืนยันนำเข้า ${preview.valid} รายการ`}
            </button>
          </div>
        </>
      )}
    </main>
  );
}
