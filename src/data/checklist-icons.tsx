import { Rocket, Layers, CircleChartLine, House } from 'nucleo-glass-icons/react'

export const checklistIcons = {
  month1:  <Rocket          size={20} stopColor1="#1B7A4A" stopColor2="#1B4F4A" />,
  month23: <Layers          size={20} stopColor1="#B8860B" stopColor2="#92720A" />,
  month46: <CircleChartLine size={20} stopColor1="#2563EB" stopColor2="#1D4ED8" />,
  month712:<House           size={20} stopColor1="#9333EA" stopColor2="#7C3AED" />,
} as const
