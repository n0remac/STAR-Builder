import Link from "next/link";

const links = [
  { href: "/resume", label: "Resume" },
  { href: "/jobs", label: "Jobs" }
];

export function SiteHeader() {
  return (
    <header className="card flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
      <Link href="/" className="group">
        <p className="label">Interview story workbench</p>
        <div className="mt-1 flex items-end gap-2">
          <span className="text-3xl font-black tracking-[-0.08em] text-ink">
            STAR
          </span>
          <span className="pb-1 text-sm font-bold text-moss transition group-hover:text-ochre">
            resume to answer
          </span>
        </div>
      </Link>
      <nav className="flex flex-wrap gap-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-full border border-ink/10 bg-paper/70 px-4 py-2 text-sm font-bold text-ink/70 transition hover:border-moss/40 hover:text-moss"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
