import { Hero } from "@/components/Hero";
import { Blockchain } from "@/components/Blockchain";
import { BackgroundWrapper } from "@/components/3D/backgrounds/BackgroundWrapper";

export default function Home() {
  return (
    <main className="min-h-screen">
      <BackgroundWrapper />
      <Hero />
      <Blockchain />
    </main>
  );
}
