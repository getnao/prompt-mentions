import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import Prompt from '../components/Prompt/Prompt';
import type { MentionOption } from '../hooks/useMentions';
import type { SelectedMention } from '../hooks/useContentEditable';

// Example icons as React components
const UserIcon = () => (
	<svg viewBox="0 0 20 20" fill="currentColor">
		<path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
	</svg>
);

const FolderIcon = () => (
	<svg viewBox="0 0 20 20" fill="currentColor">
		<path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
	</svg>
);

const FileIcon = () => (
	<svg viewBox="0 0 20 20" fill="currentColor">
		<path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
	</svg>
);

const CodeIcon = () => (
	<svg viewBox="0 0 20 20" fill="currentColor">
		<path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
	</svg>
);

const StarIcon = () => (
	<svg viewBox="0 0 20 20" fill="currentColor">
		<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
	</svg>
);

const meta = {
	title: 'Prompt',
	component: Prompt,
	tags: ['autodocs'],
	parameters: {
		docs: {
			description: {
				component: 'A text input component that highlights @mentions with a pill design. Type the trigger character (@ by default) to open a mention menu. Supports nested menus, icons, dividers, and section titles.',
			},
		},
	},
} satisfies Meta<typeof Prompt>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default options for simple stories
const defaultOptions: MentionOption[] = [
	{ id: 'john-doe', label: 'John Doe' },
	{ id: 'jane-smith', label: 'Jane Smith' },
];

export const Default: Story = {
	name: 'Default (Type @ to mention)',
	args: {
		placeholder: 'Type @ to mention someone...',
		mentionConfigs: [{ trigger: '@', options: defaultOptions }],
	},
};

export const WithCustomMentionOptions: Story = {
	name: 'Custom Mention Options',
	args: {
		placeholder: 'Type @ to mention...',
		mentionConfigs: [{
			trigger: '@',
			options: [
				{ id: 'alice', label: 'Alice Johnson' },
				{ id: 'bob', label: 'Bob Smith' },
			],
		}],
	},
};

// Options with icons
const optionsWithIcons: MentionOption[] = [
	{ id: 'alice', label: 'Alice Johnson', icon: <UserIcon /> },
	{ id: 'bob', label: 'Bob Smith', icon: <UserIcon /> },
	{ id: 'project-alpha', label: 'Project Alpha', icon: <FolderIcon /> },
	{ id: 'main-ts', label: 'main.ts', icon: <CodeIcon /> },
];

export const WithIcons: Story = {
	name: 'With Icons',
	args: {
		placeholder: 'Type @ to mention with icons...',
		mentionConfigs: [{ trigger: '@', options: optionsWithIcons }],
	},
};

// Options with dividers and titles
const optionsWithDividersAndTitles: MentionOption[] = [
	{ id: 'title-people', label: 'People', type: 'title', icon: <UserIcon /> },
	{ id: 'alice', label: 'Alice Johnson', icon: <UserIcon /> },
	{ id: 'bob', label: 'Bob Smith', icon: <UserIcon /> },
	{ id: 'divider-1', label: '', type: 'divider' },
	{ id: 'title-files', label: 'Files', type: 'title', icon: <FileIcon /> },
	{ id: 'main-ts', label: 'main.ts', icon: <CodeIcon /> },
	{ id: 'readme', label: 'README.md', icon: <FileIcon /> },
];

export const WithDividersAndTitles: Story = {
	name: 'With Dividers and Titles',
	args: {
		placeholder: 'Type @ to see sections...',
		mentionConfigs: [{ trigger: '@', options: optionsWithDividersAndTitles }],
	},
};

// Options with nested menus
const nestedOptions: MentionOption[] = [
	{ id: 'title-quick', label: 'Quick Access', type: 'title' },
	{ id: 'starred', label: 'Starred Items', icon: <StarIcon /> },
	{ id: 'divider-1', label: '', type: 'divider' },
	{ id: 'title-browse', label: 'Browse', type: 'title' },
	{
		id: 'team',
		label: 'Team Members',
		icon: <UserIcon />,
		children: [
			{ id: 'title-engineering', label: 'Engineering', type: 'title' },
			{ id: 'alice', label: 'Alice Johnson', icon: <UserIcon /> },
			{ id: 'bob', label: 'Bob Smith', icon: <UserIcon /> },
			{ id: 'divider-2', label: '', type: 'divider' },
			{ id: 'title-design', label: 'Design', type: 'title' },
			{ id: 'carol', label: 'Carol White', icon: <UserIcon /> },
		],
	},
	{
		id: 'projects',
		label: 'Projects',
		icon: <FolderIcon />,
		children: [
			{ id: 'project-alpha', label: 'Project Alpha', icon: <FolderIcon /> },
			{ id: 'project-beta', label: 'Project Beta', icon: <FolderIcon /> },
			{
				id: 'archived',
				label: 'Archived',
				icon: <FolderIcon />,
				children: [
					{ id: 'project-old', label: 'Old Project', icon: <FolderIcon /> },
					{ id: 'project-legacy', label: 'Legacy System', icon: <FolderIcon /> },
				],
			},
		],
	},
	{
		id: 'files',
		label: 'Files',
		icon: <FileIcon />,
		children: [
			{ id: 'main-ts', label: 'main.ts', icon: <CodeIcon /> },
			{ id: 'index-tsx', label: 'index.tsx', icon: <CodeIcon /> },
			{ id: 'readme', label: 'README.md', icon: <FileIcon /> },
		],
	},
];

export const WithNestedMenus: Story = {
	name: 'With Nested Menus (Tab to enter, Esc to go back)',
	args: {
		placeholder: 'Type @ - use Tab to enter submenus, Esc to go back...',
		mentionConfigs: [{ trigger: '@', options: nestedOptions }],
	},
};

export const Comparison: Story = {
	name: 'Comparison',
	render: () => (
		<div className="flex flex-col gap-8">
			<div>
				<h3 className="text-sm font-medium text-gray-600 mb-2">Default (Type @ to mention)</h3>
				<Prompt placeholder="Type @ to mention someone..." mentionConfigs={[{ trigger: '@', options: defaultOptions }]} />
			</div>
			<div>
				<h3 className="text-sm font-medium text-gray-600 mb-2">With Custom Mention Trigger (#)</h3>
				<Prompt placeholder="Type # to mention someone..." mentionConfigs={[{ trigger: '#', options: defaultOptions }]} />
			</div>
			<div>
				<h3 className="text-sm font-medium text-gray-600 mb-2">With Initial Value (mention rendered as pill)</h3>
				<Prompt initialValue="Hello, @[John Doe]!" mentionConfigs={[{ trigger: '@', options: defaultOptions }]} />
			</div>
			<div>
				<h3 className="text-sm font-medium text-gray-600 mb-2">Without Placeholder</h3>
				<Prompt placeholder="" mentionConfigs={[{ trigger: '@', options: defaultOptions }]} />
			</div>
			<div>
				<h3 className="text-sm font-medium text-gray-600 mb-2">With Nested Menus (Tab to enter, Esc to go back)</h3>
				<Prompt placeholder="Type @ to browse nested menus..." mentionConfigs={[{ trigger: '@', options: nestedOptions }]} />
			</div>
			<div>
				<h3 className="text-sm font-medium text-gray-600 mb-2">Menu Position Above (with smart fallback)</h3>
				<Prompt placeholder="Type @ - menu appears above..." mentionConfigs={[{ trigger: '@', options: nestedOptions, menuPosition: 'above' }]} />
			</div>
		</div>
	),
};

export const WithPlaceholder: Story = {
	args: {
		placeholder: 'Type @ to mention someone...',
		mentionConfigs: [{ trigger: '@', options: defaultOptions }],
	},
};

export const WithCustomMentionTrigger: Story = {
	args: {
		placeholder: 'Type # to mention someone...',
		mentionConfigs: [{ trigger: '#', options: defaultOptions }],
	},
};

export const WithInitialValue: Story = {
	args: {
		initialValue: 'Hello, @[John Doe]!',
		mentionConfigs: [{ trigger: '@', options: defaultOptions }],
	},
};

export const WithoutPlaceholder: Story = {
	args: {
		placeholder: '',
		mentionConfigs: [{ trigger: '@', options: defaultOptions }],
	},
};

export const MenuPositionAbove: Story = {
	name: 'Menu Position Above',
	args: {
		placeholder: 'Type @ to see menu above...',
		mentionConfigs: [{ trigger: '@', options: nestedOptions, menuPosition: 'above' }],
	},
	parameters: {
		docs: {
			description: {
				story: 'The mention menu appears above the cursor by default. If there\'s not enough space above, it will automatically fall back to appearing below.',
			},
		},
	},
};

export const MenuPositionBelow: Story = {
	name: 'Menu Position Below (Default)',
	args: {
		placeholder: 'Type @ to see menu below...',
		mentionConfigs: [{ trigger: '@', options: nestedOptions, menuPosition: 'below' }],
	},
	parameters: {
		docs: {
			description: {
				story: 'The mention menu appears below the cursor by default. If there\'s not enough space below, it will automatically fall back to appearing above.',
			},
		},
	},
};

// Callback showcase component
const CallbackShowcase = () => {
	const [onChangeValue, setOnChangeValue] = useState<{ value: string; mentions: SelectedMention[] } | null>(null);
	const [onEnterValue, setOnEnterValue] = useState<{ value: string; mentions: SelectedMention[] } | null>(null);
	const [onMentionAddedValue, setOnMentionAddedValue] = useState<SelectedMention | null>(null);
	const [onMentionDeletedValue, setOnMentionDeletedValue] = useState<SelectedMention | null>(null);
	const [eventLog, setEventLog] = useState<{ event: string; data: unknown; timestamp: Date }[]>([]);

	const addToLog = (event: string, data: unknown) => {
		setEventLog((prev) => [{ event, data, timestamp: new Date() }, ...prev].slice(0, 10));
	};

	const showcaseOptions: MentionOption[] = [
		{ id: 'alice', label: 'Alice Johnson', icon: <UserIcon /> },
		{ id: 'bob', label: 'Bob Smith', icon: <UserIcon /> },
		{ id: 'project-alpha', label: 'Project Alpha', icon: <FolderIcon /> },
		{ id: 'main-ts', label: 'main.ts', icon: <CodeIcon /> },
	];

	return (
		<div className="flex flex-col gap-6">
			<div>
				<h3 className="text-sm font-medium text-gray-600 mb-2">
					Interactive Prompt (Type @ to mention, press Enter to submit)
				</h3>
				<Prompt
					placeholder="Type @ to mention, press Enter to see onEnter..."
					mentionConfigs={[{ trigger: '@', options: showcaseOptions }]}
					onChange={(value, mentions) => {
						setOnChangeValue({ value, mentions });
						addToLog('onChange', { value, mentions });
					}}
					onEnter={(value, mentions) => {
						setOnEnterValue({ value, mentions });
						addToLog('onEnter', { value, mentions });
					}}
					onMentionAdded={(mention) => {
						setOnMentionAddedValue(mention);
						addToLog('onMentionAdded', mention);
					}}
					onMentionDeleted={(mention) => {
						setOnMentionDeletedValue(mention);
						addToLog('onMentionDeleted', mention);
					}}
				/>
			</div>

			<div className="grid grid-cols-2 gap-4">
				{/* onChange */}
				<div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
					<h4 className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
						<span className="w-2 h-2 rounded-full bg-blue-500"></span>
						onChange
					</h4>
					<p className="text-xs text-blue-600 mb-2">Called on every text change</p>
					{onChangeValue ? (
						<div className="text-xs font-mono bg-white p-2 rounded border border-blue-100 overflow-auto max-h-32">
							<div className="mb-1">
								<span className="text-gray-500">value:</span>{' '}
								<span className="text-blue-700">"{onChangeValue.value}"</span>
							</div>
							<div>
								<span className="text-gray-500">mentions:</span>{' '}
								<span className="text-blue-700">{JSON.stringify(onChangeValue.mentions, null, 2)}</span>
							</div>
						</div>
					) : (
						<p className="text-xs text-gray-400 italic">No data yet - start typing...</p>
					)}
				</div>

				{/* onEnter */}
				<div className="p-4 rounded-lg bg-green-50 border border-green-200">
					<h4 className="text-sm font-semibold text-green-800 mb-2 flex items-center gap-2">
						<span className="w-2 h-2 rounded-full bg-green-500"></span>
						onEnter
					</h4>
					<p className="text-xs text-green-600 mb-2">Called when Enter is pressed</p>
					{onEnterValue ? (
						<div className="text-xs font-mono bg-white p-2 rounded border border-green-100 overflow-auto max-h-32">
							<div className="mb-1">
								<span className="text-gray-500">value:</span>{' '}
								<span className="text-green-700">"{onEnterValue.value}"</span>
							</div>
							<div>
								<span className="text-gray-500">mentions:</span>{' '}
								<span className="text-green-700">{JSON.stringify(onEnterValue.mentions, null, 2)}</span>
							</div>
						</div>
					) : (
						<p className="text-xs text-gray-400 italic">No data yet - press Enter...</p>
					)}
				</div>

				{/* onMentionAdded */}
				<div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
					<h4 className="text-sm font-semibold text-purple-800 mb-2 flex items-center gap-2">
						<span className="w-2 h-2 rounded-full bg-purple-500"></span>
						onMentionAdded
					</h4>
					<p className="text-xs text-purple-600 mb-2">Called when a mention is selected</p>
					{onMentionAddedValue ? (
						<div className="text-xs font-mono bg-white p-2 rounded border border-purple-100 overflow-auto max-h-32">
							<span className="text-purple-700">{JSON.stringify(onMentionAddedValue, null, 2)}</span>
						</div>
					) : (
						<p className="text-xs text-gray-400 italic">No data yet - add a mention...</p>
					)}
				</div>

				{/* onMentionDeleted */}
				<div className="p-4 rounded-lg bg-red-50 border border-red-200">
					<h4 className="text-sm font-semibold text-red-800 mb-2 flex items-center gap-2">
						<span className="w-2 h-2 rounded-full bg-red-500"></span>
						onMentionDeleted
					</h4>
					<p className="text-xs text-red-600 mb-2">Called when a mention is removed</p>
					{onMentionDeletedValue ? (
						<div className="text-xs font-mono bg-white p-2 rounded border border-red-100 overflow-auto max-h-32">
							<span className="text-red-700">{JSON.stringify(onMentionDeletedValue, null, 2)}</span>
						</div>
					) : (
						<p className="text-xs text-gray-400 italic">No data yet - delete a mention...</p>
					)}
				</div>
			</div>

			{/* Event Log */}
			<div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
				<h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
					<span className="w-2 h-2 rounded-full bg-gray-500"></span>
					Event Log (last 10 events)
				</h4>
				{eventLog.length > 0 ? (
					<div className="space-y-2 max-h-48 overflow-auto">
						{eventLog.map((log, index) => (
							<div
								key={index}
								className="text-xs font-mono bg-white p-2 rounded border border-gray-100 flex gap-2"
							>
								<span className="text-gray-400 shrink-0">
									{log.timestamp.toLocaleTimeString()}
								</span>
								<span
									className={`font-semibold shrink-0 ${log.event === 'onChange'
										? 'text-blue-600'
										: log.event === 'onEnter'
											? 'text-green-600'
											: log.event === 'onMentionAdded'
												? 'text-purple-600'
												: 'text-red-600'
										}`}
								>
									{log.event}
								</span>
								<span className="text-gray-600 truncate">{JSON.stringify(log.data)}</span>
							</div>
						))}
					</div>
				) : (
					<p className="text-xs text-gray-400 italic">No events yet - interact with the prompt...</p>
				)}
			</div>
		</div>
	);
};

export const CallbacksShowcase: Story = {
	name: 'Callbacks Showcase',
	render: () => <CallbackShowcase />,
	parameters: {
		docs: {
			description: {
				story: 'This story demonstrates the callback values from onChange, onEnter, onMentionAdded, and onMentionDeleted. Interact with the prompt to see the callback data in real-time.',
			},
		},
	},
};

// Multiple triggers configuration
const HashtagIcon = () => (
	<svg viewBox="0 0 20 20" fill="currentColor">
		<path fillRule="evenodd" d="M9.243 3.03a1 1 0 01.727 1.213L9.53 6h2.94l.56-2.243a1 1 0 111.94.486L14.53 6H17a1 1 0 110 2h-2.97l-1 4H15a1 1 0 110 2h-2.47l-.56 2.243a1 1 0 11-1.94-.486L10.47 14H7.53l-.56 2.243a1 1 0 01-1.94-.486L5.47 14H3a1 1 0 110-2h2.97l1-4H5a1 1 0 110-2h2.47l.56-2.243a1 1 0 011.213-.727zM9.03 8l-1 4h2.94l1-4H9.03z" clipRule="evenodd" />
	</svg>
);

const SlashIcon = () => (
	<svg viewBox="0 0 20 20" fill="currentColor">
		<path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 01-1.898-.632l4-12a1 1 0 011.265-.633z" clipRule="evenodd" />
	</svg>
);

const peopleOptions: MentionOption[] = [
	{ id: 'alice', label: 'Alice Johnson', icon: <UserIcon /> },
	{ id: 'bob', label: 'Bob Smith', icon: <UserIcon /> },
	{ id: 'carol', label: 'Carol White', icon: <UserIcon /> },
];

const tagOptions: MentionOption[] = [
	{ id: 'urgent', label: 'urgent', icon: <HashtagIcon /> },
	{ id: 'bug', label: 'bug', icon: <HashtagIcon /> },
	{ id: 'feature', label: 'feature', icon: <HashtagIcon /> },
	{ id: 'docs', label: 'docs', icon: <HashtagIcon /> },
];

const commandOptions: MentionOption[] = [
	{ id: 'help', label: 'help', icon: <SlashIcon /> },
	{ id: 'search', label: 'search', icon: <SlashIcon /> },
	{ id: 'clear', label: 'clear', icon: <SlashIcon /> },
	{ id: 'settings', label: 'settings', icon: <SlashIcon /> },
];

export const MultipleTriggers: Story = {
	name: 'Multiple Triggers (@, #, /)',
	render: () => (
		<div className="flex flex-col gap-4">
			<div className="text-sm text-gray-600 mb-2">
				<p className="font-medium mb-1">Try these triggers:</p>
				<ul className="list-disc list-inside space-y-1">
					<li><code className="bg-gray-100 px-1 rounded">@</code> - Mention people</li>
					<li><code className="bg-gray-100 px-1 rounded">#</code> - Add tags</li>
					<li><code className="bg-gray-100 px-1 rounded">/</code> - Run commands</li>
				</ul>
			</div>
			<Prompt
				placeholder="Type @, #, or / to see different menus..."
				mentionConfigs={[
					{ trigger: '@', options: peopleOptions, menuPosition: 'below' },
					{ trigger: '#', options: tagOptions, menuPosition: 'below' },
					{ trigger: '/', options: commandOptions, menuPosition: 'above' },
				]}
			/>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story: 'Configure multiple trigger characters, each with its own set of options and menu position. This example shows @ for people, # for tags, and / for commands.',
			},
		},
	},
};

// Multiple triggers showcase with callbacks
const MultiTriggerShowcase = () => {
	const [events, setEvents] = useState<{ type: string; data: unknown; time: Date }[]>([]);

	const addEvent = (type: string, data: unknown) => {
		setEvents(prev => [{ type, data, time: new Date() }, ...prev].slice(0, 8));
	};

	return (
		<div className="flex flex-col gap-4">
			<div className="text-sm text-gray-600 mb-2">
				<p className="font-medium mb-1">Multi-trigger demo with event tracking:</p>
				<p>Notice how each mention includes its trigger character in the callback data.</p>
			</div>
			<Prompt
				placeholder="Type @alice, #bug, or /help..."
				mentionConfigs={[
					{ trigger: '@', options: peopleOptions },
					{ trigger: '#', options: tagOptions },
					{ trigger: '/', options: commandOptions, menuPosition: 'above' },
				]}
				onChange={(value, mentions) => addEvent('onChange', { value, mentions })}
				onMentionAdded={(mention) => addEvent('onMentionAdded', mention)}
				onMentionDeleted={(mention) => addEvent('onMentionDeleted', mention)}
			/>

			{events.length > 0 && (
				<div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
					<h4 className="text-xs font-semibold text-gray-700 mb-2">Recent Events:</h4>
					<div className="space-y-1.5 max-h-48 overflow-auto">
						{events.map((evt, i) => (
							<div key={i} className="text-xs font-mono bg-white p-2 rounded border border-gray-100 flex gap-2">
								<span className="text-gray-400 shrink-0">{evt.time.toLocaleTimeString()}</span>
								<span className={`font-semibold shrink-0 ${evt.type === 'onMentionAdded' ? 'text-green-600' :
									evt.type === 'onMentionDeleted' ? 'text-red-600' : 'text-blue-600'
									}`}>{evt.type}</span>
								<span className="text-gray-600 truncate">{JSON.stringify(evt.data)}</span>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
};

export const MultipleTriggersWithCallbacks: Story = {
	name: 'Multiple Triggers with Callbacks',
	render: () => <MultiTriggerShowcase />,
	parameters: {
		docs: {
			description: {
				story: 'Shows how callbacks include the trigger character for each mention, making it easy to distinguish between different mention types.',
			},
		},
	},
};

// Hidden trigger showcase
export const HiddenTrigger: Story = {
	name: 'Hidden Trigger (showTrigger: false)',
	render: () => (
		<div className="flex flex-col gap-6">
			<div>
				<h3 className="text-sm font-medium text-gray-600 mb-2">With Trigger Shown (default)</h3>
				<Prompt
					placeholder="Type @ to mention..."
					mentionConfigs={[{ trigger: '@', options: peopleOptions, showTrigger: true }]}
				/>
			</div>
			<div>
				<h3 className="text-sm font-medium text-gray-600 mb-2">Without Trigger Shown</h3>
				<Prompt
					placeholder="Type @ to mention (trigger hidden)..."
					mentionConfigs={[{ trigger: '@', options: peopleOptions, showTrigger: false }]}
				/>
			</div>
			<div>
				<h3 className="text-sm font-medium text-gray-600 mb-2">Mixed - @ shows trigger, # hides it</h3>
				<Prompt
					placeholder="Type @ or #..."
					mentionConfigs={[
						{ trigger: '@', options: peopleOptions, showTrigger: true },
						{ trigger: '#', options: tagOptions, showTrigger: false },
					]}
				/>
			</div>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story: 'The `showTrigger` option controls whether the trigger character (like @) appears in the mention pill. When set to `false`, mentions display as just the label without the trigger prefix.',
			},
		},
	},
};
