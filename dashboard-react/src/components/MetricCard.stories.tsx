import type { Meta, StoryObj } from '@storybook/react'
import MetricCard from './MetricCard'

const meta: Meta<typeof MetricCard> = {
  title: 'Tide/MetricCard',
  component: MetricCard,
}
export default meta
type Story = StoryObj<typeof MetricCard>

const data = Array.from({length:24}, (_,i)=> Math.round(10 + Math.sin(i/2)*3 + Math.random()*2))

export const Citizens: Story = {
  args: { title: 'Citizens Active', value: 12, badge: '24h', series: data }
}

export const Agents: Story = {
  args: { title: 'Agents • Runs', value: '5 / 9', badge: 'prog 42%', series: data }
}

