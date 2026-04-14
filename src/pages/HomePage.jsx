import MainBanner from '../components/MainBanner';
import CategoryShowcase from '../components/CategoryShowcase';
import TrendingProducts from '../components/TrendingProducts';
import BrandPhilosophy from '../components/BrandPhilosophy';

export default function HomePage() {
  return (
    <>
      <MainBanner />
      <CategoryShowcase />
      <TrendingProducts />
      <BrandPhilosophy />
    </>
  );
}