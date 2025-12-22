import { useContentEditable } from "../../hooks/useContentEditable";
import type { MentionOption } from "../../hooks/useMentions";
import type { SelectedMention } from "../../hooks/useContentEditable";
import MentionMenu from "./MentionMenu";

export type MentionMenuPosition = "above" | "below";

/** Configuration for a single mention trigger */
export interface MentionConfig {
	/** The character that triggers the mention menu (e.g., "@", "#", "/") */
	trigger: string;
	/** The options to display in the menu for this trigger */
	options: MentionOption[];
	/** Position preference for this trigger's menu */
	menuPosition?: MentionMenuPosition;
	/** Whether to show the trigger character in the mention pill. Defaults to false. */
	showTrigger?: boolean;
}

/** Default config when none provided - @ trigger with no options */
const DEFAULT_CONFIG: MentionConfig[] = [{ trigger: "@", options: [] }];

export interface PromptProps {
	initialValue?: string;
	onChange?: (value: string, mentions: SelectedMention[]) => void;
	onEnter?: (value: string, mentions: SelectedMention[]) => void;
	onMentionAdded?: (mention: SelectedMention) => void;
	onMentionDeleted?: (mention: SelectedMention) => void;
	placeholder?: string;
	/** Configure mention triggers with their options and settings. Defaults to @ trigger with no options. */
	mentionConfigs?: MentionConfig[];
}

const Prompt = (props: PromptProps) => {
	const {
		initialValue = "",
		onChange,
		onEnter,
		onMentionAdded,
		onMentionDeleted,
		placeholder = "",
		mentionConfigs = DEFAULT_CONFIG,
	} = props;

	const { ref, isEmpty, handlers, mentions } = useContentEditable({
		initialValue,
		mentionConfigs,
		onChange,
		onEnter,
		onMentionAdded,
		onMentionDeleted,
	});

	// Get the menu position for the currently active trigger
	const activeConfig = mentionConfigs.find(c => c.trigger === mentions.activeTrigger);
	const activeMenuPosition = activeConfig?.menuPosition ?? "below";

	return (
		<div className="relative">
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
			/>
		</div>
	);
};

export default Prompt; 