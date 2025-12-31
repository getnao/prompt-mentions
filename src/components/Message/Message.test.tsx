import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import Message from "./Message";
import type { MentionOption } from "../../hooks/useMentions";

afterEach(() => {
	cleanup();
});

// Example icons for testing
const UserIcon = () => (
	<svg viewBox="0 0 20 20" fill="currentColor" data-testid="user-icon">
		<path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
	</svg>
);

const defaultOptions: MentionOption[] = [
	{ id: "john-doe", label: "John Doe" },
	{ id: "jane-smith", label: "Jane Smith" },
];

const optionsWithIcons: MentionOption[] = [
	{ id: "alice", label: "Alice Johnson", icon: <UserIcon /> },
	{ id: "bob", label: "Bob Smith", icon: <UserIcon /> },
];

describe("Message", () => {
	describe("Basic Rendering", () => {
		it("renders plain text without mentions", () => {
			render(<Message value="Hello world" />);
			expect(screen.getByText("Hello world")).toBeInTheDocument();
		});

		it("renders with custom className", () => {
			const { container } = render(
				<Message value="Test" className="custom-class" />
			);
			expect(
				container.querySelector(".message-container.custom-class")
			).toBeInTheDocument();
		});

		it("renders with custom style", () => {
			const { container } = render(
				<Message value="Test" style={{ maxWidth: "500px" }} />
			);
			const messageContainer = container.querySelector(".message-container");
			expect(messageContainer).toHaveStyle({ maxWidth: "500px" });
		});

		it("renders empty string", () => {
			const { container } = render(<Message value="" />);
			expect(container.querySelector(".message-content")).toBeInTheDocument();
		});
	});

	describe("Mention Parsing", () => {
		it("renders a single mention as a pill", () => {
			const { container } = render(
				<Message
					value="Hello @[john-doe]!"
					mentionConfigs={[{ trigger: "@", options: defaultOptions }]}
				/>
			);
			const pill = container.querySelector('[data-mention="John Doe"]');
			expect(pill).toBeInTheDocument();
			expect(pill?.textContent).toBe("John Doe");
		});

		it("renders multiple mentions", () => {
			const { container } = render(
				<Message
					value="@[john-doe] and @[jane-smith] are here"
					mentionConfigs={[{ trigger: "@", options: defaultOptions }]}
				/>
			);
			expect(
				container.querySelector('[data-mention="John Doe"]')
			).toBeInTheDocument();
			expect(
				container.querySelector('[data-mention="Jane Smith"]')
			).toBeInTheDocument();
		});

		it("preserves text between mentions", () => {
			const { container } = render(
				<Message
					value="Hi @[john-doe], meet @[jane-smith]!"
					mentionConfigs={[{ trigger: "@", options: defaultOptions }]}
				/>
			);
			expect(container.textContent).toContain("Hi");
			expect(container.textContent).toContain(", meet");
			expect(container.textContent).toContain("!");
		});

		it("renders mention by id when option is found", () => {
			const { container } = render(
				<Message
					value="Hello @[john-doe]"
					mentionConfigs={[{ trigger: "@", options: defaultOptions }]}
				/>
			);
			const pill = container.querySelector('[data-mention-id="john-doe"]');
			expect(pill).toBeInTheDocument();
			expect(pill?.getAttribute("data-mention")).toBe("John Doe");
		});

		it("uses id as label when option not found", () => {
			const { container } = render(
				<Message
					value="Hello @[unknown-user]"
					mentionConfigs={[{ trigger: "@" }]}
				/>
			);
			const pill = container.querySelector('[data-mention="unknown-user"]');
			expect(pill).toBeInTheDocument();
			expect(pill?.textContent).toBe("unknown-user");
		});
	});

	describe("Multiple Triggers", () => {
		it("handles multiple trigger characters", () => {
			const { container } = render(
				<Message
					value="@[john-doe] tagged #[bug]"
					mentionConfigs={[
						{ trigger: "@", options: defaultOptions },
						{
							trigger: "#",
							options: [{ id: "bug", label: "Bug Report" }],
						},
					]}
				/>
			);
			expect(
				container.querySelector('[data-mention="John Doe"]')
			).toBeInTheDocument();
			expect(
				container.querySelector('[data-mention="Bug Report"]')
			).toBeInTheDocument();
		});

		it("stores correct trigger in data attribute", () => {
			const { container } = render(
				<Message
					value="@[john-doe] and #[feature]"
					mentionConfigs={[
						{ trigger: "@", options: defaultOptions },
						{
							trigger: "#",
							options: [{ id: "feature", label: "Feature" }],
						},
					]}
				/>
			);
			expect(
				container.querySelector('[data-mention-trigger="@"]')
			).toBeInTheDocument();
			expect(
				container.querySelector('[data-mention-trigger="#"]')
			).toBeInTheDocument();
		});
	});

	describe("showTrigger Option", () => {
		it("hides trigger by default", () => {
			const { container } = render(
				<Message
					value="Hello @[john-doe]"
					mentionConfigs={[{ trigger: "@", options: defaultOptions }]}
				/>
			);
			const pill = container.querySelector('[data-mention="John Doe"]');
			expect(pill?.textContent).toBe("John Doe");
		});

		it("shows trigger when showTrigger is true", () => {
			const { container } = render(
				<Message
					value="Hello @[john-doe]"
					mentionConfigs={[
						{ trigger: "@", options: defaultOptions, showTrigger: true },
					]}
				/>
			);
			const pill = container.querySelector('[data-mention="John Doe"]');
			expect(pill?.textContent).toBe("@John Doe");
		});

		it("handles mixed showTrigger settings", () => {
			const { container } = render(
				<Message
					value="@[john-doe] and #[bug]"
					mentionConfigs={[
						{ trigger: "@", options: defaultOptions, showTrigger: true },
						{
							trigger: "#",
							options: [{ id: "bug", label: "Bug" }],
							showTrigger: false,
						},
					]}
				/>
			);
			expect(
				container.querySelector('[data-mention="John Doe"]')?.textContent
			).toBe("@John Doe");
			expect(
				container.querySelector('[data-mention="Bug"]')?.textContent
			).toBe("Bug");
		});
	});

	describe("Icons", () => {
		it("renders mention with icon", () => {
			const { container } = render(
				<Message
					value="Hello @[alice]"
					mentionConfigs={[{ trigger: "@", options: optionsWithIcons }]}
				/>
			);
			const iconContainer = container.querySelector(".mention-pill-icon");
			expect(iconContainer).toBeInTheDocument();
			expect(iconContainer?.innerHTML).toContain("svg");
		});

		it("renders mention without icon when option has no icon", () => {
			const { container } = render(
				<Message
					value="Hello @[john-doe]"
					mentionConfigs={[{ trigger: "@", options: defaultOptions }]}
				/>
			);
			const pill = container.querySelector('[data-mention="John Doe"]');
			expect(pill?.querySelector(".mention-pill-icon")).not.toBeInTheDocument();
		});
	});

	describe("onMentionClick", () => {
		it("calls onMentionClick when mention is clicked", () => {
			const handleClick = vi.fn();
			const { container } = render(
				<Message
					value="Hello @[john-doe]"
					mentionConfigs={[{ trigger: "@", options: defaultOptions }]}
					onMentionClick={handleClick}
				/>
			);
			const pill = container.querySelector('[data-mention="John Doe"]')!;
			fireEvent.click(pill);

			expect(handleClick).toHaveBeenCalledWith({
				id: "john-doe",
				label: "John Doe",
				trigger: "@",
			});
		});

		it("calls onMentionClick with correct trigger", () => {
			const handleClick = vi.fn();
			const { container } = render(
				<Message
					value="Check #[bug]"
					mentionConfigs={[
						{
							trigger: "#",
							options: [{ id: "bug", label: "Bug Report" }],
						},
					]}
					onMentionClick={handleClick}
				/>
			);
			const pill = container.querySelector('[data-mention="Bug Report"]')!;
			fireEvent.click(pill);

			expect(handleClick).toHaveBeenCalledWith({
				id: "bug",
				label: "Bug Report",
				trigger: "#",
			});
		});

		it("does not call onMentionClick when clicking text", () => {
			const handleClick = vi.fn();
			const { container } = render(
				<Message
					value="Hello world"
					onMentionClick={handleClick}
				/>
			);
			const content = container.querySelector(".message-content")!;
			fireEvent.click(content);

			expect(handleClick).not.toHaveBeenCalled();
		});

		it("sets cursor pointer when onMentionClick is provided", () => {
			const { container } = render(
				<Message
					value="Hello @[john-doe]"
					mentionConfigs={[{ trigger: "@", options: defaultOptions }]}
					onMentionClick={() => { }}
				/>
			);
			const pill = container.querySelector('[data-mention="John Doe"]');
			expect(pill).toHaveStyle({ cursor: "pointer" });
		});
	});

	describe("Theme Support", () => {
		it("applies preset theme", () => {
			const { container } = render(
				<Message value="Test" theme="cursorDark" />
			);
			const messageContainer = container.querySelector(".message-container");
			expect(messageContainer).toHaveStyle({
				"--prompt-background-color": "#22242C",
			});
		});

		it("applies custom theme object", () => {
			const { container } = render(
				<Message
					value="Test"
					theme={{
						backgroundColor: "#ff0000",
						color: "#ffffff",
					}}
				/>
			);
			const messageContainer = container.querySelector(".message-container");
			expect(messageContainer).toHaveStyle({
				"--prompt-background-color": "#ff0000",
				"--prompt-color": "#ffffff",
			});
		});
	});

	describe("Edge Cases", () => {
		it("handles consecutive mentions", () => {
			const { container } = render(
				<Message
					value="@[john-doe]@[jane-smith]"
					mentionConfigs={[{ trigger: "@", options: defaultOptions }]}
				/>
			);
			expect(
				container.querySelectorAll(".mention-pill").length
			).toBe(2);
		});

		it("handles mention at start of string", () => {
			const { container } = render(
				<Message
					value="@[john-doe] is here"
					mentionConfigs={[{ trigger: "@", options: defaultOptions }]}
				/>
			);
			const pill = container.querySelector('[data-mention="John Doe"]');
			expect(pill).toBeInTheDocument();
		});

		it("handles mention at end of string", () => {
			const { container } = render(
				<Message
					value="Hello @[john-doe]"
					mentionConfigs={[{ trigger: "@", options: defaultOptions }]}
				/>
			);
			const pill = container.querySelector('[data-mention="John Doe"]');
			expect(pill).toBeInTheDocument();
		});

		it("handles special characters in text", () => {
			render(<Message value="Hello! @#$%^&*() world" />);
			expect(screen.getByText(/Hello! @#\$%\^&\*\(\) world/)).toBeInTheDocument();
		});

		it("handles newlines in text", () => {
			const { container } = render(
				<Message value="Line 1\nLine 2" />
			);
			expect(container.textContent).toContain("Line 1");
			expect(container.textContent).toContain("Line 2");
		});

		it("handles mentions with special characters in id", () => {
			const { container } = render(
				<Message
					value="Check @[file/path/test.tsx]"
					mentionConfigs={[
						{
							trigger: "@",
							options: [
								{ id: "file/path/test.tsx", label: "test.tsx" },
							],
						},
					]}
				/>
			);
			const pill = container.querySelector('[data-mention="test.tsx"]');
			expect(pill).toBeInTheDocument();
		});
	});

	describe("Nested Options", () => {
		it("finds options in nested structure", () => {
			const nestedOptions: MentionOption[] = [
				{
					id: "team",
					label: "Team",
					children: [
						{ id: "alice", label: "Alice Johnson" },
						{ id: "bob", label: "Bob Smith" },
					],
				},
			];

			const { container } = render(
				<Message
					value="Hello @[alice]"
					mentionConfigs={[{ trigger: "@", options: nestedOptions }]}
				/>
			);
			const pill = container.querySelector('[data-mention="Alice Johnson"]');
			expect(pill).toBeInTheDocument();
		});

		it("finds deeply nested options", () => {
			const deeplyNestedOptions: MentionOption[] = [
				{
					id: "level1",
					label: "Level 1",
					children: [
						{
							id: "level2",
							label: "Level 2",
							children: [
								{ id: "deep-item", label: "Deep Item" },
							],
						},
					],
				},
			];

			const { container } = render(
				<Message
					value="Found @[deep-item]"
					mentionConfigs={[{ trigger: "@", options: deeplyNestedOptions }]}
				/>
			);
			const pill = container.querySelector('[data-mention="Deep Item"]');
			expect(pill).toBeInTheDocument();
		});
	});

	describe("CSS Classes", () => {
		it("applies prompt-container class for theme inheritance", () => {
			const { container } = render(<Message value="Test" />);
			expect(
				container.querySelector(".prompt-container")
			).toBeInTheDocument();
		});

		it("applies message-container class", () => {
			const { container } = render(<Message value="Test" />);
			expect(
				container.querySelector(".message-container")
			).toBeInTheDocument();
		});

		it("applies mention-pill class to mentions", () => {
			const { container } = render(
				<Message
					value="@[test]"
					mentionConfigs={[{ trigger: "@" }]}
				/>
			);
			expect(container.querySelector(".mention-pill")).toBeInTheDocument();
		});
	});

	describe("Extension Icons", () => {
		it("adds extension icon for .ts file when extensionIcons is true", () => {
			const { container } = render(
				<Message
					value="Check @[index.ts]"
					mentionConfigs={[{ trigger: "@" }]}
					extensionIcons={true}
				/>
			);
			const pill = container.querySelector('[data-mention="index.ts"]');
			expect(pill).toBeInTheDocument();
			const iconContainer = pill?.querySelector(".mention-pill-icon");
			expect(iconContainer).toBeInTheDocument();
			expect(iconContainer?.innerHTML).toContain("svg");
		});

		it("adds extension icon for .tsx file when extensionIcons is true", () => {
			const { container } = render(
				<Message
					value="Check @[App.tsx]"
					mentionConfigs={[{ trigger: "@" }]}
					extensionIcons={true}
				/>
			);
			const iconContainer = container.querySelector(".mention-pill-icon");
			expect(iconContainer).toBeInTheDocument();
		});

		it("adds extension icon for .css file when extensionIcons is true", () => {
			const { container } = render(
				<Message
					value="Check @[styles.css]"
					mentionConfigs={[{ trigger: "@" }]}
					extensionIcons={true}
				/>
			);
			const iconContainer = container.querySelector(".mention-pill-icon");
			expect(iconContainer).toBeInTheDocument();
		});

		it("does not add extension icon when extensionIcons is false", () => {
			const { container } = render(
				<Message
					value="Check @[index.ts]"
					mentionConfigs={[{ trigger: "@" }]}
					extensionIcons={false}
				/>
			);
			const iconContainer = container.querySelector(".mention-pill-icon");
			expect(iconContainer).not.toBeInTheDocument();
		});

		it("does not add extension icon by default", () => {
			const { container } = render(
				<Message
					value="Check @[index.ts]"
					mentionConfigs={[{ trigger: "@" }]}
				/>
			);
			const iconContainer = container.querySelector(".mention-pill-icon");
			expect(iconContainer).not.toBeInTheDocument();
		});

		it("preserves existing icon from options over extension icon", () => {
			const CustomIcon = () => <svg data-testid="custom-icon" />;
			const { container } = render(
				<Message
					value="Check @[index.ts]"
					mentionConfigs={[
						{
							trigger: "@",
							options: [{ id: "index.ts", label: "index.ts", icon: <CustomIcon /> }],
						},
					]}
					extensionIcons={true}
				/>
			);
			const iconContainer = container.querySelector(".mention-pill-icon");
			expect(iconContainer).toBeInTheDocument();
			// The icon HTML should contain our custom icon
			expect(iconContainer?.innerHTML).toContain("custom-icon");
		});

		it("adds extension icon when option has no icon but extensionIcons is true", () => {
			const { container } = render(
				<Message
					value="Check @[index.ts]"
					mentionConfigs={[
						{
							trigger: "@",
							options: [{ id: "index.ts", label: "index.ts" }],
						},
					]}
					extensionIcons={true}
				/>
			);
			const iconContainer = container.querySelector(".mention-pill-icon");
			expect(iconContainer).toBeInTheDocument();
		});

		it("adds extension icon for unknown mention when extensionIcons is true", () => {
			const { container } = render(
				<Message
					value="Check @[unknown-file.json]"
					mentionConfigs={[{ trigger: "@" }]}
					extensionIcons={true}
				/>
			);
			const iconContainer = container.querySelector(".mention-pill-icon");
			expect(iconContainer).toBeInTheDocument();
		});

		it("works with multiple triggers and extensionIcons", () => {
			const { container } = render(
				<Message
					value="@[App.tsx] and #[bug]"
					mentionConfigs={[
						{ trigger: "@" },
						{ trigger: "#" },
					]}
					extensionIcons={true}
				/>
			);
			// App.tsx should have an icon
			const appPill = container.querySelector('[data-mention="App.tsx"]');
			expect(appPill?.querySelector(".mention-pill-icon")).toBeInTheDocument();
			// bug doesn't have a file extension, so no icon
			const bugPill = container.querySelector('[data-mention="bug"]');
			expect(bugPill?.querySelector(".mention-pill-icon")).not.toBeInTheDocument();
		});
	});
});

