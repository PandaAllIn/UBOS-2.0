import type { Meta, StoryObj } from '@storybook/react'
import Sparkline from './Sparkline'

const meta: Meta<typeof Sparkline> = {
  title: 'Tide/Sparkline',
  component: Sparkline,
}
export default meta
type Story = StoryObj<typeof Sparkline>

const data = Array.from({length:24}, (_,i)=> Math.round(10 + Math.sin(i/2)*3 + Math.random()*2))

export const Default: Story = { args: { data } }
export const Warn: Story = { args: { data, color: 'var(--warn)' } }

