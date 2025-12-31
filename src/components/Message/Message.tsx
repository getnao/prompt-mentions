import { useMemo } from "react";
import type { MentionOption } from "../../hooks/useMentions";
import type { PromptTheme, PresetThemeName } from "../../types/theme";
import { themeToStyles, presetThemes } from "../../types/theme";
import { escapeRegex, flattenOptions, iconToHTML } from "../../hooks/contentEditable/mentionDOM";
import { getExtensionIcon } from "../../utils/extensionIcons";

export interface MessageMentionConfig {
	trigger: string;
	options?: MentionOption[];
	/** Whether to show the trigger character in the mention pill. Defaults to false. */
	showTrigger?: boolean;
}

const DEFAULT_CONFIG: MessageMentionConfig[] = [{ trigger: "@" }];

export interface MessageProps {
	/** The message value containing mentions in the format trigger[id] (e.g., @[john-doe]) */
	value: string;
	/** Configure mention triggers with their options for label/icon lookup */
	mentionConfigs?: MessageMentionConfig[];
	/** Theme configuration - preset name or custom theme object */
	theme?: PresetThemeName | PromptTheme;
	/** Additional CSS class name */
	className?: string;
	/** Inline styles */
	style?: React.CSSProperties;
	/** Called when a mention pill is clicked */
	onMentionClick?: (mention: { id: string; label: string; trigger: string }) => void;
	/**
	 * When true, automatically adds file extension icons to mentions.
	 * Icons are determined by the file extension in the mention label.
	 * Only applies to mentions that don't already have an icon from options.
	 */
	extensionIcons?: boolean;
}

interface ParsedSegment {
	type: "text" | "mention";
	content: string;
	id?: string;
	label?: string;
	trigger?: string;
	icon?: React.ReactNode;
	showTrigger?: boolean;
}

function resolveTheme(theme: MessageProps["theme"]): {
	styles: React.CSSProperties;
	className: string;
} {
	if (!theme) {
		return { styles: {}, className: "" };
	}

	if (typeof theme === "string" && theme in presetThemes) {
		return {
			styles: themeToStyles(presetThemes[theme as PresetThemeName]),
			className: "",
		};
	}

	if (typeof theme === "object") {
		return {
			styles: themeToStyles(theme),
			className: "",
		};
	}

	return { styles: {}, className: "" };
}

/**
 * Recursively add extension icons to options that don't have one
 */
function addExtensionIconsToOptions(options: MentionOption[]): MentionOption[] {
	return options.map((option) => {
		// Skip dividers and titles
		if (option.type === "divider" || option.type === "title") {
			return option;
		}

		// If option already has an icon, keep it
		if (option.icon) {
			// Still process children if present
			if (option.children) {
				return {
					...option,
					children: addExtensionIconsToOptions(option.children),
				};
			}
			return option;
		}

		// Get icon based on the label (filename)
		const icon = getExtensionIcon(option.label);

		// Process children recursively
		const children = option.children
			? addExtensionIconsToOptions(option.children)
			: undefined;

		return {
			...option,
			...(icon && { icon }),
			...(children && { children }),
		};
	});
}

/**
 * Process mention configs to add extension icons if enabled
 */
function processConfigsWithExtensionIcons(
	configs: MessageMentionConfig[],
	extensionIcons: boolean
): MessageMentionConfig[] {
	if (!extensionIcons) {
		return configs;
	}

	return configs.map((config) => {
		if (!config.options) {
			return config;
		}
		return {
			...config,
			options: addExtensionIconsToOptions(config.options),
		};
	});
}

/**
 * Parse value string and extract mentions as segments
 */
function parseValue(
	value: string,
	configs: MessageMentionConfig[],
	extensionIcons: boolean
): ParsedSegment[] {
	const segments: ParsedSegment[] = [];
	let lastIndex = 0;

	// Build a combined regex for all triggers
	const triggers = configs.map((c) => escapeRegex(c.trigger));
	const combinedPattern = new RegExp(`(${triggers.join("|")})\\[([^\\]]+)\\]`, "g");

	// Create a lookup map for options by trigger
	const optionsByTrigger = new Map<string, MentionOption[]>();
	for (const config of configs) {
		optionsByTrigger.set(
			config.trigger,
			config.options ? flattenOptions(config.options) : []
		);
	}

	// Get showTrigger setting by trigger
	const showTriggerByTrigger = new Map<string, boolean>();
	for (const config of configs) {
		showTriggerByTrigger.set(config.trigger, config.showTrigger ?? false);
	}

	let match;
	while ((match = combinedPattern.exec(value)) !== null) {
		// Add text before the match
		if (match.index > lastIndex) {
			segments.push({
				type: "text",
				content: value.slice(lastIndex, match.index),
			});
		}

		const trigger = match[1] ?? "";
		const idOrLabel = match[2] ?? "";
		const options = optionsByTrigger.get(trigger) ?? [];
		const showTrigger = showTriggerByTrigger.get(trigger) ?? false;

		// Try to find the option by id first, then by label
		const option =
			options.find((opt) => opt.id === idOrLabel) ||
			options.find((opt) => opt.label === idOrLabel);

		const id = option?.id || idOrLabel;
		const label = option?.label || idOrLabel;

		// Get icon from option, or from extension if extensionIcons is enabled
		let icon = option?.icon;
		if (!icon && extensionIcons) {
			icon = getExtensionIcon(label);
		}

		segments.push({
			type: "mention",
			content: showTrigger ? `${trigger}${label}` : label,
			id: id,
			label: label,
			trigger: trigger,
			icon,
			showTrigger,
		});

		lastIndex = match.index + match[0].length;
	}

	// Add remaining text
	if (lastIndex < value.length) {
		segments.push({
			type: "text",
			content: value.slice(lastIndex),
		});
	}

	return segments;
}

/**
 * Message component for displaying sent prompts with formatted mentions.
 * Renders mention pills in a read-only format matching the Prompt component style.
 */
export function Message({
	value,
	mentionConfigs = DEFAULT_CONFIG,
	theme,
	className = "",
	style,
	onMentionClick,
	extensionIcons = false,
}: MessageProps) {
	// Process configs to add extension icons if enabled
	const processedConfigs = useMemo(
		() => processConfigsWithExtensionIcons(mentionConfigs, extensionIcons),
		[mentionConfigs, extensionIcons]
	);

	const segments = useMemo(
		() => parseValue(value, processedConfigs, extensionIcons),
		[value, processedConfigs, extensionIcons]
	);

	const { styles: themeStyles, className: themeClassName } = resolveTheme(theme);

	const combinedStyles: React.CSSProperties = {
		...themeStyles,
		...style,
	};

	const combinedClassName = ["message-container", "prompt-container", themeClassName, className]
		.filter(Boolean)
		.join(" ");

	return (
		<div className={combinedClassName} style={combinedStyles}>
			<div className="message-content">
				{segments.map((segment, index) => {
					if (segment.type === "text") {
						return <span key={index}>{segment.content}</span>;
					}

					return (
						<span
							key={index}
							className="mention-pill"
							data-mention={segment.label}
							data-mention-id={segment.id}
							data-mention-trigger={segment.trigger}
							onClick={() =>
								onMentionClick?.({
									id: segment.id!,
									label: segment.label!,
									trigger: segment.trigger!,
								})
							}
							style={onMentionClick ? { cursor: "pointer" } : undefined}
						>
							{segment.icon && (
								<span
									className="mention-pill-icon"
									dangerouslySetInnerHTML={{
										__html: iconToHTML(segment.icon),
									}}
								/>
							)}
							{segment.content}
						</span>
					);
				})}
			</div>
		</div>
	);
}

export default Message;

