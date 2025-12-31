import { useMemo, forwardRef, useImperativeHandle } from "react";
import { useContentEditable } from "../../hooks/useContentEditable";
import type { MentionOption } from "../../hooks/useMentions";
import type { SelectedMention } from "../../hooks/useContentEditable";
import MentionMenu from "./MentionMenu";
import type { PromptTheme, PresetThemeName } from "../../types/theme";
import { themeToStyles, presetThemes } from "../../types/theme";
import { getExtensionIcon } from "../../utils/extensionIcons";

export type MentionMenuPosition = "above" | "below";

export interface MentionConfig {
	trigger: string;
	options: MentionOption[];
	menuPosition?: MentionMenuPosition;
	showTrigger?: boolean;
}

const DEFAULT_CONFIG: MentionConfig[] = [{ trigger: "@", options: [] }];

export interface PromptProps {
	initialValue?: string;
	onChange?: (value: string, mentions: SelectedMention[]) => void;
	onEnter?: (value: string, mentions: SelectedMention[]) => void;
	onMentionAdded?: (mention: SelectedMention) => void;
	onMentionDeleted?: (mention: SelectedMention) => void;
	onMentionClick?: (mention: SelectedMention) => void;
	placeholder?: string;
	mentionConfigs?: MentionConfig[];
	theme?: PresetThemeName | PromptTheme;
	className?: string;
	style?: React.CSSProperties;
	/**
	 * When true, automatically adds file extension icons to mention options.
	 * Icons are determined by the file extension in the option label.
	 * Only applies to options that don't already have an icon.
	 */
	extensionIcons?: boolean;
}

/**
 * Imperative handle exposed by the Prompt component via ref.
 * Use this to programmatically interact with the prompt from parent components.
 */
export interface PromptHandle {
	/**
	 * Appends a mention to the end of the input.
	 * @param option - The mention option to append
	 * @param trigger - Optional trigger character (defaults to first configured trigger or "@")
	 */
	appendMention: (option: MentionOption, trigger?: string) => void;
	/**
	 * Focuses the prompt input.
	 */
	focus: () => void;
}

function resolveTheme(theme: PromptProps['theme']): {
	styles: React.CSSProperties;
	className: string;
} {
	// Handle undefined/null
	if (!theme) {
		return { styles: {}, className: '' };
	}

	// Handle preset theme names
	if (typeof theme === 'string' && theme in presetThemes) {
		return {
			styles: themeToStyles(presetThemes[theme as PresetThemeName]),
			className: '',
		};
	}

	// Handle custom theme object
	if (typeof theme === 'object') {
		return {
			styles: themeToStyles(theme),
			className: '',
		};
	}

	return { styles: {}, className: '' };
}

/**
 * Recursively add extension icons to options that don't have one
 */
function addExtensionIconsToOptions(options: MentionOption[]): MentionOption[] {
	return options.map((option) => {
		// Skip dividers and titles
		if (option.type === 'divider' || option.type === 'title') {
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
	configs: MentionConfig[],
	extensionIcons: boolean
): MentionConfig[] {
	if (!extensionIcons) {
		return configs;
	}

	return configs.map((config) => ({
		...config,
		options: addExtensionIconsToOptions(config.options),
	}));
}

const Prompt = forwardRef<PromptHandle, PromptProps>((props, forwardedRef) => {
	const {
		initialValue = "",
		onChange,
		onEnter,
		onMentionAdded,
		onMentionDeleted,
		onMentionClick,
		placeholder = "",
		mentionConfigs = DEFAULT_CONFIG,
		theme,
		className = "",
		style,
		extensionIcons = false,
	} = props;

	// Process configs to add extension icons if enabled
	const processedConfigs = useMemo(
		() => processConfigsWithExtensionIcons(mentionConfigs, extensionIcons),
		[mentionConfigs, extensionIcons]
	);

	const { ref, isEmpty, handlers, mentions, appendMention } = useContentEditable({
		initialValue,
		mentionConfigs: processedConfigs,
		onChange,
		onEnter,
		onMentionAdded,
		onMentionDeleted,
		onMentionClick,
	});

	// Expose imperative handle for external control
	useImperativeHandle(forwardedRef, () => ({
		appendMention: (option: MentionOption, trigger?: string) => {
			appendMention(option, trigger);
		},
		focus: () => {
			ref.current?.focus();
		},
	}), [appendMention, ref]);

	// Get the menu position for the currently active trigger
	const activeConfig = processedConfigs.find(c => c.trigger === mentions.activeTrigger);
	const activeMenuPosition = activeConfig?.menuPosition ?? "below";

	// Resolve theme to styles and class names
	const { styles: themeStyles, className: themeClassName } = resolveTheme(theme);

	// Combine styles (user styles override theme styles)
	const combinedStyles: React.CSSProperties = {
		...themeStyles,
		...style,
	};

	// Combine class names
	const combinedClassName = [
		'prompt-container',
		themeClassName,
		className,
	].filter(Boolean).join(' ');

	return (
		<div className={combinedClassName} style={combinedStyles}>
			<div
				ref={ref}
				contentEditable
				{...handlers}
				className="prompt-input"
			/>
			{isEmpty && (
				<div className="prompt-placeholder">
					{placeholder}
				</div>
			)}
			<MentionMenu
				isOpen={mentions.menuState.isOpen}
				caretRect={mentions.menuState.caretRect}
				preferredPosition={activeMenuPosition}
				options={mentions.filteredOptions}
				selectedIndex={mentions.selectedIndex}
				onSelect={mentions.selectOption}
				onEnterSubmenu={mentions.enterSubmenu}
				onExitSubmenu={mentions.exitSubmenu}
				isInSubmenu={mentions.isInSubmenu}
				onHoverIndex={mentions.setSelectedIndex}
				onClose={mentions.closeMenu}
				isKeyboardNavigating={mentions.isKeyboardNavigating}
				onMouseActivity={mentions.clearKeyboardNavigation}
				themeStyles={themeStyles}
			/>
		</div>
	);
});

Prompt.displayName = 'Prompt';

export default Prompt; 