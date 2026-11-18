import { useEffect, useRef } from "react";

export const isVideoUrl = (url) => /\.mp4$/i.test(url || "");

/** Hero background layer: a muted looping MP4 or a cover image, by file extension. */
export default function HeroBgMedia({ src }) {
  if (isVideoUrl(src)) return <HeroVideo src={src} />;
  return <div className="hero__bg-image" style={{ backgroundImage: `url(${src})` }} aria-hidden="true" />;
}

function HeroVideo({ src }) {
  const ref = useRef(null);
  // A removed <video> can keep downloading in the background (the hero
  // file is several MB), starving the next page's images. Leaving the page
  // empties the element so the browser drops that download at once.
  // The effect (re)attaches the source itself: React won't put `src` back
  // after a cleanup that ran while the element stayed mounted (StrictMode's
  // dev re-run, or a src change).
  useEffect(() => {
    const video = ref.current;
    if (video.getAttribute("src") !== src) {
      video.src = src;
      video.play().catch(() => {});
    }
    return () => {
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
  }, [src]);
  return <video ref={ref} className="hero__bg-image hero__bg-video" src={src} autoPlay muted loop playsInline aria-hidden="true" />;
}
