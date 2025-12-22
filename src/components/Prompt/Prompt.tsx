import { useContentEditable } from "../../hooks/useContentEditable";
import type { MentionOption } from "../../hooks/useMentions";
import MentionMenu from "./MentionMenu";

export interface PromptProps {
	initialValue?: string;
	onChange?: (value: string) => void;
	placeholder?: string;
	mentionTrigger?: string;
	mentionOptions?: MentionOption[];
}

const Prompt = ({
	initialValue = "",
	onChange,
	placeholder = "",
	mentionTrigger = "@",
	mentionOptions,
}: PromptProps) => {
	const { ref, isEmpty, handlers, mentions } = useContentEditable({
		initialValue,
		onChange,
		mentionTrigger,
		mentionOptions,
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
				position={mentions.menuState.position}
				options={mentions.filteredOptions}
				selectedIndex={mentions.selectedIndex}
				onSelect={mentions.selectOption}
			/>
		</div>
	);
};

export default Prompt;
