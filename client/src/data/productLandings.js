/**
 * Fixed sales pages for three product types (pages/products/ProductLanding.jsx):
 *   /products/relay      OMRON relays, by category
 *   /products/inverter   OMRON + YASKAWA inverters, one block per brand
 *   /products/servo      OMRON + YASKAWA servo, one block per brand
 *
 * Text is { en, th }. Series lists are examples for the page, not a full
 * catalog; check availability with the brand before changing them.
 * shortcut: content lives in code, not the admin CMS; move it to the database
 * if staff need to edit these pages themselves.
 */

const MOTION_TABS = [
  { to: "/products/inverter", label: { en: "Inverter", th: "Inverter" } },
  { to: "/products/servo", label: { en: "Servo", th: "Servo" } },
];

const RELAY = {
  title: { en: "OMRON Relay", th: "OMRON Relay" },
  meta: { en: "OMRON · Relay & Control Components", th: "OMRON · Relay & Control Components" },
  tagline: { en: "Relays for every industrial control system", th: "รีเลย์สำหรับทุกระบบควบคุมในงานอุตสาหกรรม" },
  intro: {
    en: "From general control circuits and PLC interfaces to machine safety and AC/DC loads such as heaters. Pick by the job, and TRISAK helps you find the right model.",
    th: "ตั้งแต่วงจรควบคุมทั่วไป เชื่อมต่อ PLC ระบบ Safety ไปจนถึงคุมโหลด AC/DC และฮีตเตอร์ เลือกจากงานของคุณ แล้วให้ TRISAK ช่วยหารุ่นที่ใช่",
  },
  quoteTopic: "OMRON Relay",
  categoriesHead: {
    eyebrow: { en: "Product categories", th: "Product categories" },
    title: { en: "Pick a relay for the job", th: "เลือก Relay ให้ตรงกับงาน" },
    text: {
      en: "Machine control, control panels, PLC systems or heaters: there is a relay type for each.",
      th: "งานเครื่องจักร ตู้ไฟฟ้า PLC หรือฮีตเตอร์ มี Relay ให้เลือกตามการใช้งาน",
    },
  },
  categories: [
    {
      id: "general-purpose",
      tag: "General Purpose",
      title: { en: "Relays for control panels and machines", th: "รีเลย์สำหรับตู้ควบคุมและเครื่องจักร" },
      text: {
        en: "Switch circuits and drive electrical devices. Plug-in and slim types.",
        th: "เปิด–ปิดวงจร สั่งงานอุปกรณ์ไฟฟ้า มีทั้งแบบ Plug-in และ Slim",
      },
      series: ["MY", "LY", "G2R", "G2RV-ST", "MK-S"],
    },
    {
      id: "ssr",
      tag: "Solid State Relay",
      title: { en: "Heaters and frequently switched loads", th: "คุมฮีตเตอร์และโหลดที่สวิตช์บ่อย" },
      text: {
        en: "No contacts to wear out. AC/DC and single- or three-phase models.",
        th: "ไม่มีหน้าสัมผัสสึกหรอ มีรุ่น AC/DC และ 1 เฟส / 3 เฟส",
      },
      series: ["G3NA", "G3PA", "G3PE", "G3PJ", "G3PH", "G3PF", "G3NE", "G3NB"],
    },
    {
      id: "safety",
      tag: "Safety Relay",
      title: { en: "Machine safety", th: "ความปลอดภัยเครื่องจักร" },
      text: {
        en: "For emergency stop, safety door and interlock circuits.",
        th: "ใช้กับวงจร Emergency Stop, Safety Door และ Interlock",
      },
      series: ["G7SA", "G7S", "G9SA"],
    },
    {
      id: "terminal",
      tag: "Terminal / I/O Relay",
      title: { en: "Connect the PLC to field devices", th: "เชื่อม PLC กับอุปกรณ์ภาคสนาม" },
      text: {
        en: "Less wiring and less panel space, for many I/O points.",
        th: "ลดการเดินสาย ประหยัดพื้นที่ในตู้ เหมาะกับงาน I/O หลายจุด",
      },
      series: ["G6D", "G6B", "G7T", "G3S4"],
    },
    {
      id: "power",
      tag: "Power Relay",
      title: { en: "High-power loads", th: "โหลดกำลังสูง" },
      text: {
        en: "Heaters, compressors and other rated power loads.",
        th: "Heater, Compressor และโหลดไฟฟ้ากำลังตามพิกัด",
      },
      series: ["G7J", "G7L", "G7Z", "MM"],
    },
    {
      id: "pcb",
      tag: "PCB Relay",
      title: { en: "Mounted on circuit boards", th: "ติดตั้งบนแผงวงจร" },
      text: {
        en: "For equipment makers and control boards, signal and power switching.",
        th: "สำหรับผู้ผลิตอุปกรณ์และบอร์ดควบคุม งาน Signal และ Power",
      },
      series: ["G5NB", "G2RL", "G5Q"],
    },
  ],
  apps: [
    { title: "Control Panel", text: { en: "Machine control cabinets", th: "ตู้ควบคุมเครื่องจักร" } },
    { title: "Heater Control", text: { en: "Heaters and temperature", th: "คุมฮีตเตอร์และอุณหภูมิ" } },
    { title: "PLC Interface", text: { en: "PLC to field devices", th: "เชื่อม PLC กับภาคสนาม" } },
    { title: "Machine Safety", text: { en: "Machine protection", th: "ระบบป้องกันเครื่องจักร" } },
    { title: "Power Control", text: { en: "Rated power loads", th: "คุมโหลดตามพิกัด" } },
    { title: "PCB Assembly", text: { en: "Control circuit boards", th: "แผงวงจรควบคุม" } },
  ],
  pick: {
    title: { en: "Which model for this job", th: "งานแบบนี้ ใช้รุ่นไหน" },
    text: {
      en: "No need to know the series. Find your job, then ask for a price.",
      th: "ไม่รู้ Series ก็ได้ ดูจากงานที่ต้องการ แล้วกดสอบถามราคา",
    },
    rows: [
      [{ en: "General switching in a control panel", th: "สั่งงานในตู้ควบคุมทั่วไป" }, "MY / LY"],
      [{ en: "Slim relay for PLC outputs", th: "Relay บางสำหรับ PLC output" }, "G2RV-ST"],
      [{ en: "Single-phase heater", th: "คุมฮีตเตอร์ 1 เฟส" }, "G3PA / G3PE"],
      [{ en: "Three-phase heater", th: "คุมฮีตเตอร์ 3 เฟส" }, "G3PE / G3PH"],
      [{ en: "E-stop or safety door circuit", th: "วงจร E-Stop / ประตู safety" }, "G7SA / G9SA"],
      [{ en: "Many I/O points from a PLC", th: "I/O หลายจุดจาก PLC" }, "G7T / G6D"],
      [{ en: "High-current loads", th: "โหลดกระแสสูง" }, "G7J / G7L"],
    ],
    why: [
      { title: { en: "Many formats", th: "หลายรูปแบบ" }, text: "Plug-in, Slim, Terminal, PCB" },
      { title: { en: "Every job covered", th: "ครบทุกงาน" }, text: "Control, Interface, Safety, Power" },
      { title: { en: "Works with PLCs", th: "เข้ากับ PLC" }, text: { en: "Fits straight into automation systems", th: "ใช้ร่วมระบบ Automation ได้ทันที" } },
      { title: { en: "Help choosing", th: "ทีมช่วยเลือก" }, text: { en: "Send the old model or a photo, we find a match", th: "ส่งรุ่นเดิมหรือรูป เราหารุ่นแทนให้" } },
    ],
  },
  cta: {
    title: { en: "Which relay do you need? Let TRISAK help", th: "ต้องการ Relay รุ่นไหน? ให้ TRISAK ช่วยแนะนำ" },
    text: {
      en: "Send the current part number, a photo of the relay, or what it controls. Our team checks it and sends a quote.",
      th: "ส่งรหัสรุ่นเดิม รูป Relay ที่ใช้อยู่ หรือบอกว่าใช้คุมอะไร ทีมงานตรวจสอบและเสนอราคาให้",
    },
    button: { en: "Ask for a quote", th: "สอบถามสินค้า / ขอใบเสนอราคา" },
  },
};

const INVERTER = {
  title: { en: "Inverter", th: "Inverter" },
  meta: { en: "Industrial Inverter · AC Drive", th: "Industrial Inverter · AC Drive" },
  tagline: {
    en: "Motor speed and torque control for machines, pumps, fans and conveyors",
    th: "คุมความเร็วและแรงบิดมอเตอร์ สำหรับเครื่องจักร ปั๊ม พัดลม และสายพาน",
  },
  intro: {
    en: "Two brands: OMRON and YASKAWA. Choose the brand you already use, or send the motor nameplate and our team will find the model.",
    th: "มีให้เลือก 2 แบรนด์ คือ OMRON และ YASKAWA เลือกตามแบรนด์ที่ใช้อยู่ หรือส่งรูป nameplate มอเตอร์ให้ทีมงานช่วยหารุ่น",
  },
  tabs: MOTION_TABS,
  quoteTopic: "Inverter",
  brandsHead: {
    eyebrow: { en: "Brands & series", th: "Brands & series" },
    title: { en: "Choose an inverter by brand", th: "เลือก Inverter ตามแบรนด์" },
    text: {
      en: "Each brand has its own team. Ask from a brand's block and the request goes straight to that team.",
      th: "แต่ละแบรนด์มีทีมดูแลของตัวเอง กดสอบถามจากบล็อกไหน คำขอจะไปถึงทีมนั้นโดยตรง",
    },
  },
  brands: [
    {
      id: "omron",
      name: "OMRON",
      team: "TRISAK Automation",
      points: [
        { en: "Compact, easy to fit in a panel", th: "ขนาดกะทัดรัด ติดตั้งง่ายในตู้" },
        { en: "Pairs directly with OMRON PLCs", th: "ใช้คู่กับ PLC OMRON ได้ทันที" },
        { en: "Sized by motor power and load", th: "เลือกตามกำลังมอเตอร์และโหลด" },
      ],
      groups: [
        {
          items: [
            { name: "3G3MX2-V2", use: { en: "General machines, conveyors, speed control", th: "เครื่องจักรทั่วไป สายพานลำเลียง งานคุมความเร็ว" } },
            { name: "3G3RX2", use: { en: "Industrial machines that need high control performance", th: "เครื่องจักรอุตสาหกรรมที่ต้องการสมรรถนะการควบคุมสูง" } },
          ],
        },
      ],
    },
    {
      id: "yaskawa",
      name: "YASKAWA",
      team: "Hytron-Trisak",
      points: [
        { en: "General and application-specific models", th: "มีรุ่นงานทั่วไปและรุ่นเฉพาะงาน" },
        { en: "Pumps, fans, elevators, cranes", th: "ปั๊ม พัดลม ลิฟต์ เครน" },
        { en: "Regenerative, low-harmonic models", th: "รุ่น Regenerative ลดฮาร์มอนิก" },
      ],
      groups: [
        {
          label: { en: "General use", th: "งานทั่วไป" },
          items: [
            { name: "GA500", use: { en: "General machines, tight spaces", th: "เครื่องจักรทั่วไป พื้นที่ติดตั้งจำกัด" } },
            { name: "GA700", use: { en: "Industrial machines, high performance", th: "เครื่องจักรอุตสาหกรรม สมรรถนะสูง" } },
            { name: "A1000", use: { en: "Precise, efficient motor control", th: "คุมมอเตอร์แม่นยำ ประสิทธิภาพสูง" } },
            { name: "V1000 / J1000", use: { en: "General and basic speed control", th: "คุมความเร็วรอบทั่วไปและงานพื้นฐาน" } },
          ],
        },
        {
          label: { en: "Specific applications", th: "งานเฉพาะทาง" },
          items: [
            { name: "E1000", use: { en: "Fans, pumps, HVAC", th: "พัดลม ปั๊ม ระบบ HVAC" } },
            { name: "L1000", use: { en: "Elevators", th: "ระบบลิฟต์" } },
            { name: "CR700", use: { en: "Cranes and hoists", th: "เครนและงานยก" } },
            { name: "U1000 / D1000 / R1000", use: { en: "Regenerative, low harmonics, energy management", th: "Regenerative ลดฮาร์มอนิก จัดการพลังงาน" } },
          ],
        },
      ],
    },
  ],
  appsTitle: { en: "Where inverters are used", th: "Inverter ใช้กับงานอะไร" },
  apps: [
    { title: "Conveyor", text: { en: "Conveyor speed", th: "คุมความเร็วสายพาน" } },
    { title: "Pump", text: { en: "Water pump systems", th: "ระบบปั๊มน้ำ" } },
    { title: "Fan & Blower", text: { en: "Fans and blowers", th: "พัดลมและโบลเวอร์" } },
    { title: "Crane & Hoist", text: { en: "Lifting and cranes", th: "ระบบยกและเครน" } },
  ],
  cta: {
    title: { en: "Match an inverter to your motor", th: "เลือก Inverter ให้เหมาะกับมอเตอร์" },
    text: {
      en: "Send these details and the brand's team will pick the model and quote it.",
      th: "ส่งข้อมูลเหล่านี้มา ทีมของแบรนด์นั้นจะช่วยเลือกรุ่นและเสนอราคาให้",
    },
    bring: [
      { en: "Motor power (kW)", th: "กำลังมอเตอร์ (kW)" },
      { en: "Supply 220 / 380 V", th: "แรงดันไฟ 220 / 380 V" },
      { en: "Load type", th: "ลักษณะโหลด" },
      { en: "Nameplate photo", th: "รูป nameplate" },
      { en: "Current model", th: "รุ่นเดิม" },
    ],
    button: { en: "Ask about inverters", th: "สอบถาม Inverter" },
  },
};

const SERVO = {
  title: { en: "Servo", th: "Servo" },
  meta: { en: "Servo Systems · Motion Control", th: "Servo Systems · Motion Control" },
  tagline: {
    en: "Servo motors and drives for precise position, speed and torque control",
    th: "Servo Motor และ Servo Drive สำหรับงานคุมตำแหน่ง ความเร็ว และแรงบิดที่ต้องแม่นยำ",
  },
  intro: {
    en: "For packaging machines, pick & place and multi-axis machinery. Two brands: OMRON and YASKAWA.",
    th: "สำหรับเครื่องบรรจุภัณฑ์ Pick & Place และเครื่องจักรหลายแกน มีให้เลือก 2 แบรนด์ คือ OMRON และ YASKAWA",
  },
  tabs: MOTION_TABS,
  quoteTopic: "Servo",
  brandsHead: {
    eyebrow: { en: "Brands & series", th: "Brands & series" },
    title: { en: "Choose a servo by brand", th: "เลือก Servo ตามแบรนด์" },
    text: INVERTER.brandsHead.text,
  },
  brands: [
    {
      id: "omron",
      name: "OMRON",
      team: "TRISAK Automation",
      points: [
        { en: "Position, speed and torque control", th: "คุมตำแหน่ง ความเร็ว แรงบิด" },
        { en: "EtherCAT, pulse and analog", th: "EtherCAT, Pulse และ Analog" },
        { en: "Pairs with OMRON PLCs and motion controllers", th: "ใช้คู่กับ PLC และ Motion Controller OMRON" },
      ],
      groups: [
        {
          items: [
            { name: "1S Series", use: { en: "High-precision automated machines, safety models available", th: "เครื่องจักรอัตโนมัติที่ต้องการความแม่นยำสูง มีรุ่น Safety" } },
            { name: "G5 EtherCAT", use: { en: "Motion control over EtherCAT", th: "Motion Control ผ่าน EtherCAT" } },
            { name: "G5 Pulse / Analog", use: { en: "Positioning by pulse or analog", th: "งาน Positioning คุมด้วย Pulse หรือ Analog" } },
            { name: "G5 Linear Motor", use: { en: "High-precision linear motion", th: "เคลื่อนที่เชิงเส้นที่ต้องการความแม่นยำสูง" } },
            { name: "SMARTSTEP 2", use: { en: "Basic positioning", th: "งานคุมตำแหน่งพื้นฐาน" } },
          ],
        },
      ],
    },
    {
      id: "yaskawa",
      name: "YASKAWA",
      team: "FAC",
      points: [
        { en: "Servo motors and drives in many sizes", th: "Servo Motor และ Drive หลายขนาด" },
        { en: "Precise motion control", th: "คุมการเคลื่อนที่อย่างแม่นยำ" },
        { en: "Built for multi-axis automated machines", th: "เหมาะกับเครื่องจักรอัตโนมัติหลายแกน" },
      ],
      groups: [
        {
          items: [
            { name: "Sigma-X (Σ-X)", use: { en: "Latest generation, for high precision and performance", th: "รุ่นใหม่ล่าสุด สำหรับเครื่องจักรที่ต้องการความแม่นยำและสมรรถนะสูง" } },
            { name: "Sigma-7 (Σ-7)", use: { en: "General automation and motion control", th: "งาน Automation และ Motion Control ทั่วไป" } },
            { name: "Sigma-V (Σ-V)", use: { en: "Previous generation, for existing machines and replacements", th: "รุ่นก่อนหน้า สำหรับเครื่องเดิมและหารุ่นทดแทน" } },
            { name: "Sigma-S (Σ-S)", use: { en: "Specific uses, by supported sub-model", th: "งานเฉพาะตามรุ่นย่อยที่รองรับ" } },
          ],
        },
      ],
    },
  ],
  appsTitle: { en: "Where servos are used", th: "Servo ใช้กับงานอะไร" },
  apps: [
    { title: "Packaging Machine", text: { en: "Feeding and cutting packs", th: "ป้อนและตัดบรรจุภัณฑ์" } },
    { title: "Pick & Place", text: { en: "Pick and place positioning", th: "คุมตำแหน่งหยิบและวาง" } },
    { title: "Precision Machinery", text: { en: "Precise machine axes", th: "คุมแกนเครื่องจักรแม่นยำ" } },
    { title: "Multi-axis Motion", text: { en: "Several axes in sync", th: "เคลื่อนที่หลายแกนพร้อมกัน" } },
  ],
  cta: {
    title: { en: "Looking for a servo motor or drive?", th: "กำลังมองหา Servo Motor หรือ Drive?" },
    text: {
      en: "Send these details and the brand's team will pick the servo system and quote it.",
      th: "ส่งข้อมูลเหล่านี้มา ทีมของแบรนด์นั้นจะช่วยเลือก Servo System และเสนอราคาให้",
    },
    bring: [
      { en: "Motor power (W / kW)", th: "กำลังมอเตอร์ (W / kW)" },
      { en: "Number of axes", th: "จำนวนแกน" },
      { en: "Type of motion", th: "ลักษณะการเคลื่อนที่" },
      { en: "Command: EtherCAT / pulse", th: "วิธีสั่งงาน EtherCAT / Pulse" },
      { en: "Current model", th: "รุ่นเดิม" },
    ],
    button: { en: "Ask about servos", th: "สอบถาม Servo" },
  },
};

export const PRODUCT_LANDINGS = { relay: RELAY, inverter: INVERTER, servo: SERVO };

/** A { en, th } text in the page language (a plain string is the same in both). */
export const lt = (v, lang) => (typeof v === "string" ? v : v?.[lang] || v?.en || "");
