import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client.js";
import Breadcrumb from "../../components/Breadcrumb.jsx";
import HeroSlideshow from "../../components/HeroSlideshow.jsx";
import Reveal from "../../components/Reveal.jsx";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import { PRODUCT_LANDINGS, lt } from "../../data/productLandings.js";

// UI labels of these pages (the page content itself is in data/productLandings.js)
const UI = {
  quote: { en: "Request a quote", th: "ขอใบเสนอราคา" },
  askPrice: { en: "Ask for a price", th: "ดูสินค้าและสอบถามราคา" },
  seriesLabel: { en: "Series", th: "Series แนะนำ" },
  managedBy: { en: "Handled by", th: "ดูแลโดย" },
  askBrand: { en: "Ask about", th: "สอบถาม" },
  apps: { en: "Applications", th: "Applications" },
  appsTitle: { en: "Relays across industry", th: "ใช้งาน Relay ในอุตสาหกรรม" },
  pickEyebrow: { en: "Quick selection", th: "Quick selection" },
  need: { en: "What you need", th: "ความต้องการ" },
  suggested: { en: "Suggested series", th: "Series แนะนำ" },
  note: {
    en: "Series shown are examples. Models and availability can change, so please check with our team before ordering.",
    th: "Series ที่แสดงเป็นตัวอย่าง รุ่นและสถานะจำหน่ายอาจเปลี่ยนแปลง กรุณาสอบถามทีมงานก่อนสั่งซื้อ",
  },
};

const quoteHref = (topic) => `/contacts?interest=products&topic=${encodeURIComponent(topic)}`;

/** Fixed sales page for one product type: /products/relay | inverter | servo. */
export default function ProductLanding({ page }) {
  const { t, lang } = useLanguage();
  const p = PRODUCT_LANDINGS[page];
  const L = (v) => lt(v, lang);
  const [heroImages, setHeroImages] = useState([]);

  // same hero photos as the other product pages
  useEffect(() => {
    let alive = true;
    api
      .getProductsPageContent()
      .then((c) => {
        if (!alive) return;
        const imgs = Array.isArray(c?.hero_bg_images) && c.hero_bg_images.length ? c.hero_bg_images : c?.hero_bg_image ? [c.hero_bg_image] : [];
        setHeroImages(imgs);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const title = L(p.title);
  // chips under the hero: section jumps (relay categories / brands)
  const jumps = p.categories
    ? p.categories.map((c) => ({ href: `#${c.id}`, label: c.tag }))
    : p.brands.map((b) => ({ href: `#${b.id}`, label: b.name }));

  return (
    <>
      <section className={`hero hero--compact hero--products guide-hero ${heroImages.length ? "hero--has-bg" : ""}`}>
        {heroImages.length > 0 && (
          <>
            <HeroSlideshow images={heroImages} />
            <div className="hero__bg-scrim" aria-hidden="true" />
          </>
        )}
        <div className="hero__grid-overlay" aria-hidden="true" />
        <div className="container hero__content">
          <span className="hero__meta">{L(p.meta)}</span>
          <h1>{title}</h1>
          <p className="hero__sub">{L(p.tagline)}</p>
          <p className="landing-hero__intro">{L(p.intro)}</p>
          <div className="hero__actions">
            <Link to={quoteHref(p.quoteTopic)} className="btn btn-primary">
              {L(UI.quote)} <span className="btn-arrow">→</span>
            </Link>
          </div>
        </div>
      </section>

      <nav className="guide-bar" aria-label={title}>
        <div className="container guide-bar__inner">
          {p.tabs && (
            <div className="guide-bar__types">
              {p.tabs.map((tab) => (
                <Link key={tab.to} to={tab.to} className={`guide-chip${tab.to.endsWith(`/${page}`) ? " is-active" : ""}`}>
                  {L(tab.label)}
                </Link>
              ))}
            </div>
          )}
          <div className={p.tabs ? "guide-bar__brands" : "guide-bar__types"}>
            {jumps.map((j) => (
              <a key={j.href} href={j.href} className={`guide-chip${p.tabs ? " guide-chip--brand" : ""}`}>
                {j.label}
              </a>
            ))}
          </div>
        </div>
      </nav>

      <div className="landing">
        <div className="container">
          <Breadcrumb
            items={[
              { label: t("nav.home"), to: "/" },
              { label: t("nav.products"), to: "/products" },
              { label: title },
            ]}
          />

          {p.categories && (
            <section className="landing-block" aria-labelledby="landing-cats-title">
              <LandingHead head={p.categoriesHead} id="landing-cats-title" L={L} />
              <div className="landing-cats">
                {p.categories.map((c, i) => (
                  <Reveal as="article" className="landing-cat" id={c.id} key={c.id} style={{ transitionDelay: `${(i % 3) * 60}ms` }}>
                    <span className="landing-cat__tag">{c.tag}</span>
                    <h3>{L(c.title)}</h3>
                    <p>{L(c.text)}</p>
                    <ul className="landing-series" aria-label={L(UI.seriesLabel)}>
                      {c.series.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                    <Link className="landing-cat__link" to={quoteHref(`${p.quoteTopic} ${c.tag}`)}>
                      {L(UI.askPrice)} →
                    </Link>
                  </Reveal>
                ))}
              </div>
            </section>
          )}

          {p.brands && (
            <section className="landing-block" aria-labelledby="landing-brands-title">
              <LandingHead head={p.brandsHead} id="landing-brands-title" L={L} />
              {p.brands.map((b) => (
                <Reveal as="article" className="landing-brand" id={b.id} key={b.id}>
                  <header className="landing-brand__head">
                    <h3 className="landing-brand__name">{b.name}</h3>
                    <span className="landing-brand__team">
                      {L(UI.managedBy)} <b>{b.team}</b>
                    </span>
                  </header>
                  <div className="landing-brand__body">
                    <div className="landing-brand__aside">
                      <ul>
                        {b.points.map((pt, i) => (
                          <li key={i}>{L(pt)}</li>
                        ))}
                      </ul>
                      <Link to={quoteHref(`${b.name} ${p.quoteTopic}`)} className="btn btn-primary">
                        {L(UI.askBrand)} {b.name} {title}
                      </Link>
                    </div>
                    <div className="landing-brand__series">
                      {b.groups.map((g, gi) => (
                        <div key={gi}>
                          {g.label && <p className="landing-brand__group">{L(g.label)}</p>}
                          <dl className="landing-slist">
                            {g.items.map((it) => (
                              <div key={it.name}>
                                <dt>{it.name}</dt>
                                <dd>{L(it.use)}</dd>
                              </div>
                            ))}
                          </dl>
                        </div>
                      ))}
                    </div>
                  </div>
                </Reveal>
              ))}
            </section>
          )}
        </div>
      </div>

      <section className="landing-apps" aria-labelledby="landing-apps-title">
        <div className="container">
          <div className="landing-head">
            <span className="eyebrow">{L(UI.apps)}</span>
            <h2 id="landing-apps-title">{L(p.appsTitle || UI.appsTitle)}</h2>
          </div>
          <ul className={`landing-apps__grid landing-apps__grid--${p.apps.length}`}>
            {p.apps.map((a) => (
              <li key={a.title}>
                <b>{a.title}</b>
                <span>{L(a.text)}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {p.pick && (
        <section className="landing-block landing-pick" aria-labelledby="landing-pick-title">
          <div className="container landing-pick__grid">
            <div>
              <div className="landing-head">
                <span className="eyebrow">{L(UI.pickEyebrow)}</span>
                <h2 id="landing-pick-title">{L(p.pick.title)}</h2>
                <p>{L(p.pick.text)}</p>
              </div>
              <ul className="landing-why">
                {p.pick.why.map((w, i) => (
                  <li key={i}>
                    <b>{L(w.title)}</b>
                    <span>{L(w.text)}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="landing-table">
              <table>
                <thead>
                  <tr>
                    <th scope="col">{L(UI.need)}</th>
                    <th scope="col">{L(UI.suggested)}</th>
                  </tr>
                </thead>
                <tbody>
                  {p.pick.rows.map(([need, series]) => (
                    <tr key={series + L(need)}>
                      <td>{L(need)}</td>
                      <td>{series}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      <section className="cta-band products-cta">
        <div className="products-cta__light" aria-hidden="true" />
        <Reveal className="container cta-band__wrap guide-cta">
          <div>
            <h2>{L(p.cta.title)}</h2>
            <p>{L(p.cta.text)}</p>
            {p.cta.bring && (
              <ul className="landing-bring">
                {p.cta.bring.map((b, i) => (
                  <li key={i}>{L(b)}</li>
                ))}
              </ul>
            )}
          </div>
          <Link to={quoteHref(p.quoteTopic)} className="btn btn-primary">
            {L(p.cta.button)} <span className="btn-arrow">→</span>
          </Link>
        </Reveal>
      </section>

      <div className="container">
        <p className="landing-note">{L(UI.note)}</p>
      </div>
    </>
  );
}

function LandingHead({ head, id, L }) {
  return (
    <div className="landing-head">
      <span className="eyebrow">{L(head.eyebrow)}</span>
      <h2 id={id}>{L(head.title)}</h2>
      {head.text && <p>{L(head.text)}</p>}
    </div>
  );
}
