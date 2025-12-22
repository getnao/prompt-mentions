import type { Meta, StoryObj } from '@storybook/react-vite';
import Prompt from '../components/Prompt/Prompt';

const meta = {
	title: 'Prompt',
	component: Prompt,
	tags: ['autodocs'],
	parameters: {
		docs: {
			description: {
				component: 'A text input component that highlights @mentions with a pill design.',
			},
		},
	},
} satisfies Meta<typeof Prompt>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Comparison: Story = {
	name: 'Comparison',
	render: () => (
		<div className="flex flex-col gap-8">
			<div>
				<h3 className="text-sm font-medium text-gray-600 mb-2">With Placeholder</h3>
				<Prompt placeholder="Type @ to mention someone..." />
			</div>
			<div>
				<h3 className="text-sm font-medium text-gray-600 mb-2">With Custom Mention Trigger</h3>
				<Prompt placeholder="Type # to mention someone..." mentionTrigger="#" />
			</div>
			<div>
				<h3 className="text-sm font-medium text-gray-600 mb-2">With Initial Value</h3>
				<Prompt initialValue="Hello, @[John Doe]!" />
			</div>
			<div>
				<h3 className="text-sm font-medium text-gray-600 mb-2">Without Placeholder</h3>
				<Prompt placeholder="" />
			</div>
		</div>
	),
};

export const WithPlaceholder: Story = {
	args: {
		placeholder: 'Type @ to mention someone...',
	},
};

export const WithCustomMentionTrigger: Story = {
	args: {
		mentionTrigger: '#',
		placeholder: 'Type # to mention someone...',
	},
};

export const WithInitialValue: Story = {
	args: {
		initialValue: 'Hello, @[John Doe]!',
	},
};

export const WithoutPlaceholder: Story = {
	args: {
		placeholder: '',
	},
};
