import { useEffect, useRef } from "react";
import type { MentionOption } from "../../hooks/useMentions";

export interface MentionMenuProps {
	isOpen: boolean;
	position: { top: number; left: number };
	options: MentionOption[];
	selectedIndex: number;
	onSelect: (option: MentionOption) => void;
}

const MentionMenu = ({
	isOpen,
	position,
	options,
	selectedIndex,
	onSelect,
}: MentionMenuProps) => {
	const menuRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (isOpen && menuRef.current) {
			const selectedItem = menuRef.current.querySelector(
				`[data-index="${selectedIndex}"]`
			);
			selectedItem?.scrollIntoView({ block: "nearest" });
		}
	}, [isOpen, selectedIndex]);

	if (!isOpen || options.length === 0) return null;

	return (
		<div
			ref={menuRef}
			className="mention-menu"
			style={{
				position: "fixed",
				top: position.top,
				left: position.left,
			}}
		>
			{options.map((option, index) => (
				<div
					key={option.id}
					data-index={index}
					className={`mention-menu-item ${
						index === selectedIndex ? "mention-menu-item-selected" : ""
					}`}
					onMouseDown={(e) => {
						e.preventDefault();
						onSelect(option);
					}}
					onMouseEnter={() => {
						// Could add hover selection here if needed
					}}
				>
					<span className="mention-menu-item-label">{option.label}</span>
				</div>
			))}
		</div>
	);
};

export default MentionMenu;

