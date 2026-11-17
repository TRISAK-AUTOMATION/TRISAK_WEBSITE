import { api } from "./client.js";

/**
 * Everything the History page needs from the API, loaded together and kept
 * for the session, so returning to the page renders instantly from memory
 * (the page still refreshes it in the background). The header calls
 * prefetchHistory() when the pointer reaches the History link, so the data
 * and the opening photo are usually here before the click lands.
 *
 * Shape: { about, history, historyFailed, brands }.
 */
let cached = null;
let inflight = null;
let fetchedAt = 0;
const FRESH_MS = 60_000; // a prefetch within this window reuses the cache

export const cachedHistoryData = () => cached;

export function loadHistoryData() {
  if (!inflight) {
    inflight = Promise.allSettled([api.getAboutContent(), api.getHistoryContent(), api.getBrands()])
      .then(([about, history, brands]) => {
        const data = {
          about: about.status === "fulfilled" ? about.value : null,
          history: history.status === "fulfilled" ? history.value : null,
          historyFailed: history.status === "rejected",
          brands: brands.status === "fulfilled" ? brands.value : null,
        };
        // keep only a good load; a failed one is retried on the next visit
        if (!data.historyFailed && data.about) {
          cached = data;
          fetchedAt = Date.now();
        }
        return data;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

const warmed = new Set();
function warmImage(src) {
  if (!src || warmed.has(src)) return;
  warmed.add(src);
  const img = new Image();
  img.decoding = "async";
  img.fetchPriority = "high";
  img.src = src;
}

export function prefetchHistory() {
  const recent = cached && Date.now() - fetchedAt < FRESH_MS;
  (recent ? Promise.resolve(cached) : loadHistoryData())
    .then((data) => warmImage(data.about?.intro_image))
    .catch(() => {});
}
