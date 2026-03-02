"use client";

export function Select({
  label,
  value,
  onChange,
  options,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  hint?: string;
}) {
  return (
    <label className="block">
      <div className="flex items-end justify-between gap-2">
        <div className="text-sm font-medium text-ink-900">{label}</div>
        {hint ? <div className="text-xs text-ink-600">{hint}</div> : null}
      </div>
      <select
        className="mt-2 w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm outline-none"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}
