import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';

export default function HomePage() {
  return (
    <main className="min-h-screen w-full relative flex flex-col justify-between overflow-x-hidden bg-[#FAF8F5]">
      
      {/* 1. Unified Whole-Page Atmospheric Background & Ambient Gradients (No seams across navbar & page) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        
        {/* Whole-page luxury parchment base gradient */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, #FAF8F5 0%, #FAF4EA 30%, #F7EBD8 60%, #FAF5EB 100%)'
          }}
        />

        {/* Radiant golden sunburst glow behind Supreme Court dome extending through top sky */}
        <div 
          className="absolute right-[6%] top-0 w-[70vw] max-w-[1300px] h-[90vh] opacity-90"
          style={{
            background: 'radial-gradient(circle at 62% 40%, rgba(255, 238, 204, 0.95) 0%, rgba(252, 226, 178, 0.60) 35%, rgba(248, 235, 210, 0.30) 60%, transparent 80%)'
          }}
        />

        {/* Golden hour warm horizon light wash */}
        <div 
          className="absolute right-0 bottom-0 w-[75vw] h-[65vh] opacity-75"
          style={{
            background: 'radial-gradient(ellipse at 75% 70%, rgba(250, 225, 175, 0.50) 0%, rgba(248, 236, 212, 0.25) 45%, transparent 70%)'
          }}
        />

        {/* Upper warm sky illumination behind navbar */}
        <div 
          className="absolute right-[10%] top-0 w-[60vw] h-[45vh] opacity-70"
          style={{
            background: 'radial-gradient(ellipse at 70% 10%, rgba(255, 242, 215, 0.85) 0%, rgba(250, 244, 232, 0.35) 55%, transparent 80%)'
          }}
        />

        {/* Fine Architectural Watermark Geometry: Curving arcs & diagonal tangent across the whole page */}
        <svg
          className="absolute inset-0 w-full h-full opacity-85"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          viewBox="0 0 1440 900"
        >
          {/* Main graceful arc curving over dome to books */}
          <path
            d="M 680,100 Q 1120,150 1320,700"
            fill="none"
            stroke="rgba(185, 138, 68, 0.32)"
            strokeWidth="1.3"
          />
          {/* Secondary subtle guide arc */}
          <path
            d="M 520,380 Q 960,160 1240,60"
            fill="none"
            stroke="rgba(185, 138, 68, 0.20)"
            strokeWidth="1"
          />
          {/* Diagonal architectural tangent line from top-right */}
          <line
            x1="1340"
            y1="20"
            x2="720"
            y2="480"
            stroke="rgba(185, 138, 68, 0.25)"
            strokeWidth="1.2"
          />
        </svg>
      </div>

      {/* 2. Top Navigation Bar (Transparent, seamlessly integrated) */}
      <Navbar />

      {/* 3. Main Hero Showcase */}
      <div className="flex-1 flex flex-col justify-center relative z-10">
        <Hero />
      </div>
    </main>
  );
}
