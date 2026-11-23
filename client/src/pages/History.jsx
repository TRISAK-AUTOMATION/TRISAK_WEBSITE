import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SectionLabel from "../components/SectionLabel.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { cachedHistoryData, loadHistoryData } from "../api/historyData.js";
import WhyTrisak, { localizeIconList } from "../components/WhyTrisak.jsx";
import { expPhotos } from "../components/ExpGallery.jsx";
import HistoryStory from "../components/HistoryStory.jsx";
import { TodaySection, WorkSection, ClosingSection } from "../components/HistorySections.jsx";

export const BRANDS = ["OMRON", "YASKAWA", "NITTO"];

// Company Introduction photo when none is uploaded in Admin > History.
export const INTRO_IMAGE_DEFAULT = "/images/solutions/smart-factory.webp";

// A stat's unit/suffix attaches directly to symbols ("30+"), but gets a
// space when it's a word ("30 years").
export const unitSep = (unit) => (/^\p{L}/u.test(unit) ? " " : "");

// Partners & Brands: the BRANDS from Admin > Brands (for their logos), in
// BRANDS order. A brand missing from the DB still shows as its name.
const brandRows = (brands) =>
  BRANDS.map(
    (name) =>
      (brands || []).find((b) => b.name?.trim().toUpperCase() === name) || {
        slug: name.toLowerCase(),
        name,
        logo_url: null,
      }
  );

// Logos evenly spaced, normalised to one optical height (see .partner-logos).
export function PartnerBrands({ brands }) {
  return (
    <ul className="partner-logos">
      {brandRows(brands).map((b) => (
        <li key={b.slug}>
          <Link to={`/products/${b.slug}`} className="partner-logos__cell" title={b.name}>
            {b.logo_url ? (
              <img className="partner-logos__img" src={b.logo_url} alt={b.name} loading="lazy" />
            ) : (
              <span className="partner-logos__name">{b.name}</span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}

// shortcut: an entry's brand is guessed from the BRANDS name in its title/description;
// add a brand field to Admin > Timeline if entries ever get misplaced.
const brandOf = (m) => {
  const text = `${m.title} ${m.body || ""}`.toUpperCase();
  const hits = BRANDS.filter((b) => text.includes(b));
  return hits.length === 1 ? hits[0] : null;
};

const yearNum = (y) => {
  const n = parseInt(y, 10);
  return Number.isNaN(n) ? Infinity : n;
};

// Founding year = the earliest numeric year on the timeline (e.g. 1978), or
// null when the timeline has none.
export const foundedYear = (timeline) => {
  const first = Math.min(...timeline.map((m) => yearNum(m.year)));
  return Number.isFinite(first) && first > 1800 ? first : null;
};

// Timeline entries for the scroll story: oldest first, with the brand guessed
// from the text and that brand's logo (shown as a white mark).
export const storyEntries = (items, brands) => {
  const logos = brandRows(brands);
  return items
    .map((m) => {
      const brand = brandOf(m);
      const row = brand && logos.find((l) => l.name.trim().toUpperCase() === brand);
      return { ...m, brand, logo: row?.logo_url || null };
    })
    .sort((a, b) => yearNum(a.year) - yearNum(b.year));
};

// Organization chart (Admin > History > Organization): a node, then its
// children joined by one bracket line, recursively.
function OrgNode({ node, root = false }) {
  return (
    <li className="org-tree__item">
      <div className={`org-tree__node${root ? " org-tree__node--root" : ""}`}>
        {node.image && <img className="org-tree__img" src={node.image} alt="" loading="lazy" />}
        <span className="org-tree__name">{node.name}</span>
        {node.person && <span className="org-tree__person">{node.person}</span>}
      </div>
      {node.children.length > 0 && (
        <ul className="org-tree__children">
          {node.children.map((child) => (
            <OrgNode key={child.id} node={child} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function OrgChart({ roots }) {
  return (
    <ul className="org-tree">
      {roots.map((node) => (
        <OrgNode key={node.id} node={node} root />
      ))}
    </ul>
  );
}

export default function History() {
  const { t, lang } = useLanguage();
  // Timeline / statistics / organization chart come from the database
  // (Admin → History). The built-in translations below are only a safety
  // net for when that request fails, so the page never renders empty.
  // A previous visit (or the header's hover prefetch) may already hold the
  // data; it is shown at once and refreshed in the background.
  const [data, setData] = useState(cachedHistoryData);
  const loaded = data !== null;
  const aboutContent = data?.about ?? null;
  const historyContent = data?.history ?? null;
  const historyFailed = data?.historyFailed ?? false;
  const brands = data?.brands ?? null;

  useEffect(() => {
    let alive = true;
    loadHistoryData().then((fresh) => {
      if (!alive) return;
      // a failed refresh never replaces good data already on screen
      setData((prev) => (prev && fresh.historyFailed ? prev : fresh));
    });
    return () => {
      alive = false;
    };
  }, []);

  // `${base}_${lang}` with English as the fallback for a blank translation.
  const pick = (row, base) => row[`${base}_${lang}`] || row[`${base}_en`] || "";

  let timeline = [];
  let stats = [];
  let orgRoots = [];
  if (historyContent) {
    const toNode = (n) => ({
      id: n.id,
      name: pick(n, "name"),
      person: pick(n, "person"),
      image: n.image_url,
      children: (n.children || []).map(toNode),
    });
    orgRoots = (historyContent.org || []).map(toNode);
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
      icon: s.icon,
    }));
  } else if (historyFailed) {
    timeline = t("history.milestones").map((m) => ({ id: m.title, ...m, body: m.body, image: null }));
    stats = t("history.stats").map((s) => ({ id: s.label, num: s.num, unit: "", label: s.label }));
  }

  // Reads `${field}_${lang}` from the admin-editable about_content
  // row, falling back to the built-in translation if the DB row
  // isn't loaded yet (or hasn't been edited from its default).
  const ac = (field, fallback) => {
    if (!aboutContent) return fallback;
    const value = aboutContent[`${field}_${lang}`];
    return value || fallback;
  };

  // the intro facts only show when the timeline actually has a founding year
  const founded = foundedYear(timeline);
  const yearsActive = founded ? new Date().getFullYear() - founded : null;

  return (
    <>
      <HistoryStory
        photo={loaded ? aboutContent?.intro_image || INTRO_IMAGE_DEFAULT : null}
        eyebrow={founded ? "TRISAK GROUP · " + t("history.factSince") + " " + founded : "TRISAK GROUP"}
        title={ac("intro_title", t("history.introTitle"))}
        lede={ac("intro_lede", t("history.introLede"))}
        entries={storyEntries(timeline, brands)}
        labels={t("history.story")}
      />

      {/* The rest waits for the data: no built-in placeholder copy or default
          photos flashing in, and nothing below competes with the opening
          photo while it loads (the story already fills the screen). */}
      {loaded && (
        <>
          <TodaySection
            eyebrow={t("history.todayEyebrow")}
            years={yearsActive}
            yearsLabel={t("history.factYears")}
            body={ac("intro_body", t("history.introBody"))}
            stats={stats}
            unitSep={unitSep}
          />

          <WhyTrisak
            title={ac("why_title", t("history.whyTitle"))}
            lede={ac("why_lede", t("history.whyLede"))}
            reasons={localizeIconList(aboutContent?.why_reasons, lang, t("history.whyReasons"))}
            processTitle={ac("why_process_title", t("history.whyProcessTitle"))}
            steps={localizeIconList(aboutContent?.why_steps, lang, t("history.whySteps"))}
            bgImage={aboutContent?.why_bg_image}
          />

          {orgRoots.length > 0 && (
            <section className="section history-section history-org">
              <div className="container">
                <SectionLabel title={t("history.structureTitle")} />
                <OrgChart roots={orgRoots} />
              </div>
            </section>
          )}

          <WorkSection
            eyebrow={ac("exp_eyebrow", t("history.experienceEyebrow"))}
            title={ac("exp_title", t("history.experienceTitle"))}
            lede={ac("exp_lede", t("history.experienceLede"))}
            photos={expPhotos(aboutContent)}
            galleryLabels={t("history.expGallery")}
          />

          <ClosingSection
            eyebrow={ac("partners_eyebrow", t("history.partnersEyebrow"))}
            title={t("history.ctaTitle")}
            sub={t("history.ctaSub")}
            logos={<PartnerBrands brands={brands} />}
            contactLabel={t("common.contactUs")}
            productsLabel={t("common.viewProducts")}
          />
        </>
      )}
    </>
  );
}
