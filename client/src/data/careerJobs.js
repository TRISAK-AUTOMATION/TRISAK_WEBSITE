// Open positions shown on the Career page.
// Each text field is bilingual: { en, th }. Edit this list to add,
// remove or update jobs. NOTE: the entries below are sample content —
// replace them with the real positions before going live.

const commonBenefits = [
  { en: "Social security", th: "ประกันสังคม" },
  { en: "Group health and accident insurance", th: "ประกันสุขภาพกลุ่มและประกันอุบัติเหตุ" },
  { en: "Annual bonus based on company performance", th: "โบนัสประจำปีตามผลประกอบการ" },
  { en: "Annual salary review", th: "ปรับเงินเดือนประจำปี" },
  { en: "Provident fund", th: "กองทุนสำรองเลี้ยงชีพ" },
  { en: "Annual paid leave", th: "วันหยุดพักร้อนประจำปี" },
  { en: "Company uniform", th: "ชุดยูนิฟอร์มพนักงาน" },
  { en: "Training and skill development", th: "งานอบรมพัฒนาทักษะ" },
];

export const careerJobs = [
  {
    id: "sales-engineer",
    title: { en: "Sales Engineer", th: "วิศวกรฝ่ายขาย (Sales Engineer)" },
    location: { en: "Bangkok", th: "กรุงเทพมหานคร" },
    salary: { en: "25,000 – 40,000 THB", th: "25,000 – 40,000 บาท" },
    type: { en: "Full-time", th: "งานประจำ" },
    summary: {
      en: "Present automation solutions and industrial equipment to factory customers, look after existing accounts and grow new ones, and work with our engineering team to build proposals that fit each customer's needs.",
      th: "นำเสนอโซลูชันระบบอัตโนมัติและอุปกรณ์อุตสาหกรรมให้ลูกค้าในกลุ่มโรงงาน ดูแลลูกค้าเดิมและขยายฐานลูกค้าใหม่ ทำงานร่วมกับทีมวิศวกรเพื่อออกแบบข้อเสนอที่ตรงความต้องการ พร้อมติดตามยอดขายตามเป้าหมาย",
    },
    responsibilities: [
      { en: "Present products and solutions to industrial customers", th: "นำเสนอสินค้าและโซลูชันให้ลูกค้ากลุ่มโรงงานอุตสาหกรรม" },
      { en: "Manage existing accounts and develop new customers in your territory", th: "ดูแลลูกค้าเดิมและหาลูกค้ารายใหม่ตามพื้นที่ที่รับผิดชอบ" },
      { en: "Prepare quotations and follow up orders through to closing", th: "จัดทำใบเสนอราคาและติดตามการสั่งซื้อจนปิดการขาย" },
      { en: "Coordinate with engineers on technical proposals", th: "ประสานงานกับทีมวิศวกรเพื่อออกแบบข้อเสนอทางเทคนิค" },
      { en: "Report monthly sales and plans to management", th: "รายงานยอดขายและแผนงานประจำเดือนต่อผู้บังคับบัญชา" },
    ],
    requirements: [
      { en: "Bachelor's degree in Electrical, Mechanical, Industrial Engineering or a related field", th: "ปริญญาตรี วิศวกรรมไฟฟ้า เครื่องกล อุตสาหการ หรือสาขาที่เกี่ยวข้อง" },
      { en: "1+ year of technical sales experience (new graduates welcome)", th: "มีประสบการณ์ด้านงานขายเชิงเทคนิค 1 ปีขึ้นไป (ยินดีรับนักศึกษาจบใหม่)" },
      { en: "Good communication and presentation skills", th: "มีทักษะการสื่อสารและการนำเสนอที่ดี" },
      { en: "Driving license; able to travel to customers upcountry", th: "มีใบขับขี่รถยนต์ และสามารถเดินทางไปพบลูกค้าต่างจังหวัดได้" },
      { en: "Working English is a plus", th: "ใช้ภาษาอังกฤษในการสื่อสารได้ จะพิจารณาเป็นพิเศษ" },
    ],
    benefits: [
      ...commonBenefits,
      { en: "Sales commission", th: "ค่าคอมมิชชัน" },
      { en: "Fuel and phone allowance", th: "ค่าน้ำมันและค่าโทรศัพท์" },
    ],
  },
  {
    id: "automation-engineer",
    title: { en: "Automation Engineer", th: "วิศวกรระบบอัตโนมัติ (Automation Engineer)" },
    location: { en: "Samut Prakan", th: "สมุทรปราการ" },
    salary: { en: "30,000 – 45,000 THB", th: "30,000 – 45,000 บาท" },
    type: { en: "Full-time", th: "งานประจำ" },
    summary: {
      en: "Design, program and install PLC, HMI and SCADA control systems for customers' production lines, commission them on site, solve problems and hand over with complete documentation.",
      th: "ออกแบบ เขียนโปรแกรม และติดตั้งระบบควบคุมอัตโนมัติด้วย PLC, HMI และ SCADA สำหรับสายการผลิตของลูกค้า ทดสอบระบบหน้างาน แก้ไขปัญหา และส่งมอบงานพร้อมเอกสารครบถ้วน",
    },
    responsibilities: [
      { en: "Design electrical control and automation systems to customer requirements", th: "ออกแบบระบบควบคุมไฟฟ้าและระบบอัตโนมัติตามความต้องการของลูกค้า" },
      { en: "Program PLC, HMI and SCADA", th: "เขียนโปรแกรม PLC, HMI และ SCADA" },
      { en: "Install, test and commission systems on site", th: "ติดตั้ง ทดสอบ และ Commissioning ระบบที่หน้างาน" },
      { en: "Troubleshoot technical issues and advise customers", th: "แก้ไขปัญหาทางเทคนิคและให้คำแนะนำแก่ลูกค้า" },
      { en: "Prepare electrical drawings and user manuals", th: "จัดทำเอกสารแบบไฟฟ้าและคู่มือการใช้งานระบบ" },
    ],
    requirements: [
      { en: "Bachelor's degree in Electrical, Mechatronics Engineering or a related field", th: "ปริญญาตรี วิศวกรรมไฟฟ้า เมคคาทรอนิกส์ หรือสาขาที่เกี่ยวข้อง" },
      { en: "2+ years of PLC programming experience", th: "มีประสบการณ์เขียนโปรแกรม PLC 2 ปีขึ้นไป" },
      { en: "Able to read and draw electrical diagrams (AutoCAD or EPLAN)", th: "อ่านและเขียนแบบไฟฟ้าได้ ใช้ AutoCAD หรือ EPLAN ได้" },
      { en: "Able to work on customer sites", th: "สามารถเดินทางไปปฏิบัติงานที่หน้างานลูกค้าได้" },
      { en: "Professional engineering license is a plus", th: "มีใบอนุญาตประกอบวิชาชีพวิศวกรรม (กว.) จะพิจารณาเป็นพิเศษ" },
    ],
    benefits: [...commonBenefits, { en: "On-site allowance", th: "เบี้ยเลี้ยงออกหน้างาน" }],
  },
  {
    id: "service-technician",
    title: { en: "Service Technician", th: "ช่างเทคนิคบริการ (Service Technician)" },
    location: { en: "Chonburi", th: "ชลบุรี" },
    salary: { en: "18,000 – 25,000 THB", th: "18,000 – 25,000 บาท" },
    type: { en: "Full-time", th: "งานประจำ" },
    summary: {
      en: "Install, repair and carry out preventive maintenance on machines and equipment at customer sites, finding the root cause of problems quickly so customers' production lines keep running.",
      th: "ติดตั้ง ซ่อมบำรุง และบำรุงรักษาเชิงป้องกันเครื่องจักรและอุปกรณ์ที่หน้างานลูกค้า ตรวจหาสาเหตุของปัญหาและแก้ไขอย่างรวดเร็ว เพื่อให้สายการผลิตของลูกค้าทำงานต่อเนื่อง",
    },
    responsibilities: [
      { en: "Install and test equipment at customer sites", th: "ติดตั้งและทดสอบอุปกรณ์ที่หน้างานลูกค้า" },
      { en: "Repair and troubleshoot machines on request", th: "ซ่อมบำรุงและแก้ไขปัญหาเครื่องจักรตามที่ได้รับแจ้ง" },
      { en: "Carry out preventive maintenance plans", th: "ทำแผนบำรุงรักษาเชิงป้องกัน (Preventive Maintenance)" },
      { en: "Record service reports and spare parts used", th: "บันทึกรายงานการบริการและอะไหล่ที่ใช้" },
      { en: "Give customers basic operating guidance", th: "ให้คำแนะนำการใช้งานอุปกรณ์เบื้องต้นแก่ลูกค้า" },
    ],
    requirements: [
      { en: "Vocational diploma or higher in Electrical, Electronics or Mechanical", th: "ปวส. ขึ้นไป สาขาไฟฟ้า อิเล็กทรอนิกส์ หรือเครื่องกล" },
      { en: "1+ year of maintenance experience", th: "มีประสบการณ์ด้านงานซ่อมบำรุง 1 ปีขึ้นไป" },
      { en: "Able to read basic electrical diagrams", th: "อ่านแบบไฟฟ้าเบื้องต้นได้" },
      { en: "Driving license", th: "มีใบขับขี่รถยนต์" },
      { en: "Hard-working, patient and a good team player", th: "ขยัน อดทน และทำงานเป็นทีมได้ดี" },
    ],
    benefits: [
      ...commonBenefits,
      { en: "Overtime pay", th: "ค่าล่วงเวลา" },
      { en: "On-site allowance", th: "เบี้ยเลี้ยงออกหน้างาน" },
    ],
  },
  {
    id: "purchasing-officer",
    title: { en: "Purchasing Officer", th: "เจ้าหน้าที่จัดซื้อ (Purchasing Officer)" },
    location: { en: "Bangkok", th: "กรุงเทพมหานคร" },
    salary: { en: "20,000 – 28,000 THB", th: "20,000 – 28,000 บาท" },
    type: { en: "Full-time", th: "งานประจำ" },
    summary: {
      en: "Source and purchase goods, equipment and materials from local and overseas suppliers, compare prices and terms, follow up deliveries and keep the supplier database up to date.",
      th: "จัดหาและสั่งซื้อสินค้า อุปกรณ์ และวัตถุดิบจากผู้ขายทั้งในและต่างประเทศ เปรียบเทียบราคาและเงื่อนไข ติดตามการส่งมอบให้ตรงเวลา และดูแลฐานข้อมูลผู้ขายให้เป็นปัจจุบัน",
    },
    responsibilities: [
      { en: "Prepare purchase requisitions and purchase orders", th: "จัดทำใบขอซื้อและใบสั่งซื้อตามความต้องการของฝ่ายต่าง ๆ" },
      { en: "Source and compare quotes from multiple suppliers", th: "สรรหาและเปรียบเทียบราคาจากผู้ขายหลายราย" },
      { en: "Follow up deliveries and coordinate imports", th: "ติดตามการส่งมอบสินค้าและประสานงานนำเข้า" },
      { en: "Maintain the supplier database", th: "ดูแลและปรับปรุงฐานข้อมูลผู้ขาย" },
      { en: "Evaluate supplier performance regularly", th: "ประเมินผลการทำงานของผู้ขายเป็นประจำ" },
    ],
    requirements: [
      { en: "Bachelor's degree in Business Administration, Logistics or a related field", th: "ปริญญาตรี สาขาบริหารธุรกิจ โลจิสติกส์ หรือสาขาที่เกี่ยวข้อง" },
      { en: "1+ year of purchasing experience", th: "มีประสบการณ์ด้านงานจัดซื้อ 1 ปีขึ้นไป" },
      { en: "Proficient in Microsoft Office and ERP systems", th: "ใช้ Microsoft Office และระบบ ERP ได้" },
      { en: "Good English communication", th: "สื่อสารภาษาอังกฤษได้ดี" },
      { en: "Strong negotiation skills and attention to detail", th: "มีทักษะการเจรจาต่อรอง ละเอียดรอบคอบ" },
    ],
    benefits: commonBenefits,
  },
];
