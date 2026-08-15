export default function SectionLabel({ index, eyebrow, title, lede }) {
  return (
    <div className="section-head">
      {index && <span className="tag-index">{index}</span>}
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h2>{title}</h2>
      {lede && <p className="lede">{lede}</p>}
    </div>
  );
}
