import { useState, useCallback, useRef } from "react";

export interface MentionOption {
	id: string;
	label: string;
}

export interface MentionMenuState {
	isOpen: boolean;
	position: { top: number; left: number };
	searchText: string;
}

export interface UseMentionsOptions {
	trigger?: string;
	options?: MentionOption[] | undefined;
}

export interface UseMentionsReturn {
	menuState: MentionMenuState;
	options: MentionOption[];
	selectedIndex: number;
	openMenu: (position: { top: number; left: number }) => void;
	closeMenu: () => void;
	updateSearch: (text: string) => void;
	selectNext: () => void;
	selectPrevious: () => void;
	getSelectedOption: () => MentionOption | null;
	filteredOptions: MentionOption[];
}

const DEFAULT_OPTIONS: MentionOption[] = [
	{ id: "john-doe", label: "John Doe" },
	{ id: "jane-smith", label: "Jane Smith" },
];

export function useMentions({
	trigger = "@",
	options = DEFAULT_OPTIONS,
}: UseMentionsOptions = {}): UseMentionsReturn {
	const [menuState, setMenuState] = useState<MentionMenuState>({
		isOpen: false,
		position: { top: 0, left: 0 },
		searchText: "",
	});
	const [selectedIndex, setSelectedIndex] = useState(0);
	const optionsRef = useRef(options);
	optionsRef.current = options;

	const filteredOptions = menuState.searchText
		? options.filter((opt) =>
			opt.label.toLowerCase().includes(menuState.searchText.toLowerCase())
		)
		: options;

	const openMenu = useCallback((position: { top: number; left: number }) => {
		setMenuState({
			isOpen: true,
			position,
			searchText: "",
		});
		setSelectedIndex(0);
	}, []);

	const closeMenu = useCallback(() => {
		setMenuState((prev) => ({
			...prev,
			isOpen: false,
			searchText: "",
		}));
		setSelectedIndex(0);
	}, []);

	const updateSearch = useCallback((text: string) => {
		setMenuState((prev) => ({
			...prev,
			searchText: text,
		}));
		setSelectedIndex(0);
	}, []);

	const selectNext = useCallback(() => {
		setSelectedIndex((prev) => {
			const max = filteredOptions.length - 1;
			return prev >= max ? 0 : prev + 1;
		});
	}, [filteredOptions.length]);

	const selectPrevious = useCallback(() => {
		setSelectedIndex((prev) => {
			const max = filteredOptions.length - 1;
			return prev <= 0 ? max : prev - 1;
		});
	}, [filteredOptions.length]);

	const getSelectedOption = useCallback((): MentionOption | null => {
		return filteredOptions[selectedIndex] ?? null;
	}, [filteredOptions, selectedIndex]);

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
	};
}

