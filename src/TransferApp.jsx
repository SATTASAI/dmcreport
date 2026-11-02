import {
  StudentsFrame,
  StudentDirectory,
  Permissions,
  ImportPanel,
} from "./RegistryPages.jsx";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  BookOpen,
  Files,
  Users,
  ChartBar,
  Gear,
  MagnifyingGlass,
  Plus,
  FileText,
  CheckCircle,
  Clock,
  UploadSimple,
  ArrowSquareOut,
  ArrowLeft,
  ArrowClockwise,
  X,
  WarningCircle,
  DownloadSimple,
} from "@phosphor-icons/react";
const API = "/api/student-transfers";
const labels = {
  pending: "รอตรวจสอบ",
  needs_documents: "รอเอกสารเพิ่มเติม",
  approved: "อนุมัติแล้ว",
  rejected: "ไม่อนุมัติ",
  cancelled: "ยกเลิกแล้ว",
};
const kinds = [
  ["referral", "หนังสือส่งตัว"],
  ["transcript", "ระเบียนแสดงผลการเรียน"],
  ["household", "สำเนาทะเบียนบ้าน"],
];
const no = (r) => `TR-${r.academic_year}-${String(r.id).padStart(4, "0")}`;
const date = (v) =>
  v
    ? new Intl.DateTimeFormat("th-TH", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Bangkok",
      }).format(
        new Date(
          v.length === 10 ? v + "T00:00:00+07:00" : v.replace(" ", "T") + "Z",
        ),
      )
    : "—";
async function api(path = "", options = {}) {
  const form = options.body instanceof FormData;
  const res = await fetch(path.startsWith("/api/") ? path : API + path, {
    credentials: "same-origin",
    ...options,
    headers: {
      ...(!form ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
    body: options.body
      ? form
        ? options.body
        : JSON.stringify(options.body)
      : undefined,
  });
  const data = await res
    .json()
    .catch(() => ({ error: "ไม่สามารถอ่านข้อมูลจากระบบได้" }));
  if (!res.ok) {
    const e = new Error(data.error || "ดำเนินการไม่สำเร็จ");
    e.status = res.status;
    throw e;
  }
  return data;
}
function Badge({ status }) {
  return (
    <span className={"badge " + status}>
      {status === "approved" ? <CheckCircle weight="fill" /> : <Clock />}
      {labels[status]}
    </span>
  );
}
export function App() {
  return new URLSearchParams(window.location.search).get("view") ===
    "students-frame" ? (
    <StudentDirectory />
  ) : (
    <RegistryApp />
  );
}
function RegistryApp() {
  const [user, U] = useState(null),
    [auth, A] = useState("loading"),
    [rows, R] = useState([]),
    [total, T] = useState(0),
    [summary, S] = useState({}),
    [direction, D] = useState("in"),
    [status, ST] = useState(""),
    [search, Q] = useState(""),
    [query, QQ] = useState(""),
    [offset, O] = useState(0),
    [id, I] = useState(null),
    [detail, V] = useState(null),
    [loading, L] = useState(false),
    [opening, OP] = useState(false),
    [error, E] = useState(""),
    [notice, N] = useState(""),
    [busy, B] = useState(false),
    [note, NT] = useState(""),
    [create, C] = useState(false),
    [decision, DC] = useState(null),
    [page, P] = useState("requests");
  const seq = useRef(0),
    detailSeq = useRef(0);
  const [refresh, REFRESH] = useState(0);
  const [registrationStudent, selectRegistrationStudent] = useState(null);
  const [selectingStudent, setSelectingStudent] = useState(false);
  const [selectionError, setSelectionError] = useState("");
  const studentSequence = useRef(0);
  const registerStudent = useCallback(async (studentId) => {
    const current = ++studentSequence.current;
    setSelectingStudent(true);
    setSelectionError("");
    try {
      const data = await api("/students/" + studentId);
      if (current !== studentSequence.current) return;
      selectRegistrationStudent(data.student);
      C(false);
      P("students");
    } catch (error) {
      if (current === studentSequence.current) setSelectionError(error.message);
    } finally {
      if (current === studentSequence.current) setSelectingStudent(false);
    }
  }, []);
  async function saveRegistration(body) {
    B(true);
    try {
      const data = await api("", { method: "POST", body });
      C(false);
      selectRegistrationStudent(null);
      P("requests");
      D(body.direction);
      Q("");
      QQ("");
      ST("");
      O(0);
      I(data.id);
      REFRESH((n) => n + 1);
      N("บันทึกคำร้องเรียบร้อยแล้ว");
    } finally {
      B(false);
    }
  }
  useEffect(() => {
    api("/api/auth/me")
      .then(async (d) => {
        if (!d.user) {
          A("login");
          return;
        }
        U(d.user);
        const access = await api("/access");
        U({ ...d.user, transfer_access: access });
        A("ready");
      })
      .catch((e) => {
        A(e.status === 401 ? "login" : "error");
        E(e.message);
      });
  }, []);
  useEffect(() => {
    const t = setTimeout(() => {
      QQ(search);
      O(0);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);
  const allowed = !!user?.transfer_access?.allowed;
  useEffect(() => {
    const studentId = Number(
      new URLSearchParams(window.location.search).get("register_student"),
    );
    if (allowed && Number.isSafeInteger(studentId) && studentId > 0)
      registerStudent(studentId);
  }, [allowed, registerStudent]);
  const load = useCallback(async () => {
    const s = ++seq.current;
    L(true);
    try {
      const d = await api(
        "?" +
          new URLSearchParams({
            direction,
            status,
            q: query,
            offset: String(offset),
          }),
      );
      if (s !== seq.current) return;
      R(d.requests);
      T(d.total);
      S(d.summary);
      E("");
      I((prev) =>
        d.requests.some((r) => r.id === prev)
          ? prev
          : window.matchMedia("(max-width: 620px)").matches
            ? null
            : (d.requests[0]?.id ?? null),
      );
    } catch (e) {
      if (s === seq.current) E(e.message);
    } finally {
      if (s === seq.current) L(false);
    }
  }, [direction, status, query, offset]);
  const open = useCallback(async (key) => {
    const s = ++detailSeq.current;
    OP(true);
    try {
      const d = await api("/" + key);
      if (s !== detailSeq.current) return;
      V(d);
      NT(d.request.note || "");
    } catch (e) {
      if (s === detailSeq.current) E(e.message);
    } finally {
      if (s === detailSeq.current) OP(false);
    }
  }, []);
  useEffect(() => {
    if (auth === "ready" && allowed) load();
  }, [auth, allowed, load, refresh]);
  useEffect(() => {
    V(null);
    if (id) open(id);
    else ++detailSeq.current;
  }, [id, open]);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => N(""), 5000);
    return () => clearTimeout(t);
  }, [notice]);
  async function mutate(path, method, body, message) {
    if (busy) return;
    B(true);
    E("");
    try {
      await api(path, { method, body });
      N(message);
      DC(null);
      await Promise.all([load(), id ? open(id) : Promise.resolve()]);
      window.dispatchEvent(new CustomEvent("school:data-changed"));
    } catch (e) {
      E(e.message);
      if (e.status === 409 && id) await open(id);
    } finally {
      B(false);
    }
  }
  async function upload(kind, file) {
    if (!file) return;
    const f = new FormData();
    f.set("file", file);
    f.set("version", String(detail.request.version));
    await mutate(
      `/${id}/documents/${kind}`,
      "POST",
      f,
      "แนบเอกสารเรียบร้อยแล้ว",
    );
  }
  const r = detail?.request,
    mutable = r && ["pending", "needs_documents"].includes(r.status),
    verified = detail?.documents.filter((d) => d.verified).length || 0;
  if (auth === "loading")
    return (
      <div className="auth-screen">
        <BookOpen size={40} />
        <h1>ทะเบียนนักเรียน</h1>
        <p>กำลังตรวจสอบบัญชีโรงเรียน…</p>
      </div>
    );
  if (auth !== "ready" || !allowed)
    return (
      <div className="auth-screen">
        <BookOpen size={40} />
        <h1>ทะเบียนย้ายเข้า–ย้ายออก</h1>
        <p>
          {auth === "error"
            ? error
            : user
              ? "บัญชีนี้ยังไม่ได้รับสิทธิ์ กรุณาติดต่อแอดมินเพื่อขอใช้งานทะเบียนย้าย"
              : "เข้าสู่ระบบด้วยบัญชีโรงเรียนเพื่อจัดการคำร้อง"}
        </p>
        <a className="button primary" href="/login.html">
          เข้าสู่ระบบโรงเรียน
        </a>
        <a href="/dashboard">กลับหน้าภาพรวม</a>
      </div>
    );
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="/dmcreport/">
          <BookOpen />
          <span>
            ทะเบียนนักเรียน<small>โรงเรียนบ้านป่าเด็ง</small>
          </span>
        </a>
        <nav aria-label="เมนูหลัก">
          <button
            className={page === "requests" ? "active" : ""}
            onClick={() => P("requests")}
          >
            <Files />
            คำร้องย้าย
          </button>
          <button
            className={page === "students" ? "active" : ""}
            onClick={() => P("students")}
          >
            <Users />
            นักเรียน
          </button>
          <button
            className={page === "imports" ? "active" : ""}
            onClick={() => P("imports")}
          >
            <UploadSimple />
            นำเข้าข้อมูล
          </button>
          <button
            className={page === "reports" ? "active" : ""}
            onClick={() => P("reports")}
          >
            <ChartBar />
            รายงาน
          </button>
          <>
            {user.transfer_access?.manage_permissions && (
              <button
                className={page === "permissions" ? "active" : ""}
                onClick={() => P("permissions")}
              >
                <Gear />
                ตั้งค่าสิทธิ์
              </button>
            )}
          </>
        </nav>
        <div className="sidebar-bottom">
          <a href="/dashboard">
            <ArrowLeft />
            กลับหน้าภาพรวม
          </a>
          <div className="staff">
            <Users />
            <div>
              <strong>{user.full_name}</strong>
              <small>
                {user.role === "staff"
                  ? "เจ้าหน้าที่ทะเบียน"
                  : user.role === "teacher"
                    ? "ครูผู้ได้รับสิทธิ์"
                    : user.role === "superadmin"
                      ? "แอดมิน"
                      : "ผู้ได้รับสิทธิ์ทะเบียนย้าย"}
              </small>
            </div>
          </div>
        </div>
      </aside>
      {page === "students" ? (
        <StudentsFrame
          onRegister={registerStudent}
          loading={selectingStudent}
          error={selectionError}
          selectedId={registrationStudent?.id}
          panel={
            registrationStudent && (
              <Create
                key={registrationStudent.id}
                inline
                student={registrationStudent}
                direction={
                  registrationStudent.status === "enrolled" ? "out" : "in"
                }
                busy={busy || selectingStudent}
                close={() => selectRegistrationStudent(null)}
                save={saveRegistration}
              />
            )
          }
        />
      ) : page === "permissions" && user.transfer_access?.manage_permissions ? (
        <Permissions />
      ) : page === "imports" ? (
        <ImportPanel onImported={() => REFRESH((n) => n + 1)} />
      ) : page === "reports" ? (
        <Reports summary={summary} onBack={() => P("requests")} />
      ) : (
        <>
          <section
            className={"inbox " + (id ? "has-selection" : "")}
            aria-label="รายการคำร้อง"
          >
            <div className="inbox-head">
              {error && !id && (
                <div className="alert error" role="alert">
                  {error}
                </div>
              )}
              <div className="inbox-title">
                <h1>
                  คำร้องย้าย <span>({total})</span>
                </h1>
                <button
                  className="icon-button"
                  title="อัปเดตข้อมูล"
                  aria-label="อัปเดตข้อมูล"
                  disabled={loading || busy}
                  onClick={() => {
                    load();
                    if (id) open(id);
                  }}
                >
                  <ArrowClockwise />
                </button>
              </div>
              <button className="new-request" onClick={() => C(true)}>
                <Plus />
                ลงทะเบียนย้าย
              </button>
              <label className="search">
                <MagnifyingGlass />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => Q(e.target.value)}
                  placeholder="ค้นหาชื่อ เลขประจำตัว หรือเลขคำร้อง"
                  aria-label="ค้นหาคำร้อง"
                />
              </label>
              <div className="tabs" role="group" aria-label="ประเภทการย้าย">
                {[
                  ["in", "ย้ายเข้า"],
                  ["out", "ย้ายออก"],
                ].map(([key, text]) => (
                  <button
                    key={key}
                    className={direction === key ? "active" : ""}
                    aria-pressed={direction === key}
                    onClick={() => {
                      D(key);
                      O(0);
                    }}
                  >
                    {text}
                  </button>
                ))}
              </div>
              <label className="status-filter">
                สถานะ
                <select
                  aria-label="กรองสถานะ"
                  value={status}
                  onChange={(e) => {
                    ST(e.target.value);
                    O(0);
                  }}
                >
                  <option value="">ทั้งหมด</option>
                  {Object.entries(labels).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="request-list" aria-busy={loading}>
              {loading ? (
                <div className="empty small">กำลังโหลดคำร้อง…</div>
              ) : rows.length ? (
                rows.map((item) => (
                  <button
                    key={item.id}
                    className={
                      "request-row " + (id === item.id ? "selected" : "")
                    }
                    aria-current={id === item.id ? "true" : undefined}
                    onClick={() => I(item.id)}
                  >
                    <div className="row-top">
                      <strong>{item.student_name}</strong>
                      <time>{date(item.created_at)}</time>
                    </div>
                    <div className="row-bottom">
                      <span>
                        {item.grade_level} · {item.student_code}
                      </span>
                      <Badge status={item.status} />
                    </div>
                  </button>
                ))
              ) : (
                <div className="empty small">
                  <Files size={32} />
                  <strong>ไม่พบคำร้อง</strong>
                  <p>
                    {query || status
                      ? "ลองเปลี่ยนคำค้นหาหรือตัวกรอง"
                      : "เริ่มบันทึกคำร้องย้ายรายการแรก"}
                  </p>
                  <button onClick={() => C(true)}>ลงทะเบียนย้าย</button>
                </div>
              )}
            </div>
            {(offset > 0 || total > 100) && (
              <div className="pagination">
                <button
                  disabled={!offset || loading}
                  onClick={() => O((n) => Math.max(0, n - 100))}
                >
                  ก่อนหน้า
                </button>
                <span>
                  {offset + 1}–{Math.min(offset + 100, total)} / {total}
                </span>
                <button
                  disabled={offset + 100 >= total || loading}
                  onClick={() => O((n) => n + 100)}
                >
                  ถัดไป
                </button>
              </div>
            )}
            <div className="inbox-footer">
              <span className="live-dot" />
              ข้อมูลจากทะเบียนโรงเรียน
            </div>
          </section>
          <main className={"detail " + (id ? "show-mobile" : "")}>
            {error && (
              <div className="alert error" role="alert">
                <WarningCircle />
                {error}
                <button aria-label="ปิดข้อความ" onClick={() => E("")}>
                  <X />
                </button>
              </div>
            )}
            {notice && (
              <div className="alert success" role="status">
                <CheckCircle />
                {notice}
              </div>
            )}
            {opening ? (
              <div className="empty">กำลังเปิดคำร้อง…</div>
            ) : r ? (
              <>
                <header className="detail-header">
                  <button className="mobile-back" onClick={() => I(null)}>
                    <ArrowLeft />
                    รายการคำร้อง
                  </button>
                  <div className="breadcrumb">
                    คำร้องย้าย <span>/</span> {no(r)}
                  </div>
                  <div className="detail-title">
                    <h2>
                      ตรวจสอบคำร้องย้าย{r.direction === "in" ? "เข้า" : "ออก"}
                    </h2>
                    <Badge status={r.status} />
                  </div>
                  <p>ยื่นคำร้อง {date(r.created_at)}</p>
                </header>
                <div className="detail-body">
                  <section className="student-info">
                    <h3>{r.student_name}</h3>
                    <p className="student-meta">
                      เลขประจำตัว {r.student_code} · ปีการศึกษา{" "}
                      {r.academic_year} / ภาคเรียนที่ {r.term}
                    </p>
                    <dl>
                      <dt>ระดับชั้น</dt>
                      <dd>{r.grade_level}</dd>
                      <dt>
                        {r.direction === "in"
                          ? "โรงเรียนเดิม"
                          : "โรงเรียนปลายทาง"}
                      </dt>
                      <dd>{r.school_name}</dd>
                      <dt>วันที่ต้องการย้าย</dt>
                      <dd>{date(r.move_date)}</dd>
                      <dt>เหตุผลในการย้าย</dt>
                      <dd>{r.reason}</dd>
                    </dl>
                  </section>
                  <section className="documents">
                    <div className="section-title">
                      <h3>เอกสารประกอบ</h3>
                      <span>ตรวจแล้ว {verified} / 3</span>
                    </div>
                    {kinds.map(([kind, text]) => {
                      const doc = detail.documents.find((d) => d.kind === kind);
                      return (
                        <div className="document-row" key={kind}>
                          <FileText className="doc-icon" size={32} />
                          <div className="document-name">
                            <strong>{text}</strong>
                            {doc && (
                              <small title={doc.file_name}>
                                {doc.file_name}
                              </small>
                            )}
                          </div>
                          <span
                            className={
                              "doc-status " +
                              (doc?.verified ? "verified" : "waiting")
                            }
                          >
                            {doc?.verified ? (
                              <CheckCircle weight="fill" />
                            ) : (
                              <Clock />
                            )}
                            {doc?.verified
                              ? "ตรวจสอบแล้ว"
                              : doc
                                ? "รอตรวจสอบ"
                                : "ยังไม่แนบ"}
                          </span>
                          <div className="document-actions">
                            {doc && (
                              <a
                                href={`${API}/${r.id}/documents/${kind}`}
                                target="_blank"
                                rel="noopener"
                              >
                                เปิดเอกสาร <ArrowSquareOut />
                              </a>
                            )}
                            {mutable && (
                              <label
                                className={"upload " + (busy ? "disabled" : "")}
                              >
                                <UploadSimple />
                                {doc ? "เปลี่ยนไฟล์" : "แนบไฟล์"}
                                <input
                                  type="file"
                                  aria-label={`แนบ${text}`}
                                  accept="application/pdf,image/jpeg,image/png,image/webp"
                                  disabled={busy}
                                  onChange={(e) => {
                                    upload(kind, e.target.files[0]);
                                    e.target.value = "";
                                  }}
                                />
                              </label>
                            )}
                            {doc && mutable && (
                              <label className="verify">
                                <input
                                  type="checkbox"
                                  aria-label={`ตรวจสอบ${text}`}
                                  checked={!!doc.verified}
                                  disabled={busy}
                                  onChange={(e) =>
                                    mutate(
                                      `/${r.id}/documents/${kind}/verify`,
                                      "PATCH",
                                      {
                                        version: r.version,
                                        verified: e.target.checked,
                                      },
                                      "บันทึกผลตรวจเอกสารแล้ว",
                                    )
                                  }
                                />
                                ตรวจแล้ว
                              </label>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {mutable && (
                      <p className="file-help">
                        รองรับ PDF ไม่เกิน 1 MB หรือรูปภาพไม่เกิน 2 MB ต่อไฟล์
                      </p>
                    )}
                  </section>
                  <section className="notes">
                    <div className="section-title">
                      <label htmlFor="staff-note">บันทึกของเจ้าหน้าที่</label>
                      {mutable && note !== r.note && (
                        <button
                          className="text-button"
                          disabled={busy}
                          onClick={() =>
                            mutate(
                              `/${r.id}/note`,
                              "PATCH",
                              { version: r.version, note },
                              "บันทึกข้อความแล้ว",
                            )
                          }
                        >
                          บันทึกข้อความ
                        </button>
                      )}
                    </div>
                    <textarea
                      id="staff-note"
                      maxLength={2000}
                      rows={3}
                      placeholder="ระบุความคิดเห็นหรือบันทึกเพิ่มเติม (ถ้ามี)"
                      value={note}
                      disabled={!mutable || busy}
                      onChange={(e) => NT(e.target.value)}
                    />
                  </section>
                  {detail.events.length > 0 && (
                    <details className="history">
                      <summary>
                        ประวัติการดำเนินการ ({detail.events.length})
                      </summary>
                      {detail.events.map((ev, i) => (
                        <div key={i}>
                          <strong>
                            {{
                              upload: "แนบเอกสาร",
                              verify: "ตรวจเอกสาร",
                              unverify: "ยกเลิกผลตรวจ",
                              note: "บันทึกข้อความ",
                              ...labels,
                            }[ev.action] || ev.action}
                          </strong>
                          <span>
                            {ev.user_name} · {date(ev.created_at)}
                          </span>
                          {ev.note && (
                            <p>
                              {kinds.find((k) => k[0] === ev.note)?.[1] ||
                                ev.note}
                            </p>
                          )}
                        </div>
                      ))}
                    </details>
                  )}
                </div>
                {mutable && (
                  <footer className="detail-footer">
                    <button
                      className="text-button danger"
                      disabled={busy}
                      onClick={() => DC("cancelled")}
                    >
                      ยกเลิกคำร้อง
                    </button>
                    <div>
                      <button
                        className="button secondary"
                        disabled={busy}
                        onClick={() => DC("needs_documents")}
                      >
                        ขอเอกสารเพิ่มเติม
                      </button>
                      {detail.can_decide && (
                        <>
                          <button
                            className="text-button"
                            disabled={busy}
                            onClick={() => DC("rejected")}
                          >
                            ไม่อนุมัติ
                          </button>
                          <button
                            className="button primary"
                            disabled={busy || verified !== 3}
                            title={
                              verified !== 3
                                ? "ตรวจเอกสารให้ครบทั้ง 3 รายการก่อนอนุมัติ"
                                : undefined
                            }
                            onClick={() => DC("approved")}
                          >
                            อนุมัติคำร้อง
                          </button>
                        </>
                      )}
                    </div>
                  </footer>
                )}
              </>
            ) : (
              <div className="empty">
                <Files size={48} />
                <h2>ทะเบียนย้ายเข้า–ย้ายออก</h2>
                <p>เลือกคำร้องเพื่อตรวจสอบข้อมูลและเอกสาร</p>
                <button className="button primary" onClick={() => C(true)}>
                  <Plus />
                  ลงทะเบียนย้าย
                </button>
              </div>
            )}
          </main>
        </>
      )}
      {create && (
        <Create
          direction={direction}
          busy={busy}
          close={() => {
            C(false);
            selectRegistrationStudent(null);
          }}
          save={saveRegistration}
        />
      )}
      {decision && (
        <Decision
          error={error}
          status={decision}
          initial={note}
          busy={busy}
          close={() => DC(null)}
          confirm={(value) =>
            mutate(
              `/${r.id}/decision`,
              "POST",
              { version: r.version, status: decision, note: value },
              "บันทึกผลพิจารณาเรียบร้อยแล้ว",
            )
          }
        />
      )}
    </div>
  );
}
function Modal({ title, close, children, busy }) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current.showModal();
    const d = ref.current;
    return () => d.close();
  }, []);
  return (
    <dialog
      ref={ref}
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) close();
      }}
    >
      <div className="modal-head">
        <h2>{title}</h2>
        <button
          className="icon-button"
          aria-label="ปิดหน้าต่าง"
          disabled={busy}
          onClick={close}
        >
          <X />
        </button>
      </div>
      {children}
    </dialog>
  );
}
function RegistrationFrame({ title, close, busy, children }) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
    if (window.matchMedia("(max-width:1000px)").matches)
      ref.current?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion:reduce)").matches
          ? "instant"
          : "smooth",
        block: "start",
      });
  }, []);
  return (
    <section
      ref={ref}
      tabIndex={-1}
      className="student-registration-panel"
      aria-label="ข้อมูลและลงทะเบียนนักเรียน"
    >
      <header className="registration-panel-heading">
        <div>
          <span>นักเรียนที่เลือก</span>
          <h2>{title}</h2>
        </div>
        <button
          className="icon-button"
          type="button"
          aria-label="ปิดข้อมูลนักเรียน"
          disabled={busy}
          onClick={close}
        >
          <X />
        </button>
      </header>
      {children}
    </section>
  );
}
function Create({ direction, student, busy, close, save, inline = false }) {
  const client = useRef(crypto.randomUUID()),
    [error, E] = useState(""),
    [type, D] = useState(direction);
  const today = new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10);
  const grades = [
    ...new Set(
      [
        student?.grade_level,
        "อนุบาล 1",
        "อนุบาล 2",
        "อนุบาล 3",
        ...Array.from({ length: 6 }, (_, i) => `ประถมศึกษาปีที่ ${i + 1}`),
        ...Array.from({ length: 6 }, (_, i) => `มัธยมศึกษาปีที่ ${i + 1}`),
      ].filter(Boolean),
    ),
  ];
  const Container = inline ? RegistrationFrame : Modal;
  return (
    <Container title="ลงทะเบียนย้ายนักเรียน" close={close} busy={busy}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const d = Object.fromEntries(new FormData(e.currentTarget));
          d.academic_year = Number(d.academic_year);
          d.term = Number(d.term);
          d.client_ref = client.current;
          E("");
          try {
            await save(d);
          } catch (err) {
            E(err.message);
          }
        }}
      >
        <div className="modal-body">
          <p className="form-intro">
            {student
              ? "เลือกนักเรียนจากทะเบียนกลางแล้ว กรุณาระบุประเภทการย้าย โรงเรียน วันที่ และเหตุผล"
              : "กรอกข้อมูลคำร้อง แล้วแนบเอกสารเพื่อตรวจสอบในขั้นตอนถัดไป"}
          </p>
          {error && (
            <p className="alert error" role="alert">
              {error}
            </p>
          )}
          <div className="form-grid">
            <label>
              ประเภทการย้าย
              <select
                name="direction"
                value={type}
                onChange={(e) => D(e.target.value)}
              >
                <option value="in">ย้ายเข้า</option>
                <option value="out">ย้ายออก</option>
              </select>
            </label>
            <label>
              วันที่ต้องการย้าย
              <input
                type="date"
                name="move_date"
                required
                defaultValue={today}
              />
            </label>
            <label>
              เลขประจำตัวนักเรียน
              <input
                name="student_code"
                required
                maxLength={30}
                defaultValue={student?.student_code || ""}
                readOnly={!!student}
              />
            </label>
            <label>
              ชื่อ–สกุลนักเรียน
              <input
                name="student_name"
                required
                maxLength={180}
                placeholder="รวมคำนำหน้าชื่อ"
                defaultValue={student?.full_name || ""}
                readOnly={!!student}
              />
            </label>
            <label>
              ระดับชั้น
              <select
                name="grade_level"
                required
                defaultValue={student?.grade_level || ""}
              >
                <option value="">เลือกระดับชั้น</option>
                {grades.map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
            <label>
              {type === "in" ? "โรงเรียนเดิม" : "โรงเรียนปลายทาง"}
              <input name="school_name" required maxLength={200} />
            </label>
            <label>
              ปีการศึกษา (พ.ศ.)
              <input
                type="number"
                name="academic_year"
                required
                min={2500}
                max={2700}
                defaultValue={
                  Number(today.slice(0, 4)) +
                  543 -
                  (Number(today.slice(5, 7)) < 5 ? 1 : 0)
                }
              />
            </label>
            <label>
              ภาคเรียน
              <select
                name="term"
                defaultValue={
                  Number(today.slice(5, 7)) >= 11 ||
                  Number(today.slice(5, 7)) < 5
                    ? "2"
                    : "1"
                }
              >
                <option value="1">ภาคเรียนที่ 1</option>
                <option value="2">ภาคเรียนที่ 2</option>
              </select>
            </label>
            <label className="full">
              เหตุผลในการย้าย
              <textarea name="reason" required maxLength={1000} rows={3} />
            </label>
          </div>
          {type === "out" && (
            <p className="file-help">
              ชื่อและเลขประจำตัวต้องตรงกับนักเรียนที่กำลังศึกษาในทะเบียนกลาง
            </p>
          )}
        </div>
        <div className="modal-footer">
          <button
            type="button"
            className="button secondary"
            disabled={busy}
            onClick={close}
          >
            ยกเลิก
          </button>
          <button className="button primary" disabled={busy}>
            {busy ? "กำลังบันทึก…" : "บันทึกคำร้อง"}
          </button>
        </div>
      </form>
    </Container>
  );
}
function Decision({ error, status, initial, busy, close, confirm }) {
  const [note, N] = useState(initial);
  return (
    <Modal
      title={status === "approved" ? "ยืนยันอนุมัติคำร้อง" : labels[status]}
      close={close}
      busy={busy}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          confirm(note);
        }}
      >
        <div className="modal-body">
          {error && (
            <div className="alert error" role="alert">
              {error}
            </div>
          )}
          <p>
            {status === "approved"
              ? "เอกสารได้รับการตรวจครบแล้ว เมื่ออนุมัติจะปิดการแก้ไขคำร้องนี้"
              : "ระบุเหตุผลเพื่อเก็บเป็นประวัติการดำเนินการ"}
          </p>
          <label className="form-label">
            เหตุผล / บันทึก
            <textarea
              value={note}
              onChange={(e) => N(e.target.value)}
              required={status !== "approved"}
              maxLength={2000}
              rows={4}
            />
          </label>
        </div>
        <div className="modal-footer">
          <button
            type="button"
            className="button secondary"
            disabled={busy}
            onClick={close}
          >
            กลับ
          </button>
          <button className="button primary" disabled={busy}>
            {busy ? "กำลังบันทึก…" : "ยืนยัน"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
function Reports({ summary, onBack }) {
  const [busy, B] = useState(false),
    [error, E] = useState("");
  async function download() {
    B(true);
    E("");
    try {
      let rows = [],
        offset = 0,
        total = 1;
      while (offset < total) {
        const d = await api("?offset=" + offset);
        rows.push(...d.requests);
        total = d.total;
        offset += 100;
      }
      const safe = (v) =>
        '"' +
        String(v ?? "")
          .replace(/^(?:\s*[=+@-]|[\t\r\n])/, "'$&")
          .replaceAll('"', '""') +
        '"';
      const csv =
        "\uFEFF" +
        [
          [
            "เลขคำร้อง",
            "ประเภท",
            "เลขประจำตัว",
            "ชื่อนักเรียน",
            "ระดับชั้น",
            "โรงเรียน",
            "ปีการศึกษา",
            "ภาคเรียน",
            "วันที่ย้าย",
            "สถานะ",
          ],
          ...rows.map((r) => [
            no(r),
            r.direction === "in" ? "ย้ายเข้า" : "ย้ายออก",
            r.student_code,
            r.student_name,
            r.grade_level,
            r.school_name,
            r.academic_year,
            r.term,
            r.move_date,
            labels[r.status],
          ]),
        ]
          .map((r) => r.map(safe).join(","))
          .join("\r\n");
      const url = URL.createObjectURL(
        new Blob([csv], { type: "text/csv;charset=utf-8" }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = "ทะเบียนย้ายนักเรียน.csv";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      E(e.message);
    } finally {
      B(false);
    }
  }
  return (
    <main className="reports">
      <div className="breadcrumb">งานทะเบียน / รายงาน</div>
      <h1>สรุปการย้ายเข้า–ย้ายออก</h1>
      <p>ข้อมูลคำร้องทุกปีการศึกษา จากฐานข้อมูลทะเบียนโรงเรียน</p>
      <div className="report-stats">
        {[
          ["คำร้องทั้งหมด", summary.total],
          ["รอดำเนินการ", summary.pending],
          ["ย้ายเข้า · อนุมัติแล้ว", summary.approved_in],
          ["ย้ายออก · อนุมัติแล้ว", summary.approved_out],
        ].map(([text, value]) => (
          <div key={text}>
            <span>{text}</span>
            <strong>{value || 0}</strong>
          </div>
        ))}
      </div>
      {error && (
        <p role="alert" className="alert error">
          {error}
        </p>
      )}
      <button className="button primary" disabled={busy} onClick={download}>
        <DownloadSimple />
        {busy ? "กำลังส่งออก…" : "ส่งออกทะเบียน CSV"}
      </button>
      <button className="text-button" onClick={onBack}>
        กลับไปคำร้องย้าย
      </button>
    </main>
  );
}
