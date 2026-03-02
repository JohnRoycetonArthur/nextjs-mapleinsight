export function ResultPanel({
  title,
  items,
  note,
}: {
  title: string;
  items: { label: string; value: string }[];
  note?: string;
}) {
  return (
    <div className="rounded-2xl border border-ink-200 bg-ink-50 p-5">
      <div className="text-sm font-semibold text-ink-900">{title}</div>
      <dl className="mt-4 space-y-3">
        {items.map((it) => (
          <div key={it.label} className="flex items-center justify-between gap-4">
            <dt className="text-sm text-ink-700">{it.label}</dt>
            <dd className="text-sm font-semibold text-ink-900">{it.value}</dd>
          </div>
        ))}
      </dl>
      {note ? <div className="mt-4 text-xs text-ink-600">{note}</div> : null}
    </div>
  );
}
