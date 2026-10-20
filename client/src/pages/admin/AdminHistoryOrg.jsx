import { HistoryItemsList, HISTORY_ADMIN_BASE } from "../../components/HistoryAdmin.jsx";
import { flattenOrg, siblingsOf } from "../../utils/orgTree.js";

const rowLabel = (r) => r.name_en + (r.person_en ? ` (${r.person_en})` : "");

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
    header: "Position / Department (EN / TH)",
    render: (r) => (
      <div className="industry-row-names" style={{ paddingLeft: r._depth * 22 }}>
        <span>
          {r._depth > 0 && <span className="history-tree-branch">└ </span>}
          {r.name_en}
        </span>
        <span className="industry-row-names__th">{r.name_th || "— no Thai name —"}</span>
        {r._hiddenByAncestor && <span className="history-row-note">Hidden on site — a parent node is disabled</span>}
      </div>
    ),
  },
  {
    header: "Person (EN / TH)",
    render: (r) =>
      r.person_en || r.person_th ? (
        <div className="industry-row-names">
          <span>{r.person_en || "—"}</span>
          <span className="industry-row-names__th">{r.person_th || "— no Thai name —"}</span>
        </div>
      ) : (
        <span className="admin-list-table__muted">—</span>
      ),
  },
  {
    header: "Reports to",
    render: (r) => <span className="admin-list-table__muted">{r._parentName || "— top level —"}</span>,
  },
];

// Arrows move a node among its siblings (same parent) only.
const canMove = (row, rows, dir) => {
  const sibs = siblingsOf(row, rows);
  const i = sibs.findIndex((s) => s.id === row.id);
  return dir === "up" ? i > 0 : i < sibs.length - 1;
};

/** History → Organization Structure management list (tree shown indented). */
export default function AdminHistoryOrg() {
  return (
    <HistoryItemsList
      section="organization"
      tabLabel="โครงสร้างองค์กร (Organization)"
      basePath={`${HISTORY_ADMIN_BASE}/organization`}
      noun="node"
      hint="The History page's organization chart. Each node reports to its parent; the order arrows move a node among nodes with the same parent."
      addLabel="+ Add Node"
      columns={columns}
      rowLabel={rowLabel}
      prepareRows={flattenOrg}
      canMove={canMove}
      disableNote="Everything reporting to it will be hidden from the public chart too."
    />
  );
}
