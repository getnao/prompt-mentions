import { useState, useCallback, useRef } from "react";
import type { ReactNode } from "react";

export type MentionItemType = 'item' | 'divider' | 'title';

export interface MentionOption {
	id: string;
	label: string;
	icon?: ReactNode;
	type?: MentionItemType;
	children?: MentionOption[];
}

export interface CaretRect {
	top: number;
	left: number;
	bottom: number;
	height: number;
}

export interface MentionMenuState {
	isOpen: boolean;
	caretRect: CaretRect;
	searchText: string;
	parentStack: string[];
}

export interface UseMentionsOptions {
	trigger?: string;
	options?: MentionOption[] | undefined;
}

export interface UseMentionsReturn {
	menuState: MentionMenuState;
	options: MentionOption[];
	selectedIndex: number;
	openMenu: (caretRect: CaretRect) => void;
	closeMenu: () => void;
	updateSearch: (text: string) => void;
	selectNext: () => void;
	selectPrevious: () => void;
	getSelectedOption: () => MentionOption | null;
	filteredOptions: MentionOption[];
	enterSubmenu: (option: MentionOption) => void;
	exitSubmenu: () => void;
	isInSubmenu: boolean;
	currentMenuItems: MentionOption[];
	setSelectedIndex: (index: number) => void;
}

const DEFAULT_OPTIONS: MentionOption[] = [
	{ id: "john-doe", label: "John Doe" },
	{ id: "jane-smith", label: "Jane Smith" },
];

const isSelectableItem = (option: MentionOption): boolean => {
	return option.type !== 'divider' && option.type !== 'title';
};

const findNextSelectableIndex = (options: MentionOption[], currentIndex: number, direction: 1 | -1): number => {
	const len = options.length;
	if (len === 0) return -1;

	let index = currentIndex;
	let iterations = 0;

	do {
		index = direction === 1
			? (index >= len - 1 ? 0 : index + 1)
			: (index <= 0 ? len - 1 : index - 1);
		iterations++;
	} while (!isSelectableItem(options[index]!) && iterations < len);

	return iterations >= len ? -1 : index;
};

const findFirstSelectableIndex = (options: MentionOption[]): number => {
	const index = options.findIndex(isSelectableItem);
	return index >= 0 ? index : 0;
};

const getOptionsAtPath = (options: MentionOption[], parentStack: string[]): MentionOption[] => {
	let current = options;
	for (const parentId of parentStack) {
		const parent = current.find(opt => opt.id === parentId);
		if (parent?.children) {
			current = parent.children;
		} else {
			return [];
		}
	}
	return current;
};

/**
 * Flatten and filter options for search results.
 * When searching, we want a flat list of all matching items (no nested structure).
 * This makes it easier to see and select search results without navigating submenus.
 */
const filterOptionsFlat = (options: MentionOption[], searchText: string): MentionOption[] => {
	const lowerSearch = searchText.toLowerCase();
	const result: MentionOption[] = [];

	const collectMatches = (opts: MentionOption[]) => {
		for (const opt of opts) {
			// Skip dividers and titles in search results
			if (opt.type === 'divider' || opt.type === 'title') {
				continue;
			}

			// Check if this item matches
			if (opt.label.toLowerCase().includes(lowerSearch)) {
				// Add matching item WITHOUT children (flat list)
				const flatItem: MentionOption = {
					id: opt.id,
					label: opt.label,
				};
				if (opt.icon) flatItem.icon = opt.icon;
				if (opt.type) flatItem.type = opt.type;
				result.push(flatItem);
			}

			// Recursively search children
			if (opt.children) {
				collectMatches(opt.children);
			}
		}
	};

	collectMatches(options);
	return result;
};

export function useMentions({
	trigger = "@",
	options = DEFAULT_OPTIONS,
}: UseMentionsOptions = {}): UseMentionsReturn {
	const [menuState, setMenuState] = useState<MentionMenuState>({
		isOpen: false,
		caretRect: { top: 0, left: 0, bottom: 0, height: 0 },
		searchText: "",
		parentStack: [],
	});
	const [selectedIndex, setSelectedIndex] = useState(0);
	const optionsRef = useRef(options);
	optionsRef.current = options;

	// Get current menu items based on parent stack
	const currentMenuItems = getOptionsAtPath(options, menuState.parentStack);

	// Filter options when searching (only at root level, not in submenus)
	// Search results are flattened - no nested structure
	const filteredOptions = menuState.searchText && menuState.parentStack.length === 0
		? filterOptionsFlat(options, menuState.searchText)
		: currentMenuItems;

	const openMenu = useCallback((caretRect: CaretRect) => {
		setMenuState({
			isOpen: true,
			caretRect,
			searchText: "",
			parentStack: [],
		});
		setSelectedIndex(findFirstSelectableIndex(options));
	}, [options]);

	const closeMenu = useCallback(() => {
		setMenuState((prev) => ({
			...prev,
			isOpen: false,
			searchText: "",
			parentStack: [],
		}));
		setSelectedIndex(0);
	}, []);

	const updateSearch = useCallback((text: string) => {
		setMenuState((prev) => ({
			...prev,
			searchText: text,
			// Reset to root when searching
			parentStack: [],
		}));
		// Find first selectable item in filtered results
		const filtered = text ? filterOptionsFlat(options, text) : options;
		setSelectedIndex(findFirstSelectableIndex(filtered));
	}, [options]);

	const selectNext = useCallback(() => {
		setSelectedIndex((prev) => {
			const nextIndex = findNextSelectableIndex(filteredOptions, prev, 1);
			return nextIndex >= 0 ? nextIndex : prev;
		});
	}, [filteredOptions]);

	const selectPrevious = useCallback(() => {
		setSelectedIndex((prev) => {
			const nextIndex = findNextSelectableIndex(filteredOptions, prev, -1);
			return nextIndex >= 0 ? nextIndex : prev;
		});
	}, [filteredOptions]);

	const getSelectedOption = useCallback((): MentionOption | null => {
		return filteredOptions[selectedIndex] ?? null;
	}, [filteredOptions, selectedIndex]);

	const enterSubmenu = useCallback((option: MentionOption) => {
		if (!option.children || option.children.length === 0) return;

		setMenuState((prev) => ({
			...prev,
			parentStack: [...prev.parentStack, option.id],
			searchText: "", // Clear search when entering submenu
		}));
		setSelectedIndex(findFirstSelectableIndex(option.children));
	}, []);

	const exitSubmenu = useCallback(() => {
		setMenuState((prev) => {
			if (prev.parentStack.length === 0) return prev;

			const newStack = prev.parentStack.slice(0, -1);
			const parentOptions = getOptionsAtPath(options, newStack);
			const parentId = prev.parentStack[prev.parentStack.length - 1];
			const parentIndex = parentOptions.findIndex(opt => opt.id === parentId);

			// Update selected index to point to the parent we just exited from
			setSelectedIndex(parentIndex >= 0 ? parentIndex : 0);

			return {
				...prev,
				parentStack: newStack,
			};
		});
	}, [options]);

	const isInSubmenu = menuState.parentStack.length > 0;

	return {
		menuState,
		options,
		selectedIndex,
		openMenu,
		closeMenu,
		updateSearch,
		selectNext,
		selectPrevious,
		getSelectedOption,
		filteredOptions,
		enterSubmenu,
		exitSubmenu,
		isInSubmenu,
		currentMenuItems,
		setSelectedIndex,
	};
}

