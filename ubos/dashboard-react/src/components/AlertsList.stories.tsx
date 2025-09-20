import type { Meta, StoryObj } from '@storybook/react'
import AlertsList from './AlertsList'

const meta: Meta<typeof AlertsList> = {
  title: 'Tide/AlertsList',
  component: AlertsList,
}
export default meta
type Story = StoryObj<typeof AlertsList>

const alerts = [
  { level: 'info', message: 'System warmup complete', timestamp: new Date().toISOString() },
  { level: 'warning', message: 'Cost cap nearing', timestamp: new Date().toISOString() },
]

export const Default: Story = { args: { alerts } }

