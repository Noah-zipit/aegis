import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex h-dvh flex-col items-center justify-center bg-ink-950 px-6 text-center">
      <p className="font-mono text-sm text-mist-600">404</p>
      <h1 className="mt-2 text-2xl font-semibold text-mist-100">
        This page wandered off
      </h1>
      <p className="mt-2 max-w-xs text-sm text-mist-500">
        The address does not resolve to anything in this prototype.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-mist-300"
      >
        Back to Aegis
      </Link>
    </div>
  );
}
