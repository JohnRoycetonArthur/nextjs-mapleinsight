export const iconGradients = {
  green:  { stopColor1: "#1B7A4A", stopColor2: "#1B4F4A" },
  blue:   { stopColor1: "#1D4ED8", stopColor2: "#0F766E" },
  red:    { stopColor1: "#D62828", stopColor2: "#F59E0B" },
  gold:   { stopColor1: "#B8860B", stopColor2: "#92720A" },
  purple: { stopColor1: "#9333EA", stopColor2: "#7C3AED" },
  gray:   { stopColor1: "#6B7280", stopColor2: "#374151" },
  white:  { stopColor1: "#FFFFFF", stopColor2: "rgba(255,255,255,0.7)" },
} as const;

export const iconShellStyles = {
  green:  "border-[#D8E7DF] bg-[linear-gradient(145deg,#F8FFFB,#EEF7F2)]",
  blue:   "border-[#DCE6F8] bg-[linear-gradient(145deg,#F8FAFF,#EEF4FF)]",
  red:    "border-[#F0DDDD] bg-[linear-gradient(145deg,#FFF9F9,#FFF1F1)]",
  gold:   "border-[#F0E4C8] bg-[linear-gradient(145deg,#FFFDF5,#FFF8E6)]",
  purple: "border-[#E4D8F4] bg-[linear-gradient(145deg,#FBF8FF,#F3EEFF)]",
  gray:   "border-[#E5E7EB] bg-[linear-gradient(145deg,#F9FAFB,#F3F4F6)]",
} as const;
