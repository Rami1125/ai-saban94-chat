import { SiteHeader } from "@/components/home/site-header";
import { HeroSection } from "@/components/home/hero-section";
import { CategoriesSection } from "@/components/home/categories-section";
import { ProductsSection } from "@/components/home/products-section";
import { VideoSection } from "@/components/home/video-section";
import { SiteFooter } from "@/components/home/site-footer";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main>
        <HeroSection />
        <CategoriesSection />
        <ProductsSection />
        <VideoSection />
      </main>
      <SiteFooter />
    </div>
  );
}
