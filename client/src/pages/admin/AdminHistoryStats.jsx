import { HistoryItemsList, HISTORY_ADMIN_BASE } from "../../components/HistoryAdmin.jsx";

const rowLabel = (r) => `${r.value}${r.unit_en ? ` ${r.unit_en}` : ""} — ${r.label_en}`;

const columns = [
  {
    header: "Value",
    render: (r) => (
      <strong>
        {r.value}
        {r.unit_en ? ` ${r.unit_en}` : ""}
      </strong>
    ),
  },
  {
    header: "Label (EN / TH)",
    render: (r) => (
      <div className="industry-row-names">
        <span>{r.label_en}</span>
        <span className="industry-row-names__th">{r.label_th || "— no Thai label —"}</span>
      </div>
    ),
  },
];

/** History → Statistics management list. */
export default function AdminHistoryStats() {
  return (
    <HistoryItemsList
      section="statistics"
      tabLabel="สถิติ (Statistics)"
      basePath={`${HISTORY_ADMIN_BASE}/statistics`}
      noun="statistic"
      hint={'Shown on the History page\'s "At a Glance" statistics row, left to right in this order. Disabled statistics are hidden from the public page.'}
      addLabel="+ Add Statistic"
      columns={columns}
      rowLabel={rowLabel}
    />
  );
}
