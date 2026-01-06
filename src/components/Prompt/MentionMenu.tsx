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
	/**
	 * When true, only renders visible items for better performance with large lists.
	 * @default true
	 */
	virtualizeMenu?: boolean;
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

// Default virtualization constants (fallback when measurement fails)
const DEFAULT_ITEM_HEIGHT = 28; // Height of regular menu items in pixels
const DEFAULT_DIVIDER_HEIGHT = 9; // Height of divider items (1px + margins/gap)
const DEFAULT_TITLE_HEIGHT = 28; // Height of title items
const OVERSCAN_COUNT = 5; // Number of items to render outside visible area

// Interface for measured item heights
interface MeasuredHeights {
	item: number;
	divider: number;
	title: number;
}

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
	virtualizeMenu = true,
}: MentionMenuProps) => {
	const menuRef = useRef<HTMLDivElement>(null);
	const [actualPosition, setActualPosition] = useState<"above" | "below">(preferredPosition);
	const [menuHeight, setMenuHeight] = useState(0);
	const [menuWidth, setMenuWidth] = useState(0);
	const [alignRight, setAlignRight] = useState(false);
	const [scrollTop, setScrollTop] = useState(0);
	const [measuredHeights, setMeasuredHeights] = useState<MeasuredHeights | null>(null);

	// Measure actual item heights from rendered DOM elements
	// This ensures virtualization works correctly with any theme
	useLayoutEffect(() => {
		if (!isOpen || !menuRef.current || !virtualizeMenu) return;

		const menu = menuRef.current;

		// Find elements of each type to measure
		const itemEl = menu.querySelector('.mention-menu-item') as HTMLElement | null;
		const dividerEl = menu.querySelector('.mention-menu-divider') as HTMLElement | null;
		const titleEl = menu.querySelector('.mention-menu-title') as HTMLElement | null;

		// Get computed heights (including margins via getBoundingClientRect + gap)
		const menuStyle = window.getComputedStyle(menu);
		const gap = parseFloat(menuStyle.gap) || 2; // default gap is 2px

		// Measure heights, but use defaults if measurement returns 0 (e.g., in JSDOM)
		const measuredItem = itemEl ? itemEl.getBoundingClientRect().height : 0;
		const measuredDivider = dividerEl ? dividerEl.getBoundingClientRect().height : 0;
		const measuredTitle = titleEl ? titleEl.getBoundingClientRect().height : 0;

		const heights: MeasuredHeights = {
			// Use measured height + gap if measurement is valid (> 0), otherwise use defaults
			item: measuredItem > 0 ? measuredItem + gap : DEFAULT_ITEM_HEIGHT,
			divider: measuredDivider > 0 ? measuredDivider + gap : DEFAULT_DIVIDER_HEIGHT,
			title: measuredTitle > 0 ? measuredTitle + gap : DEFAULT_TITLE_HEIGHT,
		};

		// Only update if heights have changed significantly (avoid unnecessary re-renders)
		setMeasuredHeights(prev => {
			if (!prev) return heights;
			const changed = Math.abs(prev.item - heights.item) > 1 ||
				Math.abs(prev.divider - heights.divider) > 1 ||
				Math.abs(prev.title - heights.title) > 1;
			return changed ? heights : prev;
		});
	}, [isOpen, virtualizeMenu, options.length > 0]);

	// Calculate item heights for virtualization using measured values
	const getItemHeight = useCallback((option: MentionOption): number => {
		const heights = measuredHeights || {
			item: DEFAULT_ITEM_HEIGHT,
			divider: DEFAULT_DIVIDER_HEIGHT,
			title: DEFAULT_TITLE_HEIGHT,
		};

		if (option.type === 'divider') return heights.divider;
		if (option.type === 'title') return heights.title;
		return heights.item;
	}, [measuredHeights]);

	// Calculate cumulative offsets for each item
	const itemOffsets = useCallback(() => {
		const offsets: number[] = [];
		let offset = 0;
		for (const option of options) {
			offsets.push(offset);
			offset += getItemHeight(option);
		}
		return { offsets, totalHeight: offset };
	}, [options, getItemHeight]);

	// Get visible range based on scroll position
	const getVisibleRange = useCallback(() => {
		if (!virtualizeMenu || options.length === 0) {
			return { startIndex: 0, endIndex: options.length - 1 };
		}

		const { offsets, totalHeight } = itemOffsets();
		const viewportHeight = menuRef.current?.clientHeight || 300;

		// Find start index using binary search
		let startIndex = 0;
		let low = 0;
		let high = offsets.length - 1;
		while (low <= high) {
			const mid = Math.floor((low + high) / 2);
			if (offsets[mid]! < scrollTop) {
				startIndex = mid;
				low = mid + 1;
			} else {
				high = mid - 1;
			}
		}

		// Find end index
		let endIndex = startIndex;
		const visibleEnd = scrollTop + viewportHeight;
		for (let i = startIndex; i < options.length; i++) {
			if (offsets[i]! > visibleEnd) break;
			endIndex = i;
		}

		// Apply overscan
		startIndex = Math.max(0, startIndex - OVERSCAN_COUNT);
		endIndex = Math.min(options.length - 1, endIndex + OVERSCAN_COUNT);

		return { startIndex, endIndex, totalHeight, offsets };
	}, [virtualizeMenu, options, itemOffsets, scrollTop]);

	// Handle scroll events
	const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
		if (virtualizeMenu) {
			setScrollTop(e.currentTarget.scrollTop);
		}
	}, [virtualizeMenu]);

	// Reset scroll position when menu opens or options change significantly
	useEffect(() => {
		if (isOpen) {
			setScrollTop(0);
		}
	}, [isOpen]);

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
		setMenuWidth(rect.width);

		const viewportHeight = window.innerHeight;
		const viewportWidth = window.innerWidth;

		// Calculate available space above and below the caret
		const spaceBelow = viewportHeight - caretRect.bottom - MENU_SPACING;
		const spaceAbove = caretRect.top - MENU_SPACING;

		// Calculate available space to the right and left of the caret
		const spaceRight = viewportWidth - caretRect.left - MENU_SPACING;
		const spaceLeft = caretRect.left - MENU_SPACING;

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

		// Determine horizontal alignment
		// Prefer left-aligned (menu starts at caret), but flip to right-aligned if:
		// - Menu would overflow on the right
		// - There's enough space on the left to fit the menu
		if (rect.width > spaceRight && spaceLeft >= rect.width) {
			setAlignRight(true);
		} else {
			setAlignRight(false);
		}
	}, [isOpen, caretRect, preferredPosition, options]);

	// Scroll selected item into view synchronously to avoid visual jank
	// useLayoutEffect ensures scroll happens before paint, so selection and scroll appear simultaneous
	// We use manual scrollTop calculation instead of scrollIntoView for more predictable behavior
	useLayoutEffect(() => {
		if (isOpen && menuRef.current) {
			const menu = menuRef.current;

			// Get menu padding to ensure items aren't flush against edges
			const computedStyle = window.getComputedStyle(menu);
			const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
			const paddingBottom = parseFloat(computedStyle.paddingBottom) || 0;

			// Check if this is the first selectable item and there's a title/divider before it
			// If so, scroll to top to show the title
			const firstSelectableIndex = options.findIndex(
				opt => opt.type !== 'title' && opt.type !== 'divider'
			);
			const hasTitleBeforeSelected = options.slice(0, selectedIndex).some(
				opt => opt.type === 'title' || opt.type === 'divider'
			);

			if (selectedIndex === firstSelectableIndex && hasTitleBeforeSelected) {
				// Scroll to the top to show the title
				menu.scrollTop = 0;
				if (virtualizeMenu) setScrollTop(0);
				return;
			}

			// For virtualized menus, calculate position from offsets
			if (virtualizeMenu) {
				const { offsets } = itemOffsets();
				const itemTop = offsets[selectedIndex] ?? 0;
				const itemHeight = getItemHeight(options[selectedIndex]!);
				const itemBottom = itemTop + itemHeight;
				const menuScrollTop = menu.scrollTop;
				const menuVisibleBottom = menuScrollTop + menu.clientHeight;

				if (itemTop < menuScrollTop + paddingTop) {
					const newScrollTop = itemTop - paddingTop;
					menu.scrollTop = newScrollTop;
					setScrollTop(newScrollTop);
				} else if (itemBottom > menuVisibleBottom - paddingBottom) {
					const newScrollTop = itemBottom - menu.clientHeight + paddingBottom;
					menu.scrollTop = newScrollTop;
					setScrollTop(newScrollTop);
				}
			} else {
				// Non-virtualized: use DOM element position
				const selectedItem = menu.querySelector(
					`[data-index="${selectedIndex}"]`
				) as HTMLElement | null;

				if (selectedItem) {
					const itemTop = selectedItem.offsetTop;
					const itemBottom = itemTop + selectedItem.offsetHeight;
					const menuScrollTop = menu.scrollTop;
					const menuVisibleBottom = menuScrollTop + menu.clientHeight;

					if (itemTop < menuScrollTop + paddingTop) {
						menu.scrollTop = itemTop - paddingTop;
					} else if (itemBottom > menuVisibleBottom - paddingBottom) {
						menu.scrollTop = itemBottom - menu.clientHeight + paddingBottom;
					}
				}
			}
		}
	}, [isOpen, selectedIndex, options, virtualizeMenu, itemOffsets, getItemHeight]);

	if (!isOpen || options.length === 0) return null;

	// Calculate final top position based on actual position
	const top = actualPosition === "below"
		? caretRect.bottom + MENU_SPACING
		: caretRect.top - menuHeight - MENU_SPACING;

	// Calculate final left position based on horizontal alignment
	// When alignRight is true, position menu so its right edge is at the caret position
	const left = alignRight
		? caretRect.left - menuWidth
		: caretRect.left;

	// Render a single menu item
	const renderItem = (option: MentionOption, index: number) => {
		// Use index as part of key to handle duplicate option IDs
		// (e.g., same file appearing in multiple categories)
		const uniqueKey = `${index}-${option.id}`;

		// Handle dividers
		if (option.type === 'divider') {
			return (
				<div
					key={uniqueKey}
					data-index={index}
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
					data-index={index}
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

		const indentStyle = option.indent ? { paddingLeft: `calc(var(--prompt-mention-menu-item-padding-left, 0.75rem) + ${option.indent} * var(--prompt-mention-menu-item-indent-size, 1rem))` } : undefined;

		return (
			<div
				key={uniqueKey}
				data-index={index}
				data-indent={option.indent ?? undefined}
				className={`mention-menu-item ${isSelected ? "mention-menu-item-selected" : ""
					} ${hasChildren ? "mention-menu-item-has-children" : ""}`}
				style={indentStyle}
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
				{option.labelRight && (
					<span className="mention-menu-item-label-right"><bdi>{option.labelRight}</bdi></span>
				)}
				{hasChildren && <ChevronRight />}
			</div>
		);
	};

	// Render items with virtualization support
	const renderItems = () => {
		if (!virtualizeMenu || options.length <= 50) {
			// For small lists, render all items
			return options.map((option, index) => renderItem(option, index));
		}

		// Virtualized rendering
		const { startIndex, endIndex, totalHeight, offsets } = getVisibleRange();
		const visibleItems: React.ReactNode[] = [];

		// Add top spacer
		const topOffset = offsets?.[startIndex] ?? 0;
		if (topOffset > 0) {
			visibleItems.push(
				<div
					key="virtualized-spacer-top"
					style={{ height: topOffset, flexShrink: 0 }}
					aria-hidden="true"
				/>
			);
		}

		// Render visible items
		for (let i = startIndex; i <= endIndex && i < options.length; i++) {
			visibleItems.push(renderItem(options[i]!, i));
		}

		// Add bottom spacer
		const bottomOffset = (totalHeight ?? 0) - ((offsets?.[endIndex] ?? 0) + getItemHeight(options[endIndex]!));
		if (bottomOffset > 0) {
			visibleItems.push(
				<div
					key="virtualized-spacer-bottom"
					style={{ height: bottomOffset, flexShrink: 0 }}
					aria-hidden="true"
				/>
			);
		}

		return visibleItems;
	};

	const menuContent = (
		<div
			ref={menuRef}
			className={`mention-menu${isKeyboardNavigating ? ' keyboard-navigating' : ''}`}
			style={{
				position: "fixed",
				top: Math.max(MENU_SPACING, top), // Ensure it doesn't go above viewport
				left: Math.max(MENU_SPACING, left), // Ensure it doesn't go past left edge of viewport
			}}
			onScroll={handleScroll}
		>
			{renderItems()}
		</div>
	);

	// Use portal to render menu at document.body level
	// This ensures proper positioning even in iframes or transformed containers (e.g., Storybook Docs)
	// Wrap in a div with prompt-container class (for CSS variable defaults) and theme styles (for overrides)
	return createPortal(
		<div className="prompt-container" style={themeStyles}>
			{menuContent}
		</div>,
		document.body
	);
};

export default MentionMenu;

