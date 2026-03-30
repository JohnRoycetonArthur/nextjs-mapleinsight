import {
  Explore,
  Groups,
  HomeWork,
  QueryStats,
  Savings,
  TravelLuggageAndBags,
} from '@material-symbols-svg/react'

export const stepIcons = {
  household:   <Groups size={18} color="#1B7A4A" />,
  immigration: <TravelLuggageAndBags size={18} color="#B8860B" />,
  destination: <Explore size={18} color="#2563EB" />,
  income:      <QueryStats size={18} color="#9333EA" />,
  savings:     <Savings size={18} color="#C41E3A" />,
  lifestyle:   <HomeWork size={18} color="#1B7A4A" />,
} as const
