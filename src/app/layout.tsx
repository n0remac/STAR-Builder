import type { Metadata } from "next";
import Link from "next/link";

import "@/app/globals.css";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "STAR MVP",
  description: "Turn resume content into STAR interview answers."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
          <SiteHeader />
          <main className="flex-1 py-8">{children}</main>
          <footer className="flex flex-col gap-2 border-t border-ink/10 py-6 text-sm text-ink/55 sm:flex-row sm:items-center sm:justify-between">
            <span>STAR MVP boilerplate</span>
            <Link href="/resume" className="font-bold text-moss">
              Start with a resume
            </Link>
          </footer>
        </div>
      </body>
    </html>
  );
}
