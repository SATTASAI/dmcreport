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

แอดมิน (`superadmin`) เข้าใช้งานและตั้งค่าสิทธิ์ได้เสมอ บัญชีครู/เจ้าหน้าที่/ผู้บริหารอื่นต้องได้รับสิทธิ์รายบุคคลจากเมนู **ตั้งค่าสิทธิ์** ก่อน จึงดูและบันทึกคำร้อง แนบ/ตรวจเอกสาร ดูนักเรียนและนำเข้าข้อมูลได้ ผู้บริหารที่ได้รับสิทธิ์และแอดมินเป็นผู้อนุมัติหรือไม่อนุมัติ ทุกการมอบ/ถอนสิทธิ์มี audit log และตรวจสิทธิ์ทุก API ไม่มีการมอบสิทธิ์ครูคนใดอัตโนมัติ

เอกสารที่ต้องแนบและตรวจครบก่อนอนุมัติ: หนังสือส่งตัว ระเบียนแสดงผลการเรียน และสำเนาทะเบียนบ้าน รองรับ PDF ไม่เกิน 1 MB และรูปภาพไม่เกิน 2 MB ตามข้อกำหนดไฟล์ของระบบโรงเรียน

การย้ายออกต้องใช้เลขประจำตัวและชื่อนักเรียนที่ตรงกับทะเบียนกลางและกำลังศึกษาอยู่ บันทึกซ้ำในประเภท/ปี/ภาคเรียนเดียวกันไม่ได้; คำร้องที่ถูกยกเลิกหรือไม่อนุมัติยื่นใหม่ได้

**ขอบเขตทะเบียน:** การอนุมัติบันทึกผลคำร้องและยอดย้ายบน dashboard ไม่เปลี่ยน roster, สถานะนักเรียนรายภาค หรือผลการเรียนโดยอัตโนมัติ เพราะข้อมูลเหล่านั้นมีระบบรายงานผลการเรียนเป็นเจ้าของตามโครงสร้างโรงเรียนเดิม ต้องดำเนินการทะเบียนกลางในระบบนั้นด้วย ยอด dashboard ใหม่ระบุชัดว่าเป็นยอดคำร้องและยอดอนุมัติ ไม่ใช่ยอดนักเรียนกำลังศึกษา

## เมนูนักเรียนและนำเข้าข้อมูล

- **นักเรียน** แสดงตารางใน iframe บน origin เดียวกัน (`?view=students-frame`) อ่านเฉพาะข้อมูลพื้นฐานจากตาราง students ในฐานกลางผ่าน `/api/student-transfers/students` ไม่มีเลขบัตรประชาชน สุขภาพ หรือผู้ปกครอง ค้นหา/กรองสถานะและแบ่งหน้าได้
- เอาเมนูบัญชีของฉันออกจากแอปนี้
- **นำเข้าข้อมูล** รองรับ XLSX (ชีตแรก), CSV และ JSON array หรือ object ที่มี rows มีแบบฟอร์ม CSV/JSON ให้ดาวน์โหลด อ่านไฟล์ใน browser, ตรวจตัวอย่างกับ server ก่อนยืนยัน สูงสุด 200 คำร้องต่อชุด / ไฟล์ 5 MB
- ยืนยันแล้วตรวจข้อมูลซ้ำและบันทึกทั้งชุดใน D1 batch เดียว ไม่มีข้อมูลบางส่วนเมื่อ conflict; retry ชุดเดิมไม่เพิ่มซ้ำ แต่ละคำร้องเริ่มรอตรวจสอบ ไม่อนุมัติจากไฟล์
- คอลัมน์: direction, student_code, student_name, grade_level, school_name, academic_year, term, move_date, reason รองรับชื่อคอลัมน์ไทยและรักษาศูนย์นำหน้าของเลขประจำตัวที่เก็บเป็นข้อความ

## พัฒนาและเผยแพร่

```sh
npm ci
npm run dev
npm run build
npm run test:sites
npm run test:imports
npm run sync:school -- ../banpadeng-school-db
```

Dev server อยู่ที่ `/dmcreport/`; `/api` proxy ไปยัง `TRANSFER_API_TARGET` (ค่าเริ่มต้น `http://127.0.0.1:8789`) ตั้งเป้าไป development API ที่มีบัญชี/ฐานทดสอบเท่านั้น ไม่มีข้อมูลจำลองหรือบัญชีทดสอบรวมใน production bundle

หลัง build และ sync ให้ commit/push source ใน repo นี้ และ assets ที่ `public/dmcreport/` ใน repo `banpadeng-school-db` พร้อม API ที่เกี่ยวข้อง การ push `main` ของ backend ใช้ workflow Cloudflare เดิมเพื่อ deploy โดยรักษา bindings/secrets เดิมไว้

## สิทธิ์และ API เพิ่มเติม

- `GET /api/student-transfers/access` ตรวจสิทธิ์บัญชีปัจจุบัน
- `GET /api/student-transfers/permissions` รายชื่อบัญชีพร้อมสถานะสิทธิ์ (superadmin เท่านั้น)
- `PUT /api/student-transfers/permissions/:userId` มอบ/ถอนสิทธิ์ `{allowed: true|false}` (superadmin เท่านั้น)
- `GET /api/student-transfers/students` ข้อมูลนักเรียนพื้นฐานใน iframe
- `POST /api/student-transfers/import/preview` ตรวจ rows โดยไม่เพิ่มคำร้อง
- `POST /api/student-transfers/import` ยืนยันนำเข้า (rows, batch_ref) บันทึก atomic

ตารางเพิ่ม: `student_transfer_access`, `student_transfer_import_batches` การถอนสิทธิ์มีผลกับ API ถัดไป รวมถึงการเปิดไฟล์แนบโดยตรง

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


## ลงทะเบียนจากรายชื่อนักเรียน

กดการ์ดนักเรียนทั้งใบในเมนู **นักเรียน** เพื่อเปิดแบบฟอร์มลงทะเบียนย้ายในหน้าหลัก เลขประจำตัวและชื่อถูกเติมจากฐานกลางและเป็น read-only ระดับชั้นถูกเลือกให้อัตโนมัติและเปลี่ยนได้ นักเรียนกำลังศึกษาตั้งต้นเป็นย้ายออก; สถานะอื่นตั้งต้นเป็นย้ายเข้า ผู้ใช้ยังเลือกประเภท วันที่ โรงเรียนและเหตุผลก่อนบันทึกเอง

iframe ส่งเฉพาะ student_id ไปหน้าหลัก ตรวจ origin และ source ของ iframe ก่อนใช้ แล้วอ่านข้อมูลล่าสุดจาก `GET /api/student-transfers/students/:id` ซึ่งใช้สิทธิ์รายบุคคลเดิม รายการนักเรียนเป็นการ์ด responsive ที่กดได้ทั้งใบ ชื่อไม่มีเส้นใต้ รองรับเมาส์และคีย์บอร์ด


## จัดเรียงนักเรียน

เหนือการ์ดเลือกจัดเรียงตามชื่อ–สกุล เลขประจำตัว หรือระดับชั้น/ห้อง และกดปุ่มลูกศรสลับน้อยไปมาก/มากไปน้อย เปลี่ยนตัวเลือกแล้วกลับหน้าแรก การจัดเรียงทำใน API ก่อนแบ่งหน้า เลขประจำตัวชนิดตัวเลขเรียงตามค่าตัวเลขและรักษาข้อความศูนย์นำหน้าเดิม

## รูปแบบการ์ดและกรอบลงทะเบียน

เมนูนักเรียนเลือกแสดงการ์ดแบบ **สี่เหลี่ยม** หรือ **แนวนอนยาว** ได้ ระบบจำรูปแบบล่าสุดบนเครื่อง เมื่อเลือกการ์ด แบบฟอร์มพร้อมข้อมูลนักเรียนจะแสดงในกรอบด้านขวา โดยรายชื่อและค่าค้นหา/จัดเรียงยังอยู่ บนมือถือกรอบอยู่ด้านล่างรายชื่อและเลื่อนกรอกข้อมูลได้ตามปกติ กดปิดเพื่อกลับไปดูรายชื่อเต็มพื้นที่
