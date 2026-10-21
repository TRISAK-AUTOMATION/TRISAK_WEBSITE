import { useEffect, useState } from "react";
import SectionLabel from "../components/SectionLabel.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { api } from "../api/client.js";

const BRANDS = ["OMRON", "YASKAWA", "NITTO"];

// A stat's unit/suffix attaches directly to symbols ("30+"), but gets a
// space when it's a word ("30 years").
const unitSep = (unit) => (/^\p{L}/u.test(unit) ? " " : "");

// One org-chart node plus, recursively, everything reporting to it. The
// markup/classes match the original static chart: a node, a connector
// line, then a row of its children.
function OrgItem({ node, root = false }) {
  const rich = Boolean(node.image || node.person);
  return (
    <div className="org-item">
      <div className={`org-node${root ? " org-node--root" : ""}${rich ? " org-node--rich" : ""}`}>
        {node.image && <img className="org-node__img" src={node.image} alt="" loading="lazy" />}
        {rich ? <span>{node.name}</span> : node.name}
        {node.person && <span className="org-node__person">{node.person}</span>}
      </div>
      {node.children.length > 0 && (
        <>
          <div className="org-connector" />
          <div className="org-branch">
            {node.children.map((child) => (
              <OrgItem key={child.id} node={child} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function History() {
  const { t, lang } = useLanguage();
  const [aboutContent, setAboutContent] = useState(null);
  // Timeline / statistics / organization chart come from the database
  // (Admin → History). The built-in translations below are only a safety
  // net for when that request fails, so the page never renders empty.
  const [historyContent, setHistoryContent] = useState(null);
  const [historyFailed, setHistoryFailed] = useState(false);

  useEffect(() => {
    api
      .getAboutContent()
      .then(setAboutContent)
      .catch(() => setAboutContent(null));
    api
      .getHistoryContent()
      .then(setHistoryContent)
      .catch(() => setHistoryFailed(true));
  }, []);

  // `${base}_${lang}` with English as the fallback for a blank translation.
  const pick = (row, base) => row[`${base}_${lang}`] || row[`${base}_en`] || "";

  let timeline = [];
  let stats = [];
  let orgRoots = [];
  if (historyContent) {
    timeline = historyContent.timeline.map((m) => ({
      id: m.id,
      year: pick(m, "year"),
      title: pick(m, "title"),
      body: pick(m, "description"),
      image: m.image_url,
    }));
    stats = historyContent.stats.map((s) => ({
      id: s.id,
      num: s.value,
      unit: pick(s, "unit"),
      label: pick(s, "label"),
    }));
    const toNode = (n) => ({
      id: n.id,
      name: pick(n, "name"),
      person: pick(n, "person"),
      image: n.image_url,
      children: n.children.map(toNode),
    });
    orgRoots = historyContent.org.map(toNode);
  } else if (historyFailed) {
    timeline = t("history.milestones").map((m) => ({ id: m.title, ...m, body: m.body, image: null }));
    stats = t("history.stats").map((s) => ({ id: s.label, num: s.num, unit: "", label: s.label }));
    orgRoots = [
      {
        id: "root",
        name: "TRISAK GROUP",
        person: "",
        image: null,
        children: t("history.structureNodes").map((name) => ({ id: name, name, person: "", image: null, children: [] })),
      },
    ];
  }

  // Reads `${field}_${lang}` from the admin-editable about_content
  // row, falling back to the built-in translation if the DB row
  // isn't loaded yet (or hasn't been edited from its default).
  const ac = (field, fallback) => {
    if (!aboutContent) return fallback;
    const value = aboutContent[`${field}_${lang}`];
    return value || fallback;
  };

  return (
    <>
      <section className="hero hero--compact">
        <div className="hero__grid-overlay" aria-hidden="true" />
        <div className="container hero__content">
          <span className="hero__meta">{ac("hero_meta", t("history.heroMeta"))}</span>
          <h1>{ac("hero_title", t("history.heroTitle"))}</h1>
          <p className="hero__sub">{ac("hero_sub", t("history.heroSub"))}</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionLabel
            eyebrow={ac("intro_eyebrow", t("history.introEyebrow"))}
            title={ac("intro_title", t("history.introTitle"))}
            lede={ac("intro_lede", t("history.introLede"))}
          />
          <p className="lede" style={{ maxWidth: "62ch" }}>
            {ac("intro_body", t("history.introBody"))}
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionLabel eyebrow={t("history.timelineEyebrow")} title={t("history.timelineTitle")} />
          <div className="timeline">
            {timeline.map((m) => (
              <div className="timeline__item" key={m.id}>
                <span className="timeline__year">{m.year}</span>
                <h3>{m.title}</h3>
                {m.body && <p>{m.body}</p>}
                {m.image && <img className="timeline__image" src={m.image} alt="" loading="lazy" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionLabel eyebrow={t("history.statsEyebrow")} title={t("history.statsTitle")} />
          <div className="stat-row">
            {stats.map((s) => (
              <div className="stat-cell" key={s.id}>
                <span className="stat-cell__num">
                  {s.num}
                  {s.unit ? unitSep(s.unit) + s.unit : ""}
                </span>
                <span className="stat-cell__label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionLabel eyebrow={t("history.structureEyebrow")} title={t("history.structureTitle")} />
          {orgRoots.length > 0 && (
            <div className="org-diagram panel">
              {orgRoots.length === 1 ? (
                <OrgItem node={orgRoots[0]} root />
              ) : (
                <div className="org-branch">
                  {orgRoots.map((node) => (
                    <OrgItem key={node.id} node={node} root />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionLabel
            eyebrow={t("history.experienceEyebrow")}
            title={t("history.experienceTitle")}
            lede={t("history.experienceLede")}
          />
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionLabel index="06" eyebrow={t("history.partnersEyebrow")} title={t("history.partnersTitle")} />
          <div className="brand-strip">
            {BRANDS.map((b) => (
              <span className="brand-strip__name" key={b}>
                {b}
              </span>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
