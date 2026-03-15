import Image from "next/image";
import Link from "next/link";

interface FounderBioProps {
  showAboutLink?: boolean;
}

export function FounderBio({ showAboutLink = true }: FounderBioProps) {
  return (
    <section
      aria-label="About the founder"
      className="mt-10 rounded-2xl border bg-white p-8 shadow-sm"
    >
      <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
        <Image
          src="/images/john-arthur.webp"
          alt="John Arthur, founder of Maple Insight Canada"
          width={200}
          height={200}
          className="h-24 w-24 flex-shrink-0 rounded-full object-cover md:h-32 md:w-32"
          priority={false}
        />

        <div className="text-center md:text-left">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-gray-900">John Arthur</h2>
            <a
              href="https://www.linkedin.com/in/johnroycetonarthur/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="John Arthur on LinkedIn"
              className="text-[#0A66C2] transition-opacity hover:opacity-80"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
          </div>
          <p className="text-sm text-gray-500">Founder, Maple Insight Canada</p>

          <p className="mt-3 max-w-2xl leading-relaxed text-gray-600">
            I moved to Canada over 15 years ago as a postgraduate student and built my career here
            as a software developer. Since then, I&apos;ve become a permanent resident, a citizen,
            and settled in Ontario with my wife and three kids. Having gone through the full
            journey from navigating the immigration process to filing my first Canadian tax return,
            I built Maple Insight Canada to help newcomers integrate into Canadian life and make smarter
            financial decisions from day one.
          </p>

          {showAboutLink ? (
            <Link
              href="/about"
              className="mt-4 inline-block text-sm font-medium text-gray-900 underline-offset-4 hover:underline focus:outline-none focus-visible:rounded focus-visible:ring-2 focus-visible:ring-gray-900"
            >
              Read my full story →
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
