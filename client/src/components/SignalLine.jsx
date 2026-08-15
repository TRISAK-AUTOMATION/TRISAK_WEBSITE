/**
 * SignalLine — the site's signature visual motif.
 * A schematic control-signal trace (right-angle bends, like a PCB / ladder-logic
 * wire) that connects a row of nodes. Used between "Our Strength" blocks on
 * Home and echoed as a vertical flow in the Engineering Process section.
 */
export default function SignalLine({ nodes = 3, orientation = "horizontal" }) {
  if (orientation === "vertical") {
    const height = nodes * 120;
    const cx = 20;
    const points = Array.from({ length: nodes }, (_, i) => 20 + i * 120);

    return (
      <svg
        className="signal-line signal-line--vertical"
        viewBox={`0 0 40 ${height}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          className="signal-path-active"
          d={`M ${cx} ${points[0]} L ${cx} ${points[points.length - 1]}`}
        />
        {points.map((y, i) => (
          <circle key={i} cx={cx} cy={y} r={4} className={i === 0 ? "signal-node-pulse" : ""} />
        ))}
      </svg>
    );
  }

  const width = nodes * 320;
  const cy = 20;
  const points = Array.from({ length: nodes }, (_, i) => 160 + i * 320);
  const path = points
    .map((x, i) => (i === 0 ? `M ${x} ${cy}` : `L ${x} ${cy}`))
    .join(" ");

  return (
    <svg
      className="signal-line signal-line--horizontal"
      viewBox={`0 0 ${width} 40`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path className="signal-path-active" d={path} />
      {points.map((x, i) => (
        <circle key={i} cx={x} cy={cy} r={4} className={i === 0 ? "signal-node-pulse" : ""} />
      ))}
    </svg>
  );
}
