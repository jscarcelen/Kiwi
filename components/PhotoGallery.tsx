export default function PhotoGallery({ photos, name }: { photos: string[]; name: string }) {
  if (!photos.length) return null;
  return (
    <div className="-mx-4 mt-6 sm:mx-0">
      <div className="snap-x-row px-4 sm:px-0">
        {photos.map((u, i) => (
          <a key={u + i} href={u} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-2xl bg-black/5">
            <img src={u} alt={`${name} photo ${i + 1}`} loading={i ? "lazy" : "eager"} className="h-52 w-[78vw] max-w-[360px] object-cover sm:h-60 sm:w-[320px]" />
          </a>
        ))}
      </div>
    </div>
  );
}
