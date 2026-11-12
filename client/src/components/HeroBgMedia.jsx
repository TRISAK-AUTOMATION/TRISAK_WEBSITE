export const isVideoUrl = (url) => /\.mp4$/i.test(url || "");

/** Hero background layer: a muted looping MP4 or a cover image, by file extension. */
export default function HeroBgMedia({ src }) {
  if (isVideoUrl(src)) {
    return <video className="hero__bg-image hero__bg-video" src={src} autoPlay muted loop playsInline aria-hidden="true" />;
  }
  return <div className="hero__bg-image" style={{ backgroundImage: `url(${src})` }} aria-hidden="true" />;
}
