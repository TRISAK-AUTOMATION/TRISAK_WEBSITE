import { useEffect, useRef, useState } from "react";
import { normalizeQuery } from "../utils/productFilterUrl.js";

/**
 * A text input's value kept in step with a value that lives in the URL.
 *
 *  - typing updates the input immediately and writes the URL after a short
 *    pause (so the address bar doesn't churn on every keystroke);
 *  - any navigation the input did not make itself — Back/Forward, "Clear all",
 *    a checkbox, a pasted link — makes the URL win: the input adopts the URL's
 *    value and a pending write is dropped, so the box can never disagree with
 *    the address bar (and typing can never be written onto a page the user has
 *    already left).
 *
 * @param urlValue  current (normalized) value from the URL
 * @param commit    called with the normalized value once typing pauses; return
 *                  false if it turned out to need no navigation
 * @param navKey    changes on every navigation (react-router's location.key)
 * @returns [draft, setDraft] — bind to the input
 */
export default function useSyncedQuery(urlValue, commit, navKey, delay = 250) {
  const [draft, setDraft] = useState(urlValue);
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const commitRef = useRef(commit);
  commitRef.current = commit;
  const ownWrite = useRef(false); // the next navigation is the one our commit just made

  useEffect(() => {
    if (ownWrite.current) {
      ownWrite.current = false;
      return;
    }
    // someone else navigated: adopt the URL unless the box already says the same thing
    if (normalizeQuery(draftRef.current) !== urlValue) setDraft(urlValue);
  }, [navKey]);

  useEffect(() => {
    const next = normalizeQuery(draft);
    if (next === urlValue) return;
    const timer = setTimeout(() => {
      ownWrite.current = commitRef.current(next) !== false;
    }, delay);
    return () => clearTimeout(timer);
    // Only typing should (re)start the timer; urlValue is deliberately not a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  return [draft, setDraft];
}
