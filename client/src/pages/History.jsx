import { useEffect, useState } from "react";
import SectionLabel from "../components/SectionLabel.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { api } from "../api/client.js";

const BRANDS = ["OMRON", "YASKAWA", "NITTO"];

export default function History() {
  const { t, lang } = useLanguage();
  const [aboutContent, setAboutContent] = useState(null);
  const milestones = t("history.milestones");
  const stats = t("history.stats");
  const structureNodes = t("history.structureNodes");

  useEffect(() => {
    api
      .getAboutContent()
      .then(setAboutContent)
      .catch(() => setAboutContent(null));
  }, []);

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
            index="01"
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
          <SectionLabel index="02" eyebrow={t("history.timelineEyebrow")} title={t("history.timelineTitle")} />
          <div className="timeline">
            {milestones.map((m) => (
              <div className="timeline__item" key={m.title}>
                <span className="timeline__year">{m.year}</span>
                <h3>{m.title}</h3>
                <p>{m.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionLabel index="03" eyebrow={t("history.statsEyebrow")} title={t("history.statsTitle")} />
          <div className="stat-row">
            {stats.map((s) => (
              <div className="stat-cell" key={s.label}>
                <span className="stat-cell__num">{s.num}</span>
                <span className="stat-cell__label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionLabel index="04" eyebrow={t("history.structureEyebrow")} title={t("history.structureTitle")} />
          <div className="org-diagram panel">
            <div className="org-node org-node--root">TRISAK GROUP</div>
            <div className="org-connector" />
            <div className="org-branch">
              {structureNodes.map((node) => (
                <div key={node}>
                  <div className="org-node">{node}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionLabel
            index="05"
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
