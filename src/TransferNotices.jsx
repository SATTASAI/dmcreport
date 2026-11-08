import { useState, useEffect, useCallback, useRef } from "react";
import { ArrowClockwise, CheckCircle, Clock } from "@phosphor-icons/react";

export function TransferNotices({ api, onPending, date, onOpenRequest }) {
  const [data, setData] = useState({ notices: [], total: 0, pending: 0 });
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const sequence = useRef(0);
  const load = useCallback(async () => {
    const current = ++sequence.current;
    setLoading(true);
    try {
      const result = await api(`/notices?offset=${offset}`, {
        cache: "no-store",
      });
      if (current !== sequence.current) return;
      setData(result);
      onPending(result.pending);
      setError("");
    } catch (e) {
      if (current === sequence.current) setError(e.message);
    } finally {
      if (current === sequence.current) setLoading(false);
    }
  }, [api, offset, onPending]);
  useEffect(() => {
    load();
    const timer = setInterval(load, 30000);
    window.addEventListener("focus", load);
    return () => {
      ++sequence.current;
      clearInterval(timer);
      window.removeEventListener("focus", load);
    };
  }, [load]);
  async function acknowledge(id) {
    setBusy(id);
    try {
      const result = await api(`/notices/${id}/acknowledge`, {
        method: "POST",
      });
      await load();
      const row = data.notices.find((item) => item.id === id);
      if (result.request_id && row)
        onOpenRequest(result.request_id, row.direction);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  }
  return (
    <main className="transfer-notices">
      <header className="notices-heading">
        <div>
          <div className="breadcrumb">งานทะเบียน / แจ้งย้าย</div>
          <h1>
            แจ้งย้าย <span>({data.total})</span>
          </h1>
        </div>
        <button
          className="icon-btn"
          aria-label="รีเฟรชแจ้งย้าย"
          onClick={load}
          disabled={loading}
        >
          <ArrowClockwise size={24} />
        </button>
      </header>
      <p>
        ข้อมูลเบื้องต้นจากผู้ปกครอง
        เจ้าหน้าที่กรอกทะเบียนและเอกสารเพิ่มเติมภายหลัง
      </p>
      <div className="notices-tools">
        <span className="badge pending">
          <Clock />
          รอตรวจสอบ {data.pending} รายการ
        </span>
        <a href="/transfer-notices.html">QR Code สำหรับผู้ปกครอง</a>
      </div>
      {error && (
        <div className="alert error" role="alert">
          {error}
          <button onClick={load}>ลองใหม่</button>
        </div>
      )}
      <section
        className="notice-records"
        aria-label="รายการแจ้งย้าย"
        aria-busy={loading}
      >
        {!data.total && (
          <p role="status">
            {loading
              ? "กำลังโหลด…"
              : error
                ? "โหลดรายการไม่สำเร็จ"
                : "ยังไม่มีรายการแจ้งย้าย"}
          </p>
        )}
        {data.notices.map((row) => (
          <article key={row.id} className="notice-card">
            <div className="notice-card-heading">
              <span className="notice-direction">
                {row.direction === "in" ? "ย้ายเข้า" : "ย้ายออก"}
              </span>
              <span
                className={
                  "badge " + (row.acknowledged_at ? "approved" : "pending")
                }
              >
                {row.acknowledged_at ? (
                  <CheckCircle />
                ) : (
                  <>
                    <span className="notice-dot inline" />
                    <Clock />
                  </>
                )}
                {row.acknowledged_at ? "ตรวจสอบแล้ว" : "รอตรวจสอบ"}
              </span>
            </div>
            <h2>{row.student_name}</h2>
            <dl>
              {[
                ["เลขรับแจ้ง", row.receipt],
                ["วันที่แจ้ง", date(row.created_at)],
                ...(row.direction === "out"
                  ? [["โรงเรียนปลายทาง", row.destination_school]]
                  : []),
                ["เบอร์ติดต่อ", row.contact_phone],
                ["ที่อยู่", row.contact_address],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>
                    {label === "เบอร์ติดต่อ" ? (
                      <a href={`tel:${value}`}>{value}</a>
                    ) : (
                      value
                    )}
                  </dd>
                </div>
              ))}
            </dl>
            {row.request_id && (
              <button
                className="button primary"
                onClick={() => onOpenRequest(row.request_id, row.direction)}
              >
                เปิดคำร้องเพื่อดำเนินการต่อ
              </button>
            )}
            {row.acknowledged_at && !row.request_id && (
              <button
                className="button primary"
                disabled={busy !== null || loading}
                onClick={() => acknowledge(row.id)}
              >
                สร้างคำร้องเพื่อดำเนินการต่อ
              </button>
            )}
            {row.acknowledged_at ? (
              <p className="notice-ack">
                ตรวจสอบโดย {row.acknowledged_name || "เจ้าหน้าที่"} ·{" "}
                {date(row.acknowledged_at)}
              </p>
            ) : (
              <button
                className="button primary"
                disabled={busy !== null || loading}
                onClick={() => acknowledge(row.id)}
              >
                <CheckCircle />
                {busy === row.id ? "กำลังบันทึก…" : "ตรวจสอบแล้ว"}
              </button>
            )}
          </article>
        ))}
      </section>
      <div className="notice-pagination">
        <button
          disabled={!offset || loading || busy !== null}
          onClick={() => setOffset((n) => Math.max(0, n - 50))}
        >
          ก่อนหน้า
        </button>
        <span>
          {data.total
            ? `${offset + 1}–${offset + data.notices.length} / ${data.total}`
            : "0 รายการ"}
        </span>
        <button
          disabled={offset + 50 >= data.total || loading || busy !== null}
          onClick={() => setOffset((n) => n + 50)}
        >
          ถัดไป
        </button>
      </div>
    </main>
  );
}
