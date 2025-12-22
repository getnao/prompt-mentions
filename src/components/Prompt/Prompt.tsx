import { useRef, useCallback, useState, useEffect } from "react";

export interface PromptProps {
	initialValue?: string;
	onChange?: (value: string) => void;
	placeholder?: string;
	mentionTrigger?: string;
}

const PILL_CLASS = "bg-violet-500/20 text-violet-400 px-1 rounded";

const highlightMentions = (text: string, trigger: string): string => {
	// Match @[content with spaces] or @simple-word
	const pattern = new RegExp(`${trigger}(?:\\[([^\\]]+)\\]|[\\w-]+)`, 'g');
	return text.replace(pattern, (match, bracketContent) => {
		const displayText = bracketContent ? `${trigger}${bracketContent}` : match;
		// Store original serialized format in data attribute
		return `<span class="${PILL_CLASS}" data-mention="${match}" contenteditable="false">${displayText}</span>`;
	});
};

const serializeContent = (element: HTMLElement): string => {
	let result = "";
	element.childNodes.forEach((node) => {
		if (node.nodeType === Node.TEXT_NODE) {
			result += node.textContent || "";
		} else if (node.nodeType === Node.ELEMENT_NODE) {
			const el = node as HTMLElement;
			// Use the original serialized format from data attribute
			if (el.dataset.mention) {
				result += el.dataset.mention;
			} else {
				result += el.textContent || "";
			}
		}
	});
	return result;
};

interface HistoryEntry {
	content: string;
	cursorPos: number;
}

const Prompt = ({
	initialValue = "",
	onChange,
	placeholder = "Type something...",
	mentionTrigger = "@"
}: PromptProps) => {
	const ref = useRef<HTMLDivElement>(null);
	const [isEmpty, setIsEmpty] = useState(!initialValue);

	// Undo/redo history
	const historyRef = useRef<HistoryEntry[]>([{ content: initialValue, cursorPos: initialValue.length }]);
	const historyIndexRef = useRef(0);
	const isUndoRedoRef = useRef(false);

	useEffect(() => {
		if (!ref.current || !initialValue) return;

		ref.current.innerHTML = highlightMentions(initialValue, mentionTrigger);
		setIsEmpty(initialValue.length === 0);
	}, []);

	const restoreCursor = useCallback((cursorPos: number) => {
		if (!ref.current) return;
		const sel = window.getSelection();
		if (!sel) return;

		const walker = document.createTreeWalker(ref.current, NodeFilter.SHOW_TEXT);
		let charCount = 0;
		let lastNode: Text | null = null;

		while (walker.nextNode()) {
			const textNode = walker.currentNode as Text;
			lastNode = textNode;
			if (charCount + textNode.length >= cursorPos) {
				const newRange = document.createRange();
				newRange.setStart(textNode, cursorPos - charCount);
				newRange.collapse(true);
				sel.removeAllRanges();
				sel.addRange(newRange);
				return;
			}
			charCount += textNode.length;
		}

		if (lastNode) {
			const newRange = document.createRange();
			newRange.setStart(lastNode, lastNode.length);
			newRange.collapse(true);
			sel.removeAllRanges();
			sel.addRange(newRange);
		}
	}, []);

	const handleInput = useCallback(() => {
		if (!ref.current) return;

		// Skip history push if this is from undo/redo
		if (isUndoRedoRef.current) {
			isUndoRedoRef.current = false;
			return;
		}

		const sel = window.getSelection();
		if (!sel || sel.rangeCount === 0) return;

		// Get cursor position as total character offset
		const range = sel.getRangeAt(0);
		const preRange = range.cloneRange();
		preRange.selectNodeContents(ref.current);
		preRange.setEnd(range.startContainer, range.startOffset);
		const cursorPos = preRange.toString().length;

		// Serialize content preserving mention format
		const serialized = serializeContent(ref.current);
		const trimmedText = serialized.replace(/\n$/, "");
		setIsEmpty(trimmedText.length === 0);
		onChange?.(trimmedText);

		// Push to history (truncate any redo history)
		historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
		historyRef.current.push({ content: serialized, cursorPos });
		historyIndexRef.current = historyRef.current.length - 1;

		// Re-highlight mentions
		ref.current.innerHTML = highlightMentions(serialized, mentionTrigger);

		// Restore cursor at same character position
		restoreCursor(cursorPos);
	}, [onChange, mentionTrigger, restoreCursor]);

	const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
		if (!ref.current) return;

		// Handle undo: Ctrl+Z (or Cmd+Z on Mac)
		if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
			e.preventDefault();
			if (historyIndexRef.current > 0) {
				historyIndexRef.current--;
				const entry = historyRef.current[historyIndexRef.current]!;
				isUndoRedoRef.current = true;
				ref.current.innerHTML = highlightMentions(entry.content, mentionTrigger);
				restoreCursor(entry.cursorPos);
				setIsEmpty(entry.content.length === 0);
				onChange?.(entry.content.replace(/\n$/, ""));
			}
			return;
		}

		// Handle redo: Ctrl+Shift+Z or Ctrl+Y (or Cmd variants on Mac)
		if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
			e.preventDefault();
			if (historyIndexRef.current < historyRef.current.length - 1) {
				historyIndexRef.current++;
				const entry = historyRef.current[historyIndexRef.current]!;
				isUndoRedoRef.current = true;
				ref.current.innerHTML = highlightMentions(entry.content, mentionTrigger);
				restoreCursor(entry.cursorPos);
				setIsEmpty(entry.content.length === 0);
				onChange?.(entry.content.replace(/\n$/, ""));
			}
			return;
		}

		// Handle select all: Ctrl+A (or Cmd+A on Mac) - select only within prompt
		if ((e.ctrlKey || e.metaKey) && e.key === "a") {
			e.preventDefault();
			const sel = window.getSelection();
			if (sel) {
				const range = document.createRange();
				range.selectNodeContents(ref.current);
				sel.removeAllRanges();
				sel.addRange(range);
			}
			return;
		}

		// Handle backspace on mentions
		if (e.key !== "Backspace") return;

		const sel = window.getSelection();
		if (!sel || sel.rangeCount === 0) return;

		const range = sel.getRangeAt(0);
		const node = range.startContainer;
		const offset = range.startOffset;

		// Helper to find and remove mention
		const removeMention = (el: HTMLElement) => {
			e.preventDefault();
			el.remove();
			ref.current!.dispatchEvent(new Event("input", { bubbles: true }));
		};

		// Case 1: Cursor is inside a mention span (or its text)
		const mentionParent = (node.nodeType === Node.TEXT_NODE ? node.parentElement : node as HTMLElement)?.closest("[data-mention]") as HTMLElement | null;
		if (mentionParent && ref.current.contains(mentionParent)) {
			removeMention(mentionParent);
			return;
		}

		// Case 2: Cursor is at start of a text node, check previous sibling
		if (node.nodeType === Node.TEXT_NODE && offset === 0) {
			const prev = node.previousSibling;
			if (prev && prev.nodeType === Node.ELEMENT_NODE) {
				const el = prev as HTMLElement;
				if (el.dataset.mention) {
					removeMention(el);
					return;
				}
			}
		}

		// Case 3: Cursor is directly in the editor (between nodes)
		if (node === ref.current && offset > 0) {
			const child = ref.current.childNodes[offset - 1];
			if (child && child.nodeType === Node.ELEMENT_NODE) {
				const el = child as HTMLElement;
				if (el.dataset.mention) {
					removeMention(el);
					return;
				}
			}
		}
	}, [mentionTrigger, restoreCursor, onChange]);

	return (
		<div className="relative">
			<div
				ref={ref}
				contentEditable
				onInput={handleInput}
				onKeyDown={handleKeyDown}
				className="min-h-[100px] p-2 border border-gray-300 rounded outline-none whitespace-pre-wrap"
			/>
			{isEmpty && (
				<div className="absolute top-2 left-2 text-gray-400 pointer-events-none">
					{placeholder}
				</div>
			)}
		</div>
	);
};

export default Prompt;
