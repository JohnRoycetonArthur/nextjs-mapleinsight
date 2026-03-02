import Link from "next/link";

export function Card({
  title,
  description,
  href,
  footer,
}: {
  title: string;
  description: string;
  href?: string;
  footer?: React.ReactNode;
}) {
  const Body = (
    <div className="rounded-2xl border border-ink-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="text-base font-semibold text-ink-900">{title}</div>
      <div className="mt-1 text-sm leading-relaxed text-ink-700">{description}</div>
      {footer ? <div className="mt-4">{footer}</div> : null}
    </div>
  );

  if (!href) return Body;
  return (
    <Link href={href} className="no-underline">
      {Body}
    </Link>
  );
}
