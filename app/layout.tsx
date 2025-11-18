import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Portfolio | Blockchain & AI Architect",
  description: "Innovative Software Architect specializing in Blockchain, AI, and Liferay solutions. Building systems that shape the future.",
  keywords: ["blockchain", "AI", "software architect", "liferay", "fullstack", "web3"],
  authors: [{ name: "Damien Heloîse" }],
  openGraph: {
    type: "website",
    title: "Portfolio | Blockchain & AI Architect",
    description: "Building blockchain & AI systems that shape the future",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="font-sora antialiased">
        {children}
      </body>
    </html>
  );
}