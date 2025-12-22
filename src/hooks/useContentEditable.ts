import { useRef, useCallback, useState, useEffect, useMemo } from "react";
import { useHistory } from "./useHistory";
import { useMentions } from "./useMentions";
import type { MentionOption, MentionTriggerConfig } from "./useMentions";

// Import types and utilities from contentEditable modules
import type {
	SelectedMention,
	MentionConfig,
	UseContentEditableOptions,
	UseContentEditableReturn,
} from "./contentEditable/types";
import { DEFAULT_MENTION_CONFIG } from "./contentEditable/types";
import { MentionDOM, normalizeValue } from "./contentEditable/mentionDOM";
import { SelectionUtils } from "./contentEditable/selectionUtils";

// Re-export types for external use
export type { SelectedMention, MentionConfig, UseContentEditableOptions, UseContentEditableReturn };
export { MentionDOM } from "./contentEditable/mentionDOM";
export { SelectionUtils } from "./contentEditable/selectionUtils";

// ============================================================================
// Main Hook
// ============================================================================

export function useContentEditable({
	initialValue = "",
	onChange,
	onEnter,
	onMentionAdded,
	onMentionDeleted,
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
	const selectionDirectionRef = useRef<"left" | "right" | null>(null);
	const currentMentionsRef = useRef<SelectedMention[]>([]);

	// Store callbacks in refs to ensure they're always up-to-date
	const onChangeRef = useRef(onChange);
	const onEnterRef = useRef(onEnter);
	const onMentionAddedRef = useRef(onMentionAdded);
	const onMentionDeletedRef = useRef(onMentionDeleted);
	onChangeRef.current = onChange;
	onEnterRef.current = onEnter;
	onMentionAddedRef.current = onMentionAdded;
	onMentionDeletedRef.current = onMentionDeleted;

	const history = useHistory({ initialValue });
	const mentions = useMentions({ configs: mentionHookConfigs });

	// ---------------------------------------------------------------------------
	// Helpers
	// ---------------------------------------------------------------------------

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

	// ---------------------------------------------------------------------------
	// History (Undo/Redo)
	// ---------------------------------------------------------------------------

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

	// ---------------------------------------------------------------------------
	// Mention Insertion
	// ---------------------------------------------------------------------------

	const insertMention = useCallback(
		(option: MentionOption) => {
			const el = getElement();
			const sel = SelectionUtils.get();
			if (!el || !sel || mentionStartRef.current === null || !activeTriggerRef.current) return;

			if (option.children && option.children.length > 0) {
				mentions.enterSubmenu(option);
				return;
			}

			const activeTrigger = activeTriggerRef.current;
			const activeConfig = mentionConfigs.find(c => c.trigger === activeTrigger);
			const showTrigger = activeConfig?.showTrigger ?? false;

			const textCursorPos = SelectionUtils.getCursorPosition(el);
			const textStartPos = mentionStartRef.current;
			const serialized = getValue();

			const serStartPos = MentionDOM.textPosToSerializedPosMulti(el, textStartPos, triggers);
			const serCursorPos = MentionDOM.textPosToSerializedPosMulti(el, textCursorPos, triggers);

			const before = serialized.slice(0, serStartPos);
			const after = serialized.slice(serCursorPos);
			const newValue = `${before}${activeTrigger}[${option.id}] ${after}`;

			const updatedConfigs = mentionConfigs.map(c =>
				c.trigger === activeTrigger
					? { ...c, options: [...c.options, option] }
					: c
			);
			el.innerHTML = MentionDOM.parseValueMulti(newValue, updatedConfigs);

			const iconOffset = option.icon ? 1 : 0;
			// If trigger is hidden, don't add its length to cursor position
			const triggerDisplayLen = showTrigger ? activeTrigger.length : 0;
			const newCursorPos = textStartPos + triggerDisplayLen + option.label.length + 1 + iconOffset;
			SelectionUtils.setCursorPosition(el, newCursorPos);

			mentionStartRef.current = null;
			mentionEndRef.current = null;
			activeTriggerRef.current = null;
			mentions.closeMenu();

			updateState(newValue);
			saveToHistory();
		},
		[getElement, getValue, triggers, mentionConfigs, mentions, updateState, saveToHistory]
	);

	// ---------------------------------------------------------------------------
	// Mention Trigger Detection
	// ---------------------------------------------------------------------------

	const checkForMentionTrigger = useCallback(() => {
		const el = getElement();
		if (!el) return;

		const content = el.textContent || "";
		if (!content.trim()) {
			if (mentions.menuState.isOpen) {
				mentions.closeMenu();
				mentionStartRef.current = null;
				mentionEndRef.current = null;
				activeTriggerRef.current = null;
			}
			return;
		}

		const range = SelectionUtils.getRange();
		if (!range) return;

		let node = range.startContainer;
		let cursorPos = range.startOffset;

		// Handle cursor at element level
		if (node.nodeType !== Node.TEXT_NODE) {
			if (node === el || node.nodeType === Node.ELEMENT_NODE) {
				const childNodes = Array.from(el.childNodes);
				let textNodeBefore: Node | null = null;
				let currentPos = 0;

				for (const child of childNodes) {
					const childLen = child.textContent?.length ?? 0;
					if (child.nodeType === Node.TEXT_NODE) {
						if (currentPos + childLen >= cursorPos || child === childNodes[childNodes.length - 1]) {
							textNodeBefore = child;
							break;
						}
					}
					currentPos += childLen;
				}

				if (textNodeBefore && textNodeBefore.nodeType === Node.TEXT_NODE) {
					node = textNodeBefore;
					cursorPos = textNodeBefore.textContent?.length ?? 0;
				} else {
					if (mentions.menuState.isOpen) {
						mentions.closeMenu();
						mentionStartRef.current = null;
						mentionEndRef.current = null;
						activeTriggerRef.current = null;
					}
					return;
				}
			} else {
				if (mentions.menuState.isOpen) {
					mentions.closeMenu();
					mentionStartRef.current = null;
					mentionEndRef.current = null;
					activeTriggerRef.current = null;
				}
				return;
			}
		}

		const text = node.textContent || "";
		const searchFromPos = Math.max(cursorPos, mentionEndRef.current ?? 0);
		let triggerPos = -1;
		let foundTrigger: string | null = null;

		for (let i = searchFromPos - 1; i >= 0; i--) {
			const char = text[i] ?? "";
			const matchedTrigger = triggers.find(t => text.slice(i, i + t.length) === t);
			if (matchedTrigger) {
				const prev = text[i - 1] ?? "";
				if (i === 0 || /\s/.test(prev)) {
					triggerPos = i;
					foundTrigger = matchedTrigger;
					break;
				}
			}
			if (/\s/.test(char)) break;
		}

		if (triggerPos !== -1 && foundTrigger) {
			if (cursorPos <= triggerPos) {
				if (mentions.menuState.isOpen) {
					mentions.closeMenu();
					mentionStartRef.current = null;
					mentionEndRef.current = null;
					activeTriggerRef.current = null;
				}
				return;
			}

			const preRange = range.cloneRange();
			preRange.selectNodeContents(el);
			preRange.setEnd(node, triggerPos);
			const absolutePos = preRange.toString().length;

			if (mentionEndRef.current === null || cursorPos > mentionEndRef.current) {
				mentionEndRef.current = cursorPos;
			}

			const searchEndPos = mentionEndRef.current;
			const searchText = text.slice(triggerPos + foundTrigger.length, searchEndPos);

			if (!mentions.menuState.isOpen) {
				mentionStartRef.current = absolutePos;
				mentionEndRef.current = cursorPos;
				activeTriggerRef.current = foundTrigger;
				mentions.openMenu(SelectionUtils.getCaretCoordinates(el), foundTrigger);
			}
			mentions.updateSearch(searchText);
		} else if (mentions.menuState.isOpen) {
			mentions.closeMenu();
			mentionStartRef.current = null;
			mentionEndRef.current = null;
			activeTriggerRef.current = null;
		}
	}, [getElement, triggers, mentions]);

	// ---------------------------------------------------------------------------
	// Backspace Handling
	// ---------------------------------------------------------------------------

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

	// ---------------------------------------------------------------------------
	// Atomic Mention Navigation
	// ---------------------------------------------------------------------------

	const isMentionInSelection = (mention: HTMLElement, range: Range): boolean => {
		const mentionRange = document.createRange();
		mentionRange.selectNode(mention);
		const startComparison = range.compareBoundaryPoints(Range.START_TO_START, mentionRange);
		const endComparison = range.compareBoundaryPoints(Range.END_TO_END, mentionRange);
		return startComparison <= 0 && endComparison >= 0;
	};

	const getSelectionDirection = (sel: Selection): "left" | "right" => {
		if (selectionDirectionRef.current) {
			return selectionDirectionRef.current;
		}
		if (!sel.anchorNode || !sel.focusNode) return "right";
		if (sel.anchorNode === sel.focusNode) {
			return sel.focusOffset < sel.anchorOffset ? "left" : "right";
		}
		const position = sel.anchorNode.compareDocumentPosition(sel.focusNode);
		if (position & Node.DOCUMENT_POSITION_PRECEDING) return "left";
		if (position & Node.DOCUMENT_POSITION_FOLLOWING) return "right";
		return "right";
	};

	const moveRangeBoundary = (
		range: Range,
		boundary: "start" | "end",
		moveDirection: "left" | "right"
	): Range | null => {
		const newRange = range.cloneRange();

		if (boundary === "start") {
			const node = range.startContainer;
			const offset = range.startOffset;

			if (moveDirection === "left") {
				if (node.nodeType === Node.TEXT_NODE && offset > 0) {
					newRange.setStart(node, offset - 1);
				} else if (node.nodeType === Node.TEXT_NODE && offset === 0) {
					const prev = node.previousSibling;
					if (prev && prev.nodeType === Node.TEXT_NODE) {
						const prevLen = prev.textContent?.length ?? 0;
						newRange.setStart(prev, Math.max(0, prevLen - 1));
					} else if (prev) {
						newRange.setStartBefore(prev);
					} else {
						return null;
					}
				} else if (node.nodeType === Node.ELEMENT_NODE && offset > 0) {
					const child = node.childNodes[offset - 1];
					if (child && child.nodeType === Node.TEXT_NODE) {
						const childLen = child.textContent?.length ?? 0;
						newRange.setStart(child, Math.max(0, childLen - 1));
					} else if (child) {
						newRange.setStartBefore(child);
					} else {
						return null;
					}
				} else {
					return null;
				}
			} else {
				if (node.nodeType === Node.TEXT_NODE) {
					const textLen = node.textContent?.length ?? 0;
					if (offset < textLen) {
						newRange.setStart(node, offset + 1);
					} else {
						const next = node.nextSibling;
						if (next && next.nodeType === Node.TEXT_NODE) {
							newRange.setStart(next, 1);
						} else if (next) {
							newRange.setStartAfter(next);
						} else {
							return null;
						}
					}
				} else if (node.nodeType === Node.ELEMENT_NODE) {
					const child = node.childNodes[offset];
					if (child && child.nodeType === Node.TEXT_NODE) {
						newRange.setStart(child, 1);
					} else if (child) {
						newRange.setStartAfter(child);
					} else {
						return null;
					}
				} else {
					return null;
				}
			}
		} else {
			const node = range.endContainer;
			const offset = range.endOffset;

			if (moveDirection === "right") {
				if (node.nodeType === Node.TEXT_NODE) {
					const textLen = node.textContent?.length ?? 0;
					if (offset < textLen) {
						newRange.setEnd(node, offset + 1);
					} else {
						const next = node.nextSibling;
						if (next && next.nodeType === Node.TEXT_NODE) {
							newRange.setEnd(next, 1);
						} else if (next) {
							newRange.setEndAfter(next);
						} else {
							return null;
						}
					}
				} else if (node.nodeType === Node.ELEMENT_NODE) {
					const child = node.childNodes[offset];
					if (child && child.nodeType === Node.TEXT_NODE) {
						newRange.setEnd(child, 1);
					} else if (child) {
						newRange.setEndAfter(child);
					} else {
						return null;
					}
				} else {
					return null;
				}
			} else {
				if (node.nodeType === Node.TEXT_NODE && offset > 0) {
					newRange.setEnd(node, offset - 1);
				} else if (node.nodeType === Node.TEXT_NODE && offset === 0) {
					const prev = node.previousSibling;
					if (prev && prev.nodeType === Node.TEXT_NODE) {
						const prevLen = prev.textContent?.length ?? 0;
						newRange.setEnd(prev, prevLen > 0 ? prevLen - 1 : 0);
					} else if (prev) {
						newRange.setEndBefore(prev);
					} else {
						return null;
					}
				} else if (node.nodeType === Node.ELEMENT_NODE && offset > 0) {
					const child = node.childNodes[offset - 1];
					if (child && child.nodeType === Node.TEXT_NODE) {
						const childLen = child.textContent?.length ?? 0;
						newRange.setEnd(child, childLen > 0 ? childLen - 1 : 0);
					} else if (child) {
						newRange.setEndBefore(child);
					} else {
						return null;
					}
				} else {
					return null;
				}
			}
		}

		return newRange;
	};

	const modifySelectionByOneChar = (
		sel: Selection,
		range: Range,
		arrowDirection: "left" | "right"
	): boolean => {
		const selDir = getSelectionDirection(sel);

		if (!selectionDirectionRef.current) {
			selectionDirectionRef.current = selDir;
		}

		const boundary: "start" | "end" = selDir === "left" ? "start" : "end";
		const newRange = moveRangeBoundary(range, boundary, arrowDirection);
		if (!newRange) return false;

		if (newRange.collapsed) {
			selectionDirectionRef.current = null;
			sel.removeAllRanges();
			sel.addRange(newRange);
			return true;
		}

		sel.removeAllRanges();
		sel.addRange(newRange);
		return true;
	};

	const handleAtomicMentionNavigation = useCallback(
		(e: React.KeyboardEvent<HTMLDivElement>): boolean => {
			const el = getElement();
			if (!el) return false;

			if (e.altKey || e.metaKey || e.ctrlKey) return false;

			const sel = SelectionUtils.get();
			if (!sel || sel.rangeCount === 0) return false;

			const range = sel.getRangeAt(0);
			const isLeft = e.key === "ArrowLeft";
			const isRight = e.key === "ArrowRight";
			const isShift = e.shiftKey;

			if (!isLeft && !isRight) return false;

			let adjacentMention: HTMLElement | null = null;

			if (isLeft) {
				const node = range.startContainer;
				const offset = range.startOffset;

				if (node.nodeType === Node.TEXT_NODE && offset === 0) {
					const prev = node.previousSibling;
					if (prev && MentionDOM.isMentionElement(prev)) {
						adjacentMention = prev as HTMLElement;
					}
				} else if (node.nodeType === Node.ELEMENT_NODE) {
					const child = node.childNodes[offset - 1];
					if (child && MentionDOM.isMentionElement(child)) {
						adjacentMention = child as HTMLElement;
					}
				}
			} else {
				const node = range.endContainer;
				const offset = range.endOffset;

				if (node.nodeType === Node.TEXT_NODE) {
					const textLen = node.textContent?.length ?? 0;
					if (offset === textLen) {
						const next = node.nextSibling;
						if (next && MentionDOM.isMentionElement(next)) {
							adjacentMention = next as HTMLElement;
						}
					}
				} else if (node.nodeType === Node.ELEMENT_NODE) {
					const child = node.childNodes[offset];
					if (child && MentionDOM.isMentionElement(child)) {
						adjacentMention = child as HTMLElement;
					}
				}
			}

			if (adjacentMention) {
				if (!range.collapsed && isMentionInSelection(adjacentMention, range)) {
					e.preventDefault();
					if (isShift) {
						modifySelectionByOneChar(sel, range, isLeft ? "left" : "right");
					} else {
						selectionDirectionRef.current = null;
						const newRange = document.createRange();
						if (isLeft) {
							newRange.setStart(range.startContainer, range.startOffset);
						} else {
							newRange.setStart(range.endContainer, range.endOffset);
						}
						newRange.collapse(true);
						sel.removeAllRanges();
						sel.addRange(newRange);
					}
					return true;
				}

				e.preventDefault();

				const newRange = document.createRange();

				if (isShift) {
					if (range.collapsed) {
						selectionDirectionRef.current = isLeft ? "left" : "right";
					}
					if (isLeft) {
						newRange.setStartBefore(adjacentMention);
						newRange.setEnd(range.endContainer, range.endOffset);
					} else {
						newRange.setStart(range.startContainer, range.startOffset);
						newRange.setEndAfter(adjacentMention);
					}
				} else {
					selectionDirectionRef.current = null;
					if (isLeft) {
						newRange.setStartBefore(adjacentMention);
						newRange.collapse(true);
					} else {
						newRange.setStartAfter(adjacentMention);
						newRange.collapse(true);
					}
				}

				sel.removeAllRanges();
				sel.addRange(newRange);
				return true;
			}

			if (!range.collapsed) {
				const mentionElements = el.querySelectorAll("[data-mention]");
				for (const mention of Array.from(mentionElements)) {
					if (isMentionInSelection(mention as HTMLElement, range)) {
						e.preventDefault();
						if (isShift) {
							modifySelectionByOneChar(sel, range, isLeft ? "left" : "right");
						} else {
							selectionDirectionRef.current = null;
							const newRange = document.createRange();
							if (isLeft) {
								newRange.setStart(range.startContainer, range.startOffset);
							} else {
								newRange.setStart(range.endContainer, range.endOffset);
							}
							newRange.collapse(true);
							sel.removeAllRanges();
							sel.addRange(newRange);
						}
						return true;
					}
				}
			}

			return false;
		},
		[getElement]
	);

	// ---------------------------------------------------------------------------
	// Event Handlers
	// ---------------------------------------------------------------------------

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
							mentionStartRef.current = null;
							mentionEndRef.current = null;
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
						mentionStartRef.current = null;
						mentionEndRef.current = null;
						activeTriggerRef.current = null;
						selectAllPressedRef.current = false;
					} else {
						const cursorPos = SelectionUtils.getCursorPosition(el);
						const currentTrigger = activeTriggerRef.current ?? triggers[0] ?? "@";
						if (cursorPos === mentionStartRef.current + currentTrigger.length) {
							mentions.closeMenu();
							mentionStartRef.current = null;
							mentionEndRef.current = null;
							activeTriggerRef.current = null;
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
		[mentions, insertMention, handleBackspaceOnMention, handleUndo, handleRedo, handleAtomicMentionNavigation, getElement, triggers, getValue]
	);

	const updateMentionSelectionVisuals = useCallback(() => {
		const el = getElement();
		if (!el) return;

		const sel = SelectionUtils.get();
		const mentionElements = el.querySelectorAll("[data-mention]");

		mentionElements.forEach((mention) => {
			mention.classList.remove("mention-selected");
		});

		if (!sel || sel.rangeCount === 0) return;
		const range = sel.getRangeAt(0);
		if (range.collapsed) return;

		mentionElements.forEach((mention) => {
			if (isMentionInSelection(mention as HTMLElement, range)) {
				mention.classList.add("mention-selected");
			}
		});
	}, [getElement]);

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
		[getElement, getValue, updateState, saveToHistory]
	);

	const onInput = useCallback(() => {
		if (!getElement() || history.isUndoRedo()) return;

		updateState(getValue());
		saveToHistory();
		checkForMentionTrigger();
	}, [getElement, getValue, history, updateState, saveToHistory, checkForMentionTrigger]);

	// ---------------------------------------------------------------------------
	// Clipboard Handlers
	// ---------------------------------------------------------------------------

	const getSelectedSerializedContent = useCallback((): { text: string; html: string } => {
		const sel = SelectionUtils.get();
		if (!sel || sel.rangeCount === 0) {
			return { text: "", html: "" };
		}

		const range = sel.getRangeAt(0);
		if (range.collapsed) {
			return { text: "", html: "" };
		}

		const fragment = range.cloneContents();
		const tempDiv = document.createElement("div");
		tempDiv.appendChild(fragment);

		const serializedText = MentionDOM.extractValueMulti(tempDiv, triggers);
		const html = tempDiv.innerHTML;

		return { text: serializedText, html };
	}, [triggers]);

	const onCopy = useCallback(
		(e: React.ClipboardEvent<HTMLDivElement>) => {
			const { text, html } = getSelectedSerializedContent();

			if (text || html) {
				e.preventDefault();
				e.clipboardData.setData("text/plain", text);
				e.clipboardData.setData("text/html", html);
			}
		},
		[getSelectedSerializedContent]
	);

	const onCut = useCallback(
		(e: React.ClipboardEvent<HTMLDivElement>) => {
			const el = getElement();
			const sel = SelectionUtils.get();
			if (!el || !sel) return;

			const { text, html } = getSelectedSerializedContent();

			if (text || html) {
				e.preventDefault();
				e.clipboardData.setData("text/plain", text);
				e.clipboardData.setData("text/html", html);

				const range = sel.getRangeAt(0);
				range.deleteContents();

				updateState(getValue());
				saveToHistory();
			}
		},
		[getElement, getSelectedSerializedContent, getValue, updateState, saveToHistory]
	);

	const onPaste = useCallback(
		(e: React.ClipboardEvent<HTMLDivElement>) => {
			e.preventDefault();

			const el = getElement();
			const sel = SelectionUtils.get();
			if (!el || !sel || sel.rangeCount === 0) return;

			const pastedText = e.clipboardData.getData("text/plain");
			if (!pastedText) return;

			const range = sel.getRangeAt(0);

			if (!range.collapsed) {
				range.deleteContents();
			}

			const parsedHTML = MentionDOM.parseValueMulti(pastedText, mentionConfigs);

			const tempDiv = document.createElement("div");
			tempDiv.innerHTML = parsedHTML;

			const nodesToInsert = Array.from(tempDiv.childNodes);
			let lastInsertedNode: Node | null = null;

			nodesToInsert.forEach((node) => {
				const insertedNode = node.cloneNode(true);
				range.insertNode(insertedNode);
				range.setStartAfter(insertedNode);
				range.collapse(true);
				lastInsertedNode = insertedNode;
			});

			if (lastInsertedNode) {
				range.setStartAfter(lastInsertedNode);
				range.collapse(true);
				sel.removeAllRanges();
				sel.addRange(range);
			}

			updateState(getValue());
			saveToHistory();
		},
		[getElement, getValue, mentionConfigs, updateState, saveToHistory]
	);

	// ---------------------------------------------------------------------------
	// Effects
	// ---------------------------------------------------------------------------

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

	// ---------------------------------------------------------------------------
	// Return
	// ---------------------------------------------------------------------------

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
		},
	};
}
