import type { Meta, StoryObj } from '@storybook/react';
import { TagBrowser } from '@/components/TagBrowser';
import { ACDTag } from '@/lib/types/acd';

const meta: Meta<typeof TagBrowser> = {
  title: 'Components/TagBrowser',
  component: TagBrowser,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof TagBrowser>;

const sampleTags: ACDTag[] = [
  {
    name: 'Motor_Start',
    type: 'BOOL',
    scope: 'Local',
    description: 'Motor start command',
  },
  {
    name: 'Motor_Speed',
    type: 'INT',
    scope: 'Local',
    description: 'Motor speed setpoint',
  },
  {
    name: 'System_Ready',
    type: 'BOOL',
    scope: 'Global',
    description: 'System ready status',
  },
  {
    name: 'Emergency_Stop',
    type: 'BOOL',
    scope: 'Global',
    description: 'Emergency stop status',
  },
  {
    name: 'Temperature',
    type: 'REAL',
    scope: 'Local',
    description: 'Process temperature',
  },
  {
    name: 'Pressure',
    type: 'REAL',
    scope: 'Local',
    description: 'Process pressure',
  },
  {
    name: 'Batch_Count',
    type: 'DINT',
    scope: 'Global',
    description: 'Total batch count',
  },
  {
    name: 'Alarm_Active',
    type: 'BOOL',
    scope: 'Global',
    description: 'Active alarm status',
  },
];

export const Initial: Story = {
  args: {
    tags: sampleTags,
  },
};

export const WithSelection: Story = {
  args: {
    tags: sampleTags,
    onTagSelect: (tag) => {
      console.log('Selected tag:', tag);
    },
  },
};

export const EmptyState: Story = {
  args: {
    tags: [],
  },
}; 