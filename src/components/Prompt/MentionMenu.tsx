import { useEffect, useRef, useState, useLayoutEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import type { MentionOption, CaretRect } from "../../hooks/useMentions";

export type MentionMenuPosition = "above" | "below";

export interface MentionMenuProps {
	isOpen: boolean;
	caretRect: CaretRect;
	preferredPosition?: MentionMenuPosition;
	options: MentionOption[];
	selectedIndex: number;
	onSelect: (option: MentionOption) => void;
	onEnterSubmenu?: (option: MentionOption) => void;
	onExitSubmenu?: () => void;
	isInSubmenu?: boolean;
	onHoverIndex?: (index: number) => void;
	onClose?: () => void;
	isKeyboardNavigating?: boolean;
	onMouseActivity?: () => void;
	themeStyles?: React.CSSProperties;
}

const ChevronRight = () => (
	<svg
		className="mention-menu-chevron"
		viewBox="0 0 16 16"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
	>
		<path
			d="M6 4L10 8L6 12"
			stroke="currentColor"
			strokeWidth="1"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	</svg>
);

const ChevronLeft = () => (
	<svg
		className="mention-menu-chevron-back"
		width="16"
		height="16"
		viewBox="0 0 16 16"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
	>
		<path
			d="M10 4L6 8L10 12"
			stroke="currentColor"
			strokeWidth="1"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	</svg>
);

const MENU_SPACING = 4; // Gap between caret and menu

const MentionMenu = ({
	isOpen,
	caretRect,
	preferredPosition = "below",
	options,
	selectedIndex,
	onSelect,
	onEnterSubmenu,
	onExitSubmenu,
	isInSubmenu = false,
	onHoverIndex,
	onClose,
	isKeyboardNavigating = false,
	onMouseActivity,
	themeStyles,
}: MentionMenuProps) => {
	const menuRef = useRef<HTMLDivElement>(null);
	const [actualPosition, setActualPosition] = useState<"above" | "below">(preferredPosition);
	const [menuHeight, setMenuHeight] = useState(0);

	// Handle mouse move on items - switches to mouse navigation mode and selects
	const handleItemMouseMove = useCallback((index: number) => {
		if (isKeyboardNavigating) {
			// Switch from keyboard to mouse navigation
			onMouseActivity?.();
		}
		// Always update selection on mouse move (mouse now has precedence)
		onHoverIndex?.(index);
	}, [isKeyboardNavigating, onMouseActivity, onHoverIndex]);

	// Handle clicks outside the menu to close it
	useEffect(() => {
		if (!isOpen || !onClose) return;

		const handleMouseDown = (e: MouseEvent) => {
			const target = e.target as Node;
			// Don't close if clicking inside the menu
			if (menuRef.current?.contains(target)) return;
			// Don't close if clicking inside the prompt input (let the input handle it)
			const promptInput = (target as Element).closest?.(".prompt-input");
			if (promptInput) return;

			onClose();
		};

		document.addEventListener("mousedown", handleMouseDown);
		return () => document.removeEventListener("mousedown", handleMouseDown);
	}, [isOpen, onClose]);

	// Calculate menu position after render to detect overflow
	useLayoutEffect(() => {
		if (!isOpen || !menuRef.current) return;

		const menuEl = menuRef.current;
		const rect = menuEl.getBoundingClientRect();
		setMenuHeight(rect.height);

		const viewportHeight = window.innerHeight;

		// Calculate available space above and below the caret
		const spaceBelow = viewportHeight - caretRect.bottom - MENU_SPACING;
		const spaceAbove = caretRect.top - MENU_SPACING;

		// Determine actual position based on preference and available space
		if (preferredPosition === "below") {
			// Prefer below, but flip to above if not enough space below and more space above
			if (rect.height > spaceBelow && spaceAbove > spaceBelow) {
				setActualPosition("above");
			} else {
				setActualPosition("below");
			}
		} else {
			// Prefer above, but flip to below if not enough space above and more space below
			if (rect.height > spaceAbove && spaceBelow > spaceAbove) {
				setActualPosition("below");
			} else {
				setActualPosition("above");
			}
		}
	}, [isOpen, caretRect, preferredPosition, options]);

	// Scroll selected item into view
	useEffect(() => {
		if (isOpen && menuRef.current) {
			const selectedItem = menuRef.current.querySelector(
				`[data-index="${selectedIndex}"]`
			);
			if (selectedItem) {
				selectedItem.scrollIntoView({ block: "nearest" });
			}
		}
	}, [isOpen, selectedIndex]);

	if (!isOpen || options.length === 0) return null;

	// Calculate final top position based on actual position
	const top = actualPosition === "below"
		? caretRect.bottom + MENU_SPACING
		: caretRect.top - menuHeight - MENU_SPACING;

	const menuContent = (
		<div
			ref={menuRef}
			className={`mention-menu${isKeyboardNavigating ? ' keyboard-navigating' : ''}`}
			style={{
				position: "fixed",
				top: Math.max(MENU_SPACING, top), // Ensure it doesn't go above viewport
				left: caretRect.left,
			}}
		>
			{options.map((option, index) => {
				// Use index as part of key to handle duplicate option IDs
				// (e.g., same file appearing in multiple categories)
				const uniqueKey = `${index}-${option.id}`;

				// Handle dividers
				if (option.type === 'divider') {
					return (
						<div
							key={uniqueKey}
							className="mention-menu-divider"
							role="separator"
						/>
					);
				}

				// Handle titles/headers
				if (option.type === 'title') {
					return (
						<div
							key={uniqueKey}
							className="mention-menu-title"
						>
							{option.icon && (
								<span className="mention-menu-item-icon">{option.icon}</span>
							)}
							<span className="mention-menu-title-label">{option.label}</span>
						</div>
					);
				}

				// Regular selectable item - use the actual array index
				const hasChildren = option.children && option.children.length > 0;
				const isSelected = index === selectedIndex;

				return (
					<div
						key={uniqueKey}
						data-index={index}
						className={`mention-menu-item ${isSelected ? "mention-menu-item-selected" : ""
							} ${hasChildren ? "mention-menu-item-has-children" : ""}`}
						onMouseDown={(e) => {
							e.preventDefault();
							e.stopPropagation();
							if (hasChildren && onEnterSubmenu) {
								onEnterSubmenu(option);
							} else {
								onSelect(option);
							}
						}}
						onMouseMove={() => handleItemMouseMove(index)}
					>
						{option.icon && (
							<span className="mention-menu-item-icon">{option.icon}</span>
						)}
						<span className="mention-menu-item-label">{option.label}</span>
						{hasChildren && <ChevronRight />}
					</div>
				);
			})}
		</div>
	);

	// Use portal to render menu at document.body level
	// This ensures proper positioning even in iframes or transformed containers (e.g., Storybook Docs)
	// Wrap in a div with theme styles so CSS custom properties are inherited
	return createPortal(
		<div style={themeStyles}>
			{menuContent}
		</div>,
		document.body
	);
};

export default MentionMenu;

