import type { Metadata } from "next";
import "./globals.css";
import { ProjectProvider } from "@/lib/context/ProjectContext";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: "HolmStone | Solar & Battery Sizing",
  description: "Solar PV and battery sizing, costing and LCOE application",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full">
      <body className="flex h-full min-h-screen bg-slate-50 text-slate-800 antialiased">
        <ProjectProvider>
          <Nav />
          <main className="flex-1 overflow-y-auto px-8 py-8">
            <div className="mx-auto max-w-5xl">{children}</div>
          </main>
        </ProjectProvider>
      </body>
    </html>
  );
}
