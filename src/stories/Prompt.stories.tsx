import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, useRef } from 'react';
import Prompt from '../components/Prompt/Prompt';
import type { PromptHandle } from '../components/Prompt/Prompt';
import type { MentionOption } from '../hooks/useMentions';
import type { SelectedMention } from '../hooks/useContentEditable';
import { presetThemes, type PromptTheme } from '../types/theme';
import { Files, BookOpen, SquareTerminal, MessageSquare, File } from 'lucide-react';

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
		backgrounds: {
			options: {
				dark: { name: 'Dark', value: '#1F2126' },
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

export const WithPlaceholder: Story = {
	args: {
		placeholder: 'Type @ to mention someone...',
		mentionConfigs: [{ trigger: '@', options: defaultOptions }],
	},
};

const cursorMentionOptions: MentionOption[] = [
	{ id: 'src/components/Prompt/Prompt.tsx', label: 'Prompt.tsx' },
	{ id: 'src/index.css', label: 'index.css' },
	{ id: 'src/sql/query.sql', label: 'query.sql' },
	{ type: 'divider', label: '', id: 'divider-1' },
	{
		label: 'Files & Folders', id: 'title-files', icon: <Files strokeWidth={1} />, children: [
			{ id: 'files-folders', label: 'Files & Folders', type: 'title' },
			{ id: 'src', label: 'src', icon: <FolderIcon /> },
			{ id: 'src/index.css', label: 'index.css', labelRight: 'src/', indent: 1 },
			{ id: 'src/stories.css', label: 'stories.css', labelRight: 'src/', indent: 1 },
			{ id: 'src/components/something/Prompt/Prompt.tsx', label: 'Prompt.tsx', labelRight: 'src/components/something/Prompt/' },
			{ id: 'src/index.css', label: 'index.css' },
			{ id: 'src/stories/Prompt.stories.tsx', label: 'MentionMenu.stories.tsx' },
			{ id: 'src/stories.css', label: 'stories.css' },
			{ id: 'src/utils/formatDate.ts', label: 'formatDate.ts' },
			{ id: 'src/hooks/useDebounce.ts', label: 'useDebounce.ts' },
			{ id: 'src/components/Button/Button.tsx', label: 'Button.tsx' },
			{ id: 'src/api/endpoints.ts', label: 'endpoints.ts' },
			{ id: 'src/types/User.ts', label: 'User.ts' },
			{ id: 'src/services/authService.ts', label: 'authService.ts' },
			{ id: 'src/constants/config.ts', label: 'config.ts' },
			{ id: 'src/components/Modal/Modal.tsx', label: 'Modal.tsx' },
			{ id: 'src/helpers/validation.ts', label: 'validation.ts' },
			{ id: 'src/context/ThemeContext.tsx', label: 'ThemeContext.tsx' },
			{ id: 'src/lib/analytics.ts', label: 'analytics.ts' },
			{ id: 'src/components/Header/Header.tsx', label: 'Header.tsx' },
			{ id: 'src/utils/parseQuery.ts', label: 'parseQuery.ts' },
			{ id: 'src/middleware/errorHandler.ts', label: 'errorHandler.ts' },
		]
	},
	{
		label: 'Docs', id: 'title-docs', icon: <BookOpen strokeWidth={1} />, children: [
			{ id: 'src/components/Prompt/Prompt.tsx', label: 'Prompt.tsx' },
			{ id: 'src/index.css', label: 'index.css' },
			{ id: 'src/stories/Prompt.stories.tsx', label: 'Prompt.stories.tsx' },
		]
	},
	{
		label: 'Terminal', id: 'title-terminal', icon: <SquareTerminal strokeWidth={1} />, children: [
			{ id: 'src/components/Prompt/Prompt.tsx', label: 'Prompt.tsx' },
			{ id: 'src/index.css', label: 'index.css' },
			{ id: 'src/stories/Prompt.stories.tsx', label: 'Prompt.stories.tsx' },
		]
	},
	{
		label: 'Past Chats', id: 'title-past-chats', icon: <MessageSquare strokeWidth={1} />, children: [
			{ id: 'src/components/Prompt/Prompt.tsx', label: 'Prompt.tsx' },
			{ id: 'src/index.css', label: 'index.css' },
			{ id: 'src/stories/Prompt.stories.tsx', label: 'Prompt.stories.tsx' },
		]
	},
];

export const CursorDarkTheme: Story = {
	args: {
		placeholder: 'Type @ to mention someone...',
		mentionConfigs: [{ trigger: '@', options: cursorMentionOptions, menuPosition: 'above' }],
		theme: 'cursorDark',
		initialValue: 'I want to change the @[src/components/Prompt/Prompt.tsx] to fix the bug.',
		onMentionClick: (mention: SelectedMention) => {
			alert(`Mention clicked!\n\nID: ${mention.id}\nLabel: ${mention.label}\nTrigger: ${mention.trigger}`);
		},
		extensionIcons: true,
	},
	globals: {
		backgrounds: { value: 'dark' }
	}
};

export const WithCustomMentionTrigger: Story = {
	args: {
		placeholder: 'Type # to mention someone...',
		mentionConfigs: [{ trigger: '#', options: defaultOptions }],
	},
};

export const WithInitialValue: Story = {
	args: {
		initialValue: 'Hello, @[john-doe]!',
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
				<h3 className="text-sm font-medium text-gray-600 mb-2">Default behavior (not shown)</h3>
				<Prompt
					placeholder="Type @ to mention..."
					mentionConfigs={[{ trigger: '@', options: peopleOptions }]}
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

// Clickable mentions showcase
export const ClickableMentions: Story = {
	name: 'Clickable Mentions (onMentionClick)',
	render: () => (
		<div className="flex flex-col gap-6">
			<div>
				<h3 className="text-sm font-medium text-gray-600 mb-2">Click on a mention pill to see its ID</h3>
				<Prompt
					initialValue="Hello @[alice]! Can you review the @[main-ts] file?"
					placeholder="Type @ to add mentions, then click on them..."
					mentionConfigs={[{ trigger: '@', options: optionsWithIcons }]}
					onMentionClick={(mention: SelectedMention) => {
						alert(`Mention clicked!\n\nID: ${mention.id}\nLabel: ${mention.label}\nTrigger: ${mention.trigger}`);
					}}
				/>
			</div>
			<div>
				<h3 className="text-sm font-medium text-gray-600 mb-2">Custom action on click (console log)</h3>
				<Prompt
					initialValue="Check out #[feature-request] and #[bug-fix] tags"
					placeholder="Type # to add tags..."
					mentionConfigs={[{ trigger: '#', options: tagOptions }]}
					onMentionClick={(mention: SelectedMention) => {
						console.log('Mention clicked:', mention);
						alert(`Opening tag: ${mention.label}`);
					}}
				/>
			</div>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story: 'The `onMentionClick` callback is triggered when a user clicks on a mention pill. This can be used to open a profile, navigate to a file, or perform any custom action.',
			},
		},
	},
};

// ========== Theme Customization Stories ==========

export const PresetThemes: Story = {
	name: 'Preset Themes',
	render: () => (
		<div className="space-y-8 p-4">
			<div>
				<h3 className="text-sm font-medium text-gray-600 mb-2">Light Theme (default)</h3>
				<Prompt
					theme="light"
					placeholder="Type @ to mention..."
					mentionConfigs={[{ trigger: '@', options: optionsWithIcons }]}
				/>
			</div>
			<div>
				<h3 className="text-sm font-medium text-gray-600 mb-2">Cursor Dark Theme</h3>
				<div className="bg-[#1F2126] p-4 rounded-lg">
					<Prompt
						theme="cursorDark"
						placeholder="Type @ to mention..."
						mentionConfigs={[{ trigger: '@', options: optionsWithIcons }]}
					/>
				</div>
			</div>
			<div>
				<h3 className="text-sm font-medium text-gray-600 mb-2">GitHub Dark Theme</h3>
				<div className="bg-[#0d1117] p-4 rounded-lg">
					<Prompt
						theme="githubDark"
						placeholder="Type @ to mention..."
						mentionConfigs={[{ trigger: '@', options: optionsWithIcons }]}
					/>
				</div>
			</div>
			<div>
				<h3 className="text-sm font-medium text-gray-600 mb-2">Minimal Theme</h3>
				<Prompt
					theme="minimal"
					placeholder="Type @ to mention..."
					mentionConfigs={[{ trigger: '@', options: optionsWithIcons }]}
				/>
			</div>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story: 'The library includes several preset themes that can be applied by passing a theme name string. Available presets: `"light"`, `"cursorDark"`, `"githubDark"`, `"minimal"`.',
			},
		},
	},
};

// Custom theme example
const customPurpleTheme: PromptTheme = {
	backgroundColor: '#1a1625',
	color: '#e0d4f7',
	placeholderColor: '#6b5b8c',
	fontSize: '14px',
	borderRadius: '12px',
	borderColor: '#2d2640',
	padding: '0.75rem',
	focusBorderColor: '#9c6ade',
	menu: {
		backgroundColor: '#1a1625',
		borderColor: '#2d2640',
		color: '#c4b5dc',
		itemHoverColor: '#2d2640',
		chevronColor: '#6b5b8c',
		chevronHoverColor: '#9c6ade',
	},
	pill: {
		backgroundColor: 'linear-gradient(135deg, #7c3aed 0%, #c026d3 100%)',
		borderRadius: '8px',
		color: 'white',
		padding: '0.125rem 0.625rem',
	},
};

const customOceanTheme: PromptTheme = {
	backgroundColor: '#0c1929',
	color: '#b8d4e8',
	placeholderColor: '#4a6785',
	fontSize: '14px',
	borderRadius: '8px',
	borderColor: '#1e3a5f',
	padding: '0.625rem',
	focusBorderColor: '#0ea5e9',
	menu: {
		backgroundColor: '#0c1929',
		borderColor: '#1e3a5f',
		color: '#8bb8d4',
		itemHoverColor: '#1e3a5f',
		chevronColor: '#4a6785',
		chevronHoverColor: '#0ea5e9',
	},
	pill: {
		backgroundColor: 'linear-gradient(135deg, #0369a1 0%, #0891b2 100%)',
		borderRadius: '6px',
		color: 'white',
		padding: '0.125rem 0.5rem',
	},
};

export const CustomTheme: Story = {
	name: 'Custom Theme Object',
	render: () => (
		<div className="space-y-8 p-4">
			<div>
				<h3 className="text-sm font-medium text-gray-600 mb-2">Custom Purple Theme</h3>
				<div className="bg-[#1a1625] p-4 rounded-lg">
					<Prompt
						theme={customPurpleTheme}
						placeholder="Type @ to mention..."
						mentionConfigs={[{ trigger: '@', options: optionsWithIcons }]}
					/>
				</div>
			</div>
			<div>
				<h3 className="text-sm font-medium text-gray-600 mb-2">Custom Ocean Theme</h3>
				<div className="bg-[#0c1929] p-4 rounded-lg">
					<Prompt
						theme={customOceanTheme}
						placeholder="Type @ to mention..."
						mentionConfigs={[{ trigger: '@', options: optionsWithIcons }]}
					/>
				</div>
			</div>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story: `Pass a \`PromptTheme\` object for full control over styling. The theme object supports all customizable properties:

\`\`\`typescript
const myTheme: PromptTheme = {
  backgroundColor: '#fff',
  color: '#000',
  placeholderColor: '#999',
  fontSize: '14px',
  borderRadius: '8px',
  borderColor: '#ccc',
  padding: '0.5rem',
  focusBorderColor: '#0066ff',
  menu: {
    backgroundColor: '#fff',
    borderColor: '#eee',
    color: '#333',
    itemHoverColor: '#f5f5f5',
    chevronColor: '#999',
    chevronHoverColor: '#0066ff',
  },
  pill: {
    backgroundColor: '#0066ff',
    borderRadius: '4px',
    color: 'white',
    padding: '2px 8px',
  },
};

<Prompt theme={myTheme} ... />
\`\`\``,
			},
		},
	},
};

export const PartialThemeOverride: Story = {
	name: 'Partial Theme Override',
	render: () => (
		<div className="space-y-8 p-4">
			<div>
				<h3 className="text-sm font-medium text-gray-600 mb-2">Only override pill styles</h3>
				<Prompt
					theme={{
						pill: {
							backgroundColor: '#16a34a',
							borderRadius: '4px',
						},
					}}
					placeholder="Type @ to mention..."
					mentionConfigs={[{ trigger: '@', options: optionsWithIcons }]}
				/>
			</div>
			<div>
				<h3 className="text-sm font-medium text-gray-600 mb-2">Only override focus color</h3>
				<Prompt
					theme={{
						focusBorderColor: '#f43f5e',
					}}
					placeholder="Focus the input to see the custom border color..."
					mentionConfigs={[{ trigger: '@', options: optionsWithIcons }]}
				/>
			</div>
			<div>
				<h3 className="text-sm font-medium text-gray-600 mb-2">Extend a preset theme</h3>
				<div className="bg-[#0d1117] p-4 rounded-lg">
					<Prompt
						theme={{
							...presetThemes.githubDark,
							pill: {
								...presetThemes.githubDark.pill,
								backgroundColor: '#f97316',
								color: 'white',
							},
						}}
						placeholder="GitHub dark with orange pills..."
						mentionConfigs={[{ trigger: '@', options: optionsWithIcons }]}
					/>
				</div>
			</div>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story: 'You can pass a partial theme object to only override specific properties. Unspecified values will use the CSS variable defaults. You can also extend preset themes by spreading them.',
			},
		},
	},
};

export const ThemeWithCustomClass: Story = {
	name: 'Theme with Custom Class & Style',
	render: () => (
		<div className="space-y-8 p-4">
			<div>
				<h3 className="text-sm font-medium text-gray-600 mb-2">With custom className</h3>
				<Prompt
					theme="minimal"
					className="shadow-lg"
					placeholder="Type @ to mention..."
					mentionConfigs={[{ trigger: '@', options: optionsWithIcons }]}
				/>
			</div>
			<div>
				<h3 className="text-sm font-medium text-gray-600 mb-2">With inline styles</h3>
				<Prompt
					theme="light"
					style={{ maxWidth: 400, margin: '0 auto' }}
					placeholder="Centered with max width..."
					mentionConfigs={[{ trigger: '@', options: optionsWithIcons }]}
				/>
			</div>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story: 'Use the `className` and `style` props alongside themes for additional customization like layout, shadows, or animations.',
			},
		},
	},
};

// ========== labelRight Feature Stories ==========

// Options with labelRight for showing file paths
const fileOptionsWithPaths: MentionOption[] = [
	{ id: 'title-recent', label: 'Recent Files', type: 'title' },
	{ id: 'prompt-tsx', label: 'Prompt.tsx', labelRight: 'src/components/', icon: <CodeIcon /> },
	{ id: 'index-css', label: 'index.css', labelRight: 'src/', icon: <FileIcon /> },
	{ id: 'useMentions-ts', label: 'useMentions.ts', labelRight: 'src/hooks/', icon: <CodeIcon /> },
	{ id: 'divider-1', label: '', type: 'divider' },
	{ id: 'title-all', label: 'All Files', type: 'title' },
	{ id: 'app-tsx', label: 'App.tsx', labelRight: 'src/', icon: <CodeIcon /> },
	{ id: 'theme-ts', label: 'theme.ts', labelRight: 'src/types/', icon: <CodeIcon /> },
	{ id: 'readme-md', label: 'README.md', labelRight: './', icon: <FileIcon /> },
	{ id: 'package-json', label: 'package.json', labelRight: './', icon: <FileIcon /> },
	{ id: 'stories-tsx', label: 'Prompt.stories.tsx', labelRight: 'src/stories/', icon: <CodeIcon /> },
];

export const WithLabelRight: Story = {
	name: 'With Label Right (File Paths)',
	args: {
		placeholder: 'Type @ to see files with paths...',
		mentionConfigs: [{ trigger: '@', options: fileOptionsWithPaths }],
	},
	parameters: {
		docs: {
			description: {
				story: `The \`labelRight\` property allows you to display secondary information aligned to the right side of menu items. This is perfect for showing file paths, metadata, or any additional context.

\`\`\`typescript
const options: MentionOption[] = [
  { id: 'file1', label: 'index.tsx', labelRight: 'src/components/' },
  { id: 'file2', label: 'styles.css', labelRight: 'src/styles/' },
];
\`\`\`

The right label is styled with a muted gray color and will ellipsis from the left if it overflows (showing the most relevant part of the path).`,
			},
		},
	},
};

// ========== Indent Feature Stories ==========

// Options with indent for file/folder hierarchy
const fileTreeOptions: MentionOption[] = [
	{ id: 'src', label: 'src', icon: <FolderIcon /> },
	{ id: 'components', label: 'components', icon: <FolderIcon />, indent: 1 },
	{ id: 'prompt-folder', label: 'Prompt', icon: <FolderIcon />, indent: 2 },
	{ id: 'prompt-tsx', label: 'Prompt.tsx', labelRight: 'src/components/Prompt/', icon: <CodeIcon />, indent: 3 },
	{ id: 'prompt-test', label: 'Prompt.test.tsx', labelRight: 'src/components/Prompt/', icon: <CodeIcon />, indent: 3 },
	{ id: 'menu-tsx', label: 'MentionMenu.tsx', labelRight: 'src/components/Prompt/', icon: <CodeIcon />, indent: 3 },
	{ id: 'hooks', label: 'hooks', icon: <FolderIcon />, indent: 1 },
	{ id: 'useMentions', label: 'useMentions.ts', labelRight: 'src/hooks/', icon: <CodeIcon />, indent: 2 },
	{ id: 'useHistory', label: 'useHistory.ts', labelRight: 'src/hooks/', icon: <CodeIcon />, indent: 2 },
	{ id: 'types', label: 'types', icon: <FolderIcon />, indent: 1 },
	{ id: 'theme-ts', label: 'theme.ts', labelRight: 'src/types/', icon: <CodeIcon />, indent: 2 },
	{ id: 'index-ts', label: 'index.ts', labelRight: 'src/types/', icon: <CodeIcon />, indent: 2 },
];

export const WithIndentHierarchy: Story = {
	name: 'With Indent (File Tree Hierarchy)',
	args: {
		placeholder: 'Type @ to see file tree...',
		mentionConfigs: [{ trigger: '@', options: fileTreeOptions }],
	},
	parameters: {
		docs: {
			description: {
				story: `The \`indent\` property creates visual hierarchy by adding left padding to menu items. Combined with \`labelRight\`, you can create IDE-like file tree experiences.

\`\`\`typescript
const options: MentionOption[] = [
  { id: 'src', label: 'src', icon: <FolderIcon /> },
  { id: 'components', label: 'components', icon: <FolderIcon />, indent: 1 },
  { id: 'button', label: 'Button.tsx', labelRight: 'src/components/', indent: 2 },
];
\`\`\`

**Note:** When searching, items are flattened and indentation is removed to show a clean list of results.`,
			},
		},
	},
};

// Combined showcase with Cursor-like dark theme
const cursorFileTreeOptions: MentionOption[] = [
	{ id: 'seeds', label: 'seeds', icon: <FolderIcon /> },
	{ id: 'gitkeep', label: '.gitkeep', labelRight: 'seeds/', icon: <FileIcon />, indent: 1 },
	{ id: 'raw-customers', label: 'raw_customers.csv', labelRight: 'seeds/', icon: <File strokeWidth={1} />, indent: 1 },
	{ id: 'raw-orders', label: 'raw_orders.csv', labelRight: 'seeds/', icon: <File strokeWidth={1} />, indent: 1 },
	{ id: 'raw-payments', label: 'raw_payments.csv', labelRight: 'seeds/', icon: <File strokeWidth={1} />, indent: 1 },
	{ id: 'divider-1', label: '', type: 'divider' },
	{ id: 'models', label: 'models', icon: <FolderIcon /> },
	{ id: 'staging', label: 'staging', icon: <FolderIcon />, indent: 1 },
	{ id: 'stg-customers', label: 'stg_customers.sql', labelRight: 'models/staging/', icon: <CodeIcon />, indent: 2 },
	{ id: 'stg-orders', label: 'stg_orders.sql', labelRight: 'models/staging/', icon: <CodeIcon />, indent: 2 },
	{ id: 'marts', label: 'marts', icon: <FolderIcon />, indent: 1 },
	{ id: 'dim-customers', label: 'dim_customers.sql', labelRight: 'models/marts/', icon: <CodeIcon />, indent: 2 },
	{ id: 'fct-orders', label: 'fct_orders.sql', labelRight: 'models/marts/', icon: <CodeIcon />, indent: 2 },
];

export const FileTreeDarkTheme: Story = {
	name: 'File Tree with Dark Theme (Cursor-style)',
	render: () => (
		<div className="bg-[#1F2126] p-6 rounded-lg">
			<Prompt
				theme="cursorDark"
				placeholder="Type @ to browse files..."
				mentionConfigs={[{ trigger: '@', options: cursorFileTreeOptions, menuPosition: 'below' }]}
				extensionIcons={true}
			/>
		</div>
	),
	globals: {
		backgrounds: { value: 'dark' }
	},
	parameters: {
		docs: {
			description: {
				story: `A complete example combining \`labelRight\`, \`indent\`, and the Cursor dark theme to create an IDE-like file browsing experience. This showcases how the features work together for a polished UI.

Features demonstrated:
- **labelRight**: Shows file paths aligned right
- **indent**: Creates folder/file hierarchy
- **extensionIcons**: Automatic file type icons based on extension
- **cursorDark theme**: Dark mode styling`,
			},
		},
	},
};

// ========== Imperative Handle (ref) Stories ==========

// Options for external mention append demo
const externalMentionOptions: MentionOption[] = [
	{ id: 'alice', label: 'Alice Johnson', icon: <UserIcon /> },
	{ id: 'bob', label: 'Bob Smith', icon: <UserIcon /> },
	{ id: 'carol', label: 'Carol White', icon: <UserIcon /> },
	{ id: 'main-ts', label: 'main.ts', icon: <CodeIcon /> },
	{ id: 'index-tsx', label: 'index.tsx', icon: <CodeIcon /> },
	{ id: 'readme', label: 'README.md', icon: <FileIcon /> },
];

const tagOptionsForExternal: MentionOption[] = [
	{ id: 'urgent', label: 'urgent' },
	{ id: 'bug', label: 'bug' },
	{ id: 'feature', label: 'feature' },
];

const AppendMentionShowcase = () => {
	const promptRef = useRef<PromptHandle>(null);
	const [lastAction, setLastAction] = useState<string>('');

	const handleAppendUser = (user: MentionOption) => {
		promptRef.current?.appendMention(user);
		promptRef.current?.focus();
		setLastAction(`Appended: @${user.label}`);
	};

	const handleAppendTag = (tag: MentionOption) => {
		promptRef.current?.appendMention(tag, '#');
		promptRef.current?.focus();
		setLastAction(`Appended: #${tag.label}`);
	};

	return (
		<div className="flex flex-col gap-6">
			<div className="text-sm text-gray-600">
				<p className="font-medium mb-2">External Mention Append Demo</p>
				<p>Click the buttons below to programmatically append mentions to the input.</p>
			</div>

			<Prompt
				ref={promptRef}
				placeholder="Type here or use buttons to add mentions..."
				mentionConfigs={[
					{ trigger: '@', options: externalMentionOptions },
					{ trigger: '#', options: tagOptionsForExternal },
				]}
				onChange={(value) => console.log('Value:', value)}
			/>

			<div className="flex flex-col gap-4">
				<div>
					<h4 className="text-sm font-semibold text-gray-700 mb-2">Add People (@)</h4>
					<div className="flex flex-wrap gap-2">
						{externalMentionOptions.filter(o => o.icon?.toString().includes('UserIcon') || o.label.includes('Johnson') || o.label.includes('Smith') || o.label.includes('White')).slice(0, 3).map((user) => (
							<button
								key={user.id}
								onClick={() => handleAppendUser(user)}
								className="px-3 py-1.5 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md transition-colors flex items-center gap-2"
							>
								<span className="w-4 h-4">{user.icon}</span>
								{user.label}
							</button>
						))}
					</div>
				</div>

				<div>
					<h4 className="text-sm font-semibold text-gray-700 mb-2">Add Files (@)</h4>
					<div className="flex flex-wrap gap-2">
						{externalMentionOptions.filter(o => o.label.includes('.ts') || o.label.includes('.md')).map((file) => (
							<button
								key={file.id}
								onClick={() => handleAppendUser(file)}
								className="px-3 py-1.5 text-sm bg-green-100 hover:bg-green-200 text-green-700 rounded-md transition-colors flex items-center gap-2"
							>
								<span className="w-4 h-4">{file.icon}</span>
								{file.label}
							</button>
						))}
					</div>
				</div>

				<div>
					<h4 className="text-sm font-semibold text-gray-700 mb-2">Add Tags (#)</h4>
					<div className="flex flex-wrap gap-2">
						{tagOptionsForExternal.map((tag) => (
							<button
								key={tag.id}
								onClick={() => handleAppendTag(tag)}
								className="px-3 py-1.5 text-sm bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-md transition-colors"
							>
								#{tag.label}
							</button>
						))}
					</div>
				</div>
			</div>

			{lastAction && (
				<div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
					<span className="text-sm text-gray-600">Last action: </span>
					<span className="text-sm font-mono text-gray-800">{lastAction}</span>
				</div>
			)}
		</div>
	);
};

export const ExternalMentionAppend: Story = {
	name: 'External Mention Append (ref)',
	render: () => <AppendMentionShowcase />,
	parameters: {
		docs: {
			description: {
				story: `Use the \`ref\` prop to access imperative methods for controlling the prompt from outside.

### Available Methods

\`\`\`typescript
interface PromptHandle {
  // Appends a mention to the end of the input
  appendMention: (option: MentionOption, trigger?: string) => void;
  // Focuses the prompt input
  focus: () => void;
}
\`\`\`

### Usage Example

\`\`\`tsx
import { useRef } from 'react';
import { Prompt, PromptHandle, MentionOption } from 'prompt-mentions';

function MyComponent() {
  const promptRef = useRef<PromptHandle>(null);

  const handleAddMention = () => {
    const option: MentionOption = {
      id: 'user-123',
      label: 'John Doe',
    };
    
    // Append mention with default trigger (@)
    promptRef.current?.appendMention(option);
    
    // Or with a specific trigger
    promptRef.current?.appendMention(option, '#');
    
    // Focus the prompt after adding
    promptRef.current?.focus();
  };

  return (
    <>
      <Prompt
        ref={promptRef}
        mentionConfigs={[
          { trigger: '@', options: [...] },
          { trigger: '#', options: [...] },
        ]}
      />
      <button onClick={handleAddMention}>Add @John Doe</button>
    </>
  );
}
\`\`\`

This is useful for:
- Adding mentions from a sidebar or external UI
- Integrating with drag-and-drop
- Programmatically inserting mentions based on other user actions
- Building command palettes that insert mentions`,
			},
		},
	},
};

// Dark theme version of external append
const AppendMentionDarkShowcase = () => {
	const promptRef = useRef<PromptHandle>(null);

	const files: MentionOption[] = [
		{ id: 'src/index.ts', label: 'index.ts' },
		{ id: 'src/App.tsx', label: 'App.tsx' },
		{ id: 'package.json', label: 'package.json' },
	];

	return (
		<div className="bg-[#1F2126] p-6 rounded-lg">
			<div className="flex flex-col gap-4">
				<Prompt
					ref={promptRef}
					theme="cursorDark"
					placeholder="Ask a question about your code..."
					mentionConfigs={[{ trigger: '@', options: cursorMentionOptions, menuPosition: 'above' }]}
					extensionIcons={true}
				/>

				<div className="flex gap-2">
					<span className="text-xs text-gray-500">Quick add:</span>
					{files.map((file) => (
						<button
							key={file.id}
							onClick={() => {
								promptRef.current?.appendMention(file);
								promptRef.current?.focus();
							}}
							className="px-2 py-1 text-xs bg-[#2d2d30] hover:bg-[#3d3d40] text-gray-300 rounded transition-colors"
						>
							@{file.label}
						</button>
					))}
				</div>
			</div>
		</div>
	);
};

export const ExternalMentionAppendDark: Story = {
	name: 'External Mention Append (Dark Theme)',
	render: () => <AppendMentionDarkShowcase />,
	globals: {
		backgrounds: { value: 'dark' }
	},
	parameters: {
		docs: {
			description: {
				story: 'The external mention append feature works seamlessly with all themes. This example shows a Cursor-like dark theme with quick-add buttons for common files.',
			},
		},
	},
};

// ========== Performance Test Story (5000 entries) ==========

// Generate 5000 file-like entries for performance testing
const generateManyOptions = (count: number): MentionOption[] => {
	const folders = [
		'src', 'lib', 'components', 'hooks', 'utils', 'services', 'api', 'types',
		'models', 'controllers', 'views', 'layouts', 'pages', 'features', 'modules',
		'config', 'constants', 'helpers', 'middleware', 'plugins', 'themes', 'assets',
	];
	const subfolders = [
		'auth', 'user', 'dashboard', 'settings', 'profile', 'admin', 'common',
		'shared', 'core', 'base', 'ui', 'data', 'network', 'storage', 'cache',
	];
	const extensions = ['.ts', '.tsx', '.js', '.jsx', '.css', '.scss', '.json', '.md', '.sql', '.yml'];
	const prefixes = [
		'index', 'main', 'App', 'Button', 'Modal', 'Form', 'Input', 'Select', 'Table',
		'List', 'Card', 'Header', 'Footer', 'Sidebar', 'Nav', 'Menu', 'Dialog', 'Toast',
		'Alert', 'Badge', 'Avatar', 'Icon', 'Image', 'Link', 'Text', 'Title', 'Label',
		'Checkbox', 'Radio', 'Switch', 'Slider', 'Progress', 'Spinner', 'Skeleton',
		'use', 'get', 'set', 'fetch', 'create', 'update', 'delete', 'handle', 'process',
		'validate', 'transform', 'format', 'parse', 'serialize', 'deserialize', 'convert',
	];
	const suffixes = [
		'', 'Utils', 'Helper', 'Service', 'Controller', 'Model', 'View', 'Context',
		'Provider', 'Consumer', 'Hook', 'Store', 'Reducer', 'Action', 'Selector',
		'Schema', 'Type', 'Interface', 'Enum', 'Const', 'Config', 'Test', 'Spec',
	];

	const options: MentionOption[] = [];

	for (let i = 0; i < count; i++) {
		const folder = folders[i % folders.length];
		const subfolder = subfolders[Math.floor(i / folders.length) % subfolders.length];
		const prefix = prefixes[i % prefixes.length];
		const suffix = suffixes[Math.floor(i / prefixes.length) % suffixes.length];
		const ext = extensions[i % extensions.length];
		const fileName = `${prefix}${suffix}${i}${ext}`;
		const path = `${folder}/${subfolder}/`;

		options.push({
			id: `${path}${fileName}`,
			label: fileName,
			labelRight: path,
		});
	}

	return options;
};

const manyOptions = generateManyOptions(5000);

export const PerformanceTest5000Entries: Story = {
	name: 'Performance Test (5000 Entries)',
	render: () => (
		<div className="flex flex-col gap-4">
			<div className="text-sm text-gray-600 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
				<p className="font-medium mb-2">⚡ Performance Test (Virtualized)</p>
				<p>This story loads <strong>5,000 entries</strong> to test the menu's performance with a large dataset.</p>
				<p className="mt-2 text-xs text-gray-500">
					Type <code className="bg-gray-100 px-1 rounded">@</code> to open the menu, then try searching to filter results.
				</p>
				<p className="mt-1 text-xs text-green-600">
					✓ Virtualization is <strong>enabled by default</strong> - only visible items are rendered.
				</p>
			</div>
			<Prompt
				placeholder="Type @ to search through 5000 files..."
				mentionConfigs={[{ trigger: '@', options: manyOptions, menuPosition: 'below' }]}
				extensionIcons={true}
			/>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story: `This story tests the performance of the mention menu with a very large dataset (5,000 entries).

**Virtualization** is enabled by default (\`virtualizeMenu={true}\`), which means only visible items are rendered to the DOM. This ensures smooth scrolling and quick menu opening even with thousands of entries.

Use this to verify:
- Menu opens smoothly with many entries
- Search/filtering remains responsive
- Scrolling through results is smooth
- Memory usage remains reasonable

The entries are generated programmatically with realistic file names and paths.`,
			},
		},
	},
};

export const PerformanceTest5000EntriesDark: Story = {
	name: 'Performance Test (5000 Entries, Dark)',
	render: () => (
		<div className="bg-[#1F2126] p-6 rounded-lg">
			<div className="flex flex-col gap-4">
				<div className="text-sm text-gray-400 bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-4">
					<p className="font-medium mb-2 text-yellow-500">⚡ Performance Test (Virtualized)</p>
					<p>This story loads <strong className="text-yellow-400">5,000 entries</strong> to test the menu's performance with a large dataset.</p>
					<p className="mt-2 text-xs text-gray-500">
						Type <code className="bg-gray-800 px-1 rounded">@</code> to open the menu, then try searching to filter results.
					</p>
					<p className="mt-1 text-xs text-green-400">
						✓ Virtualization is <strong>enabled by default</strong> - only visible items are rendered.
					</p>
				</div>
				<Prompt
					theme="cursorDark"
					placeholder="Type @ to search through 5000 files..."
					mentionConfigs={[{ trigger: '@', options: manyOptions, menuPosition: 'below' }]}
					extensionIcons={true}
				/>
			</div>
		</div>
	),
	globals: {
		backgrounds: { value: 'dark' }
	},
	parameters: {
		docs: {
			description: {
				story: 'Dark theme version of the 5000 entries performance test with virtualization enabled.',
			},
		},
	},
};

export const VirtualizationDisabled: Story = {
	name: 'Virtualization Disabled (100 items)',
	render: () => {
		const smallerOptions = generateManyOptions(100);
		return (
			<div className="flex flex-col gap-4">
				<div className="text-sm text-gray-600 bg-orange-50 border border-orange-200 rounded-lg p-4">
					<p className="font-medium mb-2">⚠️ Virtualization Disabled</p>
					<p>This story shows 100 entries with virtualization explicitly disabled.</p>
					<p className="mt-2 text-xs text-orange-600">
						All 100 items are rendered to the DOM at once. For small lists, this may be acceptable.
					</p>
				</div>
				<Prompt
					placeholder="Type @ to browse files (no virtualization)..."
					mentionConfigs={[{ trigger: '@', options: smallerOptions, menuPosition: 'below' }]}
					extensionIcons={true}
					virtualizeMenu={false}
				/>
			</div>
		);
	},
	parameters: {
		docs: {
			description: {
				story: `You can disable virtualization by setting \`virtualizeMenu={false}\`.

\`\`\`tsx
<Prompt
  virtualizeMenu={false}
  mentionConfigs={[{ trigger: '@', options: options }]}
/>
\`\`\`

**Note:** Virtualization is automatically skipped for lists with 50 or fewer items, even when enabled.
Disabling virtualization for very large lists (1000+) may cause performance issues.`,
			},
		},
	},
};
