export function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-ink-200 bg-white px-3 py-1 text-xs font-medium text-ink-700">
      {children}
    </span>
  );
}
