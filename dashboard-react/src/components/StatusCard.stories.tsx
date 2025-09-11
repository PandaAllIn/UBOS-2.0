import type { Meta, StoryObj } from '@storybook/react'
import StatusCard from './StatusCard'

const meta: Meta<typeof StatusCard> = {
  title: 'Tide/StatusCard',
  component: StatusCard,
}
export default meta
type Story = StoryObj<typeof StatusCard>

export const OK: Story = { args: { title: 'Perplexity', state: 'ok', description: 'pro plan' } }
export const Warn: Story = { args: { title: 'OpenAI', state: 'warn', description: 'trial' } }
export const Err: Story = { args: { title: 'Notion', state: 'err', description: 'auth required' } }

