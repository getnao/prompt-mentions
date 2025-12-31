import type { Meta, StoryObj } from "@storybook/react-vite";
import { Message } from "../components/Message";
import type { MentionOption } from "../hooks/useMentions";
import { presetThemes, type PromptTheme } from "../types/theme";

// Example icons
const UserIcon = () => (
	<svg viewBox="0 0 20 20" fill="currentColor">
		<path
			fillRule="evenodd"
			d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
			clipRule="evenodd"
		/>
	</svg>
);

const FolderIcon = () => (
	<svg viewBox="0 0 20 20" fill="currentColor">
		<path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
	</svg>
);

const CodeIcon = () => (
	<svg viewBox="0 0 20 20" fill="currentColor">
		<path
			fillRule="evenodd"
			d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z"
			clipRule="evenodd"
		/>
	</svg>
);

const HashtagIcon = () => (
	<svg viewBox="0 0 20 20" fill="currentColor">
		<path
			fillRule="evenodd"
			d="M9.243 3.03a1 1 0 01.727 1.213L9.53 6h2.94l.56-2.243a1 1 0 111.94.486L14.53 6H17a1 1 0 110 2h-2.97l-1 4H15a1 1 0 110 2h-2.47l-.56 2.243a1 1 0 11-1.94-.486L10.47 14H7.53l-.56 2.243a1 1 0 01-1.94-.486L5.47 14H3a1 1 0 110-2h2.97l1-4H5a1 1 0 110-2h2.47l.56-2.243a1 1 0 011.213-.727zM9.03 8l-1 4h2.94l1-4H9.03z"
			clipRule="evenodd"
		/>
	</svg>
);

const meta = {
	title: "Message",
	component: Message,
	tags: ["autodocs"],
	parameters: {
		docs: {
			description: {
				component:
					"A read-only component for displaying sent messages with formatted mention pills. Uses the same styling as the Prompt component for consistent appearance.",
			},
		},
		backgrounds: {
			options: {
				dark: { name: "Dark", value: "#1F2126" },
			},
		},
	},
} satisfies Meta<typeof Message>;

export default meta;
type Story = StoryObj<typeof meta>;

// Options for stories
const peopleOptions: MentionOption[] = [
	{ id: "john-doe", label: "John Doe", icon: <UserIcon /> },
	{ id: "jane-smith", label: "Jane Smith", icon: <UserIcon /> },
	{ id: "alice", label: "Alice Johnson", icon: <UserIcon /> },
];

const fileOptions: MentionOption[] = [
	{ id: "src/index.ts", label: "index.ts", icon: <CodeIcon /> },
	{ id: "src/App.tsx", label: "App.tsx", icon: <CodeIcon /> },
	{ id: "src/components", label: "components", icon: <FolderIcon /> },
];

const tagOptions: MentionOption[] = [
	{ id: "bug", label: "Bug", icon: <HashtagIcon /> },
	{ id: "feature", label: "Feature", icon: <HashtagIcon /> },
	{ id: "urgent", label: "Urgent", icon: <HashtagIcon /> },
];

export const Default: Story = {
	name: "Default",
	args: {
		value: "Hello @[john-doe], please review the changes.",
		mentionConfigs: [{ trigger: "@", options: peopleOptions }],
	},
};

export const PlainText: Story = {
	name: "Plain Text (No Mentions)",
	args: {
		value: "This is a regular message without any mentions.",
	},
};

export const MultipleMentions: Story = {
	name: "Multiple Mentions",
	args: {
		value:
			"@[john-doe] and @[jane-smith], can you check the @[src/App.tsx] file?",
		mentionConfigs: [
			{ trigger: "@", options: [...peopleOptions, ...fileOptions] },
		],
	},
};

export const WithIcons: Story = {
	name: "With Icons",
	args: {
		value: "Please review @[src/index.ts] and @[src/App.tsx] files.",
		mentionConfigs: [{ trigger: "@", options: fileOptions }],
	},
};

export const MultipleTriggers: Story = {
	name: "Multiple Triggers (@, #)",
	args: {
		value:
			"@[alice], this is a #[bug] report. Can you help with #[urgent] priority?",
		mentionConfigs: [
			{ trigger: "@", options: peopleOptions },
			{ trigger: "#", options: tagOptions },
		],
	},
};

export const ShowTrigger: Story = {
	name: "Show Trigger Character",
	args: {
		value: "@[john-doe] assigned #[bug] to @[jane-smith]",
		mentionConfigs: [
			{ trigger: "@", options: peopleOptions, showTrigger: true },
			{ trigger: "#", options: tagOptions, showTrigger: true },
		],
	},
};

export const HiddenTrigger: Story = {
	name: "Hidden Trigger (Default)",
	args: {
		value: "@[john-doe] assigned #[bug] to @[jane-smith]",
		mentionConfigs: [
			{ trigger: "@", options: peopleOptions, showTrigger: false },
			{ trigger: "#", options: tagOptions, showTrigger: false },
		],
	},
};

export const UnknownMentions: Story = {
	name: "Unknown Mentions (ID as Label)",
	args: {
		value: "Hello @[unknown-user], check @[some-file.ts]",
		mentionConfigs: [{ trigger: "@" }],
	},
	parameters: {
		docs: {
			description: {
				story:
					"When a mention ID is not found in the options, the ID itself is displayed as the label.",
			},
		},
	},
};

export const ClickableMentions: Story = {
	name: "Clickable Mentions",
	args: {
		value: "Click on @[john-doe] or @[jane-smith] to see their profile.",
		mentionConfigs: [{ trigger: "@", options: peopleOptions }],
		onMentionClick: (mention) => {
			alert(
				`Mention clicked!\n\nID: ${mention.id}\nLabel: ${mention.label}\nTrigger: ${mention.trigger}`
			);
		},
	},
	parameters: {
		docs: {
			description: {
				story:
					"Pass `onMentionClick` to handle clicks on mention pills. The callback receives the mention's id, label, and trigger.",
			},
		},
	},
};

export const LongMessage: Story = {
	name: "Long Message with Mentions",
	args: {
		value: `Hey @[john-doe], I wanted to follow up on our discussion about the @[src/App.tsx] refactoring.

I've made some changes to @[src/index.ts] and would love to get @[jane-smith]'s input as well.

This is marked as #[urgent] since we need to ship before the deadline. Let me know if you have any questions!`,
		mentionConfigs: [
			{ trigger: "@", options: [...peopleOptions, ...fileOptions] },
			{ trigger: "#", options: tagOptions },
		],
	},
};

export const WithExtensionIcons: Story = {
	name: "Extension Icons (Auto File Type Icons)",
	args: {
		value: "Check out @[src/App.tsx], @[styles.css], @[package.json], and @[README.md]!",
		mentionConfigs: [{ trigger: "@" }],
		extensionIcons: true,
	},
	parameters: {
		docs: {
			description: {
				story: `When \`extensionIcons\` is enabled, file mentions automatically receive icons based on their extension.

\`\`\`tsx
<Message
  value="Check @[App.tsx] and @[styles.css]"
  extensionIcons={true}
/>
\`\`\`

Supported extensions include: .ts, .tsx, .js, .jsx, .css, .scss, .json, .md, .html, .py, .sql, and many more.`,
			},
		},
	},
};

export const ExtensionIconsDarkTheme: Story = {
	name: "Extension Icons (Dark Theme)",
	args: {
		value: "Review @[index.ts], @[App.tsx], @[query.sql], and @[config.yaml] files.",
		mentionConfigs: [{ trigger: "@" }],
		extensionIcons: true,
		theme: "cursorDark",
	},
	render: (args) => (
		<div className="bg-[#1F2126] p-4 rounded-lg">
			<Message {...args} />
		</div>
	),
	globals: {
		backgrounds: { value: "dark" },
	},
};

export const ExtensionIconsWithOptions: Story = {
	name: "Extension Icons with Options Lookup",
	args: {
		value: "The @[main-file] has been updated along with @[styles.module.css].",
		mentionConfigs: [
			{
				trigger: "@",
				options: [
					{ id: "main-file", label: "index.ts" },
				],
			},
		],
		extensionIcons: true,
	},
	parameters: {
		docs: {
			description: {
				story:
					"Extension icons work alongside option lookup. The mention ID is resolved to its label, and the icon is determined from the label's file extension.",
			},
		},
	},
};

// Theme stories
export const LightTheme: Story = {
	name: "Light Theme",
	args: {
		value: "Hello @[john-doe], this uses the light theme.",
		mentionConfigs: [{ trigger: "@", options: peopleOptions }],
		theme: "light",
	},
};

export const CursorDarkTheme: Story = {
	name: "Cursor Dark Theme",
	args: {
		value:
			"Review the @[src/App.tsx] file and let me know what you think @[alice].",
		mentionConfigs: [
			{ trigger: "@", options: [...peopleOptions, ...fileOptions] },
		],
		theme: "cursorDark",
	},
	globals: {
		backgrounds: { value: "dark" },
	},
};

export const GithubDarkTheme: Story = {
	name: "GitHub Dark Theme",
	args: {
		value: "@[john-doe] opened #[bug] issue on the repository.",
		mentionConfigs: [
			{ trigger: "@", options: peopleOptions },
			{ trigger: "#", options: tagOptions, showTrigger: true },
		],
		theme: "githubDark",
	},
	render: (args) => (
		<div className="bg-[#0d1117] p-4 rounded-lg">
			<Message {...args} />
		</div>
	),
};

export const MinimalTheme: Story = {
	name: "Minimal Theme",
	args: {
		value: "A clean message with @[jane-smith] mentioned.",
		mentionConfigs: [{ trigger: "@", options: peopleOptions }],
		theme: "minimal",
	},
};

const customPurpleTheme: PromptTheme = {
	backgroundColor: "#1a1625",
	color: "#e0d4f7",
	pill: {
		backgroundColor:
			"linear-gradient(135deg, #7c3aed 0%, #c026d3 100%)",
		borderRadius: "8px",
		color: "white",
	},
};

export const CustomTheme: Story = {
	name: "Custom Theme",
	args: {
		value: "This message uses a custom purple theme with @[alice].",
		mentionConfigs: [{ trigger: "@", options: peopleOptions }],
		theme: customPurpleTheme,
	},
	render: (args) => (
		<div className="bg-[#1a1625] p-4 rounded-lg">
			<Message {...args} />
		</div>
	),
};

// Chat-like showcase
const ChatShowcase = () => {
	const messages = [
		{
			sender: "You",
			value: "Hey @[john-doe], can you take a look at the @[src/App.tsx] file?",
			isUser: true,
		},
		{
			sender: "John Doe",
			value: "Sure! I'll check it out. Is this related to #[bug]?",
			isUser: false,
		},
		{
			sender: "You",
			value: "Yes, @[jane-smith] reported it yesterday. It's marked as #[urgent].",
			isUser: true,
		},
	];

	return (
		<div className="flex flex-col gap-4 max-w-xl">
			{messages.map((msg, i) => (
				<div
					key={i}
					className={`flex flex-col ${msg.isUser ? "items-end" : "items-start"}`}
				>
					<span className="text-xs text-gray-500 mb-1">{msg.sender}</span>
					<div
						className={`rounded-lg p-3 ${msg.isUser ? "bg-blue-500 text-white" : "bg-gray-100"
							}`}
					>
						<Message
							value={msg.value}
							mentionConfigs={[
								{ trigger: "@", options: [...peopleOptions, ...fileOptions] },
								{ trigger: "#", options: tagOptions },
							]}
							{...(msg.isUser ? { theme: { pill: { backgroundColor: "rgba(255,255,255,0.2)", color: "white" } } } : {})}
						/>
					</div>
				</div>
			))}
		</div>
	);
};

export const ChatInterface: Story = {
	name: "Chat Interface Example",
	args: {
		value: "",
	},
	render: () => <ChatShowcase />,
	parameters: {
		docs: {
			description: {
				story:
					"Example of using the Message component in a chat-like interface, showing how sent messages display formatted mentions.",
			},
		},
	},
};

// Dark theme chat
const DarkChatShowcase = () => {
	const messages = [
		{
			value: "Can you review @[src/index.ts] and @[src/App.tsx]?",
			isUser: true,
		},
		{
			value: "Sure! I see there's a #[bug] in the @[src/components] folder.",
			isUser: false,
		},
		{
			value: "@[alice] can help with that, she's familiar with the codebase.",
			isUser: true,
		},
	];

	return (
		<div className="bg-[#1F2126] p-6 rounded-lg">
			<div className="flex flex-col gap-3 max-w-xl">
				{messages.map((msg, i) => (
					<div
						key={i}
						className={`flex ${msg.isUser ? "justify-end" : "justify-start"}`}
					>
						<div
							className={`rounded-lg p-3 max-w-[80%] ${msg.isUser
									? "bg-[#0066FF]"
									: "bg-[#2D2D30]"
								}`}
						>
							<Message
								value={msg.value}
								mentionConfigs={[
									{
										trigger: "@",
										options: [...peopleOptions, ...fileOptions],
									},
									{ trigger: "#", options: tagOptions },
								]}
								theme={{
									color: "#FFFFFF",
									pill: {
										backgroundColor: msg.isUser
											? "rgba(255,255,255,0.2)"
											: "rgba(99, 102, 241, 0.3)",
										color: "white",
									},
								}}
							/>
						</div>
					</div>
				))}
			</div>
		</div>
	);
};

export const DarkChatInterface: Story = {
	name: "Dark Chat Interface",
	args: {
		value: "",
	},
	render: () => <DarkChatShowcase />,
	globals: {
		backgrounds: { value: "dark" },
	},
	parameters: {
		docs: {
			description: {
				story:
					"Dark-themed chat interface using the Message component with custom pill styling.",
			},
		},
	},
};

// Comparison with Prompt
const ComparisonShowcase = () => {
	const value = "Hello @[john-doe], please check @[src/App.tsx] for the #[bug].";
	const config = [
		{ trigger: "@", options: [...peopleOptions, ...fileOptions] },
		{ trigger: "#", options: tagOptions },
	];

	return (
		<div className="flex flex-col gap-6">
			<div>
				<h3 className="text-sm font-medium text-gray-600 mb-2">
					Message Component (Read-only Display)
				</h3>
				<div className="border rounded-lg p-4">
					<Message value={value} mentionConfigs={config} />
				</div>
			</div>
			<div className="text-sm text-gray-500">
				<p>The Message component displays the same mention pills as the Prompt component,</p>
				<p>but in a read-only format suitable for showing sent messages.</p>
			</div>
			<div className="bg-gray-50 rounded-lg p-4">
				<h4 className="text-xs font-semibold text-gray-700 mb-2">Raw Value:</h4>
				<code className="text-xs text-gray-600 break-all">{value}</code>
			</div>
		</div>
	);
};

export const ComparisonWithPrompt: Story = {
	name: "Value Format Example",
	args: {
		value: "",
	},
	render: () => <ComparisonShowcase />,
	parameters: {
		docs: {
			description: {
				story: `The Message component accepts values in the same format that the Prompt component outputs:

\`\`\`
"Hello @[john-doe], please check @[src/App.tsx] for the #[bug]."
\`\`\`

This makes it easy to display sent messages that were composed using the Prompt component.`,
			},
		},
	},
};

