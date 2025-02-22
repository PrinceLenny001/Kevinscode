import type { Meta, StoryObj } from '@storybook/react';
import { LadderLogicDiagram } from '@/components/LadderLogicDiagram';
import { ACDLadderLogic } from '@/lib/types/acd';

const meta: Meta<typeof LadderLogicDiagram> = {
  title: 'Components/LadderLogicDiagram',
  component: LadderLogicDiagram,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof LadderLogicDiagram>;

const sampleLadderLogic: ACDLadderLogic = {
  rungs: [
    {
      number: 1,
      elements: [
        {
          type: 'XIC',
          tag: 'Start_PB',
          position: { row: 0, col: 0 },
        },
        {
          type: 'OTE',
          tag: 'Motor_Run',
          position: { row: 0, col: 1 },
        },
      ],
      comment: 'Motor start circuit',
    },
    {
      number: 2,
      elements: [
        {
          type: 'XIC',
          tag: 'Motor_Run',
          position: { row: 0, col: 0 },
        },
        {
          type: 'XIC',
          tag: 'OverTemp',
          position: { row: 0, col: 1 },
        },
        {
          type: 'OTE',
          tag: 'Motor_Fault',
          position: { row: 0, col: 2 },
        },
      ],
      comment: 'Motor fault detection',
    },
    {
      number: 3,
      elements: [
        {
          type: 'XIC',
          tag: 'Reset_PB',
          position: { row: 0, col: 0 },
        },
        {
          type: 'XIO',
          tag: 'OverTemp',
          position: { row: 0, col: 1 },
        },
        {
          type: 'OTU',
          tag: 'Motor_Fault',
          position: { row: 0, col: 2 },
        },
      ],
      comment: 'Fault reset circuit',
    },
  ],
};

export const Initial: Story = {
  args: {
    value: sampleLadderLogic,
  },
};

export const WithOnChange: Story = {
  args: {
    value: sampleLadderLogic,
    onChange: (value) => {
      console.log('Changed value:', value);
    },
  },
}; 