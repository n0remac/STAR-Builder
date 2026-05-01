import Link from "next/link";

export default function NotFound() {
  return (
    <section className="card mx-auto max-w-2xl text-center">
      <p className="label">Not found</p>
      <h1 className="mt-3 text-4xl font-black">This page does not exist.</h1>
      <Link href="/" className="button mt-6">
        Return home
      </Link>
    </section>
  );
}
