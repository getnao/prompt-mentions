import type { MentionOption, UseMentionsReturn } from "../useMentions";

export interface SelectedMention {
	id: string;
	label: string;
	/** The trigger character used for this mention (e.g., "@", "#") */
	trigger: string;
}

export interface MentionRefs {
	mentionStart: React.MutableRefObject<number | null>;
	mentionEnd: React.MutableRefObject<number | null>;
	activeTrigger: React.MutableRefObject<string | null>;
}

/** Configuration for a single mention trigger */
export interface MentionConfig {
	trigger: string;
	options: MentionOption[];
	/** Whether to show the trigger character in the mention pill. Defaults to true. */
	showTrigger?: boolean;
}

/** Default config when none provided */
export const DEFAULT_MENTION_CONFIG: MentionConfig[] = [{ trigger: "@", options: [] }];

export interface UseContentEditableOptions {
	initialValue?: string | undefined;
	/** Configure mention triggers with their options. Defaults to @ trigger with no options. */
	mentionConfigs?: MentionConfig[];
	onChange?: ((value: string, mentions: SelectedMention[]) => void) | undefined;
	onEnter?: ((value: string, mentions: SelectedMention[]) => void) | undefined;
	onMentionAdded?: ((mention: SelectedMention) => void) | undefined;
	onMentionDeleted?: ((mention: SelectedMention) => void) | undefined;
	/** Called when a mention pill is clicked */
	onMentionClick?: ((mention: SelectedMention) => void) | undefined;
}

export interface UseContentEditableReturn {
	ref: React.RefObject<HTMLDivElement | null>;
	isEmpty: boolean;
	handlers: {
		onInput: () => void;
		onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
		onKeyUp: (e: React.KeyboardEvent<HTMLDivElement>) => void;
		onSelect: () => void;
		onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
		onCopy: (e: React.ClipboardEvent<HTMLDivElement>) => void;
		onCut: (e: React.ClipboardEvent<HTMLDivElement>) => void;
		onPaste: (e: React.ClipboardEvent<HTMLDivElement>) => void;
	};
	mentions: {
		menuState: UseMentionsReturn["menuState"];
		filteredOptions: MentionOption[];
		selectedIndex: number;
		selectOption: (option: MentionOption) => void;
		enterSubmenu: (option: MentionOption) => void;
		exitSubmenu: () => void;
		isInSubmenu: boolean;
		setSelectedIndex: (index: number) => void;
		activeTrigger: string;
		closeMenu: () => void;
		/** True when keyboard navigation is active (arrow keys were used) */
		isKeyboardNavigating: boolean;
		/** Call this when mouse activity is detected to exit keyboard navigation mode */
		clearKeyboardNavigation: () => void;
	};
	/**
	 * Appends a mention to the end of the input content.
	 * @param option - The mention option to append
	 * @param trigger - Optional trigger character (defaults to first configured trigger)
	 */
	appendMention: (option: MentionOption, trigger?: string) => void;
}

export interface CaretCoordinates {
	top: number;
	left: number;
	bottom: number;
	height: number;
}

