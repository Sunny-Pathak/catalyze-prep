import { HeroSection } from "@/components/HeroSection";
import { WormholeSection } from "@/components/WormholeSection";
import { AsciiSculptureCanvas } from "@/components/AsciiSculptureCanvas";
import { MonumentalFinale } from "@/components/MonumentalFinale";
import { LoadingScreen } from "@/components/LoadingScreen";

export default function Home() {
  return (
    <main className="relative flex flex-col min-h-screen w-full bg-[#07060b] text-white selection:bg-violet-500 selection:text-black overflow-x-clip">
      {/* Restrained Architectural Loading Screen */}
      <LoadingScreen />

      {/* Unified Fixed ASCII Sculpture Canvas */}
      <AsciiSculptureCanvas />

      {/* 1st Section: Minimal Hero Section (Bust -> Standing Statue) */}
      <HeroSection />

      {/* 2nd Section: The 4 Architectural Pillars (Wormhole & Angel) */}
      <WormholeSection />

      {/* 3rd Section: Monumental Typographic Finale & Colophon */}
      <MonumentalFinale />
    </main>
  );
}
