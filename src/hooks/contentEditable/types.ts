import type { MentionOption } from "../useMentions";
import type { useMentions } from "../useMentions";

// ============================================================================
// Types
// ============================================================================

export interface SelectedMention {
	id: string;
	label: string;
	/** The trigger character used for this mention (e.g., "@", "#") */
	trigger: string;
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
		menuState: ReturnType<typeof useMentions>["menuState"];
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
}

export interface CaretCoordinates {
	top: number;
	left: number;
	bottom: number;
	height: number;
}

