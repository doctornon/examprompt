# MCQ Prompt Builder — เว็บรวม Builder 1 + Builder 2

## โครงสร้างไฟล์

```
index.html      หน้าเลือกเครื่องมือ (badge card + จุดเด่นจุดอ่อน + ตารางช่วยตัดสินใจ)
builder1.html   เครื่องมือเดิมจาก exampromt.vercel.app + แถบสลับเครื่องมือ
builder2.html   เครื่องมือใหม่ ปรับสีและฟอนต์ให้ตรงกับตัวเดิมแล้ว
vercel.json     เปิด clean URLs (/builder1 แทน /builder1.html)
```

static ล้วน ไม่มี build step ไม่มี dependency ไม่มีการเรียก API

## วิธี deploy

**ทับโปรเจกต์เดิมบน Vercel** — เอาไฟล์เดิมออก แล้ววาง 4 ไฟล์นี้ที่ root ของ repo แล้ว push
โดเมน `exampromt.vercel.app` จะชี้มาที่ `index.html` เอง ส่วนเครื่องมือเดิมย้ายไปอยู่ที่ `/builder1`

```
git add index.html builder1.html builder2.html vercel.json
git rm <ไฟล์ html เดิมที่ root ถ้าชื่อไม่ใช่ builder1.html>
git commit -m "รวม builder 1 และ 2 พร้อมหน้าเลือกเครื่องมือ"
git push
```

หรือลากทั้งโฟลเดอร์เข้า vercel.com/new ก็ได้

## สิ่งที่แก้ในไฟล์เดิม

`builder1.html` ถูกแตะสองจุดเท่านั้น ตรรกะและ prompt ทั้งหมดเหมือนเดิม
1. เติม CSS ของแถบสลับเครื่องมือ (`.xnav*`) ต่อท้าย `<style>` ก้อนแรก
2. แทรก `<div class="xnav">…</div>` ก่อน `<div class="top">`

ถ้าต้องอัปเดต builder 1 ในอนาคต ให้ทำสองอย่างนี้ซ้ำกับไฟล์ใหม่

## การปรับแต่งต่อ

- รายการตัวเลือกทั้งหมดของ builder 2 อยู่ในตัวแปร `BLUEPRINT` ก้อนเดียว
- ข้อความคำสั่งหลักอยู่ที่ `CORE` (ข้อกำหนด 4 ข้อ ล็อกไว้) และ `RULES`
- การปรับรูปคำสั่งตาม AI แต่ละตัวอยู่ที่ `ADAPTER`
- ข้อความจุดเด่นจุดอ่อนอยู่ใน `index.html` แก้เป็น HTML ตรง ๆ ได้
