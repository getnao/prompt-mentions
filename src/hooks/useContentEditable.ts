import { useRef, useCallback, useState, useEffect } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { useHistory } from "./useHistory";
import { useMentions } from "./useMentions";
import type { MentionOption } from "./useMentions";
import type { ReactNode } from "react";

// ============================================================================
// Types
// ============================================================================

export interface SelectedMention {
	id: string;
	label: string;
}

export interface UseContentEditableOptions {
	initialValue?: string | undefined;
	mentionTrigger?: string | undefined;
	mentionOptions?: MentionOption[] | undefined;
	onChange?: ((value: string, mentions: SelectedMention[]) => void) | undefined;
	onEnter?: ((value: string, mentions: SelectedMention[]) => void) | undefined;
	onMentionAdded?: ((mention: SelectedMention) => void) | undefined;
	onMentionDeleted?: ((mention: SelectedMention) => void) | undefined;
}

export interface UseContentEditableReturn {
	ref: React.RefObject<HTMLDivElement | null>;
	isEmpty: boolean;
	handlers: {
		onInput: () => void;
		onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
		onKeyUp: (e: React.KeyboardEvent<HTMLDivElement>) => void;
		onSelect: () => void;
		onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
		onCopy: (e: React.ClipboardEvent<HTMLDivElement>) => void;
		onCut: (e: React.ClipboardEvent<HTMLDivElement>) => void;
		onPaste: (e: React.ClipboardEvent<HTMLDivElement>) => void;
	};
	mentions: {
		menuState: ReturnType<typeof useMentions>["menuState"];
		filteredOptions: MentionOption[];
		selectedIndex: number;
		selectOption: (option: MentionOption) => void;
		enterSubmenu: (option: MentionOption) => void;
		exitSubmenu: () => void;
		isInSubmenu: boolean;
		setSelectedIndex: (index: number) => void;
	};
}

// ============================================================================
// String Utilities
// ============================================================================

const escapeRegex = (str: string): string =>
	str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeValue = (raw: string): string =>
	raw.replace(/\u00A0/g, " ").trim() ? raw : "";

/**
 * Flatten nested options into a flat array for icon lookup
 */
const flattenOptions = (options: MentionOption[]): MentionOption[] => {
	const result: MentionOption[] = [];
	for (const opt of options) {
		result.push(opt);
		if (opt.children) {
			result.push(...flattenOptions(opt.children));
		}
	}
	return result;
};

// ============================================================================
// Icon Utilities
// ============================================================================

const iconToHTML = (icon: ReactNode): string => {
	if (!icon) return "";
	if (typeof icon === "string") return icon;
	try {
		return renderToStaticMarkup(icon as React.ReactElement);
	} catch {
		return "";
	}
};

// ============================================================================
// Mention DOM Utilities
// ============================================================================

const MentionDOM = {
	createHTML(id: string, label: string, trigger: string, icon?: ReactNode): string {
		// X icon SVG for delete
		const deleteIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M18 6L6 18M6 6l12 12"/></svg>`;
		// Icon container with both original icon and delete X (swaps on hover)
		const iconHTML = icon
			? `<span class="mention-pill-icon" data-mention-delete="true"><span class="mention-pill-icon-original">${iconToHTML(icon)}</span><span class="mention-pill-icon-delete">${deleteIconSVG}</span></span>`
			: "";
		// Store icon HTML in data attribute for later reconstruction
		const iconAttr = icon ? ` data-icon="${encodeURIComponent(iconToHTML(icon))}"` : "";
		// Store both id and label - data-mention stores the label for display, data-mention-id stores the id for serialization
		return `<span contenteditable="false" data-mention="${label}" data-mention-id="${id}"${iconAttr} class="mention-pill">${iconHTML}${trigger}${label}</span>`;
	},

	isMentionElement(node: Node): node is HTMLElement {
		return (
			node.nodeType === Node.ELEMENT_NODE &&
			(node as HTMLElement).hasAttribute("data-mention")
		);
	},

	parseValue(value: string, trigger: string, options?: MentionOption[]): string {
		const regex = new RegExp(`${escapeRegex(trigger)}\\[([^\\]]+)\\]`, "g");
		return value.replace(regex, (_, idOrLabel) => {
			// Try to find the option by id first, then by label (for backward compatibility)
			const option = options?.find(opt => opt.id === idOrLabel) || options?.find(opt => opt.label === idOrLabel);
			const id = option?.id || idOrLabel;
			const label = option?.label || idOrLabel;
			return this.createHTML(id, label, trigger, option?.icon);
		});
	},

	/**
	 * Reconstruct mention HTML including icons from stored data attributes.
	 * Used when parsing existing content that may have icon data.
	 */
	parseValueWithIcons(value: string, trigger: string): string {
		const regex = new RegExp(`${escapeRegex(trigger)}\\[([^\\]]+)\\]`, "g");
		return value.replace(regex, (_, idOrLabel) => this.createHTML(idOrLabel, idOrLabel, trigger));
	},

	extractValue(element: HTMLElement, trigger: string): string {
		let result = "";

		const walk = (node: Node) => {
			if (node.nodeType === Node.TEXT_NODE) {
				result += node.textContent || "";
			} else if (this.isMentionElement(node)) {
				// Use the id for serialization if available, otherwise fall back to label
				const id = node.getAttribute("data-mention-id") || node.getAttribute("data-mention");
				result += `${trigger}[${id}]`;
			} else if (node.nodeType === Node.ELEMENT_NODE) {
				node.childNodes.forEach(walk);
			}
		};

		walk(element);
		return result;
	},

	/**
	 * Extract all mentions from the element as SelectedMention array
	 */
	extractMentions(element: HTMLElement): SelectedMention[] {
		const mentions: SelectedMention[] = [];
		const mentionElements = element.querySelectorAll("[data-mention]");
		mentionElements.forEach((el) => {
			const label = el.getAttribute("data-mention") || "";
			const id = el.getAttribute("data-mention-id") || label;
			mentions.push({ id, label });
		});
		return mentions;
	},

	/**
	 * Convert a text position (from innerText) to a serialized position (with @[id] syntax).
	 * This is needed because mention spans display as "@Name" but serialize as "@[id]".
	 */
	textPosToSerializedPos(element: HTMLElement, textPos: number, trigger: string): number {
		let textOffset = 0;
		let serializedOffset = 0;

		const walk = (node: Node): boolean => {
			if (node.nodeType === Node.TEXT_NODE) {
				const len = node.textContent?.length ?? 0;
				if (textOffset + len >= textPos) {
					serializedOffset += textPos - textOffset;
					return true;
				}
				textOffset += len;
				serializedOffset += len;
			} else if (this.isMentionElement(node)) {
				const displayLen = node.textContent?.length ?? 0;
				// Use id for serialization
				const id = node.getAttribute("data-mention-id") || node.getAttribute("data-mention") || "";
				const serializedLen = trigger.length + id.length + 2; // @[id]

				if (textOffset + displayLen >= textPos) {
					// Position is within or at the mention - map to end of serialized
					serializedOffset += serializedLen;
					return true;
				}
				textOffset += displayLen;
				serializedOffset += serializedLen;
			} else if (node.nodeType === Node.ELEMENT_NODE) {
				for (const child of Array.from(node.childNodes)) {
					if (walk(child)) return true;
				}
			}
			return false;
		};

		walk(element);
		return serializedOffset;
	},
};

// ============================================================================
// Selection Utilities
// ============================================================================

const SelectionUtils = {
	get(): Selection | null {
		return window.getSelection();
	},

	getRange(): Range | null {
		const sel = this.get();
		return sel && sel.rangeCount > 0 ? sel.getRangeAt(0) : null;
	},

	getCursorPosition(container: HTMLElement): number {
		const range = this.getRange();
		if (!range) return 0;

		const preCaretRange = range.cloneRange();
		preCaretRange.selectNodeContents(container);
		preCaretRange.setEnd(range.endContainer, range.endOffset);
		return preCaretRange.toString().length;
	},

	setCursorPosition(container: HTMLElement, position: number): void {
		const sel = this.get();
		if (!sel) return;

		const range = document.createRange();
		let currentPos = 0;
		let found = false;

		const walk = (node: Node): boolean => {
			if (node.nodeType === Node.TEXT_NODE) {
				const len = node.textContent?.length ?? 0;
				if (currentPos + len >= position) {
					range.setStart(node, position - currentPos);
					range.collapse(true);
					found = true;
					return true;
				}
				currentPos += len;
			} else if (MentionDOM.isMentionElement(node)) {
				const len = node.textContent?.length ?? 0;
				if (currentPos + len >= position) {
					range.setStartAfter(node);
					range.collapse(true);
					found = true;
					return true;
				}
				currentPos += len;
			} else if (node.nodeType === Node.ELEMENT_NODE) {
				for (const child of Array.from(node.childNodes)) {
					if (walk(child)) return true;
				}
			}
			return false;
		};

		walk(container);

		if (!found) {
			range.selectNodeContents(container);
			range.collapse(false);
		}

		sel.removeAllRanges();
		sel.addRange(range);
	},

	getCaretCoordinates(container: HTMLElement): { top: number; left: number; bottom: number; height: number } {
		const range = this.getRange();
		if (!range) return { top: 0, left: 0, bottom: 0, height: 0 };

		const rect = range.getBoundingClientRect();

		if (rect.width === 0 && rect.height === 0) {
			const containerRect = container.getBoundingClientRect();
			// Fallback to container position with estimated line height
			const height = 20;
			return {
				top: containerRect.top,
				left: containerRect.left,
				bottom: containerRect.top + height,
				height,
			};
		}

		return {
			top: rect.top,
			left: rect.left,
			bottom: rect.bottom,
			height: rect.height,
		};
	},

	setAfter(sel: Selection, node: Node, offset = 1): void {
		const range = document.createRange();
		range.setStart(node, offset);
		range.collapse(true);
		sel.removeAllRanges();
		sel.addRange(range);
	},
};

// ============================================================================
// Main Hook
// ============================================================================

export function useContentEditable({
	initialValue = "",
	onChange,
	onEnter,
	onMentionAdded,
	onMentionDeleted,
	mentionTrigger = "@",
	mentionOptions,
}: UseContentEditableOptions = {}): UseContentEditableReturn {
	const ref = useRef<HTMLDivElement>(null);
	const [isEmpty, setIsEmpty] = useState(!initialValue);
	const mentionStartRef = useRef<number | null>(null);
	const mentionEndRef = useRef<number | null>(null); // Tracks the furthest position in search text
	const selectAllPressedRef = useRef(false);
	// Track the direction of selection: "left" means we're selecting leftward (focus is at start)
	const selectionDirectionRef = useRef<"left" | "right" | null>(null);
	// Track current mentions for detecting additions/deletions
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
	const mentions = useMentions({ trigger: mentionTrigger, options: mentionOptions });

	// ---------------------------------------------------------------------------
	// Helpers
	// ---------------------------------------------------------------------------

	const getElement = useCallback(() => ref.current, []);

	const getValue = useCallback(() => {
		const el = getElement();
		return el ? MentionDOM.extractValue(el, mentionTrigger) : "";
	}, [getElement, mentionTrigger]);

	const updateState = useCallback(
		(value: string) => {
			const el = ref.current;
			const normalized = normalizeValue(value);
			setIsEmpty(!normalized);

			// Extract current mentions from DOM
			const newMentions = el ? MentionDOM.extractMentions(el) : [];
			const prevMentions = currentMentionsRef.current;

			// Detect added mentions
			const addedMentions = newMentions.filter(
				(m) => !prevMentions.some((p) => p.id === m.id)
			);
			// Detect deleted mentions
			const deletedMentions = prevMentions.filter(
				(p) => !newMentions.some((m) => m.id === p.id)
			);

			// Update ref with current mentions
			currentMentionsRef.current = newMentions;

			// Call callbacks for additions (using refs for latest callback)
			addedMentions.forEach((m) => onMentionAddedRef.current?.(m));

			// Call callbacks for deletions (using refs for latest callback)
			deletedMentions.forEach((m) => onMentionDeletedRef.current?.(m));

			// Call onChange with value and mentions (using ref for latest callback)
			onChangeRef.current?.(normalized, newMentions);
		},
		[]
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

			el.innerHTML = MentionDOM.parseValue(content, mentionTrigger, mentionOptions);
			updateState(MentionDOM.extractValue(el, mentionTrigger));
			requestAnimationFrame(() => SelectionUtils.setCursorPosition(el, cursorPosition));
		},
		[getElement, mentionTrigger, mentionOptions, updateState]
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
			if (!el || !sel || mentionStartRef.current === null) return;

			// If option has children, enter submenu instead of inserting
			if (option.children && option.children.length > 0) {
				mentions.enterSubmenu(option);
				return;
			}

			// Get text positions
			const textCursorPos = SelectionUtils.getCursorPosition(el);
			const textStartPos = mentionStartRef.current;

			// Get serialized value (preserves existing @[id] syntax)
			const serialized = getValue();

			// Convert text positions to serialized positions
			const serStartPos = MentionDOM.textPosToSerializedPos(el, textStartPos, mentionTrigger);
			const serCursorPos = MentionDOM.textPosToSerializedPos(el, textCursorPos, mentionTrigger);

			// Build new serialized value with the new mention (using id)
			const before = serialized.slice(0, serStartPos);
			const after = serialized.slice(serCursorPos);
			const newValue = `${before}${mentionTrigger}[${option.id}] ${after}`;

			// Parse and set HTML (this restores all mention spans including existing ones)
			// We need to include the new option's icon, so we create a temporary options array
			const allOptions = mentionOptions ? [...mentionOptions, option] : [option];
			el.innerHTML = MentionDOM.parseValue(newValue, mentionTrigger, flattenOptions(allOptions));

			// Position cursor after the new mention (after the space)
			// Account for icon space if present
			const iconOffset = option.icon ? 1 : 0;
			const newCursorPos = textStartPos + mentionTrigger.length + option.label.length + 1 + iconOffset;
			SelectionUtils.setCursorPosition(el, newCursorPos);

			// Cleanup
			mentionStartRef.current = null;
			mentionEndRef.current = null;
			mentions.closeMenu();

			updateState(newValue);
			saveToHistory();
		},
		[getElement, getValue, mentionTrigger, mentionOptions, mentions, updateState, saveToHistory]
	);

	// ---------------------------------------------------------------------------
	// Mention Trigger Detection
	// ---------------------------------------------------------------------------

	const checkForMentionTrigger = useCallback(() => {
		const el = getElement();
		if (!el) return;

		// If element is empty, close menu
		const content = el.textContent || "";
		if (!content.trim()) {
			if (mentions.menuState.isOpen) {
				mentions.closeMenu();
				mentionStartRef.current = null;
				mentionEndRef.current = null;
			}
			return;
		}

		const range = SelectionUtils.getRange();
		if (!range) return;

		let node = range.startContainer;
		let cursorPos = range.startOffset;

		// If cursor is at the container level (not in a text node), check if we're
		// positioned right after a text node (e.g., after Cmd+A → ArrowRight)
		if (node.nodeType !== Node.TEXT_NODE) {
			// Check if we're at the element level and there's a preceding text node
			if (node === el || node.nodeType === Node.ELEMENT_NODE) {
				const childNodes = Array.from(el.childNodes);
				// Find the text node at or before our position
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

				// If we found a text node, use it instead
				if (textNodeBefore && textNodeBefore.nodeType === Node.TEXT_NODE) {
					node = textNodeBefore;
					cursorPos = textNodeBefore.textContent?.length ?? 0;
				} else {
					// No text node found, close menu if open
					if (mentions.menuState.isOpen) {
						mentions.closeMenu();
						mentionStartRef.current = null;
						mentionEndRef.current = null;
					}
					return;
				}
			} else {
				// Cursor is somewhere else (e.g., after a mention pill)
				if (mentions.menuState.isOpen) {
					mentions.closeMenu();
					mentionStartRef.current = null;
					mentionEndRef.current = null;
				}
				return;
			}
		}

		const text = node.textContent || "";

		// Find trigger position by searching backward from cursor
		// We need to search from the furthest point we've been to, not just current cursor
		const searchFromPos = Math.max(cursorPos, mentionEndRef.current ?? 0);
		let triggerPos = -1;
		for (let i = searchFromPos - 1; i >= 0; i--) {
			const char = text[i] ?? "";
			if (char === mentionTrigger) {
				const prev = text[i - 1] ?? "";
				if (i === 0 || /\s/.test(prev)) {
					triggerPos = i;
					break;
				}
			}
			if (/\s/.test(char)) break;
		}

		if (triggerPos !== -1) {
			// Check if cursor is still within the trigger context (between trigger and end)
			if (cursorPos <= triggerPos) {
				// Cursor moved before the trigger, close menu
				if (mentions.menuState.isOpen) {
					mentions.closeMenu();
					mentionStartRef.current = null;
					mentionEndRef.current = null;
				}
				return;
			}

			const preRange = range.cloneRange();
			preRange.selectNodeContents(el);
			preRange.setEnd(node, triggerPos);
			const absolutePos = preRange.toString().length;

			// Track the furthest position for search text calculation
			// Only extend the end position, never shrink it (until menu closes)
			if (mentionEndRef.current === null || cursorPos > mentionEndRef.current) {
				mentionEndRef.current = cursorPos;
			}

			// Use the tracked end position for search, not current cursor position
			// This prevents search from changing when navigating left within search text
			const searchEndPos = mentionEndRef.current;
			const searchText = text.slice(triggerPos + 1, searchEndPos);

			if (!mentions.menuState.isOpen) {
				mentionStartRef.current = absolutePos;
				mentionEndRef.current = cursorPos; // Initialize end position
				mentions.openMenu(SelectionUtils.getCaretCoordinates(el));
			}
			mentions.updateSearch(searchText);
		} else if (mentions.menuState.isOpen) {
			mentions.closeMenu();
			mentionStartRef.current = null;
			mentionEndRef.current = null;
		}
	}, [getElement, mentionTrigger, mentions]);

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

	/**
	 * Check if a mention element is within the current selection range.
	 */
	const isMentionInSelection = (mention: HTMLElement, range: Range): boolean => {
		const mentionRange = document.createRange();
		mentionRange.selectNode(mention);

		// Check if mention start is >= selection start AND mention end is <= selection end
		const startComparison = range.compareBoundaryPoints(Range.START_TO_START, mentionRange);
		const endComparison = range.compareBoundaryPoints(Range.END_TO_END, mentionRange);

		// mention is within selection if selection starts before/at mention start
		// AND selection ends after/at mention end
		return startComparison <= 0 && endComparison >= 0;
	};

	/**
	 * Determine the selection direction. Uses tracked direction if available,
	 * otherwise falls back to detecting from Selection API.
	 */
	const getSelectionDirection = (sel: Selection): "left" | "right" => {
		// If we've tracked the direction, use that
		if (selectionDirectionRef.current) {
			return selectionDirectionRef.current;
		}

		// Fallback: try to detect from Selection API
		if (!sel.anchorNode || !sel.focusNode) return "right";

		// Check if anchor and focus are the same node
		if (sel.anchorNode === sel.focusNode) {
			// Same node - compare offsets
			return sel.focusOffset < sel.anchorOffset ? "left" : "right";
		}

		// Different nodes - compare positions
		const position = sel.anchorNode.compareDocumentPosition(sel.focusNode);
		if (position & Node.DOCUMENT_POSITION_PRECEDING) {
			// Focus is before anchor = selecting leftward
			return "left";
		}
		if (position & Node.DOCUMENT_POSITION_FOLLOWING) {
			// Focus is after anchor = selecting rightward
			return "right";
		}

		// If focus is contained within anchor or vice versa, use offset comparison
		// This handles cases like selecting within a text node that's a child
		return "right";
	};

	/**
	 * Move a range boundary by one character.
	 * @param boundary - "start" or "end" of the range to modify
	 * @param moveDirection - "left" or "right" direction to move
	 */
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
				// Move start to the left
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
				// Move start to the right (contract selection from left)
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
			// boundary === "end"
			const node = range.endContainer;
			const offset = range.endOffset;

			if (moveDirection === "right") {
				// Move end to the right (extend selection)
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
				// Move end to the left (contract selection from right)
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

	/**
	 * Modify selection by one character in the given arrow direction.
	 * Handles both extending and contracting based on selection direction.
	 */
	const modifySelectionByOneChar = (
		sel: Selection,
		range: Range,
		arrowDirection: "left" | "right"
	): boolean => {
		const selDir = getSelectionDirection(sel);

		// Save the direction so subsequent operations use the same direction
		// (because addRange resets anchor/focus to forward selection)
		if (!selectionDirectionRef.current) {
			selectionDirectionRef.current = selDir;
		}

		// Determine which boundary to modify and in which direction
		// If selecting leftward: focus is at range.start
		// If selecting rightward: focus is at range.end
		let boundary: "start" | "end";

		if (selDir === "left") {
			// Focus is at range.start, move start in arrow direction
			boundary = "start";
		} else {
			// Focus is at range.end, move end in arrow direction
			boundary = "end";
		}

		const newRange = moveRangeBoundary(range, boundary, arrowDirection);
		if (!newRange) return false;

		// Check if selection would become collapsed or inverted
		if (newRange.collapsed) {
			// Selection fully contracted - just set cursor position
			selectionDirectionRef.current = null;
			sel.removeAllRanges();
			sel.addRange(newRange);
			return true;
		}

		sel.removeAllRanges();
		sel.addRange(newRange);
		return true;
	};

	/**
	 * Move cursor by one character in the given direction.
	 */
	const moveCursorByOneChar = (
		sel: Selection,
		range: Range,
		direction: "left" | "right"
	): boolean => {
		const newRange = document.createRange();

		if (direction === "left") {
			const node = range.startContainer;
			const offset = range.startOffset;

			if (node.nodeType === Node.TEXT_NODE && offset > 0) {
				newRange.setStart(node, offset - 1);
				newRange.collapse(true);
			} else if (node.nodeType === Node.TEXT_NODE && offset === 0) {
				const prev = node.previousSibling;
				if (prev && prev.nodeType === Node.TEXT_NODE) {
					const prevLen = prev.textContent?.length ?? 0;
					newRange.setStart(prev, prevLen);
					newRange.collapse(true);
				} else if (prev) {
					newRange.setStartAfter(prev);
					newRange.collapse(true);
				} else {
					return false;
				}
			} else if (node.nodeType === Node.ELEMENT_NODE && offset > 0) {
				const child = node.childNodes[offset - 1];
				if (child && child.nodeType === Node.TEXT_NODE) {
					const childLen = child.textContent?.length ?? 0;
					newRange.setStart(child, childLen);
					newRange.collapse(true);
				} else if (child) {
					newRange.setStartAfter(child);
					newRange.collapse(true);
				} else {
					return false;
				}
			} else {
				return false;
			}
		} else {
			const node = range.endContainer;
			const offset = range.endOffset;

			if (node.nodeType === Node.TEXT_NODE) {
				const textLen = node.textContent?.length ?? 0;
				if (offset < textLen) {
					newRange.setStart(node, offset + 1);
					newRange.collapse(true);
				} else {
					const next = node.nextSibling;
					if (next && next.nodeType === Node.TEXT_NODE) {
						newRange.setStart(next, 0);
						newRange.collapse(true);
					} else if (next) {
						newRange.setStartAfter(next);
						newRange.collapse(true);
					} else {
						return false;
					}
				}
			} else if (node.nodeType === Node.ELEMENT_NODE) {
				const child = node.childNodes[offset];
				if (child && child.nodeType === Node.TEXT_NODE) {
					newRange.setStart(child, 0);
					newRange.collapse(true);
				} else if (child) {
					newRange.setStartAfter(child);
					newRange.collapse(true);
				} else {
					return false;
				}
			} else {
				return false;
			}
		}

		sel.removeAllRanges();
		sel.addRange(newRange);
		return true;
	};

	/**
	 * Handle arrow key navigation to treat mentions as atomic units.
	 * Returns true if the event was handled.
	 */
	const handleAtomicMentionNavigation = useCallback(
		(e: React.KeyboardEvent<HTMLDivElement>): boolean => {
			const el = getElement();
			if (!el) return false;

			// Don't intercept Alt+Arrow (word-by-word navigation) or Cmd/Ctrl+Arrow (line navigation)
			if (e.altKey || e.metaKey || e.ctrlKey) return false;

			const sel = SelectionUtils.get();
			if (!sel || sel.rangeCount === 0) return false;

			const range = sel.getRangeAt(0);
			const isLeft = e.key === "ArrowLeft";
			const isRight = e.key === "ArrowRight";
			const isShift = e.shiftKey;

			if (!isLeft && !isRight) return false;

			// Find adjacent mention
			let adjacentMention: HTMLElement | null = null;

			if (isLeft) {
				// Check if there's a mention to the left of the cursor/selection start
				const node = range.startContainer;
				const offset = range.startOffset;

				if (node.nodeType === Node.TEXT_NODE && offset === 0) {
					// At start of text node, check previous sibling
					const prev = node.previousSibling;
					if (prev && MentionDOM.isMentionElement(prev)) {
						adjacentMention = prev as HTMLElement;
					}
				} else if (node.nodeType === Node.ELEMENT_NODE) {
					// Cursor is at element level, check child before offset
					const child = node.childNodes[offset - 1];
					if (child && MentionDOM.isMentionElement(child)) {
						adjacentMention = child as HTMLElement;
					}
				}
			} else {
				// Check if there's a mention to the right of the cursor/selection end
				const node = range.endContainer;
				const offset = range.endOffset;

				if (node.nodeType === Node.TEXT_NODE) {
					const textLen = node.textContent?.length ?? 0;
					if (offset === textLen) {
						// At end of text node, check next sibling
						const next = node.nextSibling;
						if (next && MentionDOM.isMentionElement(next)) {
							adjacentMention = next as HTMLElement;
						}
					}
				} else if (node.nodeType === Node.ELEMENT_NODE) {
					// Cursor is at element level, check child at offset
					const child = node.childNodes[offset];
					if (child && MentionDOM.isMentionElement(child)) {
						adjacentMention = child as HTMLElement;
					}
				}
			}

			// If we found an adjacent mention, handle it atomically
			if (adjacentMention) {
				// If the mention is already within the selection, extend by one char instead
				if (!range.collapsed && isMentionInSelection(adjacentMention, range)) {
					e.preventDefault();
					if (isShift) {
						modifySelectionByOneChar(sel, range, isLeft ? "left" : "right");
					} else {
						// Without shift, collapse selection to the appropriate end
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
					// Extend selection to include the mention
					// Track the initial selection direction when starting from collapsed
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
					// Just move cursor past the mention
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

			// No adjacent mention found, but if we have a selection with mentions inside,
			// we need to handle Arrow keys (jsdom doesn't do this automatically)
			if (!range.collapsed) {
				// Check if there are any mentions inside the current selection
				const mentionElements = el.querySelectorAll("[data-mention]");
				for (const mention of mentionElements) {
					if (isMentionInSelection(mention as HTMLElement, range)) {
						e.preventDefault();
						if (isShift) {
							modifySelectionByOneChar(sel, range, isLeft ? "left" : "right");
						} else {
							// Collapse selection to appropriate end
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
							// If item has children, enter submenu; otherwise select it
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
						// If in submenu, go back to parent; otherwise close menu
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

			// Handle atomic mention navigation (treat mentions as single units)
			if ((e.key === "ArrowLeft" || e.key === "ArrowRight") && handleAtomicMentionNavigation(e)) {
				return;
			}

			// Backspace on mention
			if (e.key === "Backspace" && handleBackspaceOnMention(e)) return;

			// Close menu if about to delete the trigger character
			if (e.key === "Backspace" && mentions.menuState.isOpen && mentionStartRef.current !== null) {
				const el = getElement();
				if (el) {
					// If select-all was just pressed, backspace will delete everything including the trigger
					if (selectAllPressedRef.current) {
						mentions.closeMenu();
						mentionStartRef.current = null;
						mentionEndRef.current = null;
						selectAllPressedRef.current = false;
					} else {
						const cursorPos = SelectionUtils.getCursorPosition(el);
						// If cursor is right after the trigger (no search text), we're about to delete the trigger
						if (cursorPos === mentionStartRef.current + mentionTrigger.length) {
							mentions.closeMenu();
							mentionStartRef.current = null;
							mentionEndRef.current = null;
						}
					}
				}
			}

			// Track select-all (Cmd+A / Ctrl+A) - check both metaKey and ctrlKey
			if ((e.metaKey || e.ctrlKey) && e.key === "a") {
				selectAllPressedRef.current = true;
			} else if (e.key !== "Backspace") {
				// Reset on any key except Backspace (which handles it above)
				selectAllPressedRef.current = false;
			}

			// Undo/Redo
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

			// Enter key (when mention menu is not open) - prevent newline, call handler
			// Shift+Enter allows newline insertion
			if (e.key === "Enter" && !e.shiftKey) {
				e.preventDefault();
				const el = getElement();
				const currentMentions = el ? MentionDOM.extractMentions(el) : [];
				onEnterRef.current?.(getValue(), currentMentions);
			}
		},
		[mentions, insertMention, handleBackspaceOnMention, handleUndo, handleRedo, handleAtomicMentionNavigation, getElement, mentionTrigger, getValue]
	);

	/**
	 * Update visual state of mentions based on current selection.
	 * Adds 'mention-selected' class to mentions that are within the selection.
	 */
	const updateMentionSelectionVisuals = useCallback(() => {
		const el = getElement();
		if (!el) return;

		const sel = SelectionUtils.get();
		const mentionElements = el.querySelectorAll("[data-mention]");

		// Remove selected class from all mentions first
		mentionElements.forEach((mention) => {
			mention.classList.remove("mention-selected");
		});

		// If no selection or collapsed, no mentions are selected
		if (!sel || sel.rangeCount === 0) return;
		const range = sel.getRangeAt(0);
		if (range.collapsed) return;

		// Add selected class to mentions within the selection
		mentionElements.forEach((mention) => {
			if (isMentionInSelection(mention as HTMLElement, range)) {
				mention.classList.add("mention-selected");
			}
		});
	}, [getElement]);

	const onKeyUp = useCallback(
		(e: React.KeyboardEvent<HTMLDivElement>) => {
			// After cursor movement keys, always check for mention trigger context
			// This handles both closing the menu when navigating away AND reopening it
			// when navigating back into a trigger block (e.g., after Cmd+A → ArrowRight)
			if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) {
				checkForMentionTrigger();
				// Also update mention selection visuals after keyboard navigation
				updateMentionSelectionVisuals();
			}
		},
		[checkForMentionTrigger, updateMentionSelectionVisuals]
	);

	const onSelect = useCallback(() => {
		// Update mention visual states based on selection
		updateMentionSelectionVisuals();

		// Called when selection changes (e.g., mouse click, drag selection)
		// Check if we're still in a mention context
		if (mentions.menuState.isOpen) {
			// Use requestAnimationFrame to ensure selection has updated
			requestAnimationFrame(() => {
				checkForMentionTrigger();
			});
		}
	}, [mentions.menuState.isOpen, checkForMentionTrigger, updateMentionSelectionVisuals]);

	/**
	 * Handle mousedown to prevent cursor from getting stuck inside mention elements.
	 * When clicking on a mention, position cursor after it instead.
	 * When clicking on the delete button, remove the mention.
	 */
	const onMouseDown = useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			const target = e.target as HTMLElement;

			// Check if we clicked on the delete button
			const deleteButton = target.closest("[data-mention-delete]") as HTMLElement | null;
			if (deleteButton) {
				e.preventDefault();
				e.stopPropagation();

				const mentionElement = deleteButton.closest("[data-mention]") as HTMLElement | null;
				if (mentionElement) {
					const el = getElement();
					if (!el) return;

					// Position cursor after the mention before removing it
					const sel = SelectionUtils.get();
					if (sel) {
						const range = document.createRange();
						range.setStartAfter(mentionElement);
						range.collapse(true);
						sel.removeAllRanges();
						sel.addRange(range);
					}

					// Remove the mention
					mentionElement.remove();

					// Update state
					updateState(getValue());
					saveToHistory();

					// Focus the contenteditable
					el.focus();
				}
				return;
			}

			// Check if we clicked on a mention or inside one
			const mentionElement = target.closest("[data-mention]") as HTMLElement | null;
			if (!mentionElement) return;

			const el = getElement();
			if (!el) return;

			// Prevent default to avoid browser placing cursor inside the mention
			e.preventDefault();

			// Determine click position relative to mention center to decide cursor placement
			const rect = mentionElement.getBoundingClientRect();
			const clickX = e.clientX;
			const mentionCenterX = rect.left + rect.width / 2;

			const sel = SelectionUtils.get();
			if (!sel) return;

			const range = document.createRange();

			if (clickX < mentionCenterX) {
				// Clicked on left half - place cursor before mention
				range.setStartBefore(mentionElement);
			} else {
				// Clicked on right half - place cursor after mention
				range.setStartAfter(mentionElement);
			}
			range.collapse(true);

			sel.removeAllRanges();
			sel.addRange(range);

			// Focus the contenteditable to ensure it receives keyboard input
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
	// Clipboard Handlers (Copy/Cut/Paste)
	// ---------------------------------------------------------------------------

	/**
	 * Extract the serialized value from selected content, handling mention pills
	 */
	const getSelectedSerializedContent = useCallback((): { text: string; html: string } => {
		const sel = SelectionUtils.get();
		if (!sel || sel.rangeCount === 0) {
			return { text: "", html: "" };
		}

		const range = sel.getRangeAt(0);
		if (range.collapsed) {
			return { text: "", html: "" };
		}

		// Clone the selected content
		const fragment = range.cloneContents();
		const tempDiv = document.createElement("div");
		tempDiv.appendChild(fragment);

		// Extract serialized text (with @[Name] format for mentions)
		const serializedText = MentionDOM.extractValue(tempDiv, mentionTrigger);

		// Get HTML representation
		const html = tempDiv.innerHTML;

		return { text: serializedText, html };
	}, [mentionTrigger]);

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

				// Delete the selected content
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

			// Get text from clipboard (prefer text/plain with our serialized format)
			const pastedText = e.clipboardData.getData("text/plain");

			if (!pastedText) return;

			// Get current selection range
			const range = sel.getRangeAt(0);

			// Delete any selected content first
			if (!range.collapsed) {
				range.deleteContents();
			}

			// Parse the pasted text to convert @[Name] syntax to HTML
			const parsedHTML = MentionDOM.parseValue(pastedText, mentionTrigger, mentionOptions ? flattenOptions(mentionOptions) : undefined);

			// Create a temp container to hold the parsed content
			const tempDiv = document.createElement("div");
			tempDiv.innerHTML = parsedHTML;

			// Insert each child node at the cursor position
			const nodesToInsert = Array.from(tempDiv.childNodes);
			let lastInsertedNode: Node | null = null;

			nodesToInsert.forEach((node) => {
				const insertedNode = node.cloneNode(true);
				range.insertNode(insertedNode);
				range.setStartAfter(insertedNode);
				range.collapse(true);
				lastInsertedNode = insertedNode;
			});

			// Position cursor after the last inserted content
			if (lastInsertedNode) {
				range.setStartAfter(lastInsertedNode);
				range.collapse(true);
				sel.removeAllRanges();
				sel.addRange(range);
			}

			updateState(getValue());
			saveToHistory();
		},
		[getElement, getValue, mentionTrigger, updateState, saveToHistory]
	);

	// ---------------------------------------------------------------------------
	// Effects
	// ---------------------------------------------------------------------------

	useEffect(() => {
		const el = ref.current;
		if (el && initialValue) {
			el.innerHTML = MentionDOM.parseValue(initialValue, mentionTrigger, mentionOptions ? flattenOptions(mentionOptions) : undefined);
			// Initialize the mentions tracking with initial mentions
			currentMentionsRef.current = MentionDOM.extractMentions(el);
		}
	}, []);

	// Listen to document selectionchange to update mention selection visuals
	useEffect(() => {
		const handleSelectionChange = () => {
			const el = ref.current;
			if (!el) return;

			// Only update if selection is within our element
			const sel = window.getSelection();
			if (sel && sel.rangeCount > 0) {
				const range = sel.getRangeAt(0);
				if (el.contains(range.commonAncestorContainer)) {
					updateMentionSelectionVisuals();
				} else {
					// Selection is outside our element, clear all mention selection visuals
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
		},
	};
}
