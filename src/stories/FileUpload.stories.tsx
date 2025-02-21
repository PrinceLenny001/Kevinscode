import type { Meta, StoryObj } from '@storybook/react';
import { FileUpload } from '@/components/FileUpload';

const meta: Meta<typeof FileUpload> = {
  title: 'Components/FileUpload',
  component: FileUpload,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof FileUpload>;

export const Default: Story = {
  args: {
    onFileSelect: (file) => {
      console.log('File selected:', file.name);
    },
  },
};

export const CustomAccept: Story = {
  args: {
    onFileSelect: (file) => {
      console.log('File selected:', file.name);
    },
    accept: '.txt,.doc,.docx',
  },
}; 