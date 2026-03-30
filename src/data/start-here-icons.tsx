import { WalletContent, Clipboard, CircleChartLine, House } from 'nucleo-glass-icons/react'

export const startHereIcons = {
  firstNinetyDays:  <WalletContent  size={20} stopColor1="#1B7A4A" stopColor2="#1B4F4A" />,
  taxSeason:        <Clipboard      size={20} stopColor1="#B8860B" stopColor2="#92720A" />,
  growingYourMoney: <CircleChartLine size={20} stopColor1="#2563EB" stopColor2="#1D4ED8" />,
  bigDecisions:     <House          size={20} stopColor1="#9333EA" stopColor2="#7C3AED" />,
} as const
