/**
 * Animated blueprint-style background for the admin sign-in page: two
 * robotic arms picking from a conveyor belt that carries boxes past.
 * Pure SVG + CSS keyframes (styles in catalog.css, .robot-scene*), so it
 * costs no extra download; frozen when the visitor prefers reduced motion.
 *
 * Each joint is a nested <g> whose local origin is the pivot, so a CSS
 * rotate() on it turns the rest of the arm around that joint.
 */

function RobotArm({ x, mirrored = false, delay = "0s" }) {
  return (
    <g transform={`translate(${x} 820)${mirrored ? " scale(-1 1)" : ""}`}>
      <g className="robot-arm" style={{ "--delay": delay }}>
        {/* pedestal + turret */}
        <path className="robot-scene__part" d="M-70 0 L-52 -46 H52 L70 0 Z" />
        <rect className="robot-scene__part" x="-40" y="-70" width="80" height="26" rx="6" />
        <circle className="robot-scene__joint" cx="0" cy="-78" r="26" />

        {/* shoulder → upper arm */}
        <g transform="translate(0 -78)">
          <g className="robot-arm__shoulder">
            <rect className="robot-scene__part" x="-22" y="-250" width="44" height="250" rx="22" />
            <line className="robot-scene__detail" x1="0" y1="-40" x2="0" y2="-210" />
            <circle className="robot-scene__joint" cx="0" cy="-250" r="24" />

            {/* elbow → forearm */}
            <g transform="translate(0 -250)">
              <g className="robot-arm__elbow">
                <rect className="robot-scene__part" x="0" y="-17" width="200" height="34" rx="17" />
                <line className="robot-scene__detail" x1="36" y1="0" x2="168" y2="0" />
                <circle className="robot-scene__joint" cx="200" cy="0" r="17" />

                {/* wrist → gripper */}
                <g transform="translate(200 0)">
                  <g className="robot-arm__wrist">
                    <rect className="robot-scene__part" x="-12" y="0" width="24" height="44" rx="6" />
                    <rect className="robot-scene__part" x="-30" y="44" width="60" height="12" rx="4" />
                    <g className="robot-arm__finger robot-arm__finger--l">
                      <rect className="robot-scene__part" x="-28" y="56" width="10" height="38" rx="3" />
                    </g>
                    <g className="robot-arm__finger robot-arm__finger--r">
                      <rect className="robot-scene__part" x="18" y="56" width="10" height="38" rx="3" />
                    </g>
                    <circle className="robot-scene__led" cx="0" cy="22" r="4" />
                  </g>
                </g>
              </g>
            </g>
          </g>
        </g>
      </g>
    </g>
  );
}

export default function LoginRobotScene() {
  return (
    <svg
      className="robot-scene"
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
      focusable="false"
    >
      {/* conveyor belt along the bottom */}
      <g className="robot-scene__conveyor">
        <rect className="robot-scene__part" x="-40" y="828" width="1680" height="30" rx="15" />
        <line className="robot-scene__belt" x1="-40" y1="843" x2="1640" y2="843" />
        {Array.from({ length: 17 }, (_, i) => (
          <circle key={i} className="robot-scene__roller" cx={i * 100} cy="843" r="9" />
        ))}
      </g>

      {/* boxes riding the belt (staggered so a few are always on screen) */}
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i} className="robot-scene__box" style={{ "--delay": `${-i * 5.2}s` }}>
          <rect className="robot-scene__part" x="0" y="772" width="64" height="56" rx="4" />
          <path className="robot-scene__detail" d="M0 790 H64 M32 772 V790" />
        </g>
      ))}

      <RobotArm x={330} />
      <RobotArm x={1270} mirrored delay="-4s" />

      {/* faint signal lines between the arms */}
      <path className="robot-scene__signal" d="M330 600 C 600 470, 1000 470, 1270 600" />
    </svg>
  );
}
