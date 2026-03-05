import type { Metadata } from "next";
import { Bebas_Neue, Cormorant_Garamond, Barlow_Condensed } from "next/font/google";
import "./globals.css";

const bebasNeue = Bebas_Neue({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400"],
});

const cormorantGaramond = Cormorant_Garamond({
  variable: "--font-editorial",
  subsets: ["latin"],
  weight: ["300", "400", "600"],
  style: ["normal", "italic"],
});

const barlowCondensed = Barlow_Condensed({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["300", "400", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "F1 Bingo — Test Your Formula 1 Knowledge",
  description: "The ultimate Formula 1 knowledge challenge. Play solo or race against friends in real time.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${bebasNeue.variable} ${cormorantGaramond.variable} ${barlowCondensed.variable} antialiased`}
      >
      <style>{`
        .back-hub-btn:hover {
          color: rgba(255,255,255,0.9) !important;
          border-color: rgba(255,255,255,0.25) !important;
        }
      `}</style>
      <a
          href="https://jocular-custard-46000b.netlify.app"
          className="back-hub-btn"
          style={{
            position: 'fixed',
            top: '16px',
            left: '18px',
            zIndex: 9999,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontFamily: 'var(--font-mono, "Barlow Condensed", sans-serif)',
            fontWeight: 700,
            fontSize: '0.72rem',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.4)',
            border: '1px solid rgba(255,255,255,0.1)',
            padding: '7px 14px',
            background: 'rgba(5,5,7,0.7)',
            textDecoration: 'none',
            backdropFilter: 'blur(8px)',
            transition: 'all 0.18s',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          All Games
        </a>
        {children}
      </body>
    </html>
  );
}