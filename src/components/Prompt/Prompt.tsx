import { useContentEditable } from "../../hooks/useContentEditable";
import type { MentionOption } from "../../hooks/useMentions";
import type { SelectedMention } from "../../hooks/useContentEditable";
import MentionMenu from "./MentionMenu";

export type MentionMenuPosition = "above" | "below";

export interface PromptProps {
	initialValue?: string;
	onChange?: (value: string, mentions: SelectedMention[]) => void;
	onEnter?: (value: string, mentions: SelectedMention[]) => void;
	onMentionAdded?: (mention: SelectedMention) => void;
	onMentionDeleted?: (mention: SelectedMention) => void;
	placeholder?: string;
	mentionTrigger?: string;
	mentionOptions?: MentionOption[];
	mentionMenuPosition?: MentionMenuPosition;
}

const Prompt = (props: PromptProps) => {
	const {
		initialValue = "",
		onChange,
		onEnter,
		onMentionAdded,
		onMentionDeleted,
		placeholder = "",
		mentionTrigger = "@",
		mentionOptions,
		mentionMenuPosition = "below",
	} = props;

	const { ref, isEmpty, handlers, mentions } = useContentEditable({
		initialValue,
		mentionTrigger,
		mentionOptions,
		onChange,
		onEnter,
		onMentionAdded,
		onMentionDeleted,
	});

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
				preferredPosition={mentionMenuPosition}
				options={mentions.filteredOptions}
				selectedIndex={mentions.selectedIndex}
				onSelect={mentions.selectOption}
				onEnterSubmenu={mentions.enterSubmenu}
				onExitSubmenu={mentions.exitSubmenu}
				isInSubmenu={mentions.isInSubmenu}
				onHoverIndex={mentions.setSelectedIndex}
			/>
		</div>
	);
};

export default Prompt;
