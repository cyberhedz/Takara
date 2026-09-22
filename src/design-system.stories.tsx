import type { Meta, StoryObj } from '@storybook/react'
import { DsButton, DsCard, DsNavigation, DsPopover, DsRadioGroup } from './design-system'
import { FIGMA_URLS } from './figma-links'
import './design-system.css'

const meta = { title: 'Pivotal Design System', parameters: { layout: 'fullscreen', design: { type: 'figma', url: FIGMA_URLS.overview } } } satisfies Meta
export default meta
type Story = StoryObj<typeof meta>

export const Overview: Story = { render: () => <div className="ds-canvas"><h1>Pivotal Design System</h1><p>Core components translated from the Figma design-system file.</p><div className="ds-section"><h2>Navigation</h2><DsNavigation /></div><div className="ds-section"><h2>Buttons and elevation</h2><div className="ds-row"><DsButton>Primary action</DsButton><DsButton variant="secondary">Secondary action</DsButton><DsButton variant="quiet">Quiet action</DsButton><DsCard>Raised content card</DsCard></div></div><div className="ds-section"><h2>Controls</h2><div className="ds-row"><DsRadioGroup options={['All studies', 'Recruiting and not yet recruiting studies']} /><DsPopover>Picker popover content</DsPopover></div></div></div> }
export const Navigation: Story = { parameters: { design: { type: 'figma', url: FIGMA_URLS.navigation } }, render: () => <div className="ds-canvas"><DsNavigation /></div> }
export const Buttons: Story = { parameters: { design: { type: 'figma', url: FIGMA_URLS.buttons } }, render: () => <div className="ds-canvas"><div className="ds-row"><DsButton>Primary</DsButton><DsButton variant="secondary">Secondary</DsButton><DsButton variant="quiet">Quiet</DsButton><DsButton disabled>Disabled</DsButton></div></div> }
export const Elevation: Story = { parameters: { design: { type: 'figma', url: FIGMA_URLS.elevation } }, render: () => <div className="ds-canvas"><div className="ds-row"><DsCard elevation={1}>Elevation 01</DsCard><DsCard elevation={2}>Elevation 02</DsCard><DsCard elevation={3}>Elevation 03</DsCard></div></div> }
export const Controls: Story = { parameters: { design: { type: 'figma', url: FIGMA_URLS.radio } }, render: () => <div className="ds-canvas"><div className="ds-row"><DsRadioGroup options={['All studies', 'Recruiting and not yet recruiting studies']} /><DsPopover>Picker popover content</DsPopover></div></div> }