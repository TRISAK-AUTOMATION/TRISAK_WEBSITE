/**
 * Page content for each main product type, /products/series/:typeSlug
 * (same sections as Control Components: categories, applications, quick selection).
 *
 * Series follow the OMRON / YASKAWA / NITTO KOGYO product lines; they are examples
 * for choosing, not a full catalog.
 * shortcut: content lives in code, not the admin CMS; move it to the database if
 * staff need to edit these pages themselves.
 */

const T = (en, th) => ({ en, th });
const c = (id, tag, title, text, series) => ({ id, tag, title: T(...title), text: T(...text), series });
const a = (title, en, th) => ({ title, text: T(en, th) });
const r = (en, th, series) => [T(en, th), series];
// Thai puts a space only around Latin words: "เลือก Sensor ให้", "เลือกหุ่นยนต์ให้"
const thWord = (w) => `${/^[A-Za-z]/.test(w) ? " " : ""}${w}${/[A-Za-z0-9)]$/.test(w) ? " " : ""}`;

const WHY = [
  { title: T("Genuine products", "สินค้าแท้"), text: T("Straight from the brand, with warranty", "จากแบรนด์โดยตรง พร้อมการรับประกัน") },
  { title: T("Engineers on hand", "มีวิศวกรช่วย"), text: T("We help size and select the model", "ช่วยคำนวณและเลือกรุ่นให้เหมาะกับงาน") },
  { title: T("Replacements found", "หารุ่นทดแทน"), text: T("Send the old model or a photo, we find a match", "ส่งรุ่นเดิมหรือรูป เราหารุ่นแทนให้") },
  { title: T("Support after sale", "ดูแลหลังการขาย"), text: T("Setup advice and service", "แนะนำการติดตั้งและบริการหลังการขาย") },
];

/**
 * word: how the page names the product, e.g. { a: "a sensor", many: "Sensors", th: "Sensor" }
 * → "Pick a sensor for the job" / "เลือก Sensor ให้ตรงกับงาน", "Sensors across industry" / "ใช้งาน Sensor ในอุตสาหกรรม"
 */
function landing({ name, brand, word, tagline, intro, catsText, categories, apps, rows }) {
  return {
    title: T(name, name),
    meta: T(`${brand} · ${name}`, `${brand} · ${name}`),
    tagline: T(...tagline),
    intro: T(...intro),
    quoteTopic: name,
    categoriesHead: {
      eyebrow: T("Product categories", "Product categories"),
      title: T(`Pick ${word.a} for the job`, `เลือก${thWord(word.th)}ให้ตรงกับงาน`),
      text: T(...catsText),
    },
    categories,
    appsTitle: T(`${word.many} across industry`, `ใช้งาน${thWord(word.th)}ในอุตสาหกรรม`),
    apps,
    pick: {
      title: T("Which model for this job", "งานแบบนี้ ใช้รุ่นไหน"),
      text: T("No need to know the series. Find your job, then ask for a price.", "ไม่รู้ Series ก็ได้ ดูจากงานที่ต้องการ แล้วกดสอบถามราคา"),
      rows,
      why: WHY,
    },
    cta: {
      title: T(`Which ${word.many.toLowerCase()} do you need? Let TRISAK help`, `ต้องการ${thWord(word.th)}รุ่นไหน? ให้ TRISAK ช่วยแนะนำ`),
      text: T(
        "Send the current part number, a photo of the nameplate, or describe the job. Our team checks it and sends a quote.",
        "ส่งรหัสรุ่นเดิม รูป Nameplate หรือเล่าลักษณะงาน ทีมงานตรวจสอบและเสนอราคาให้"
      ),
      button: T("Ask for a quote", "สอบถามสินค้า / ขอใบเสนอราคา"),
    },
  };
}

const SENSORS = landing({
  name: "Sensors & Identification",
  brand: "OMRON",
  word: { a: "a sensor", many: "Sensors", th: "Sensor" },
  tagline: ["Detect, measure and identify on the production line", "ตรวจจับ วัด และระบุชิ้นงานในไลน์การผลิต"],
  intro: [
    "Photoelectric, fiber and proximity sensors, RFID, vision and measurement sensors from OMRON. Tell us what you need to detect and we find the model.",
    "เซนเซอร์ Photoelectric, Fiber, Proximity, RFID, Vision และ Measurement จาก OMRON บอกเราว่าต้องการตรวจจับอะไร แล้วเราช่วยหารุ่นให้",
  ],
  catsText: ["Object, metal, small parts, ID tags or images: there is a sensor type for each.", "ตรวจจับวัตถุ โลหะ ชิ้นงานเล็ก อ่าน Tag หรือดูด้วยภาพ มีเซนเซอร์ให้เลือกตามงาน"],
  categories: [
    c("photoelectric", "Photoelectric Sensors", ["Detect objects with light", "ตรวจจับวัตถุด้วยแสง"], ["Through-beam, retro-reflective and diffuse types for conveyors and machines.", "มีแบบ Through-beam, Retro-reflective และ Diffuse สำหรับสายพานและเครื่องจักร"], ["E3Z", "E3FA", "E3S", "E3AS"]),
    c("fiber", "Fiber Sensors", ["Tight spaces and tiny parts", "พื้นที่แคบและชิ้นงานเล็ก"], ["An amplifier plus a fiber head that fits where a sensor body cannot.", "แอมป์คู่กับหัวไฟเบอร์ ติดตั้งในจุดที่ตัวเซนเซอร์เข้าไม่ถึง"], ["E3NX", "E3X", "E32"]),
    c("proximity", "Proximity Sensors", ["Detect metal without contact", "ตรวจจับโลหะแบบไม่สัมผัส"], ["Inductive for metal, capacitive for liquids, powder and non-metal.", "Inductive สำหรับโลหะ Capacitive สำหรับของเหลว ผง และวัตถุที่ไม่ใช่โลหะ"], ["E2E NEXT", "E2A", "E2B", "E2K"]),
    c("rfid", "RFID Systems", ["Track parts and pallets", "ติดตามชิ้นงานและพาเลท"], ["Read and write data on tags for traceability and production tracking.", "อ่านและเขียนข้อมูลบน Tag สำหรับ Traceability และติดตามการผลิต"], ["V680S", "V680", "V640", "V780"]),
    c("vision", "Vision Systems", ["Inspect with images", "ตรวจสอบด้วยภาพ"], ["Presence, position, codes and defects, from smart cameras to vision controllers.", "ตรวจการมีอยู่ ตำแหน่ง อ่านโค้ด และหาตำหนิ ตั้งแต่ Smart Camera ถึง Vision Controller"], ["FHV7", "FH", "FQ", "FZ"]),
    c("measurement", "Measurement Sensors", ["Measure distance and height", "วัดระยะและความสูง"], ["Laser displacement and profile sensors for precise measuring.", "Laser Displacement และ Profile Sensor สำหรับงานวัดละเอียด"], ["ZX2", "ZP-L", "ZG"]),
  ],
  apps: [
    a("Packaging", "Detect packs and labels", "ตรวจจับกล่องและฉลาก"),
    a("Food & Beverage", "Bottles, cans and fill level", "ขวด กระป๋อง และระดับบรรจุ"),
    a("Automotive", "Parts presence on assembly", "ตรวจชิ้นส่วนในไลน์ประกอบ"),
    a("Electronics", "Small parts and PCBs", "ชิ้นงานเล็กและแผงวงจร"),
    a("Logistics", "Conveyors and sorting", "สายพานและงานคัดแยก"),
    a("Quality Inspection", "Defects and measurement", "ตรวจตำหนิและวัดขนาด"),
  ],
  rows: [
    r("Detect boxes on a conveyor", "ตรวจจับกล่องบนสายพาน", "E3Z / E3FA"),
    r("Detect metal parts at close range", "ตรวจจับชิ้นงานโลหะระยะใกล้", "E2E NEXT"),
    r("Tiny parts or very tight spaces", "ชิ้นงานเล็กมาก หรือพื้นที่แคบ", "E3NX + E32"),
    r("Long distance or dusty areas", "ระยะไกล หรือพื้นที่มีฝุ่น", "E3AS"),
    r("Liquid or powder through a tank wall", "ของเหลวหรือผงผ่านผนังถัง", "E2K"),
    r("Track work-in-progress by ID tag", "ติดตามงานระหว่างผลิตด้วย Tag", "V680S"),
    r("Check codes, position or defects by image", "ตรวจโค้ด ตำแหน่ง หรือตำหนิด้วยภาพ", "FHV7 / FH"),
  ],
});

const PLC = landing({
  name: "PLC & Controllers",
  brand: "OMRON · YASKAWA",
  word: { a: "a controller", many: "Controllers", th: "PLC / Controller" },
  tagline: ["The brain of the machine, from compact PLCs to motion controllers", "สมองของเครื่องจักร ตั้งแต่ PLC ขนาดเล็กถึง Motion Controller"],
  intro: [
    "OMRON PLCs and Sysmac machine automation controllers, plus YASKAWA motion controllers. Choose by machine size, I/O and motion.",
    "PLC และ Machine Automation Controller ตระกูล Sysmac จาก OMRON และ Motion Controller จาก YASKAWA เลือกตามขนาดเครื่อง จำนวน I/O และงาน Motion",
  ],
  catsText: ["Small machines, whole lines or multi-axis motion: pick the controller class first.", "เครื่องเล็ก ทั้งไลน์ หรืองาน Motion หลายแกน เลือกระดับของ Controller ก่อน"],
  categories: [
    c("compact-plc", "Compact PLC", ["Small and stand-alone machines", "เครื่องจักรขนาดเล็กและเครื่องเดี่ยว"], ["Built-in I/O, easy to program, good value.", "มี I/O ในตัว เขียนโปรแกรมง่าย คุ้มค่า"], ["CP1E", "CP2E", "CP1H"]),
    c("modular-plc", "Modular PLC", ["Expandable control for lines", "ควบคุมไลน์ ขยายได้"], ["Add I/O, communication and special units as the system grows.", "เพิ่มยูนิต I/O สื่อสาร และยูนิตพิเศษได้ตามระบบ"], ["CJ2M", "CJ2H", "CS1"]),
    c("mac", "Machine Automation Controller", ["Logic, motion and network in one", "รวม Logic, Motion และ Network"], ["Sysmac controllers with EtherCAT and EtherNet/IP built in.", "Controller ตระกูล Sysmac มี EtherCAT และ EtherNet/IP ในตัว"], ["NX1P2", "NX102", "NJ", "NY"]),
    c("remote-io", "Remote I/O", ["I/O close to the machine", "I/O ใกล้จุดใช้งาน"], ["EtherCAT I/O that cuts panel wiring.", "I/O ผ่าน EtherCAT ลดการเดินสายในตู้"], ["NX Series"]),
    c("motion-controller", "Motion Controller", ["Multi-axis YASKAWA motion", "Motion หลายแกนของ YASKAWA"], ["Synchronised axes with Sigma servo over MECHATROLINK.", "ซิงโครไนซ์หลายแกนกับเซอร์โว Sigma ผ่าน MECHATROLINK"], ["MP2300", "MP3300", "FA-M3"]),
  ],
  apps: [
    a("Packaging Machine", "Sequence and motion", "ลำดับการทำงานและ Motion"),
    a("Assembly Line", "Stations and interlocks", "สถานีประกอบและ Interlock"),
    a("Conveyor System", "Zones and sorting", "แบ่งโซนและคัดแยก"),
    a("Process Skid", "Pumps, valves and recipes", "ปั๊ม วาล์ว และสูตรการผลิต"),
    a("OEM Machines", "Standard machine platforms", "แพลตฟอร์มเครื่องจักรมาตรฐาน"),
    a("Retrofit", "Replace old PLCs", "เปลี่ยน PLC รุ่นเก่า"),
  ],
  rows: [
    r("Small machine with few I/O", "เครื่องจักรเล็ก I/O ไม่มาก", "CP1E / CP2E"),
    r("Replace an old CJ1 / CS1", "เปลี่ยน CJ1 / CS1 รุ่นเก่า", "CJ2M"),
    r("Machine with servo over EtherCAT", "เครื่องจักรมีเซอร์โวผ่าน EtherCAT", "NX1P2 / NX102"),
    r("Many axes at high speed", "หลายแกน ความเร็วสูง", "NJ"),
    r("Controller and PC in one box", "รวม Controller กับ PC", "NY"),
    r("I/O spread around the machine", "I/O กระจายรอบเครื่อง", "NX Series EtherCAT I/O"),
    r("YASKAWA Sigma servo, many axes", "เซอร์โว YASKAWA Sigma หลายแกน", "MP3300"),
  ],
});

const HMI = landing({
  name: "HMI & Industrial PC",
  brand: "OMRON",
  word: { a: "an HMI", many: "HMIs", th: "HMI" },
  tagline: ["Screens and industrial PCs for the shop floor", "หน้าจอและคอมพิวเตอร์อุตสาหกรรมสำหรับหน้างาน"],
  intro: [
    "OMRON touch panels from basic to Sysmac-integrated, and industrial PCs built for 24/7 running.",
    "หน้าจอสัมผัส OMRON ตั้งแต่รุ่นพื้นฐานถึงรุ่นที่เชื่อมกับ Sysmac และคอมพิวเตอร์อุตสาหกรรมสำหรับใช้งานต่อเนื่อง 24 ชั่วโมง",
  ],
  catsText: ["A simple operator screen, a rich machine interface, or a PC on the line.", "หน้าจอสั่งงานพื้นฐาน หน้าจอเครื่องจักรแบบเต็มรูปแบบ หรือ PC ประจำไลน์"],
  categories: [
    c("basic-hmi", "Basic HMI", ["Operator screens at good value", "หน้าจอสั่งงาน คุ้มค่า"], ["Run, stop, set values and alarms for stand-alone machines.", "สั่งเดิน หยุด ตั้งค่า และแสดง Alarm สำหรับเครื่องเดี่ยว"], ["NB"]),
    c("advanced-hmi", "Advanced HMI", ["Sysmac machine interface", "หน้าจอเครื่องจักรตระกูล Sysmac"], ["Wide screens designed together with the controller in Sysmac Studio.", "จอกว้าง ออกแบบร่วมกับ Controller ใน Sysmac Studio"], ["NA5"]),
    c("box-ipc", "Box IPC", ["PC inside the cabinet", "PC ติดตั้งในตู้"], ["Industrial PC for data, vision and line software.", "Industrial PC สำหรับงานข้อมูล Vision และซอฟต์แวร์ประจำไลน์"], ["NYB"]),
    c("panel-ipc", "Panel IPC", ["PC with a built-in screen", "PC พร้อมจอในตัว"], ["Touch screen and PC in one, mounted on the machine.", "จอสัมผัสและ PC ในเครื่องเดียว ติดตั้งที่เครื่องจักร"], ["NYP"]),
  ],
  apps: [
    a("Machine Operation", "Run and set the machine", "สั่งงานและตั้งค่าเครื่อง"),
    a("Alarm & Trend", "Faults and history", "แจ้งเตือนและประวัติ"),
    a("Line Monitoring", "Status of the whole line", "ดูสถานะทั้งไลน์"),
    a("Data & Reports", "Production data on a PC", "เก็บข้อมูลการผลิตบน PC"),
  ],
  rows: [
    r("Simple screen for one machine", "หน้าจอพื้นฐานสำหรับเครื่องเดียว", "NB"),
    r("Machine on an NJ / NX controller", "เครื่องจักรที่ใช้ NJ / NX", "NA5"),
    r("Replace an old NS / NT screen", "เปลี่ยนหน้าจอ NS / NT รุ่นเก่า", "NA5 / NB"),
    r("PC in the cabinet for data or vision", "PC ในตู้สำหรับข้อมูลหรือ Vision", "NYB"),
    r("PC with screen on the machine", "PC พร้อมจอที่เครื่องจักร", "NYP"),
  ],
});

const NETWORKS = landing({
  name: "Networks & IIoT",
  brand: "OMRON · YASKAWA",
  word: { a: "a network", many: "Networks", th: "Network" },
  tagline: ["Connect controllers, drives and devices on one network", "เชื่อม Controller, Drive และอุปกรณ์บนเครือข่ายเดียว"],
  intro: [
    "EtherCAT, EtherNet/IP and OPC UA from OMRON, and MECHATROLINK from YASKAWA, for machines that share data.",
    "EtherCAT, EtherNet/IP และ OPC UA จาก OMRON และ MECHATROLINK จาก YASKAWA สำหรับเครื่องจักรที่ต้องแลกเปลี่ยนข้อมูล",
  ],
  catsText: ["Fast machine control, plant-level links or IT connection.", "ควบคุมในเครื่องความเร็วสูง เชื่อมระดับโรงงาน หรือส่งข้อมูลขึ้นระบบ IT"],
  categories: [
    c("ethercat", "EtherCAT", ["Fast in-machine network", "เครือข่ายในเครื่องจักรความเร็วสูง"], ["Servo, I/O and sensors on one cable with tight timing.", "เซอร์โว I/O และเซนเซอร์บนสายเดียว ซิงก์แม่นยำ"], ["NX-ECC", "GX Series"]),
    c("ethernet-ip", "EtherNet/IP", ["Machine to machine and line", "เชื่อมเครื่องกับเครื่องและไลน์"], ["Share data between controllers, HMIs and devices.", "แลกข้อมูลระหว่าง Controller, HMI และอุปกรณ์"], ["NX-EIC", "CJ1W-EIP21"]),
    c("comm-units", "Communication Units", ["Serial and fieldbus links", "เชื่อม Serial และ Fieldbus"], ["Connect barcode readers, meters and older devices.", "เชื่อมเครื่องอ่านบาร์โค้ด มิเตอร์ และอุปกรณ์รุ่นเก่า"], ["NX-CIF", "CJ1W-SCU"]),
    c("opc-ua", "OPC UA", ["Send data to IT systems", "ส่งข้อมูลขึ้นระบบ IT"], ["Built into Sysmac controllers for SCADA and MES.", "มีในตัว Controller ตระกูล Sysmac สำหรับ SCADA และ MES"], ["NX102", "NJ501"]),
    c("mechatrolink", "MECHATROLINK", ["YASKAWA motion network", "เครือข่าย Motion ของ YASKAWA"], ["Links YASKAWA servo, drives and motion controllers.", "เชื่อมเซอร์โว Drive และ Motion Controller ของ YASKAWA"], ["MECHATROLINK-III"]),
  ],
  apps: [
    a("Machine Network", "Servo and I/O on one cable", "เซอร์โวและ I/O บนสายเดียว"),
    a("Line Integration", "Machines working together", "เครื่องจักรทำงานร่วมกัน"),
    a("SCADA / MES", "Data to the factory system", "ส่งข้อมูลเข้าระบบโรงงาน"),
    a("Retrofit", "Connect older devices", "เชื่อมอุปกรณ์รุ่นเก่า"),
  ],
  rows: [
    r("Servo and I/O in one machine", "เซอร์โวและ I/O ในเครื่องเดียว", "EtherCAT (NX-ECC)"),
    r("Link several machines on a line", "เชื่อมหลายเครื่องในไลน์", "EtherNet/IP"),
    r("Send data to SCADA / MES", "ส่งข้อมูลเข้า SCADA / MES", "OPC UA (NX102 / NJ501)"),
    r("Connect a serial device", "เชื่อมอุปกรณ์ Serial", "NX-CIF / CJ1W-SCU"),
    r("YASKAWA servo network", "เครือข่ายเซอร์โว YASKAWA", "MECHATROLINK-III"),
  ],
});

const DRIVES = landing({
  name: "Drives & Inverters",
  brand: "OMRON · YASKAWA",
  word: { a: "an inverter", many: "Inverters", th: "Inverter" },
  tagline: ["Motor speed control that saves energy", "คุมความเร็วมอเตอร์ และประหยัดพลังงาน"],
  intro: [
    "OMRON and YASKAWA inverters for conveyors, pumps, fans, cranes and lifts. Send the motor nameplate and we match the drive.",
    "อินเวอร์เตอร์ OMRON และ YASKAWA สำหรับสายพาน ปั๊ม พัดลม เครน และลิฟต์ ส่งรูป Nameplate มอเตอร์ให้เรา เราหาไดรฟ์ที่เข้ากันให้",
  ],
  catsText: ["General machines, heavy loads or special jobs like lifts and regeneration.", "เครื่องจักรทั่วไป โหลดหนัก หรืองานเฉพาะ เช่น ลิฟต์และงานคืนพลังงาน"],
  categories: [
    c("compact", "Compact Inverter", ["Small motors, small panels", "มอเตอร์เล็ก ตู้เล็ก"], ["Easy setup for fans, pumps and simple conveyors.", "ตั้งค่าง่าย สำหรับพัดลม ปั๊ม และสายพานทั่วไป"], ["OMRON M1", "OMRON MX2-V2", "YASKAWA GA500", "YASKAWA V1000"]),
    c("general", "General Purpose", ["Most industrial machines", "เครื่องจักรอุตสาหกรรมทั่วไป"], ["Vector control and wide power range for everyday jobs.", "Vector control ช่วงกำลังกว้าง สำหรับงานทั่วไป"], ["YASKAWA GA700", "YASKAWA GA800", "OMRON RX2"]),
    c("high-performance", "High Performance", ["Heavy loads and precise torque", "โหลดหนักและแรงบิดแม่นยำ"], ["Extruders, winders and machines that need full torque at low speed.", "Extruder, Winder และงานที่ต้องการแรงบิดเต็มที่รอบต่ำ"], ["YASKAWA A1000", "OMRON RX2"]),
    c("hvac", "HVAC Drive", ["Fans, pumps and buildings", "พัดลม ปั๊ม และอาคาร"], ["Built for air handling and pumping with energy savings.", "ออกแบบสำหรับงานระบบอากาศและปั๊ม ช่วยประหยัดพลังงาน"], ["YASKAWA HV600"]),
    c("lift-crane", "Lift & Crane", ["Elevators, cranes and hoists", "ลิฟต์ เครน และงานยก"], ["Smooth start and stop with brake control for lifting.", "ออกตัวและหยุดนุ่มนวล คุมเบรกสำหรับงานยก"], ["YASKAWA L1000", "YASKAWA CR700"]),
    c("regenerative", "Matrix & Regenerative", ["Low harmonics, energy back to the grid", "ลดฮาร์มอนิก คืนพลังงานสู่ระบบ"], ["For long down-hill loads, centrifuges and strict power quality.", "สำหรับโหลดที่คืนพลังงานต่อเนื่อง Centrifuge และงานที่เข้มเรื่องคุณภาพไฟ"], ["YASKAWA U1000", "YASKAWA D1000", "YASKAWA R1000"]),
  ],
  apps: [
    a("Conveyor", "Conveyor speed", "คุมความเร็วสายพาน"),
    a("Pump", "Water pump systems", "ระบบปั๊มน้ำ"),
    a("Fan & Blower", "Air flow and energy saving", "คุมลมและประหยัดพลังงาน"),
    a("HVAC", "Building air systems", "ระบบอากาศในอาคาร"),
    a("Crane & Hoist", "Lifting and cranes", "ระบบยกและเครน"),
    a("Elevator", "Passenger and goods lifts", "ลิฟต์โดยสารและขนของ"),
  ],
  rows: [
    r("Small fan or pump", "พัดลมหรือปั๊มขนาดเล็ก", "MX2-V2 / GA500"),
    r("General conveyor or machine", "สายพานหรือเครื่องจักรทั่วไป", "GA500 / GA700"),
    r("Heavy load, high torque at low speed", "โหลดหนัก แรงบิดสูงรอบต่ำ", "A1000 / RX2"),
    r("Building fans and pumps", "พัดลมและปั๊มในอาคาร", "HV600"),
    r("Elevator", "ลิฟต์", "L1000"),
    r("Crane or hoist", "เครนหรือรอก", "CR700"),
    r("Low harmonics or regeneration", "ลดฮาร์มอนิกหรือคืนพลังงาน", "U1000 / D1000 / R1000"),
  ],
});

const SERVO = landing({
  name: "Servo & Motion",
  brand: "OMRON · YASKAWA",
  word: { a: "a servo", many: "Servos", th: "Servo" },
  tagline: ["Precise position, speed and torque control", "คุมตำแหน่ง ความเร็ว และแรงบิดอย่างแม่นยำ"],
  intro: [
    "OMRON 1S and G5 servo, YASKAWA Sigma servo, direct drive and linear motors. Tell us the load and motion and we size the axis.",
    "เซอร์โว OMRON 1S และ G5 เซอร์โว YASKAWA Sigma, Direct Drive และ Linear Motor บอกโหลดและลักษณะการเคลื่อนที่ เราช่วยคำนวณขนาดให้",
  ],
  catsText: ["Rotary servo, motion controllers, or direct and linear motors for the most precise axes.", "เซอร์โวแบบหมุน Motion Controller หรือ Direct / Linear Motor สำหรับแกนที่ต้องแม่นยำที่สุด"],
  categories: [
    c("omron-servo", "OMRON Servo", ["Servo for Sysmac machines", "เซอร์โวสำหรับเครื่องจักร Sysmac"], ["EtherCAT servo with safety built in, or pulse control.", "เซอร์โว EtherCAT พร้อม Safety ในตัว หรือคุมด้วย Pulse"], ["1S", "G5", "R88M / R88D"]),
    c("yaskawa-servo", "YASKAWA Sigma", ["Fast and precise servo", "เซอร์โวเร็วและแม่นยำ"], ["Sigma-X and Sigma-7 with auto tuning and vibration control.", "Sigma-X และ Sigma-7 จูนอัตโนมัติและลดการสั่น"], ["Sigma-X", "Sigma-7", "Sigma-5"]),
    c("motion-controllers", "Motion Controllers", ["Coordinate many axes", "คุมหลายแกนพร้อมกัน"], ["Camming, gearing and interpolation for complex machines.", "Cam, Gear และ Interpolation สำหรับเครื่องจักรซับซ้อน"], ["NJ / NX", "MP3300"]),
    c("direct-drive", "Direct Drive Motors", ["No gearbox, no backlash", "ไม่มีเกียร์ ไม่มี Backlash"], ["High-torque rotary tables and indexers.", "โต๊ะหมุนและ Indexer แรงบิดสูง"], ["SGM Series"]),
    c("linear", "Linear Motors", ["Straight-line high precision", "เคลื่อนที่เชิงเส้นแม่นยำสูง"], ["Fast, accurate travel for electronics and inspection.", "เคลื่อนที่เร็วและแม่นยำ สำหรับงานอิเล็กทรอนิกส์และงานตรวจสอบ"], ["SGL Series", "G5 Linear"]),
  ],
  apps: [
    a("Packaging Machine", "Feeding and cutting packs", "ป้อนและตัดบรรจุภัณฑ์"),
    a("Pick & Place", "Pick and place positioning", "คุมตำแหน่งหยิบและวาง"),
    a("Printing & Converting", "Registration and cut-to-length", "คุมตำแหน่งพิมพ์และตัดความยาว"),
    a("Electronics", "Fast, precise axes", "แกนเร็วและแม่นยำ"),
    a("Machine Tools", "Feed axes and tables", "แกนป้อนและโต๊ะงาน"),
    a("Multi-axis Motion", "Several axes in sync", "เคลื่อนที่หลายแกนพร้อมกัน"),
  ],
  rows: [
    r("Machine on an NJ / NX controller", "เครื่องจักรใช้ NJ / NX", "OMRON 1S"),
    r("Simple positioning by pulse", "คุมตำแหน่งพื้นฐานด้วย Pulse", "OMRON G5"),
    r("Highest speed and precision", "ความเร็วและความแม่นยำสูงสุด", "YASKAWA Sigma-X"),
    r("General YASKAWA servo", "เซอร์โว YASKAWA งานทั่วไป", "Sigma-7"),
    r("Rotary table without gearbox", "โต๊ะหมุนไม่ใช้เกียร์", "SGM Direct Drive"),
    r("Long, precise linear travel", "เคลื่อนที่เชิงเส้นยาวและแม่นยำ", "SGL Linear"),
  ],
});

const SAFETY = landing({
  name: "Safety",
  brand: "OMRON · YASKAWA",
  word: { a: "a safety device", many: "Safety devices", th: "อุปกรณ์ Safety" },
  tagline: ["Protect people and machines", "ปกป้องคนและเครื่องจักร"],
  intro: [
    "OMRON safety controllers, relays, light curtains, door switches and emergency stops, plus safe motion in YASKAWA drives and servo.",
    "Safety Controller, Safety Relay, Light Curtain, Door Switch และ Emergency Stop จาก OMRON รวมถึง Safe Motion ในไดรฟ์และเซอร์โว YASKAWA",
  ],
  catsText: ["Sense the hazard, stop the machine and keep the circuit monitored.", "ตรวจจับจุดอันตราย หยุดเครื่องจักร และเฝ้าดูวงจรตลอดเวลา"],
  categories: [
    c("safety-controllers", "Safety Controllers", ["Programmable safety logic", "Safety Logic แบบโปรแกรมได้"], ["Many safety inputs, stand-alone or inside a Sysmac system.", "รับสัญญาณ Safety ได้มาก ใช้เดี่ยวหรืออยู่ในระบบ Sysmac"], ["G9SP", "NX Safety"]),
    c("safety-relays", "Safety Relays", ["One safety function, simple wiring", "ฟังก์ชัน Safety เดียว เดินสายง่าย"], ["For E-stop, door and light curtain circuits.", "สำหรับวงจร E-Stop, ประตู และ Light Curtain"], ["G9SA", "G9SE", "G7SA"]),
    c("light-curtains", "Safety Light Curtains", ["Guard openings with light", "ป้องกันช่องเปิดด้วยแสง"], ["Stop the machine when a hand or body enters.", "หยุดเครื่องเมื่อมือหรือร่างกายเข้าพื้นที่อันตราย"], ["F3SG"]),
    c("door-switches", "Safety Door Switches", ["Lock and monitor guards", "ล็อกและตรวจสอบประตู"], ["Mechanical, solenoid-locking and non-contact switches.", "แบบกลไก แบบล็อกด้วยโซลินอยด์ และแบบไม่สัมผัส"], ["D4NS", "D4N", "D4SL-N", "D40A", "D40Z"]),
    c("estop", "Emergency Stop", ["Stop at the push of a button", "หยุดฉุกเฉินด้วยปุ่มเดียว"], ["E-stop switches for panels and machines.", "สวิตช์หยุดฉุกเฉินสำหรับตู้และเครื่องจักร"], ["A22E", "A22NE"]),
    c("safety-sensors", "Safety Sensors", ["Watch an area", "เฝ้าพื้นที่"], ["Laser scanners for zones around robots and AGVs.", "Laser Scanner สำหรับพื้นที่รอบหุ่นยนต์และ AGV"], ["OS32C", "E3ZS"]),
  ],
  apps: [
    a("Machine Guarding", "Doors and covers", "ประตูและฝาครอบเครื่อง"),
    a("Robot Cell", "Area around robots", "พื้นที่รอบหุ่นยนต์"),
    a("Press Machine", "Hands near the die", "มือใกล้แม่พิมพ์"),
    a("Packaging Line", "Openings and infeeds", "ช่องเปิดและจุดป้อนงาน"),
    a("Conveyor", "Pull cords and E-stops", "สายดึงและปุ่มหยุดฉุกเฉิน"),
    a("AGV / AMR", "Moving-vehicle zones", "พื้นที่รถขนส่งอัตโนมัติ"),
  ],
  rows: [
    r("One E-stop or one door", "E-Stop หรือประตูจุดเดียว", "G9SE / G9SA"),
    r("Many safety inputs on one machine", "Safety หลายจุดในเครื่องเดียว", "G9SP"),
    r("Safety inside an NX / NJ system", "Safety ในระบบ NX / NJ", "NX Safety"),
    r("Guard an opening hands pass through", "ป้องกันช่องที่มือผ่าน", "F3SG"),
    r("Lock the door until the machine stops", "ล็อกประตูจนเครื่องหยุดสนิท", "D4SL-N"),
    r("Door sensor that is hard to defeat", "สวิตช์ประตูที่โกงยาก", "D40A / D40Z"),
    r("Zone around a robot or AGV", "พื้นที่รอบหุ่นยนต์หรือ AGV", "OS32C"),
  ],
});

const LEVEL = landing({
  name: "Level Control",
  brand: "OMRON",
  word: { a: "a level controller", many: "Level controllers", th: "Level Controller" },
  tagline: ["Control tank levels for water and liquids", "ควบคุมระดับน้ำและของเหลวในถัง"],
  intro: [
    "OMRON floatless level controllers with electrodes and holders: no moving parts, for water tanks, wells and process tanks.",
    "Floatless Level Controller ของ OMRON พร้อมอิเล็กโทรดและตัวยึด ไม่มีชิ้นส่วนเคลื่อนไหว สำหรับถังน้ำ บ่อ และถังในกระบวนการผลิต",
  ],
  catsText: ["Pick the controller, then the electrodes and holder for your tank.", "เลือกตัวควบคุม แล้วเลือกอิเล็กโทรดและตัวยึดให้เข้ากับถัง"],
  categories: [
    c("floatless", "Floatless Level Controllers", ["Pump control by electrodes", "คุมปั๊มด้วยอิเล็กโทรด"], ["Fill or drain automatically between high and low levels.", "เติมหรือระบายอัตโนมัติระหว่างระดับสูงและต่ำ"], ["61F-G", "61F-GP-N", "61F-LS", "61F-UHS"]),
    c("electrodes", "Electrodes & Holders", ["Sense the liquid level", "ตรวจจับระดับของเหลว"], ["Electrodes cut to length, with holders for the tank.", "อิเล็กโทรดตัดตามความยาว พร้อมตัวยึดสำหรับถัง"], ["PS Series", "F03 Series"]),
    c("level-sensors", "Level Sensors", ["Detect level from outside", "ตรวจระดับจากภายนอก"], ["Capacitive sensors through the tank wall.", "เซนเซอร์ Capacitive ตรวจผ่านผนังถัง"], ["E2K"]),
  ],
  apps: [
    a("Water Tank", "Fill and empty", "เติมและระบายน้ำ"),
    a("Wastewater", "Sump and pit pumps", "ปั๊มบ่อพักและบ่อบำบัด"),
    a("Boiler", "Feed water level", "ระดับน้ำป้อน Boiler"),
    a("Cooling Tower", "Make-up water", "เติมน้ำหอระบายความร้อน"),
  ],
  rows: [
    r("Fill a water tank automatically", "เติมน้ำเข้าถังอัตโนมัติ", "61F-G + PS Series"),
    r("Drain a sump or pit", "สูบน้ำออกจากบ่อ", "61F-G + PS Series"),
    r("Plug-in controller in a panel", "Controller แบบเสียบในตู้", "61F-GP-N"),
    r("Liquid level through a plastic tank", "ระดับของเหลวผ่านถังพลาสติก", "E2K"),
  ],
});

const POWER = landing({
  name: "Power & Energy",
  brand: "OMRON · YASKAWA",
  word: { a: "a power device", many: "Power devices", th: "อุปกรณ์ด้านพลังงาน" },
  tagline: ["Clean power for control panels, and energy you can see", "ไฟเลี้ยงที่เสถียรสำหรับตู้ควบคุม และพลังงานที่ตรวจวัดได้"],
  intro: [
    "OMRON DIN-rail power supplies, UPS, power and condition monitors, plus YASKAWA regenerative units.",
    "Power Supply แบบ DIN-rail, UPS, Power Monitor และ Condition Monitor จาก OMRON รวมถึงชุดคืนพลังงานจาก YASKAWA",
  ],
  catsText: ["Power the panel, keep it running, then measure and save energy.", "จ่ายไฟให้ตู้ สำรองไฟไม่ให้ดับ แล้ววัดและประหยัดพลังงาน"],
  categories: [
    c("power-supplies", "Power Supplies", ["24 V for the control panel", "ไฟ 24 V สำหรับตู้ควบคุม"], ["Compact DIN-rail units with long life.", "ติดราง DIN ขนาดกะทัดรัด อายุใช้งานยาว"], ["S8VK", "S8VK-X", "S8FS", "S82K"]),
    c("ups", "UPS", ["Ride through power cuts", "สำรองไฟเมื่อไฟดับ"], ["Keep controllers and PCs running and shut down safely.", "ให้ Controller และ PC ทำงานต่อและปิดเครื่องอย่างปลอดภัย"], ["S8BA"]),
    c("energy", "Energy Monitoring", ["See where power goes", "รู้ว่าพลังงานไปไหน"], ["Measure kWh per machine or line.", "วัด kWh ต่อเครื่องหรือต่อไลน์"], ["KM-N2", "KM50"]),
    c("condition", "Condition Monitoring", ["Find faults before they stop you", "เจอปัญหาก่อนเครื่องหยุด"], ["Watch motor current and panel temperature.", "เฝ้าดูกระแสมอเตอร์และอุณหภูมิในตู้"], ["K6CM", "K6PM"]),
    c("regeneration", "Regeneration", ["Return braking energy", "คืนพลังงานจากการเบรก"], ["Send motor braking energy back to the supply.", "ส่งพลังงานจากการเบรกมอเตอร์กลับสู่ระบบไฟ"], ["YASKAWA D1000", "YASKAWA R1000"]),
  ],
  apps: [
    a("Control Panel", "24 V supply", "ไฟเลี้ยง 24 V"),
    a("Energy Saving", "kWh per machine", "วัดพลังงานรายเครื่อง"),
    a("Predictive Maintenance", "Motor health", "สุขภาพมอเตอร์"),
    a("Factory Utilities", "Pumps, air and cooling", "ปั๊ม ลม และระบบทำความเย็น"),
  ],
  rows: [
    r("24 V supply for a control panel", "ไฟ 24 V สำหรับตู้ควบคุม", "S8VK"),
    r("Small panel, tight space", "ตู้เล็ก พื้นที่จำกัด", "S8FS / S82K"),
    r("Keep a PC or controller on in a power cut", "ให้ PC / Controller ทำงานตอนไฟดับ", "S8BA"),
    r("Measure energy per machine", "วัดพลังงานรายเครื่อง", "KM-N2"),
    r("Spot motor problems early", "ตรวจปัญหามอเตอร์ล่วงหน้า", "K6CM"),
    r("Return braking energy", "คืนพลังงานจากการเบรก", "D1000 / R1000"),
  ],
});

const ROBOTICS = landing({
  name: "Robotics",
  brand: "OMRON · YASKAWA",
  word: { a: "a robot", many: "Robots", th: "หุ่นยนต์" },
  tagline: ["Robots for welding, handling, palletizing and working beside people", "หุ่นยนต์งานเชื่อม หยิบจับ จัดเรียง และทำงานร่วมกับคน"],
  intro: [
    "YASKAWA MOTOMAN industrial robots, OMRON TM collaborative robots and OMRON mobile robots. Tell us the part, weight and cycle time.",
    "หุ่นยนต์อุตสาหกรรม YASKAWA MOTOMAN หุ่นยนต์ทำงานร่วมกับคน OMRON TM และหุ่นยนต์เคลื่อนที่ OMRON บอกชิ้นงาน น้ำหนัก และรอบเวลาที่ต้องการ",
  ],
  catsText: ["Industrial arms, collaborative robots or mobile robots that move goods.", "แขนกลอุตสาหกรรม หุ่นยนต์ทำงานร่วมกับคน หรือหุ่นยนต์เคลื่อนที่ขนของ"],
  categories: [
    c("articulated", "Articulated Robots", ["Fast industrial arms", "แขนกลอุตสาหกรรมความเร็วสูง"], ["Handling, welding and machine tending.", "งานหยิบจับ งานเชื่อม และป้อนชิ้นงานเข้าเครื่อง"], ["YASKAWA GP", "YASKAWA AR", "YASKAWA MA"]),
    c("collaborative", "Collaborative Robots", ["Work beside people", "ทำงานข้างคนได้"], ["Quick to set up, with built-in vision on OMRON TM.", "ติดตั้งเร็ว OMRON TM มีกล้องในตัว"], ["OMRON TM", "YASKAWA HC"]),
    c("palletizing", "Palletizing & Delta", ["Stacking and fast picking", "จัดเรียงและหยิบเร็ว"], ["Palletizing robots and delta robots for packing lines.", "หุ่นยนต์จัดเรียงพาเลทและ Delta สำหรับไลน์บรรจุ"], ["YASKAWA MPL", "YASKAWA MPP"]),
    c("mobile", "Mobile Robots", ["Move goods without tracks", "ขนของโดยไม่ต้องวางราง"], ["Autonomous mobile robots that map the plant.", "AMR นำทางเองด้วยแผนที่โรงงาน"], ["OMRON LD", "OMRON HD"]),
    c("robot-controllers", "Robot Controllers", ["Control the robot cell", "ควบคุมเซลล์หุ่นยนต์"], ["Robot controllers and Sysmac robot control.", "Robot Controller และการควบคุมหุ่นยนต์ผ่าน Sysmac"], ["YASKAWA YRC1000", "OMRON NJ / NY"]),
  ],
  apps: [
    a("Arc Welding", "Repeatable welds", "งานเชื่อมคุณภาพสม่ำเสมอ"),
    a("Palletizing", "Stack boxes and bags", "จัดเรียงกล่องและกระสอบ"),
    a("Pick & Place", "Fast picking", "หยิบวางความเร็วสูง"),
    a("Machine Tending", "Load CNC machines", "ป้อนชิ้นงานเข้าเครื่อง CNC"),
    a("Intralogistics", "Move goods in the plant", "ขนส่งของภายในโรงงาน"),
    a("Assembly", "Screwing and inserting", "ขันสกรูและประกอบชิ้นงาน"),
  ],
  rows: [
    r("Arc welding", "งานเชื่อม", "YASKAWA AR"),
    r("General handling, heavy parts", "หยิบจับทั่วไป ชิ้นงานหนัก", "YASKAWA GP"),
    r("Working next to operators", "ทำงานข้างพนักงาน", "OMRON TM / YASKAWA HC"),
    r("Stacking boxes on pallets", "จัดเรียงกล่องบนพาเลท", "YASKAWA MPL"),
    r("Very fast light picking", "หยิบชิ้นงานเบาเร็วมาก", "YASKAWA MPP"),
    r("Moving carts between stations", "ขนรถเข็นระหว่างสถานี", "OMRON LD / HD"),
  ],
});

const SOFTWARE = landing({
  name: "Software",
  brand: "OMRON · YASKAWA",
  word: { a: "software", many: "Software tools", th: "Software" },
  tagline: ["Program, set up and maintain your automation", "เขียนโปรแกรม ตั้งค่า และดูแลระบบอัตโนมัติ"],
  intro: [
    "OMRON Sysmac Studio and CX-One, plus YASKAWA tools for servo, drives and motion controllers.",
    "Sysmac Studio และ CX-One จาก OMRON รวมถึงซอฟต์แวร์ YASKAWA สำหรับเซอร์โว ไดรฟ์ และ Motion Controller",
  ],
  catsText: ["Pick the tool that matches the controller or drive you use.", "เลือกซอฟต์แวร์ให้ตรงกับ Controller หรือ Drive ที่ใช้"],
  categories: [
    c("sysmac-studio", "Sysmac Studio", ["One tool for the whole machine", "เครื่องมือเดียวทั้งเครื่องจักร"], ["Logic, motion, safety, vision and HMI for NJ / NX / NY.", "Logic, Motion, Safety, Vision และ HMI สำหรับ NJ / NX / NY"], ["Sysmac Studio"]),
    c("cx-one", "CX-One", ["PLC programming", "เขียนโปรแกรม PLC"], ["For CP, CJ and CS PLCs and NB / NS screens.", "สำหรับ PLC ตระกูล CP, CJ, CS และหน้าจอ NB / NS"], ["CX-Programmer", "CX-Designer", "NB-Designer"]),
    c("servo-tools", "Servo Tools", ["Set up and tune YASKAWA servo", "ตั้งค่าและจูนเซอร์โว YASKAWA"], ["Sizing, tuning and diagnosis for Sigma servo.", "เลือกขนาด จูน และวิเคราะห์ปัญหาเซอร์โว Sigma"], ["SigmaWin+", "SigmaSelect"]),
    c("drive-tools", "Drive Tools", ["Set up YASKAWA inverters", "ตั้งค่าอินเวอร์เตอร์ YASKAWA"], ["Parameters, monitoring and backup for drives.", "ตั้งพารามิเตอร์ ดูค่า และสำรองข้อมูลไดรฟ์"], ["DriveWizard"]),
    c("motion-tools", "Motion Programming", ["Program YASKAWA motion", "เขียนโปรแกรม Motion ของ YASKAWA"], ["For MP series motion controllers.", "สำหรับ Motion Controller ตระกูล MP"], ["MPE720", "MotionWorks IEC"]),
  ],
  apps: [
    a("Programming", "Write machine logic", "เขียนลอจิกเครื่องจักร"),
    a("Simulation", "Test before the machine is built", "ทดสอบก่อนสร้างเครื่องจริง"),
    a("Commissioning", "Set up and tune", "ตั้งค่าและจูนเครื่อง"),
    a("Maintenance", "Diagnose and back up", "วิเคราะห์ปัญหาและสำรองข้อมูล"),
  ],
  rows: [
    r("Program an NJ / NX controller", "เขียนโปรแกรม NJ / NX", "Sysmac Studio"),
    r("Program a CP / CJ PLC", "เขียนโปรแกรม CP / CJ", "CX-Programmer (CX-One)"),
    r("Tune a YASKAWA Sigma servo", "จูนเซอร์โว YASKAWA Sigma", "SigmaWin+"),
    r("Set up a YASKAWA inverter", "ตั้งค่าอินเวอร์เตอร์ YASKAWA", "DriveWizard"),
    r("Program a YASKAWA MP controller", "เขียนโปรแกรม YASKAWA MP", "MPE720"),
  ],
});

const ELECTRICAL = landing({
  name: "Industrial Electrical",
  brand: "OMRON",
  word: { a: "a panel component", many: "Panel components", th: "อุปกรณ์ไฟฟ้าในตู้" },
  tagline: ["The parts every control panel needs", "อุปกรณ์ที่ตู้ควบคุมทุกตู้ต้องใช้"],
  intro: [
    "OMRON push buttons, lamps, relays and sockets, terminal blocks and power supplies for building control panels.",
    "สวิตช์ปุ่มกด ไฟแสดงสถานะ รีเลย์และซ็อกเก็ต เทอร์มินอล และ Power Supply จาก OMRON สำหรับประกอบตู้ควบคุม",
  ],
  catsText: ["From the door of the panel to the DIN rail inside it.", "ตั้งแต่หน้าตู้จนถึงอุปกรณ์บนราง DIN ภายในตู้"],
  categories: [
    c("push-buttons", "Push Buttons & Selectors", ["Operator controls on the panel door", "ปุ่มสั่งงานหน้าตู้"], ["22 mm and 30 mm buttons, selectors and buzzers.", "ปุ่มกด 22 mm และ 30 mm สวิตช์เลือก และ Buzzer"], ["A22N", "M22N", "A30N"]),
    c("lamps", "Indicator Lamps", ["Show machine status", "แสดงสถานะเครื่อง"], ["LED pilot lamps for run, stop and fault.", "ไฟ LED แสดงสถานะ Run, Stop และ Fault"], ["A22N", "M22N"]),
    c("relays", "Relays & Sockets", ["Switch control circuits", "สั่งงานวงจรควบคุม"], ["General relays with matching DIN-rail sockets.", "รีเลย์งานทั่วไปพร้อมซ็อกเก็ตติดราง DIN"], ["MY", "G2R", "G6B", "P2RF"]),
    c("terminal-blocks", "Terminal Blocks", ["Tidy, fast wiring", "เดินสายเป็นระเบียบและรวดเร็ว"], ["Push-in terminal blocks that save wiring time.", "เทอร์มินอลแบบ Push-in ลดเวลาเดินสาย"], ["XW2", "XW5T"]),
    c("power-supplies", "Power Supplies", ["24 V for the panel", "ไฟ 24 V สำหรับตู้"], ["Compact DIN-rail power supplies.", "Power Supply ติดราง DIN ขนาดกะทัดรัด"], ["S8VK", "S8FS"]),
  ],
  apps: [
    a("Control Panel", "Panel building", "ประกอบตู้ควบคุม"),
    a("Operator Station", "Buttons and lamps", "ปุ่มกดและไฟแสดงสถานะ"),
    a("Machine Builder", "Standard panel parts", "อุปกรณ์มาตรฐานสำหรับผู้สร้างเครื่อง"),
    a("Building Systems", "Pumps and ventilation", "ระบบปั๊มและระบายอากาศ"),
  ],
  rows: [
    r("Push button on the panel door", "ปุ่มกดหน้าตู้", "A22N / M22N"),
    r("Status lamp", "ไฟแสดงสถานะ", "A22N / M22N"),
    r("Control relay with socket", "รีเลย์ควบคุมพร้อมซ็อกเก็ต", "MY + PYF / G2R + P2RF"),
    r("Fast wiring on the DIN rail", "เดินสายบนราง DIN ให้เร็ว", "XW5T"),
    r("24 V supply", "ไฟเลี้ยง 24 V", "S8VK"),
  ],
});

const IT = landing({
  name: "Industrial IT & IIoT",
  brand: "OMRON · YASKAWA",
  word: { a: "an IIoT solution", many: "IIoT solutions", th: "IIoT" },
  tagline: ["Turn machine data into decisions", "เปลี่ยนข้อมูลเครื่องจักรเป็นการตัดสินใจ"],
  intro: [
    "Edge controllers, industrial PCs and connectivity from OMRON and YASKAWA to collect, show and use production data.",
    "Edge Controller, Industrial PC และระบบเชื่อมต่อจาก OMRON และ YASKAWA สำหรับเก็บ แสดงผล และใช้ข้อมูลการผลิต",
  ],
  catsText: ["Collect data at the machine, connect it, then put it to work.", "เก็บข้อมูลที่เครื่อง เชื่อมต่อ แล้วนำไปใช้งาน"],
  categories: [
    c("edge", "Edge Computing", ["Collect and process data at the line", "เก็บและประมวลผลข้อมูลที่ไลน์"], ["No-code data flow from machines to dashboards.", "ส่งข้อมูลจากเครื่องสู่ Dashboard แบบไม่ต้องเขียนโค้ด"], ["DX1", "NX / NJ"]),
    c("ipc", "Industrial PC Platform", ["PCs built for the plant", "PC สำหรับโรงงาน"], ["Box and panel PCs for data and line software.", "Box PC และ Panel PC สำหรับข้อมูลและซอฟต์แวร์ประจำไลน์"], ["NYB", "NYP"]),
    c("connectivity", "Industrial Communication", ["Link machines to IT", "เชื่อมเครื่องจักรกับ IT"], ["OPC UA, EtherNet/IP and EtherCAT connectivity.", "เชื่อมต่อผ่าน OPC UA, EtherNet/IP และ EtherCAT"], ["OPC UA", "EtherNet/IP", "EtherCAT"]),
    c("data", "Data Collection", ["Logging and monitoring", "บันทึกและติดตามข้อมูล"], ["Production counts, downtime and condition data.", "ยอดผลิต เวลาหยุดเครื่อง และข้อมูลสภาพเครื่อง"], ["DX1", "K6CM"]),
    c("yaskawa-connect", "YASKAWA Connectivity", ["Robot and drive data", "ข้อมูลหุ่นยนต์และไดรฟ์"], ["Connect YASKAWA robots, servo and drives to plant systems.", "เชื่อมหุ่นยนต์ เซอร์โว และไดรฟ์ YASKAWA เข้าระบบโรงงาน"], ["MECHATROLINK", "EtherCAT"]),
  ],
  apps: [
    a("Production Monitoring", "Output and downtime", "ยอดผลิตและเวลาหยุด"),
    a("OEE", "Line efficiency", "ประสิทธิภาพไลน์"),
    a("Predictive Maintenance", "Fix before failure", "ซ่อมก่อนเสีย"),
    a("Traceability", "Track every part", "ติดตามทุกชิ้นงาน"),
    a("Energy Tracking", "kWh per product", "พลังงานต่อชิ้นงาน"),
    a("Smart Factory", "Connect the whole plant", "เชื่อมทั้งโรงงาน"),
  ],
  rows: [
    r("Machine data to a dashboard without coding", "ข้อมูลเครื่องสู่ Dashboard ไม่ต้องเขียนโค้ด", "DX1"),
    r("Controller data to SCADA / MES", "ข้อมูล Controller สู่ SCADA / MES", "NX102 (OPC UA)"),
    r("PC on the line for data software", "PC ประจำไลน์สำหรับซอฟต์แวร์ข้อมูล", "NYB / NYP"),
    r("Watch motor health", "เฝ้าดูสุขภาพมอเตอร์", "K6CM"),
    r("Count output and downtime", "นับยอดผลิตและเวลาหยุดเครื่อง", "DX1"),
  ],
});

const SWITCHES = landing({
  name: "Switches & Human Interface Devices",
  brand: "OMRON",
  word: { a: "a switch", many: "Switches", th: "Switch" },
  tagline: ["Buttons, limit switches and safety switches for machines", "ปุ่มกด ลิมิตสวิตช์ และสวิตช์ Safety สำหรับเครื่องจักร"],
  intro: [
    "OMRON push buttons, selectors, emergency stops, lamps, limit switches, safety door switches and basic switches.",
    "สวิตช์ปุ่มกด สวิตช์เลือก ปุ่มหยุดฉุกเฉิน ไฟแสดงสถานะ ลิมิตสวิตช์ สวิตช์ประตู Safety และ Basic Switch จาก OMRON",
  ],
  catsText: ["Controls people press, and switches the machine touches.", "สวิตช์ที่คนกด และสวิตช์ที่เครื่องจักรกด"],
  categories: [
    c("push-buttons", "Push Buttons & Selectors", ["Operator controls", "อุปกรณ์สั่งงาน"], ["22 mm and 30 mm buttons, 2/3-position and key selectors.", "ปุ่มกด 22 mm และ 30 mm สวิตช์เลือก 2/3 ตำแหน่ง และแบบกุญแจ"], ["A22N", "M22N", "A30N"]),
    c("estop", "Emergency Stop & Lamps", ["Stop and show status", "หยุดฉุกเฉินและแสดงสถานะ"], ["E-stops, pilot lamps and buzzers.", "ปุ่มหยุดฉุกเฉิน ไฟแสดงสถานะ และ Buzzer"], ["A22E", "A22NE", "A22N"]),
    c("limit", "Limit Switches", ["Detect position by contact", "ตรวจตำแหน่งแบบสัมผัส"], ["Tough switches for oil, dust and heavy duty.", "ทนน้ำมัน ฝุ่น และงานหนัก"], ["WL", "D4C", "D4E", "SHL", "D4A"]),
    c("safety-door", "Safety Door Switches", ["Interlock guards", "Interlock ประตูเครื่อง"], ["Mechanical and locking door switches.", "สวิตช์ประตูแบบกลไกและแบบล็อก"], ["D4NS", "D4NL", "D4SL-N", "D4GS-N"]),
    c("basic", "Basic & Micro Switches", ["Small, precise switching", "สวิตช์เล็ก แม่นยำ"], ["Snap-action switches for machines and equipment.", "สวิตช์ Snap-action สำหรับเครื่องจักรและอุปกรณ์"], ["Z", "V", "SS", "D2F"]),
  ],
  apps: [
    a("Operator Panel", "Buttons and lamps", "ปุ่มกดและไฟแสดงสถานะ"),
    a("Machine Position", "End of travel", "ตำแหน่งปลายทาง"),
    a("Door Interlock", "Guard monitoring", "ตรวจสอบประตูเครื่อง"),
    a("OEM Equipment", "Built into products", "ติดตั้งในผลิตภัณฑ์"),
  ],
  rows: [
    r("Start / stop button", "ปุ่ม Start / Stop", "A22N / M22N"),
    r("Emergency stop", "ปุ่มหยุดฉุกเฉิน", "A22E / A22NE"),
    r("End of travel on a machine", "ตำแหน่งสุดระยะของเครื่อง", "WL / D4C"),
    r("Heavy duty, oily areas", "งานหนัก พื้นที่มีน้ำมัน", "D4A / WL"),
    r("Guard door interlock", "Interlock ประตูเครื่อง", "D4NS / D4NL"),
    r("Small switch inside equipment", "สวิตช์เล็กในอุปกรณ์", "V / SS / D2F"),
  ],
});

const ENCLOSURES = landing({
  name: "Industrial Enclosures",
  brand: "NITTO KOGYO",
  word: { a: "an enclosure", many: "Enclosures", th: "ตู้ไฟ" },
  tagline: ["Steel and stainless cabinets for control panels", "ตู้เหล็กและตู้สแตนเลสสำหรับตู้ควบคุม"],
  intro: [
    "NITTO KOGYO wall-mount, floor-standing, stainless and outdoor enclosures, terminal boxes and accessories.",
    "ตู้ NITTO KOGYO แบบติดผนัง แบบตั้งพื้น สแตนเลส และกลางแจ้ง รวมถึงกล่องเทอร์มินอลและอุปกรณ์เสริม",
  ],
  catsText: ["Choose by size, material and where the cabinet will stand.", "เลือกตามขนาด วัสดุ และสถานที่ติดตั้ง"],
  categories: [
    c("steel", "Steel Control Cabinets", ["Standard control panels", "ตู้ควบคุมมาตรฐาน"], ["Wall-mount and floor-standing steel cabinets.", "ตู้เหล็กแบบติดผนังและแบบตั้งพื้น"], ["RA", "RAV", "FR", "F", "HY"]),
    c("stainless", "Stainless Steel Enclosures", ["Food, chemical and wash-down areas", "งานอาหาร เคมี และพื้นที่ล้างน้ำ"], ["Corrosion resistant and easy to clean.", "ทนการกัดกร่อน ทำความสะอาดง่าย"], ["SOR", "SR"]),
    c("outdoor", "Outdoor Enclosures", ["Rain, dust and sun", "ทนฝน ฝุ่น และแดด"], ["Weatherproof and waterproof cabinets.", "ตู้กันฝนและกันน้ำ"], ["Weatherproof", "Waterproof"]),
    c("terminal-boxes", "Terminal Boxes", ["Small junction boxes", "กล่องต่อสายขนาดเล็ก"], ["For field wiring and small controls.", "สำหรับต่อสายภาคสนามและอุปกรณ์ขนาดเล็ก"], ["TB", "WP"]),
    c("accessories", "Enclosure Accessories", ["Cooling and mounting", "ระบายความร้อนและการติดตั้ง"], ["Fan units, filters, DIN rails and mounting plates.", "พัดลม ฟิลเตอร์ ราง DIN และแผ่นติดตั้ง"], ["Fan Units", "Filters", "DIN Rails"]),
  ],
  apps: [
    a("Control Panel", "Machine and process panels", "ตู้ควบคุมเครื่องจักรและกระบวนการ"),
    a("Power Distribution", "MDB and DB panels", "ตู้ MDB และ DB"),
    a("Food Plant", "Stainless wash-down", "ตู้สแตนเลสล้างน้ำได้"),
    a("Outdoor Site", "Pumps and utilities", "งานปั๊มและสาธารณูปโภค"),
  ],
  rows: [
    r("Wall-mount control panel", "ตู้ควบคุมติดผนัง", "RA / HY"),
    r("Large floor-standing panel", "ตู้ขนาดใหญ่ตั้งพื้น", "FR / F"),
    r("Food or wash-down area", "พื้นที่อาหารหรือล้างน้ำ", "SOR / SR"),
    r("Outdoors in rain and sun", "กลางแจ้ง ตากแดดตากฝน", "Weatherproof"),
    r("Small junction box", "กล่องต่อสายขนาดเล็ก", "TB / WP"),
    r("Hot panel that needs cooling", "ตู้ร้อนต้องระบายความร้อน", "Fan Units + Filters"),
  ],
});

/** By admin type slug (Control Components is RELAY in productLandings.js). */
export const MORE_TYPE_LANDINGS = {
  "sensors-identification": SENSORS,
  "plc-controllers": PLC,
  "hmi-industrial-pc": HMI,
  "networks-iiot": NETWORKS,
  "drives-inverters": DRIVES,
  "servo-motion": SERVO,
  safety: SAFETY,
  "level-control": LEVEL,
  "power-energy": POWER,
  robotics: ROBOTICS,
  software: SOFTWARE,
  "industrial-electrical": ELECTRICAL,
  "industrial-it-iiot": IT,
  "switches-human-interface-devices": SWITCHES,
  "industrial-enclosures": ENCLOSURES,
};
