// A share card shown in the app, in the theme the page is showing. Both images
// are lazy and one is hidden by CSS, so only the matching one downloads (Next's
// documented pattern for themed images). Fills its parent, which sets the size.
import Image from "next/image";
import { cardImage } from "@/lib/variants";

interface CardImageProps {
  readonly images: { readonly light: string; readonly dark: string };
  readonly alt: string;
  readonly sizes: string;
  /** The page's main image (the story card): fetched first. */
  readonly main?: boolean;
}

export function CardImage({ images, alt, sizes, main = false }: CardImageProps) {
  return (["light", "dark"] as const).map((theme) => (
    <Image
      key={theme}
      src={images[theme]}
      alt={alt}
      fill
      sizes={sizes}
      fetchPriority={main ? "high" : "auto"}
      draggable={false}
      className={cardImage({ theme })}
    />
  ));
}
