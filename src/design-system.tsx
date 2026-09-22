import { ReactNode, useState } from 'react'

export const designTokens = {
  colors: { background: '#0d0f15', navigation: '#1c1c1c', primary: '#3568d4', primaryLight: '#6698ff', text: '#f7f9fa', muted: '#8f90a6', input: '#8f90a6', white: '#ebebf0' },
  radius: { sm: '8px', md: '12px' },
  elevation: { 1: '0 2px 8px rgba(0, 0, 0, .18)', 2: '0 5px 16px rgba(0, 0, 0, .26)', 3: '0 10px 28px rgba(0, 0, 0, .34)' },
  mobile: {
    colors: { primary: '#003a6d', text: '#191919', muted: '#737373', border: '#eeeeee', line: '#d2d2d2', surface: '#f5f5f5', white: '#ffffff' },
    radius: '16px',
  },
} as const

type ButtonProps = { children: ReactNode; variant?: 'primary' | 'secondary' | 'quiet'; disabled?: boolean; onClick?: () => void }
export function DsButton({ children, variant = 'primary', disabled, onClick }: ButtonProps) {
  return <button className={`ds-button ds-button-${variant}`} disabled={disabled} onClick={onClick}>{children}</button>
}

type NavigationProps = { active?: 'Invest' | 'Portfolio' | 'Resources' | 'Support' }
export function DsNavigation({ active = 'Invest' }: NavigationProps) {
  return <header className="ds-navigation"><strong className="ds-navigation-brand"><span className="ds-brand-mark">✦</span> Jarvis</strong><nav aria-label="Design system navigation">{(['Invest', 'Portfolio', 'Resources', 'Support'] as const).map((item) => <a className={item === active ? 'is-active' : ''} href={`#${item.toLowerCase()}`} key={item}>{item}</a>)}</nav><span className="ds-navigation-user">United States <span aria-hidden="true">⌄</span></span></header>
}

type RadioGroupProps = { options: string[]; initialValue?: string }
export function DsRadioGroup({ options, initialValue = options[0] }: RadioGroupProps) {
  const [value, setValue] = useState(initialValue)
  return <fieldset className="ds-radio-group"><legend>Study status</legend>{options.map((option) => <label key={option}><input type="radio" name="ds-radio" checked={value === option} onChange={() => setValue(option)} /><span>{option}</span></label>)}</fieldset>
}

export function DsCard({ children, elevation = 2 }: { children: ReactNode; elevation?: 1 | 2 | 3 }) { return <div className={`ds-card ds-elevation-${elevation}`}>{children}</div> }
export function DsPopover({ children }: { children: ReactNode }) { return <div className="ds-popover" role="dialog">{children}</div> }