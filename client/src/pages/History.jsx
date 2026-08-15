import SectionLabel from "../components/SectionLabel.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";

const BRANDS = ["OMRON", "YASKAWA", "NITTO"];

export default function History() {
  const { t } = useLanguage();
  const milestones = t("history.milestones");
  const stats = t("history.stats");
  const structureNodes = t("history.structureNodes");

  return (
    <>
      <section className="hero hero--compact">
        <div className="hero__grid-overlay" aria-hidden="true" />
        <div className="container hero__content">
          <span className="hero__meta">{t("history.heroMeta")}</span>
          <h1>{t("history.heroTitle")}</h1>
          <p className="hero__sub">{t("history.heroSub")}</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionLabel
            index="01"
            eyebrow={t("history.introEyebrow")}
            title={t("history.introTitle")}
            lede={t("history.introLede")}
          />
          <p className="lede" style={{ maxWidth: "62ch" }}>
            {t("history.introBody")}
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
