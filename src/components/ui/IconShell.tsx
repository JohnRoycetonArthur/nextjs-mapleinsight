type IconShellProps = {
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizes = {
  sm: "h-9 w-9 rounded-xl",
  md: "h-12 w-12 rounded-2xl",
  lg: "h-14 w-14 rounded-2xl",
};

export function IconShell({ children, size = "md", className = "" }: IconShellProps) {
  return (
    <div className={`inline-flex items-center justify-center border transition-transform duration-300 group-hover:scale-[1.04] ${sizes[size]} ${className}`}>
      {children}
    </div>
  );
}
