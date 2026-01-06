import { useRef, useCallback } from "react";

export interface HistoryEntry {
	content: string;
	cursorPosition: number;
}

export interface UseHistoryOptions {
	initialValue?: string;
	maxSize?: number;
}

export interface UseHistoryReturn {
	push: (content: string, cursorPosition: number) => void;
	undo: () => HistoryEntry | null;
	redo: () => HistoryEntry | null;
	canUndo: () => boolean;
	canRedo: () => boolean;
	isUndoRedo: () => boolean;
	setUndoRedo: (value: boolean) => void;
	/**
	 * Returns the current history entry's content, or empty string if none.
	 */
	getCurrentContent: () => string;
	/**
	 * Pops entries from history while the predicate returns true.
	 * Useful for consolidating multiple entries into a single undoable action.
	 * Returns the number of entries removed.
	 */
	popWhile: (predicate: (content: string) => boolean) => number;
}

const DEFAULT_MAX_SIZE = 100;

export function useHistory({
	initialValue = "",
	maxSize = DEFAULT_MAX_SIZE,
}: UseHistoryOptions = {}): UseHistoryReturn {
	const historyRef = useRef<HistoryEntry[]>([
		{ content: initialValue, cursorPosition: initialValue.length },
	]);
	const indexRef = useRef(0);
	const isUndoRedoRef = useRef(false);

	const push = useCallback(
		(content: string, cursorPosition: number) => {
			// Don't push if content is same as current
			const currentEntry = historyRef.current[indexRef.current];
			if (currentEntry && currentEntry.content === content) return;

			// Remove any redo entries after current position
			historyRef.current = historyRef.current.slice(0, indexRef.current + 1);

			// Add new entry
			historyRef.current.push({ content, cursorPosition });

			// Limit history size
			if (historyRef.current.length > maxSize) {
				historyRef.current.shift();
			} else {
				indexRef.current++;
			}
		},
		[maxSize]
	);

	const undo = useCallback((): HistoryEntry | null => {
		if (indexRef.current <= 0) return null;

		indexRef.current--;
		return historyRef.current[indexRef.current] ?? null;
	}, []);

	const redo = useCallback((): HistoryEntry | null => {
		if (indexRef.current >= historyRef.current.length - 1) return null;

		indexRef.current++;
		return historyRef.current[indexRef.current] ?? null;
	}, []);

	const canUndo = useCallback(() => indexRef.current > 0, []);

	const canRedo = useCallback(
		() => indexRef.current < historyRef.current.length - 1,
		[]
	);

	const isUndoRedo = useCallback(() => isUndoRedoRef.current, []);

	const setUndoRedo = useCallback((value: boolean) => {
		isUndoRedoRef.current = value;
	}, []);

	const getCurrentContent = useCallback((): string => {
		const currentEntry = historyRef.current[indexRef.current];
		return currentEntry?.content ?? "";
	}, []);

	const popWhile = useCallback((predicate: (content: string) => boolean): number => {
		let removed = 0;
		// Pop entries while predicate is true and we can go back
		while (indexRef.current > 0) {
			const currentEntry = historyRef.current[indexRef.current];
			if (currentEntry && predicate(currentEntry.content)) {
				// Remove the current entry and move index back
				historyRef.current.splice(indexRef.current, 1);
				indexRef.current--;
				removed++;
			} else {
				break;
			}
		}
		return removed;
	}, []);

	return {
		push,
		undo,
		redo,
		canUndo,
		canRedo,
		isUndoRedo,
		setUndoRedo,
		getCurrentContent,
		popWhile,
	};
}

