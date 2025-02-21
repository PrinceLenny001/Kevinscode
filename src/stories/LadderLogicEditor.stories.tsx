import type { Meta, StoryObj } from '@storybook/react';
import { LadderLogicEditor } from '@/components/LadderLogicEditor';

const meta: Meta<typeof LadderLogicEditor> = {
  title: 'Components/LadderLogicEditor',
  component: LadderLogicEditor,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof LadderLogicEditor>;

const sampleLadderLogic = `XIC(Start_PB)OTE(Motor_Run)
XIC(Motor_Run)XIC(OverTemp)OTE(Motor_Fault)
XIC(Reset_PB)XIO(OverTemp)OTU(Motor_Fault)`;

export const Initial: Story = {
  args: {},
};

export const WithContent: Story = {
  args: {
    initialValue: sampleLadderLogic,
  },
};

export const WithSaveHandler: Story = {
  args: {
    initialValue: sampleLadderLogic,
    onSave: (value) => {
      console.log('Saved value:', value);
    },
  },
}; 