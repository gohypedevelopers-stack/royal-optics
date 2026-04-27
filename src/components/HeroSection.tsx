import HeroSlider from "@/components/HeroSlider";

export default function HeroSection({
  banners,
}: {
  banners: Array<{
    id: string;
    title: string;
    subtitle: string | null;
    imageUrl: string;
    ctaLabel: string | null;
    ctaHref: string | null;
  }>;
}) {
  return <HeroSlider banners={banners} />;
}
