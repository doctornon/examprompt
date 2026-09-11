# ตั้งค่า Google Sign-in ให้ examprompt

ฝั่งโค้ดกับฐานข้อมูลทำเสร็จแล้ว เหลือสามขั้นที่ต้องทำในหน้าเว็บของ Google กับ Supabase
เพราะต้องกรอก Client Secret ซึ่งเป็นรหัสลับ

---

## ค่าที่จะต้องใช้

| รายการ | ค่า |
|---|---|
| Supabase project | `sa-aspire-hub` (ref `pgsuvtaigujlyhagonje`) |
| Supabase URL | `https://pgsuvtaigujlyhagonje.supabase.co` |
| Authorized redirect URI | `https://pgsuvtaigujlyhagonje.supabase.co/auth/v1/callback` |
| Authorized JavaScript origin | `https://examprompt.vercel.app` |
| Site URL | `https://examprompt.vercel.app` |
| Redirect URLs | `https://examprompt.vercel.app/**` |

---

## ขั้นที่ 1 — สร้าง OAuth client ใน Google Cloud Console

1. เข้า <https://console.cloud.google.com/> เลือกโปรเจกต์ หรือสร้างใหม่ชื่ออะไรก็ได้ เช่น `examprompt`
2. เมนูซ้าย **APIs & Services → OAuth consent screen**
   - User Type เลือก **External** แล้วกด Create
   - App name ใส่ `MCQ Prompt Builder` · User support email กับ Developer contact ใส่อีเมลของอาจารย์
   - Scopes ไม่ต้องเพิ่มอะไร ค่าเริ่มต้น (email, profile, openid) พอแล้ว
   - เมื่อสร้างเสร็จให้กด **Publish app** เปลี่ยนสถานะเป็น *In production*
     ถ้าปล่อยเป็น Testing จะเข้าได้เฉพาะอีเมลที่ใส่ในรายชื่อ test users เท่านั้น (สูงสุด 100 คน)
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID**
   - Application type: **Web application**
   - Authorized JavaScript origins ใส่ `https://examprompt.vercel.app`
   - Authorized redirect URIs ใส่ `https://pgsuvtaigujlyhagonje.supabase.co/auth/v1/callback`
   - กด Create แล้วจะได้ **Client ID** กับ **Client Secret** เก็บหน้านี้ไว้ก่อน

---

## ขั้นที่ 2 — เปิด Google provider ใน Supabase

1. เข้า <https://supabase.com/dashboard/project/pgsuvtaigujlyhagonje/auth/providers>
2. หา **Google** กดเปิด แล้ววาง Client ID กับ Client Secret จากขั้นที่ 1 กด Save
3. ไปที่ **Authentication → URL Configuration**
   - Site URL: `https://examprompt.vercel.app`
   - Redirect URLs เพิ่ม `https://examprompt.vercel.app/**`
   - ถ้าจะทดสอบบนเครื่องด้วย ให้เพิ่ม `http://localhost:5500/**` แล้วเปิดผ่าน local server
     (เปิดไฟล์ตรง ๆ แบบ `file://` จะล็อกอินไม่ได้ เพราะ Google ไม่รับ origin แบบนั้น)

---

## ขั้นที่ 3 — อัปไฟล์ขึ้น GitHub

เอาไฟล์ในโฟลเดอร์นี้ไปแทนของเดิมใน <https://github.com/doctornon/examprompt>
ไฟล์ใหม่คือ `auth.js` ส่วน `index.html` `builder1.html` `builder2.html` มีการแก้เพิ่มท้ายไฟล์
Vercel จะ deploy ให้เองภายในไม่กี่สิบวินาที

---

## ทดสอบว่าใช้ได้

1. เปิด <https://examprompt.vercel.app> — หน้าเลือกเครื่องมือต้องเปิดดูได้ตามปกติ มุมขวาบนมีปุ่ม “ลงชื่อเข้าใช้”
2. กดเข้า Builder 1 หรือ Builder 2 — ต้องเจอหน้าล็อกอินคลุมไว้
3. กดลงชื่อเข้าใช้ด้วย Google แล้วเลือกบัญชี ระบบจะพากลับมาที่หน้าเดิมและเปิดใช้ได้
4. ตรวจว่ามีผู้ใช้เข้าระบบจริงด้วยคำสั่งนี้ใน SQL editor ของ Supabase

```sql
select email, full_name, created_at, last_seen_at
from public.ep_profiles
order by created_at desc;
```

---

## สิ่งที่สร้างไว้ในฐานข้อมูลแล้ว

ทั้งหมดใช้ prefix `ep_` เพื่อไม่ให้ปนกับตารางของ ASPIRE hub ที่อยู่ในโปรเจกต์เดียวกัน

| ตาราง | หน้าที่ |
|---|---|
| `ep_profiles` | โปรไฟล์ผู้ใช้ สร้างอัตโนมัติเมื่อล็อกอินครั้งแรก · RLS ให้เห็นเฉพาะแถวของตัวเอง |
| `ep_presets` | ผังข้อสอบที่บันทึกไว้ · เจ้าของแก้ได้เอง ถ้าตั้ง `is_shared` จะให้คนอื่นอ่านได้ |

trigger `ep_on_auth_user_created` บน `auth.users` เป็นตัวสร้างแถวใน `ep_profiles` ให้อัตโนมัติ

---

## หมายเหตุเรื่องความปลอดภัย

- คีย์ `sb_publishable_...` ใน `auth.js` เป็นคีย์สาธารณะ ออกแบบมาให้ฝังในหน้าเว็บได้ ไม่ใช่ความลับ
  ตัวที่กันข้อมูลจริงคือ RLS ในฐานข้อมูล ห้ามเอา service_role key มาใส่ในไฟล์นี้เด็ดขาด
- การกั้นหน้า Builder เป็นการกั้นที่หน้าจอ ไม่ใช่กั้นที่ไฟล์ ใครกด view source ก็ยังเห็นโค้ดของเครื่องมือได้
  ซึ่งไม่เป็นปัญหาเพราะเครื่องมือทำงานในเบราว์เซอร์ล้วนและไม่มีความลับอยู่ในนั้น
  สิ่งที่ต้องกันจริงคือข้อมูลใน Supabase ซึ่งกันด้วย RLS แล้ว
- ผู้ใช้ที่ล็อกอิน examprompt จะไปปรากฏใน `auth.users` ของโปรเจกต์ `sa-aspire-hub` ด้วย
  ตรวจ RLS ของ ASPIRE แล้ว การเขียนทุกตารางต้องมี `center_id` หรือ `role=admin` ใน app_metadata
  ผู้ใช้ใหม่จึงเขียนอะไรไม่ได้ แต่จะอ่านตาราง `centers` กับ `surveys` ได้ เพราะสองตารางนั้นตั้งไว้ว่า
  ผู้ใช้ที่ล็อกอินแล้วอ่านได้ทุกคน ถ้ารับไม่ได้ ให้บอกผมแก้นโยบายสองตัวนี้ให้
