// ============================================================
//  ตั้งค่าระบบ
//  1) Deploy Google Apps Script (Code.gs) เป็น Web app
//  2) คัดลอก URL ที่ลงท้ายด้วย /exec มาวางระหว่างเครื่องหมายคำพูดด้านล่าง
//  ถ้าเว้นว่างไว้ เว็บยังใช้งานได้ปกติ แต่จะไม่บันทึกคะแนนลง Google Sheets
// ============================================================
const CONFIG = {
  SCRIPT_URL: "https://script.google.com/macros/s/AKfycbxbQ8UXjzY9bHpVO9gl3RVbrKJHcBa91e4W_JCbHtjQeaIhOtrzhfY5Yz6k2hTyqbCb/exec"
};
