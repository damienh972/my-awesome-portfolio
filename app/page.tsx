import { Hero } from "@/components/Hero";
import { BackgroundWrapper } from "@/components/3D/BackgroundWrapper";

export default function Home() {
  return (
    <main className="relative">
      <BackgroundWrapper />
      <div className="relative z-10">
        <Hero />
        <section className="flex items-center justify-center bg-gray-900 text-white" style={{ height: '200vh' }}>
          <h2 className="text-4xl">Blockchain Section</h2>
        </section>
      </div>

    </main>
  );
}