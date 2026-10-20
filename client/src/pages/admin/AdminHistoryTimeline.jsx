import { HistoryItemsList, HISTORY_ADMIN_BASE } from "../../components/HistoryAdmin.jsx";

const rowLabel = (r) => `${r.year_en} — ${r.title_en}`;

const columns = [
  {
    header: "Image",
    render: (r) =>
      r.image_url ? (
        <img src={r.image_url} alt="" className="admin-list-thumb" />
      ) : (
        <span className="admin-list-thumb admin-list-thumb--empty" />
      ),
  },
  {
    header: "Year / Date (EN / TH)",
    render: (r) => (
      <div className="industry-row-names">
        <span>{r.year_en}</span>
        <span className="industry-row-names__th">{r.year_th || "— no Thai —"}</span>
      </div>
    ),
  },
  {
    header: "Event (EN / TH)",
    render: (r) => (
      <div className="industry-row-names">
        <span>{r.title_en}</span>
        <span className="industry-row-names__th">{r.title_th || "— no Thai title —"}</span>
      </div>
    ),
  },
];

/** History → Timeline management list (add / edit / enable / reorder / delete). */
export default function AdminHistoryTimeline() {
  return (
    <HistoryItemsList
      section="timeline"
      tabLabel="ไทม์ไลน์ (Timeline)"
      basePath={`${HISTORY_ADMIN_BASE}/timeline`}
      noun="entry"
      hint="Shown on the History page's Company History timeline, top to bottom in this order. Disabled entries are hidden from the public page."
      addLabel="+ Add Entry"
      columns={columns}
      rowLabel={rowLabel}
    />
  );
}
