import { Hero } from "@/components/Hero";

export default function Home() {
  return (
    <main className="relative">
      <Hero />
      <section className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Next Section</h2>
          <p className="text-gray-400">Blockchain section coming soon...</p>
        </div>
      </section>
    </main>
  );
}