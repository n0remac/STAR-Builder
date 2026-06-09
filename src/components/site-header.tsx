import Link from "next/link";

import { auth, signIn, signOut } from "@/auth";
import { isAdminEmail } from "@/lib/admin";

const links = [
  { href: "/profile", label: "Profile" },
  { href: "/resume", label: "Resume" },
  { href: "/jobs", label: "Jobs" },
  { href: "/narratives", label: "Narratives" }
];

export async function SiteHeader() {
  const session = await auth();
  const isAdmin = isAdminEmail(session?.user?.email);

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
      <div className="flex flex-wrap items-center gap-2">
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
          {isAdmin ? (
            <Link
              href="/admin/ownership"
              className="rounded-full border border-ink/10 bg-paper/70 px-4 py-2 text-sm font-bold text-ink/70 transition hover:border-moss/40 hover:text-moss"
            >
              Admin
            </Link>
          ) : null}
        </nav>
        {session?.user ? (
          <form
            action={async () => {
              "use server";
              await signOut();
            }}
            className="flex flex-wrap items-center gap-2"
          >
            <span className="pill max-w-56 truncate">
              {session.user.name || session.user.email}
            </span>
            <button type="submit" className="button-secondary">
              Sign out
            </button>
          </form>
        ) : (
          <form
            action={async () => {
              "use server";
              await signIn("google");
            }}
          >
            <button type="submit" className="button">
              Sign in with Google
            </button>
          </form>
        )}
      </div>
    </header>
  );
}
