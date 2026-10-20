import type { Product } from "@/lib/catalog/types";
import { getPhotos, photoSrc, photoWidths, type Photo } from "@/lib/catalog/media";

// Fixed local derivatives: no on-demand image transforms and no third-party requests.
export function PhotoImg({
  photo,
  sizes,
  eager = false,
}: {
  photo: Photo;
  sizes: string;
  eager?: boolean;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={photoSrc(photo, 800)}
      srcSet={photoWidths.map((w) => `${photoSrc(photo, w)} ${w}w`).join(", ")}
      sizes={sizes}
      width={1100}
      height={1100}
      alt={photo.alt}
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : "auto"}
      decoding="async"
      data-studio={photo.studio || undefined}
    />
  );
}

export function ProductPhoto({
  product,
  eager = false,
  sizes = "(max-width: 700px) 50vw, 25vw",
}: {
  product: Product;
  eager?: boolean;
  sizes?: string;
}) {
  const photo = getPhotos(product.slug)[0];
  return (
    <div className="photo">
      {photo ? <PhotoImg photo={photo} sizes={sizes} eager={eager} /> : null}
    </div>
  );
}
