import { Container } from "@/components/Container";

export const metadata = {
  title: "Contact",
  description: "Contact Maple Insight."
};

export default function ContactPage() {
  return (
    <Container>
      <div className="py-12">
        <h1 className="text-2xl font-semibold text-ink-900 md:text-3xl">Contact</h1>
        <p className="mt-4 max-w-2xl text-ink-700">
          For now, this is a simple placeholder. Replace the email below with yours.
        </p>

        <div className="mt-6 rounded-2xl border border-ink-200 bg-white p-5">
          <div className="text-sm font-semibold text-ink-900">Email</div>
          <a className="mt-2 inline-block text-sm text-maple-700 hover:text-maple-800" href="mailto:hello@mapleinsight.ca">
            hello@mapleinsight.ca
          </a>
        </div>
      </div>
    </Container>
  );
}
