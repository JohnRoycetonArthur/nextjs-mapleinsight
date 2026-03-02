"use client";

export function NumberInput({
  label,
  value,
  onChange,
  step = 1,
  min,
  max,
  prefix,
  suffix,
  hint,
}: {
  label: string;
  value: number | "";
  onChange: (v: number | "") => void;
  step?: number;
  min?: number;
  max?: number;
  prefix?: string;
  suffix?: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <div className="flex items-end justify-between gap-2">
        <div className="text-sm font-medium text-ink-900">{label}</div>
        {hint ? <div className="text-xs text-ink-600">{hint}</div> : null}
      </div>

      <div className="mt-2 flex items-center rounded-xl border border-ink-200 bg-white px-3 py-2">
        {prefix ? <span className="mr-2 text-sm text-ink-600">{prefix}</span> : null}
        <input
          inputMode="decimal"
          className="w-full appearance-none bg-transparent text-sm outline-none"
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === "") return onChange("");
            const n = Number(raw);
            if (Number.isFinite(n)) onChange(n);
          }}
        />
        {suffix ? <span className="ml-2 text-sm text-ink-600">{suffix}</span> : null}
      </div>
    </label>
  );
}
