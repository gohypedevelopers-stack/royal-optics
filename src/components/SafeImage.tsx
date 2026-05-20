import Image, { ImageProps } from "next/image";

export function getGoogleDriveDirectLink(url: string): string | null {
  if (!url) return null;
  const fileDMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileDMatch && fileDMatch[1]) {
    return `https://drive.google.com/uc?export=view&id=${fileDMatch[1]}`;
  }
  const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (url.includes("drive.google.com") && idMatch && idMatch[1]) {
    return `https://drive.google.com/uc?export=view&id=${idMatch[1]}`;
  }
  return null;
}

export default function SafeImage({ src, alt, ...props }: ImageProps) {
  if (typeof src === "string") {
    const driveLink = getGoogleDriveDirectLink(src);
    if (driveLink) {
      const { fill, priority, quality, placeholder, blurDataURL, ...rest } = props;
      
      const style = fill
        ? {
            position: "absolute" as const,
            height: "100%",
            width: "100%",
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
            objectFit: props.className?.includes("object-cover") ? ("cover" as const) : ("contain" as const),
            ...props.style,
          }
        : props.style;

      // Disable eslint rule for standard img tag, as we specifically need to use it here.
      // eslint-disable-next-line @next/next/no-img-element
      return (
        <img
          src={driveLink}
          alt={alt || ""}
          style={style}
          {...(rest as any)}
        />
      );
    }
  }

  return <Image src={src} alt={alt} {...props} />;
}
