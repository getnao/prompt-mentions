import { useCallback } from "react";
import { SelectionUtils } from "./selectionUtils";

// ============================================================================
// Types
// ============================================================================

export interface MentionRefs {
	mentionStart: React.MutableRefObject<number | null>;
	mentionEnd: React.MutableRefObject<number | null>;
	activeTrigger: React.MutableRefObject<string | null>;
}

export interface UseMentionTriggerOptions {
	getElement: () => HTMLDivElement | null;
	triggers: string[];
	mentionRefs: MentionRefs;
	isMenuOpen: boolean;
	openMenu: (caretCoords: { top: number; left: number; bottom: number; height: number }, trigger: string) => void;
	closeMenu: () => void;
	updateSearch: (text: string) => void;
}

export interface UseMentionTriggerReturn {
	checkForMentionTrigger: () => void;
	clearMentionState: () => void;
}

// ============================================================================
// Hook
// ============================================================================

export function useMentionTrigger({
	getElement,
	triggers,
	mentionRefs,
	isMenuOpen,
	openMenu,
	closeMenu,
	updateSearch,
}: UseMentionTriggerOptions): UseMentionTriggerReturn {
	const clearMentionState = useCallback(() => {
		mentionRefs.mentionStart.current = null;
		mentionRefs.mentionEnd.current = null;
		mentionRefs.activeTrigger.current = null;
	}, [mentionRefs]);

	const checkForMentionTrigger = useCallback(() => {
		const el = getElement();
		if (!el) return;

		const content = el.textContent || "";
		if (!content.trim()) {
			if (isMenuOpen) {
				closeMenu();
				clearMentionState();
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
					if (isMenuOpen) {
						closeMenu();
						clearMentionState();
					}
					return;
				}
			} else {
				if (isMenuOpen) {
					closeMenu();
					clearMentionState();
				}
				return;
			}
		}

		const text = node.textContent || "";
		const searchFromPos = Math.max(cursorPos, mentionRefs.mentionEnd.current ?? 0);
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
				if (isMenuOpen) {
					closeMenu();
					clearMentionState();
				}
				return;
			}

			const preRange = range.cloneRange();
			preRange.selectNodeContents(el);
			preRange.setEnd(node, triggerPos);
			const absolutePos = preRange.toString().length;

			if (mentionRefs.mentionEnd.current === null || cursorPos > mentionRefs.mentionEnd.current) {
				mentionRefs.mentionEnd.current = cursorPos;
			}

			const searchEndPos = mentionRefs.mentionEnd.current;
			const searchText = text.slice(triggerPos + foundTrigger.length, searchEndPos);

			if (!isMenuOpen) {
				mentionRefs.mentionStart.current = absolutePos;
				mentionRefs.mentionEnd.current = cursorPos;
				mentionRefs.activeTrigger.current = foundTrigger;
				openMenu(SelectionUtils.getCaretCoordinates(el), foundTrigger);
			}
			updateSearch(searchText);
		} else if (isMenuOpen) {
			closeMenu();
			clearMentionState();
		}
	}, [getElement, triggers, mentionRefs, isMenuOpen, openMenu, closeMenu, updateSearch, clearMentionState]);

	return {
		checkForMentionTrigger,
		clearMentionState,
	};
}

