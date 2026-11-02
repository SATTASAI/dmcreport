# ทะเบียนย้ายเข้า–ย้ายออก · โรงเรียนบ้านป่าเด็ง

เว็บจริงตามแนวทาง Review Desk (แบบที่ 3): รายการคำร้องทางซ้ายและข้อมูล/เอกสารทางขวา รองรับมือถือ ภาษาไทย และฟอนต์ Sarabun ที่ให้บริการจากระบบเอง

## ระบบที่ใช้งาน

- หน้าเว็บ: `https://system.banpadengschool.ac.th/dmcreport/`
- Dashboard: `https://system.banpadengschool.ac.th/dashboard`
- Frontend source: repo `SATTASAI/dmcreport`
- API, ฐานข้อมูล และไฟล์ production: repo/Worker `SATTASAI/banpadeng-school-db`
- ข้อมูลคำร้องอยู่ใน Cloudflare D1 เดิม `banpadeng_school_db` ผ่าน binding `DB` ไม่สร้างฐานนักเรียนอีกชุด
- ไฟล์อยู่ใน Google Drive เดิมของโรงเรียน แยกโฟลเดอร์ `ทะเบียนย้ายเข้า-ออก/{request_id}`; อ่านไฟล์ผ่าน API ที่ตรวจบัญชีและสิทธิ์ ไม่มีลิงก์สาธารณะ
- ใช้ session cookie โรงเรียนผ่าน origin เดียวกัน ไม่มี API key หรือรหัสผ่านฝังใน frontend

## การใช้งาน

เจ้าหน้าที่ (`staff`), ผู้บริหาร (`executive`) และผู้ดูแล (`superadmin`) บันทึก/ดูคำร้อง แนบเอกสาร ตรวจเอกสาร และขอเอกสารเพิ่มเติมได้ ผู้บริหาร/ผู้ดูแลเป็นผู้อนุมัติหรือไม่อนุมัติ คำร้องที่สิ้นสุดแล้วแก้ไขไม่ได้ ระบบเก็บประวัติการตรวจและการพิจารณา

เอกสารที่ต้องแนบและตรวจครบก่อนอนุมัติ: หนังสือส่งตัว ระเบียนแสดงผลการเรียน และสำเนาทะเบียนบ้าน รองรับ PDF ไม่เกิน 1 MB และรูปภาพไม่เกิน 2 MB ตามข้อกำหนดไฟล์ของระบบโรงเรียน

การย้ายออกต้องใช้เลขประจำตัวและชื่อนักเรียนที่ตรงกับทะเบียนกลางและกำลังศึกษาอยู่ บันทึกซ้ำในประเภท/ปี/ภาคเรียนเดียวกันไม่ได้; คำร้องที่ถูกยกเลิกหรือไม่อนุมัติยื่นใหม่ได้

**ขอบเขตทะเบียน:** การอนุมัติบันทึกผลคำร้องและยอดย้ายบน dashboard ไม่เปลี่ยน roster, สถานะนักเรียนรายภาค หรือผลการเรียนโดยอัตโนมัติ เพราะข้อมูลเหล่านั้นมีระบบรายงานผลการเรียนเป็นเจ้าของตามโครงสร้างโรงเรียนเดิม ต้องดำเนินการทะเบียนกลางในระบบนั้นด้วย ยอด dashboard ใหม่ระบุชัดว่าเป็นยอดคำร้องและยอดอนุมัติ ไม่ใช่ยอดนักเรียนกำลังศึกษา

## พัฒนาและเผยแพร่

```sh
npm ci
npm run dev
npm run build
npm run test:sites
npm run sync:school -- ../banpadeng-school-db
```

Dev server อยู่ที่ `/dmcreport/`; `/api` proxy ไปยัง `TRANSFER_API_TARGET` (ค่าเริ่มต้น `http://127.0.0.1:8789`) ตั้งเป้าไป development API ที่มีบัญชี/ฐานทดสอบเท่านั้น ไม่มีข้อมูลจำลองหรือบัญชีทดสอบรวมใน production bundle

หลัง build และ sync ให้ commit/push source ใน repo นี้ และ assets ที่ `public/dmcreport/` ใน repo `banpadeng-school-db` พร้อม API ที่เกี่ยวข้อง การ push `main` ของ backend ใช้ workflow Cloudflare เดิมเพื่อ deploy โดยรักษา bindings/secrets เดิมไว้

## API และความสอดคล้องของข้อมูล

- `GET/POST /api/student-transfers` รายการ/สร้างคำร้อง (รายการแบ่งหน้า 100 รายการ รองรับ `q`, `direction`, `status`, `offset`)
- `GET /api/student-transfers/:id` ข้อมูล เอกสาร และประวัติ
- `PATCH /api/student-transfers/:id/note` บันทึกข้อความ
- `POST /api/student-transfers/:id/documents/:kind` แนบไฟล์ (`file`, `version` แบบ multipart)
- `GET /api/student-transfers/:id/documents/:kind` เปิดเอกสารที่ได้รับสิทธิ์
- `PATCH /api/student-transfers/:id/documents/:kind/verify` ผลตรวจ (`version`, `verified`)
- `POST /api/student-transfers/:id/decision` เปลี่ยนสถานะ (`version`, `status`, `note`)
- `/api/overview` เพิ่ม `student_transfer_summary`: `total`, `pending`, `needs_documents`, `approved_in`, `approved_out` (ทุกปีการศึกษา ไม่ผูกกับตัวกรองปีงบประมาณ)

ตารางสร้างเพิ่มแบบไม่ลบข้อมูล: `student_transfer_requests`, `student_transfer_documents`, `student_transfer_events` ใช้ optimistic version และ D1 batch ป้องกันการแก้ทับ ตรวจสิทธิ์ที่ API ทุกครั้ง มี idempotency key สำหรับการบันทึกซ้ำจากการ retry และ unique index กันคำร้องซ้ำ ยอด dashboard อ่านจาก ledger โดยตรงและมี revision triggers ร่วมกับ polling 2 วินาทีเดิม

ตรวจด้วย backend test suite และ browser โดยใช้ข้อมูลจำลองแยกจาก production ดูหลักฐานการตรวจเทียบภาพใน `design-qa.md` และ `docs/` การทดสอบ Google Drive จริงและการล็อกอินจริงต้องใช้บัญชีโรงเรียน ไม่มีการบันทึกข้อมูลทดสอบลง production
