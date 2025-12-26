import { useRef, useCallback, useState, useEffect, useMemo } from "react";
import { useHistory } from "./useHistory";
import { useMentions } from "./useMentions";
import type { MentionOption, MentionTriggerConfig } from "./useMentions";
import type {
	SelectedMention,
	MentionConfig,
	UseContentEditableOptions,
	UseContentEditableReturn,
} from "./contentEditable/types";
import { DEFAULT_MENTION_CONFIG } from "./contentEditable/types";
import { MentionDOM, normalizeValue } from "./contentEditable/mentionDOM";
import { SelectionUtils } from "./contentEditable/selectionUtils";
import { useMentionNavigation } from "./contentEditable/useMentionNavigation";
import { useMentionInsertion } from "./contentEditable/useMentionInsertion";
import { useMentionTrigger } from "./contentEditable/useMentionTrigger";
import { useClipboardHandlers } from "./contentEditable/useClipboardHandlers";

export type { SelectedMention, MentionConfig, UseContentEditableOptions, UseContentEditableReturn };
export { MentionDOM } from "./contentEditable/mentionDOM";
export { SelectionUtils } from "./contentEditable/selectionUtils";

export function useContentEditable({
	initialValue = "",
	onChange,
	onEnter,
	onMentionAdded,
	onMentionDeleted,
	onMentionClick,
	mentionConfigs = DEFAULT_MENTION_CONFIG,
}: UseContentEditableOptions = {}): UseContentEditableReturn {
	// Extract triggers for quick lookup
	const triggers = useMemo(() => mentionConfigs.map(c => c.trigger), [mentionConfigs]);

	// Build configs for useMentions hook
	const mentionHookConfigs: MentionTriggerConfig[] = useMemo(() =>
		mentionConfigs.map(c => ({ trigger: c.trigger, options: c.options })),
		[mentionConfigs]);

	const ref = useRef<HTMLDivElement>(null);
	const [isEmpty, setIsEmpty] = useState(!initialValue);
	const mentionStartRef = useRef<number | null>(null);
	const mentionEndRef = useRef<number | null>(null);
	const activeTriggerRef = useRef<string | null>(null);
	const selectAllPressedRef = useRef(false);
	const currentMentionsRef = useRef<SelectedMention[]>([]);

	// Store callbacks in refs to ensure they're always up-to-date
	const onChangeRef = useRef(onChange);
	const onEnterRef = useRef(onEnter);
	const onMentionAddedRef = useRef(onMentionAdded);
	const onMentionDeletedRef = useRef(onMentionDeleted);
	const onMentionClickRef = useRef(onMentionClick);
	onChangeRef.current = onChange;
	onEnterRef.current = onEnter;
	onMentionAddedRef.current = onMentionAdded;
	onMentionDeletedRef.current = onMentionDeleted;
	onMentionClickRef.current = onMentionClick;

	const history = useHistory({ initialValue });
	const mentions = useMentions({ configs: mentionHookConfigs });

	const mentionRefs = useMemo(() => ({
		mentionStart: mentionStartRef,
		mentionEnd: mentionEndRef,
		activeTrigger: activeTriggerRef,
	}), []);

	const getElement = useCallback(() => ref.current, []);

	const getValue = useCallback(() => {
		const el = getElement();
		return el ? MentionDOM.extractValueMulti(el, triggers) : "";
	}, [getElement, triggers]);

	const updateState = useCallback(
		(value: string) => {
			const el = ref.current;
			const normalized = normalizeValue(value);
			setIsEmpty(!normalized);

			const defaultTrigger = triggers[0] ?? "@";
			const newMentions = el ? MentionDOM.extractMentions(el, defaultTrigger) : [];
			const prevMentions = currentMentionsRef.current;

			// Detect added mentions
			const addedMentions = newMentions.filter(
				(m) => !prevMentions.some((p) => p.id === m.id && p.trigger === m.trigger)
			);
			// Detect deleted mentions
			const deletedMentions = prevMentions.filter(
				(p) => !newMentions.some((m) => m.id === p.id && m.trigger === p.trigger)
			);

			currentMentionsRef.current = newMentions;

			addedMentions.forEach((m) => onMentionAddedRef.current?.(m));
			deletedMentions.forEach((m) => onMentionDeletedRef.current?.(m));
			onChangeRef.current?.(normalized, newMentions);
		},
		[triggers]
	);

	const saveToHistory = useCallback(() => {
		const el = getElement();
		if (el) {
			history.push(getValue(), SelectionUtils.getCursorPosition(el));
		}
	}, [getElement, getValue, history]);

	const updateStateAndSaveHistory = useCallback(() => {
		updateState(getValue());
		saveToHistory();
	}, [getValue, updateState, saveToHistory]);

	const applyHistoryEntry = useCallback(
		(content: string, cursorPosition: number) => {
			const el = getElement();
			if (!el) return;

			el.innerHTML = MentionDOM.parseValueMulti(content, mentionConfigs);
			updateState(MentionDOM.extractValueMulti(el, triggers));
			requestAnimationFrame(() => SelectionUtils.setCursorPosition(el, cursorPosition));
		},
		[getElement, mentionConfigs, triggers, updateState]
	);

	const handleUndo = useCallback(() => {
		history.setUndoRedo(true);
		const entry = history.undo();
		if (entry) applyHistoryEntry(entry.content, entry.cursorPosition);
		history.setUndoRedo(false);
	}, [history, applyHistoryEntry]);

	const handleRedo = useCallback(() => {
		history.setUndoRedo(true);
		const entry = history.redo();
		if (entry) applyHistoryEntry(entry.content, entry.cursorPosition);
		history.setUndoRedo(false);
	}, [history, applyHistoryEntry]);

	const { handleAtomicMentionNavigation, updateMentionSelectionVisuals } =
		useMentionNavigation({ getElement });

	const { checkForMentionTrigger, clearMentionState } = useMentionTrigger({
		getElement,
		triggers,
		mentionRefs,
		isMenuOpen: mentions.menuState.isOpen,
		openMenu: mentions.openMenu,
		closeMenu: mentions.closeMenu,
		updateSearch: mentions.updateSearch,
	});

	const { insertMention } = useMentionInsertion({
		getElement,
		getValue,
		triggers,
		mentionConfigs,
		mentionRefs,
		onInserted: (newValue) => {
			updateState(newValue);
			saveToHistory();
		},
		closeMenu: mentions.closeMenu,
		enterSubmenu: mentions.enterSubmenu,
	});

	const { onCopy, onCut, onPaste } = useClipboardHandlers({
		getElement,
		triggers,
		mentionConfigs,
		onContentChanged: updateStateAndSaveHistory,
	});

	const handleBackspaceOnMention = useCallback(
		(e: React.KeyboardEvent): boolean => {
			const el = getElement();
			const range = SelectionUtils.getRange();
			if (!el || !range?.collapsed || range.startOffset !== 0) return false;

			const node = range.startContainer;
			const prev =
				node.nodeType === Node.TEXT_NODE
					? node.previousSibling
					: (node as HTMLElement).previousElementSibling;

			if (prev && MentionDOM.isMentionElement(prev)) {
				e.preventDefault();
				prev.remove();
				updateState(getValue());
				saveToHistory();
				return true;
			}

			return false;
		},
		[getElement, getValue, updateState, saveToHistory]
	);

	const onKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLDivElement>) => {
			const isMac = navigator.platform.toUpperCase().includes("MAC");
			const modKey = isMac ? e.metaKey : e.ctrlKey;

			// Mention menu navigation
			if (mentions.menuState.isOpen) {
				switch (e.key) {
					case "ArrowDown":
						e.preventDefault();
						mentions.selectNext();
						return;
					case "ArrowUp":
						e.preventDefault();
						mentions.selectPrevious();
						return;
					case "Tab": {
						e.preventDefault();
						const selected = mentions.getSelectedOption();
						if (selected) {
							if (selected.children && selected.children.length > 0) {
								mentions.enterSubmenu(selected);
							} else {
								insertMention(selected);
							}
						}
						return;
					}
					case "Enter": {
						e.preventDefault();
						const selected = mentions.getSelectedOption();
						if (selected) insertMention(selected);
						return;
					}
					case "Escape":
						e.preventDefault();
						if (mentions.isInSubmenu) {
							mentions.exitSubmenu();
						} else {
							mentions.closeMenu();
							clearMentionState();
						}
						return;
				}
			}

			if ((e.key === "ArrowLeft" || e.key === "ArrowRight") && handleAtomicMentionNavigation(e)) {
				return;
			}

			if (e.key === "Backspace" && handleBackspaceOnMention(e)) return;

			if (e.key === "Backspace" && mentions.menuState.isOpen && mentionStartRef.current !== null) {
				const el = getElement();
				if (el) {
					if (selectAllPressedRef.current) {
						mentions.closeMenu();
						clearMentionState();
						selectAllPressedRef.current = false;
					} else {
						const cursorPos = SelectionUtils.getCursorPosition(el);
						const currentTrigger = activeTriggerRef.current ?? triggers[0] ?? "@";
						if (cursorPos === mentionStartRef.current + currentTrigger.length) {
							mentions.closeMenu();
							clearMentionState();
						}
					}
				}
			}

			if ((e.metaKey || e.ctrlKey) && e.key === "a") {
				selectAllPressedRef.current = true;
			} else if (e.key !== "Backspace") {
				selectAllPressedRef.current = false;
			}

			if (modKey && e.key === "z" && !e.shiftKey) {
				e.preventDefault();
				handleUndo();
			} else if (modKey && e.key === "z" && e.shiftKey) {
				e.preventDefault();
				handleRedo();
			} else if (e.ctrlKey && e.key === "y" && !isMac) {
				e.preventDefault();
				handleRedo();
			}

			if (e.key === "Enter" && !e.shiftKey) {
				e.preventDefault();
				const el = getElement();
				const defaultTrigger = triggers[0] ?? "@";
				const currentMentions = el ? MentionDOM.extractMentions(el, defaultTrigger) : [];
				onEnterRef.current?.(getValue(), currentMentions);
			}
		},
		[mentions, insertMention, handleBackspaceOnMention, handleUndo, handleRedo, handleAtomicMentionNavigation, getElement, triggers, getValue, clearMentionState]
	);

	const onKeyUp = useCallback(
		(e: React.KeyboardEvent<HTMLDivElement>) => {
			if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) {
				checkForMentionTrigger();
				updateMentionSelectionVisuals();
			}
		},
		[checkForMentionTrigger, updateMentionSelectionVisuals]
	);

	const onSelect = useCallback(() => {
		updateMentionSelectionVisuals();

		if (mentions.menuState.isOpen) {
			requestAnimationFrame(() => {
				checkForMentionTrigger();
			});
		}
	}, [mentions.menuState.isOpen, checkForMentionTrigger, updateMentionSelectionVisuals]);

	const onMouseDown = useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			const target = e.target as HTMLElement;

			const deleteButton = target.closest("[data-mention-delete]") as HTMLElement | null;
			if (deleteButton) {
				e.preventDefault();
				e.stopPropagation();

				const mentionElement = deleteButton.closest("[data-mention]") as HTMLElement | null;
				if (mentionElement) {
					const el = getElement();
					if (!el) return;

					const sel = SelectionUtils.get();
					if (sel) {
						const range = document.createRange();
						range.setStartAfter(mentionElement);
						range.collapse(true);
						sel.removeAllRanges();
						sel.addRange(range);
					}

					mentionElement.remove();
					updateState(getValue());
					saveToHistory();
					el.focus();
				}
				return;
			}

			const mentionElement = target.closest("[data-mention]") as HTMLElement | null;
			if (!mentionElement) return;

			const el = getElement();
			if (!el) return;

			e.preventDefault();

			// Call onMentionClick callback if provided
			if (onMentionClickRef.current) {
				const id = mentionElement.getAttribute("data-mention-id") || mentionElement.getAttribute("data-mention") || "";
				const label = mentionElement.getAttribute("data-mention") || "";
				const trigger = mentionElement.getAttribute("data-mention-trigger") || triggers[0] || "@";
				onMentionClickRef.current({ id, label, trigger });
			}

			const rect = mentionElement.getBoundingClientRect();
			const clickX = e.clientX;
			const mentionCenterX = rect.left + rect.width / 2;

			const sel = SelectionUtils.get();
			if (!sel) return;

			const range = document.createRange();

			if (clickX < mentionCenterX) {
				range.setStartBefore(mentionElement);
			} else {
				range.setStartAfter(mentionElement);
			}
			range.collapse(true);

			sel.removeAllRanges();
			sel.addRange(range);
			el.focus();
		},
		[getElement, getValue, updateState, saveToHistory, triggers]
	);

	const onInput = useCallback(() => {
		if (!getElement() || history.isUndoRedo()) return;

		updateState(getValue());
		saveToHistory();
		checkForMentionTrigger();
	}, [getElement, getValue, history, updateState, saveToHistory, checkForMentionTrigger]);

	useEffect(() => {
		const el = ref.current;
		if (el && initialValue) {
			el.innerHTML = MentionDOM.parseValueMulti(initialValue, mentionConfigs);
			const defaultTrigger = triggers[0] ?? "@";
			currentMentionsRef.current = MentionDOM.extractMentions(el, defaultTrigger);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		const handleSelectionChange = () => {
			const el = ref.current;
			if (!el) return;

			const sel = window.getSelection();
			if (sel && sel.rangeCount > 0) {
				const range = sel.getRangeAt(0);
				if (el.contains(range.commonAncestorContainer)) {
					updateMentionSelectionVisuals();
				} else {
					const mentionElements = el.querySelectorAll("[data-mention]");
					mentionElements.forEach((mention) => {
						mention.classList.remove("mention-selected");
					});
				}
			}
		};

		document.addEventListener("selectionchange", handleSelectionChange);
		return () => {
			document.removeEventListener("selectionchange", handleSelectionChange);
		};
	}, [updateMentionSelectionVisuals]);

	const closeMenu = useCallback(() => {
		mentions.closeMenu();
		clearMentionState();
	}, [mentions, clearMentionState]);

	return {
		ref,
		isEmpty,
		handlers: { onInput, onKeyDown, onKeyUp, onSelect, onMouseDown, onCopy, onCut, onPaste },
		mentions: {
			menuState: mentions.menuState,
			filteredOptions: mentions.filteredOptions,
			selectedIndex: mentions.selectedIndex,
			selectOption: insertMention,
			enterSubmenu: mentions.enterSubmenu,
			exitSubmenu: mentions.exitSubmenu,
			isInSubmenu: mentions.isInSubmenu,
			setSelectedIndex: mentions.setSelectedIndex,
			activeTrigger: mentions.activeTrigger,
			closeMenu,
			isKeyboardNavigating: mentions.isKeyboardNavigating,
			clearKeyboardNavigation: mentions.clearKeyboardNavigation,
		},
	};
}
