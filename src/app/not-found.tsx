import Link from "next/link";
import { Container } from "@/components/Container";

export default function NotFound() {
  return (
    <Container>
      <div className="py-16">
        <h1 className="text-2xl font-semibold text-ink-900">Page not found</h1>
        <p className="mt-2 text-ink-700">That page doesn’t exist (or it moved).</p>
        <Link className="mt-6 inline-block rounded-xl bg-ink-900 px-4 py-2 text-sm font-semibold text-white no-underline hover:bg-ink-800" href="/">
          Go home
        </Link>
      </div>
    </Container>
  );
}
