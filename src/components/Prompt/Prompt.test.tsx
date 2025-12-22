import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import Prompt from './Prompt';

afterEach(() => {
	cleanup();
});

/**
 * Helper to simulate typing in a contenteditable and trigger mention detection.
 * Sets up a mock selection at the end of the text.
 */
function simulateTypingWithCursor(editableDiv: Element, text: string) {
	const textNode = document.createTextNode(text);
	editableDiv.innerHTML = '';
	editableDiv.appendChild(textNode);

	// Mock the selection to be at the end of the text
	const range = document.createRange();
	range.setStart(textNode, text.length);
	range.setEnd(textNode, text.length);

	const selection = window.getSelection();
	selection?.removeAllRanges();
	selection?.addRange(range);

	fireEvent.input(editableDiv);
}

describe('Prompt', () => {
	it('renders with custom placeholder', () => {
		render(<Prompt placeholder="Type @ to mention someone..." />);
		expect(screen.getByText('Type @ to mention someone...')).toBeInTheDocument();
	});

	it('renders with initial value', () => {
		const { container } = render(<Prompt initialValue="Hello, @[John Doe]!" />);
		// Mention should be rendered as a pill with data-mention attribute
		const mentionPill = container.querySelector('[data-mention="John Doe"]');
		expect(mentionPill).toBeInTheDocument();
		expect(mentionPill?.textContent).toBe('@John Doe');
	});

	it('hides placeholder when initial value is provided', () => {
		render(<Prompt initialValue="Some text" placeholder="My placeholder" />);
		expect(screen.queryByText('My placeholder')).not.toBeInTheDocument();
	});

	it('calls onChange when content is edited', () => {
		const handleChange = vi.fn();
		const { container } = render(<Prompt onChange={handleChange} />);

		const editableDiv = container.querySelector('[contenteditable="true"]')!;
		editableDiv.textContent = 'Hello world';
		fireEvent.input(editableDiv);

		expect(handleChange).toHaveBeenCalledWith('Hello world', []);
	});

	it('hides placeholder after typing', () => {
		const { container } = render(<Prompt placeholder="Custom placeholder" />);

		expect(screen.getByText('Custom placeholder')).toBeInTheDocument();

		const editableDiv = container.querySelector('[contenteditable="true"]')!;
		editableDiv.textContent = 'Some text';
		fireEvent.input(editableDiv);

		expect(screen.queryByText('Custom placeholder')).not.toBeInTheDocument();
	});

	it('shows placeholder when content is cleared', () => {
		const { container } = render(<Prompt placeholder="Unique placeholder" />);

		const editableDiv = container.querySelector('[contenteditable="true"]')!;

		// Type something
		editableDiv.textContent = 'Hello';
		fireEvent.input(editableDiv);
		expect(screen.queryByText('Unique placeholder')).not.toBeInTheDocument();

		// Clear content
		editableDiv.textContent = '';
		fireEvent.input(editableDiv);
		expect(screen.getByText('Unique placeholder')).toBeInTheDocument();
	});

	it('treats non-breaking space as empty', () => {
		const { container } = render(<Prompt placeholder="Nbsp placeholder" />);

		const editableDiv = container.querySelector('[contenteditable="true"]')!;

		// Simulate browser inserting nbsp when "empty"
		editableDiv.textContent = '\u00A0';
		fireEvent.input(editableDiv);

		expect(screen.getByText('Nbsp placeholder')).toBeInTheDocument();
	});

	it('renders without placeholder when empty string provided', () => {
		const { container } = render(<Prompt placeholder="" />);
		const editableDiv = container.querySelector('[contenteditable="true"]');
		expect(editableDiv).toBeInTheDocument();
	});

	describe('Enter Key Behavior', () => {
		it('calls onEnter with current value when pressing Enter', () => {
			const handleEnter = vi.fn();
			const { container } = render(<Prompt onEnter={handleEnter} />);
			const editableDiv = container.querySelector('[contenteditable="true"]')!;

			editableDiv.textContent = 'Hello world';
			fireEvent.input(editableDiv);

			fireEvent.keyDown(editableDiv, { key: 'Enter' });

			expect(handleEnter).toHaveBeenCalledWith('Hello world', []);
		});

		it('calls onEnter with serialized mention format', () => {
			const handleEnter = vi.fn();
			// Using id format in initial value - will use the default options to find the label
			const { container } = render(<Prompt initialValue="Hi @[john-doe]!" onEnter={handleEnter} />);
			const editableDiv = container.querySelector('[contenteditable="true"]')!;

			fireEvent.keyDown(editableDiv, { key: 'Enter' });

			// Default options have { id: "john-doe", label: "John Doe" }
			// The mention should be found by id and display with the label
			expect(handleEnter).toHaveBeenCalledWith('Hi @[john-doe]!', [{ id: 'john-doe', label: 'john-doe' }]);
		});

		it('does not insert newline when pressing Enter', () => {
			const { container } = render(<Prompt />);
			const editableDiv = container.querySelector('[contenteditable="true"]')!;

			editableDiv.textContent = 'Hello';
			fireEvent.input(editableDiv);

			const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
			const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
			editableDiv.dispatchEvent(event);

			expect(preventDefaultSpy).toHaveBeenCalled();
		});

		it('does not call onEnter when pressing Shift+Enter', () => {
			const handleEnter = vi.fn();
			const { container } = render(<Prompt onEnter={handleEnter} />);
			const editableDiv = container.querySelector('[contenteditable="true"]')!;

			editableDiv.textContent = 'Hello';
			fireEvent.input(editableDiv);

			fireEvent.keyDown(editableDiv, { key: 'Enter', shiftKey: true });

			expect(handleEnter).not.toHaveBeenCalled();
		});

		it('does not call onEnter when Enter is pressed with mention menu open', () => {
			const handleEnter = vi.fn();
			const { container } = render(<Prompt onEnter={handleEnter} />);
			const editableDiv = container.querySelector('[contenteditable="true"]')!;

			// Type @ to open mention menu
			simulateTypingWithCursor(editableDiv, '@');
			expect(screen.getByText('John Doe')).toBeInTheDocument();

			// Press Enter to select mention (not submit)
			fireEvent.keyDown(editableDiv, { key: 'Enter' });

			// onEnter should NOT be called - Enter selected the mention instead
			expect(handleEnter).not.toHaveBeenCalled();

			// Mention should be inserted
			const mentionPill = container.querySelector('[data-mention="John Doe"]');
			expect(mentionPill).toBeInTheDocument();
		});
	});

	describe('Undo/Redo', () => {
		it('undoes text changes with Ctrl+Z', () => {
			const handleChange = vi.fn();
			const { container } = render(<Prompt onChange={handleChange} />);
			const editableDiv = container.querySelector('[contenteditable="true"]')!;

			// Type first text
			editableDiv.textContent = 'Hello';
			fireEvent.input(editableDiv);
			expect(handleChange).toHaveBeenLastCalledWith('Hello', []);

			// Type second text
			editableDiv.textContent = 'Hello World';
			fireEvent.input(editableDiv);
			expect(handleChange).toHaveBeenLastCalledWith('Hello World', []);

			// Undo with Ctrl+Z
			fireEvent.keyDown(editableDiv, { key: 'z', ctrlKey: true });
			expect(editableDiv.textContent).toBe('Hello');
		});

		it('undoes text changes with Cmd+Z on Mac', () => {
			const originalPlatform = navigator.platform;
			Object.defineProperty(navigator, 'platform', { value: 'MacIntel', configurable: true });

			const { container } = render(<Prompt />);
			const editableDiv = container.querySelector('[contenteditable="true"]')!;

			editableDiv.textContent = 'First';
			fireEvent.input(editableDiv);

			editableDiv.textContent = 'Second';
			fireEvent.input(editableDiv);

			// Undo with Cmd+Z
			fireEvent.keyDown(editableDiv, { key: 'z', metaKey: true });
			expect(editableDiv.textContent).toBe('First');

			Object.defineProperty(navigator, 'platform', { value: originalPlatform, configurable: true });
		});

		it('redoes text changes with Ctrl+Shift+Z', () => {
			const { container } = render(<Prompt />);
			const editableDiv = container.querySelector('[contenteditable="true"]')!;

			editableDiv.textContent = 'Hello';
			fireEvent.input(editableDiv);

			editableDiv.textContent = 'Hello World';
			fireEvent.input(editableDiv);

			// Undo
			fireEvent.keyDown(editableDiv, { key: 'z', ctrlKey: true });
			expect(editableDiv.textContent).toBe('Hello');

			// Redo with Ctrl+Shift+Z
			fireEvent.keyDown(editableDiv, { key: 'z', ctrlKey: true, shiftKey: true });
			expect(editableDiv.textContent).toBe('Hello World');
		});

		it('redoes text changes with Ctrl+Y', () => {
			const { container } = render(<Prompt />);
			const editableDiv = container.querySelector('[contenteditable="true"]')!;

			editableDiv.textContent = 'First';
			fireEvent.input(editableDiv);

			editableDiv.textContent = 'Second';
			fireEvent.input(editableDiv);

			// Undo
			fireEvent.keyDown(editableDiv, { key: 'z', ctrlKey: true });
			expect(editableDiv.textContent).toBe('First');

			// Redo with Ctrl+Y
			fireEvent.keyDown(editableDiv, { key: 'y', ctrlKey: true });
			expect(editableDiv.textContent).toBe('Second');
		});

		it('clears redo history when new text is typed after undo', () => {
			const { container } = render(<Prompt />);
			const editableDiv = container.querySelector('[contenteditable="true"]')!;

			editableDiv.textContent = 'First';
			fireEvent.input(editableDiv);

			editableDiv.textContent = 'Second';
			fireEvent.input(editableDiv);

			// Undo to get back to "First"
			fireEvent.keyDown(editableDiv, { key: 'z', ctrlKey: true });
			expect(editableDiv.textContent).toBe('First');

			// Type new text
			editableDiv.textContent = 'Third';
			fireEvent.input(editableDiv);

			// Try to redo - should not work since history was cleared
			fireEvent.keyDown(editableDiv, { key: 'z', ctrlKey: true, shiftKey: true });
			expect(editableDiv.textContent).toBe('Third');
		});

		it('does nothing when undoing at the beginning of history', () => {
			const { container } = render(<Prompt />);
			const editableDiv = container.querySelector('[contenteditable="true"]')!;

			editableDiv.textContent = 'Only change';
			fireEvent.input(editableDiv);

			// Undo once
			fireEvent.keyDown(editableDiv, { key: 'z', ctrlKey: true });
			expect(editableDiv.textContent).toBe('');

			// Try to undo again - should stay at empty
			fireEvent.keyDown(editableDiv, { key: 'z', ctrlKey: true });
			expect(editableDiv.textContent).toBe('');
		});

		it('does nothing when redoing at the end of history', () => {
			const { container } = render(<Prompt />);
			const editableDiv = container.querySelector('[contenteditable="true"]')!;

			editableDiv.textContent = 'Some text';
			fireEvent.input(editableDiv);

			// Try to redo without undoing - should stay the same
			fireEvent.keyDown(editableDiv, { key: 'z', ctrlKey: true, shiftKey: true });
			expect(editableDiv.textContent).toBe('Some text');
		});

		it('updates isEmpty state correctly during undo/redo', () => {
			const { container } = render(<Prompt placeholder="Enter text" />);
			const editableDiv = container.querySelector('[contenteditable="true"]')!;

			// Initially shows placeholder
			expect(screen.getByText('Enter text')).toBeInTheDocument();

			// Type something - placeholder should hide
			editableDiv.textContent = 'Hello';
			fireEvent.input(editableDiv);
			expect(screen.queryByText('Enter text')).not.toBeInTheDocument();

			// Undo - placeholder should show again
			fireEvent.keyDown(editableDiv, { key: 'z', ctrlKey: true });
			expect(screen.getByText('Enter text')).toBeInTheDocument();

			// Redo - placeholder should hide again
			fireEvent.keyDown(editableDiv, { key: 'z', ctrlKey: true, shiftKey: true });
			expect(screen.queryByText('Enter text')).not.toBeInTheDocument();
		});
	});

	describe('Mentions', () => {
		describe('Menu Display', () => {
			it('opens mention menu when typing trigger character', () => {
				const { container } = render(<Prompt />);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				// Menu should not be visible initially
				expect(screen.queryByText('John Doe')).not.toBeInTheDocument();

				// Type @ to trigger mention menu
				simulateTypingWithCursor(editableDiv, '@');

				// Menu should now show default options
				expect(screen.getByText('John Doe')).toBeInTheDocument();
				expect(screen.getByText('Jane Smith')).toBeInTheDocument();
			});

			it('opens menu when trigger is preceded by space', () => {
				const { container } = render(<Prompt />);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				simulateTypingWithCursor(editableDiv, 'Hello @');

				expect(screen.getByText('John Doe')).toBeInTheDocument();
			});

			it('does not open menu when trigger is part of a word', () => {
				const { container } = render(<Prompt />);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				simulateTypingWithCursor(editableDiv, 'email@');

				expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
			});

			it('filters options based on search text', () => {
				const { container } = render(<Prompt />);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				simulateTypingWithCursor(editableDiv, '@Jo');

				// John Doe should match, Jane Smith should not
				expect(screen.getByText('John Doe')).toBeInTheDocument();
				expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
			});

			it('shows nothing when search text matches none', () => {
				const { container } = render(<Prompt />);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				// First open with just @
				simulateTypingWithCursor(editableDiv, '@xyz');

				// No matches - menu should show empty or filtered state
				expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
				expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
			});

			it('closes menu when pressing Escape', () => {
				const { container } = render(<Prompt />);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				simulateTypingWithCursor(editableDiv, '@');
				expect(screen.getByText('John Doe')).toBeInTheDocument();

				fireEvent.keyDown(editableDiv, { key: 'Escape' });

				expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
			});

			it('closes menu when cursor moves away from trigger', () => {
				const { container } = render(<Prompt />);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				simulateTypingWithCursor(editableDiv, '@');
				expect(screen.getByText('John Doe')).toBeInTheDocument();

				// Type a space which should close the menu
				simulateTypingWithCursor(editableDiv, '@ ');

				expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
			});

			it('closes menu when trigger is deleted via backspace (if trigger is first character)', () => {
				const { container } = render(<Prompt />);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				simulateTypingWithCursor(editableDiv, '@');
				expect(screen.getByText('John Doe')).toBeInTheDocument();

				// Simulate pressing Backspace to delete the @ trigger
				fireEvent.keyDown(editableDiv, { key: 'Backspace' });

				expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
			});

			it('closes menu when trigger is deleted via Cmd+A and Backspace', () => {
				const { container } = render(<Prompt />);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				simulateTypingWithCursor(editableDiv, '@j');
				expect(screen.getByText('John Doe')).toBeInTheDocument();

				// Simulate pressing Cmd+A to select all text
				fireEvent.keyDown(editableDiv, { key: 'a', metaKey: true });

				// Simulate pressing Backspace to delete the @ trigger
				fireEvent.keyDown(editableDiv, { key: 'Backspace' });

				expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
			});

			it('closes menu when trigger is deleted via backspace (if trigger is not first character)', () => {
				const { container } = render(<Prompt />);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				simulateTypingWithCursor(editableDiv, 'Hello @');
				expect(screen.getByText('John Doe')).toBeInTheDocument();

				// Simulate pressing Backspace to delete the @ trigger
				fireEvent.keyDown(editableDiv, { key: 'Backspace' });

				expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
			});

			it('closes menu on Cmd+A (select all) and reopens when navigating back to trigger', async () => {
				vi.useFakeTimers();

				const { container } = render(<Prompt />);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				simulateTypingWithCursor(editableDiv, '@');
				expect(screen.getByText('John Doe')).toBeInTheDocument();

				// Simulate pressing Cmd+A (select all)
				fireEvent.keyDown(editableDiv, { key: 'a', metaKey: true });

				// Simulate the selection changing to select all text (as the browser would do)
				// Select all means the range spans from 0 to end of text
				const textNode = editableDiv.firstChild!;
				const range = document.createRange();
				range.setStart(textNode, 0);
				range.setEnd(textNode, 1); // Select all text (the "@")
				const selection = window.getSelection();
				selection?.removeAllRanges();
				selection?.addRange(range);

				// Fire select event to trigger onSelect handler (which checks for trigger context)
				fireEvent.select(editableDiv);

				// Run timers to execute requestAnimationFrame callback
				await vi.runAllTimersAsync();

				// Menu should close because text is selected (not a collapsed cursor after @)
				expect(screen.queryByText('John Doe')).not.toBeInTheDocument();

				// Now simulate pressing ArrowRight once
				// IMPORTANT: Real browser behavior after ArrowRight on a selection may place
				// the cursor at the container level (after the text node), not inside it.
				// This simulates that real browser behavior:
				range.setStartAfter(textNode);
				range.setEndAfter(textNode);
				selection?.removeAllRanges();
				selection?.addRange(range);

				fireEvent.keyDown(editableDiv, { key: 'ArrowRight' });
				fireEvent.keyUp(editableDiv, { key: 'ArrowRight' });

				// Run any pending timers
				await vi.runAllTimersAsync();

				// Menu should reopen because cursor is now in trigger context (right after @)
				expect(screen.getByText('John Doe')).toBeInTheDocument();

				vi.useRealTimers();
			});

			it('closes menu when cursor moves left with ArrowLeft', () => {
				const { container } = render(<Prompt />);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				// Type "hello @" then trigger menu
				const text = 'hello @';
				const textNode = document.createTextNode(text);
				editableDiv.innerHTML = '';
				editableDiv.appendChild(textNode);

				// Set cursor at the end (after @)
				const range = document.createRange();
				range.setStart(textNode, text.length);
				range.setEnd(textNode, text.length);
				window.getSelection()?.removeAllRanges();
				window.getSelection()?.addRange(range);
				fireEvent.input(editableDiv);

				expect(screen.getByText('John Doe')).toBeInTheDocument();

				// Move cursor left (before the @)
				range.setStart(textNode, 5); // Position before space+@
				range.setEnd(textNode, 5);
				window.getSelection()?.removeAllRanges();
				window.getSelection()?.addRange(range);

				fireEvent.keyDown(editableDiv, { key: 'ArrowLeft' });
				fireEvent.keyUp(editableDiv, { key: 'ArrowLeft' });

				expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
			});

			it('preserves search filter when navigating within search text with ArrowLeft', () => {
				const { container } = render(<Prompt />);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				// Type "@Jo" to filter - only John Doe should match, not Jane Smith
				const text = '@Jo';
				const textNode = document.createTextNode(text);
				editableDiv.innerHTML = '';
				editableDiv.appendChild(textNode);

				// Set cursor at the end (after "Jo")
				const range = document.createRange();
				range.setStart(textNode, text.length); // position 3, after "@Jo"
				range.setEnd(textNode, text.length);
				window.getSelection()?.removeAllRanges();
				window.getSelection()?.addRange(range);
				fireEvent.input(editableDiv);

				// Verify filtering: John matches "Jo", Jane does not
				expect(screen.getByText('John Doe')).toBeInTheDocument();
				expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();

				// Move cursor left to position 2 (after "@J", still within search text)
				range.setStart(textNode, 2);
				range.setEnd(textNode, 2);
				window.getSelection()?.removeAllRanges();
				window.getSelection()?.addRange(range);

				fireEvent.keyDown(editableDiv, { key: 'ArrowLeft' });
				fireEvent.keyUp(editableDiv, { key: 'ArrowLeft' });

				// Search should NOT change when navigating within the search text
				// The filter should remain "Jo", not become "J"
				// So John Doe should still be visible, and Jane Smith should NOT appear
				expect(screen.getByText('John Doe')).toBeInTheDocument();
				expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
			});

			it('updates search filter when deleting characters with Backspace', () => {
				const { container } = render(<Prompt />);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				// Type "@Jo" to filter - only John Doe should match
				const text = '@Jo';
				let textNode = document.createTextNode(text);
				editableDiv.innerHTML = '';
				editableDiv.appendChild(textNode);

				const range = document.createRange();
				range.setStart(textNode, text.length);
				range.setEnd(textNode, text.length);
				window.getSelection()?.removeAllRanges();
				window.getSelection()?.addRange(range);
				fireEvent.input(editableDiv);

				// Verify John matches, Jane doesn't
				expect(screen.getByText('John Doe')).toBeInTheDocument();
				expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();

				// Now delete the "o" with Backspace - search becomes "J"
				const newText = '@J';
				textNode = document.createTextNode(newText);
				editableDiv.innerHTML = '';
				editableDiv.appendChild(textNode);

				range.setStart(textNode, newText.length);
				range.setEnd(textNode, newText.length);
				window.getSelection()?.removeAllRanges();
				window.getSelection()?.addRange(range);

				fireEvent.keyDown(editableDiv, { key: 'Backspace' });
				fireEvent.input(editableDiv);

				// After deleting, search is "J" which matches both John and Jane
				expect(screen.getByText('John Doe')).toBeInTheDocument();
				expect(screen.getByText('Jane Smith')).toBeInTheDocument();
			});

			it('closes menu when clicking elsewhere in the text', async () => {
				const { container } = render(<Prompt />);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				// Type "hello @"
				const text = 'hello @';
				const textNode = document.createTextNode(text);
				editableDiv.innerHTML = '';
				editableDiv.appendChild(textNode);

				// Set cursor at the end (after @)
				const range = document.createRange();
				range.setStart(textNode, text.length);
				range.setEnd(textNode, text.length);
				window.getSelection()?.removeAllRanges();
				window.getSelection()?.addRange(range);
				fireEvent.input(editableDiv);

				expect(screen.getByText('John Doe')).toBeInTheDocument();

				// Simulate clicking at the beginning (selection change)
				range.setStart(textNode, 0);
				range.setEnd(textNode, 0);
				window.getSelection()?.removeAllRanges();
				window.getSelection()?.addRange(range);

				// Trigger onSelect event
				fireEvent.select(editableDiv);

				// Wait for requestAnimationFrame to process
				await new Promise(resolve => setTimeout(resolve, 20));

				expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
			});
		});

		describe('Menu Navigation', () => {
			it('navigates down with ArrowDown', () => {
				const { container } = render(<Prompt />);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				simulateTypingWithCursor(editableDiv, '@');

				// First item should be selected by default
				const items = container.querySelectorAll('.mention-menu-item');
				expect(items[0]).toHaveClass('mention-menu-item-selected');

				// Press down arrow
				fireEvent.keyDown(editableDiv, { key: 'ArrowDown' });

				// Second item should now be selected
				const updatedItems = container.querySelectorAll('.mention-menu-item');
				expect(updatedItems[1]).toHaveClass('mention-menu-item-selected');
			});

			it('navigates up with ArrowUp', () => {
				const { container } = render(<Prompt />);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				simulateTypingWithCursor(editableDiv, '@');

				// Go down first
				fireEvent.keyDown(editableDiv, { key: 'ArrowDown' });

				// Then up
				fireEvent.keyDown(editableDiv, { key: 'ArrowUp' });

				const items = container.querySelectorAll('.mention-menu-item');
				expect(items[0]).toHaveClass('mention-menu-item-selected');
			});

			it('wraps around when navigating past the end', () => {
				const { container } = render(<Prompt />);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				simulateTypingWithCursor(editableDiv, '@');

				// Go down twice (past the end with 2 options)
				fireEvent.keyDown(editableDiv, { key: 'ArrowDown' });
				fireEvent.keyDown(editableDiv, { key: 'ArrowDown' });

				// Should wrap to first item
				const items = container.querySelectorAll('.mention-menu-item');
				expect(items[0]).toHaveClass('mention-menu-item-selected');
			});
		});

		describe('Mention Insertion', () => {
			it('inserts mention when pressing Enter', () => {
				const handleChange = vi.fn();
				const { container } = render(<Prompt onChange={handleChange} />);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				simulateTypingWithCursor(editableDiv, '@');
				fireEvent.keyDown(editableDiv, { key: 'Enter' });

				// Should have a mention pill
				const mentionPill = container.querySelector('[data-mention="John Doe"]');
				expect(mentionPill).toBeInTheDocument();
				expect(mentionPill?.textContent).toBe('@John Doe');

				// Menu should close
				expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
			});

			it('inserts mention when pressing Tab', () => {
				const { container } = render(<Prompt />);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				simulateTypingWithCursor(editableDiv, '@');
				fireEvent.keyDown(editableDiv, { key: 'Tab' });

				const mentionPill = container.querySelector('[data-mention="John Doe"]');
				expect(mentionPill).toBeInTheDocument();
			});

			it('inserts selected mention after navigation', () => {
				const { container } = render(<Prompt />);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				simulateTypingWithCursor(editableDiv, '@');
				fireEvent.keyDown(editableDiv, { key: 'ArrowDown' }); // Select Jane Smith
				fireEvent.keyDown(editableDiv, { key: 'Enter' });

				const mentionPill = container.querySelector('[data-mention="Jane Smith"]');
				expect(mentionPill).toBeInTheDocument();
			});

			it('calls onChange with serialized mention format', () => {
				const handleChange = vi.fn();
				const { container } = render(<Prompt onChange={handleChange} />);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				simulateTypingWithCursor(editableDiv, '@');
				fireEvent.keyDown(editableDiv, { key: 'Enter' });

				// Should be called with @[id] format (default options use id = label)
				expect(handleChange).toHaveBeenCalledWith(expect.stringContaining('@[john-doe]'), expect.any(Array));
			});

			it('inserts mention by clicking on option', () => {
				const { container } = render(<Prompt />);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				simulateTypingWithCursor(editableDiv, '@');

				// Click on Jane Smith option (uses mouseDown to prevent blur)
				const janeOption = screen.getByText('Jane Smith');
				fireEvent.mouseDown(janeOption);

				const mentionPill = container.querySelector('[data-mention="Jane Smith"]');
				expect(mentionPill).toBeInTheDocument();
			});

			it('adds space after inserted mention', () => {
				const handleChange = vi.fn();
				const { container } = render(<Prompt onChange={handleChange} />);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				simulateTypingWithCursor(editableDiv, '@');
				fireEvent.keyDown(editableDiv, { key: 'Enter' });

				// The onChange should include a space after the mention (using id)
				expect(handleChange).toHaveBeenCalledWith('@[john-doe] ', expect.any(Array));
			});
		});

		describe('Multiple Mentions', () => {
			it('preserves first mention when inserting second', () => {
				const { container } = render(<Prompt initialValue="Hello @[John Doe] and " />);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				// Verify first mention exists
				expect(container.querySelector('[data-mention="John Doe"]')).toBeInTheDocument();

				// Type @ after existing content to add second mention
				const textNode = document.createTextNode('Hello @John Doe and @');
				editableDiv.innerHTML = '';

				// Recreate the first mention pill
				const firstMention = document.createElement('span');
				firstMention.setAttribute('data-mention', 'John Doe');
				firstMention.setAttribute('contenteditable', 'false');
				firstMention.className = 'mention-pill';
				firstMention.textContent = '@John Doe';

				editableDiv.appendChild(document.createTextNode('Hello '));
				editableDiv.appendChild(firstMention);
				editableDiv.appendChild(document.createTextNode(' and @'));

				// Set cursor at end
				const lastTextNode = editableDiv.lastChild!;
				const range = document.createRange();
				range.setStart(lastTextNode, lastTextNode.textContent!.length);
				range.setEnd(lastTextNode, lastTextNode.textContent!.length);
				window.getSelection()?.removeAllRanges();
				window.getSelection()?.addRange(range);

				fireEvent.input(editableDiv);

				// Menu should open
				expect(screen.getByText('Jane Smith')).toBeInTheDocument();

				// Select second person
				fireEvent.keyDown(editableDiv, { key: 'ArrowDown' });
				fireEvent.keyDown(editableDiv, { key: 'Enter' });

				// Both mentions should exist
				expect(container.querySelector('[data-mention="John Doe"]')).toBeInTheDocument();
				expect(container.querySelector('[data-mention="Jane Smith"]')).toBeInTheDocument();
			});

			it('renders multiple mentions from initial value', () => {
				const { container } = render(
					<Prompt initialValue="Hi @[John Doe] and @[Jane Smith]!" />
				);

				expect(container.querySelector('[data-mention="John Doe"]')).toBeInTheDocument();
				expect(container.querySelector('[data-mention="Jane Smith"]')).toBeInTheDocument();
			});
		});

		describe('Custom Configuration', () => {
			it('uses custom trigger character', () => {
				const { container } = render(<Prompt mentionTrigger="#" />);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				// @ should not open menu
				simulateTypingWithCursor(editableDiv, '@');
				expect(screen.queryByText('John Doe')).not.toBeInTheDocument();

				// # should open menu
				simulateTypingWithCursor(editableDiv, '#');
				expect(screen.getByText('John Doe')).toBeInTheDocument();
			});

			it('uses custom mention options', () => {
				const customOptions = [
					{ id: 'alice', label: 'Alice' },
					{ id: 'bob', label: 'Bob' },
				];

				const { container } = render(<Prompt mentionOptions={customOptions} />);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				simulateTypingWithCursor(editableDiv, '@');

				// Custom options should appear
				expect(screen.getByText('Alice')).toBeInTheDocument();
				expect(screen.getByText('Bob')).toBeInTheDocument();

				// Default options should not
				expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
			});

			it('inserts custom mention with custom trigger', () => {
				const handleChange = vi.fn();
				const { container } = render(
					<Prompt
						mentionTrigger="#"
						mentionOptions={[{ id: 'tag1', label: 'important' }]}
						onChange={handleChange}
					/>
				);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				simulateTypingWithCursor(editableDiv, '#');
				fireEvent.keyDown(editableDiv, { key: 'Enter' });

				const pill = container.querySelector('[data-mention="important"]');
				expect(pill).toBeInTheDocument();
				expect(pill?.textContent).toBe('#important');
				// Uses id (tag1) in serialized format
				expect(handleChange).toHaveBeenCalledWith('#[tag1] ', expect.any(Array));
			});
		});

		describe('Mention Deletion', () => {
			it('renders mention from initial value as non-editable pill', () => {
				const { container } = render(<Prompt initialValue="@[John Doe]" />);

				const mentionPill = container.querySelector('[data-mention="John Doe"]');
				expect(mentionPill).toBeInTheDocument();
				expect(mentionPill?.getAttribute('contenteditable')).toBe('false');
			});
		});

		describe('Mention Selection (Atomic Unit)', () => {
			/**
			 * Helper to get the current selection as a string
			 */
			function getSelectionText(): string {
				return window.getSelection()?.toString() || '';
			}

			/**
			 * Helper to set cursor position at end of element
			 */
			function setCursorAtEnd(element: Element) {
				const range = document.createRange();
				range.selectNodeContents(element);
				range.collapse(false); // collapse to end
				const selection = window.getSelection();
				selection?.removeAllRanges();
				selection?.addRange(range);
			}

			/**
			 * Helper to set cursor position at start of element
			 */
			function setCursorAtStart(element: Element) {
				const range = document.createRange();
				range.selectNodeContents(element);
				range.collapse(true); // collapse to start
				const selection = window.getSelection();
				selection?.removeAllRanges();
				selection?.addRange(range);
			}

			it('selects entire mention as single unit with Shift+Left from end', () => {
				const { container } = render(<Prompt initialValue="hello @[John Doe]" />);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				// Set cursor at the end
				setCursorAtEnd(editableDiv);

				// Press Shift+Left once - should select the entire mention
				fireEvent.keyDown(editableDiv, { key: 'ArrowLeft', shiftKey: true });

				// The selection should be "@John Doe" (the display text of the mention)
				expect(getSelectionText()).toBe('@John Doe');
			});

			it('extends selection past mention with second Shift+Left', () => {
				const { container } = render(<Prompt initialValue="hello @[John Doe]" />);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				// Set cursor at the end
				setCursorAtEnd(editableDiv);

				// Press Shift+Left once to select mention
				fireEvent.keyDown(editableDiv, { key: 'ArrowLeft', shiftKey: true });
				expect(getSelectionText()).toBe('@John Doe');

				// Press Shift+Left again to extend selection by one character (the space)
				fireEvent.keyDown(editableDiv, { key: 'ArrowLeft', shiftKey: true });
				expect(getSelectionText()).toBe(' @John Doe');
			});

			it('selects mention as single unit when mention is at start with Shift+Right', () => {
				const { container } = render(<Prompt initialValue="@[John Doe] hello" />);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				// Set cursor at the start
				setCursorAtStart(editableDiv);

				// Press Shift+Right once - should select the entire mention
				fireEvent.keyDown(editableDiv, { key: 'ArrowRight', shiftKey: true });

				expect(getSelectionText()).toBe('@John Doe');
			});

			it('extends selection past mention with second Shift+Right', () => {
				const { container } = render(<Prompt initialValue="@[John Doe] hello" />);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				// Set cursor at the start
				setCursorAtStart(editableDiv);

				// Press Shift+Right once to select mention
				fireEvent.keyDown(editableDiv, { key: 'ArrowRight', shiftKey: true });
				expect(getSelectionText()).toBe('@John Doe');

				// Press Shift+Right again to extend selection by one character (the space)
				fireEvent.keyDown(editableDiv, { key: 'ArrowRight', shiftKey: true });
				expect(getSelectionText()).toBe('@John Doe ');
			});

			it('moves cursor past entire mention with single Left arrow (no shift)', () => {
				const { container } = render(<Prompt initialValue="hello @[John Doe]" />);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				// Set cursor at the end
				setCursorAtEnd(editableDiv);

				// Press Left once - cursor should move before the mention (not character by character)
				fireEvent.keyDown(editableDiv, { key: 'ArrowLeft' });

				// Now Shift+Right should select the entire mention (proving cursor is before it)
				fireEvent.keyDown(editableDiv, { key: 'ArrowRight', shiftKey: true });
				expect(getSelectionText()).toBe('@John Doe');
			});

			it('moves cursor past entire mention with single Right arrow (no shift)', () => {
				const { container } = render(<Prompt initialValue="@[John Doe] hello" />);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				// Set cursor at the start
				setCursorAtStart(editableDiv);

				// Press Right once - cursor should move after the mention (not character by character)
				fireEvent.keyDown(editableDiv, { key: 'ArrowRight' });

				// Now Shift+Left should select the entire mention (proving cursor is after it)
				fireEvent.keyDown(editableDiv, { key: 'ArrowLeft', shiftKey: true });
				expect(getSelectionText()).toBe('@John Doe');
			});

			it('adds mention-selected class when mention is within selection', () => {
				const { container } = render(<Prompt initialValue="@[John Doe]" />);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;
				const mentionPill = container.querySelector('[data-mention="John Doe"]')!;

				// Initially, mention should not have selected class
				expect(mentionPill).not.toHaveClass('mention-selected');

				// Select the mention using Shift+Left from end
				setCursorAtEnd(editableDiv);
				fireEvent.keyDown(editableDiv, { key: 'ArrowLeft', shiftKey: true });
				fireEvent.keyUp(editableDiv, { key: 'ArrowLeft', shiftKey: true });

				// Now mention should have selected class
				expect(mentionPill).toHaveClass('mention-selected');
			});

			it('removes mention-selected class when selection is cleared', () => {
				const { container } = render(<Prompt initialValue="@[John Doe]" />);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;
				const mentionPill = container.querySelector('[data-mention="John Doe"]')!;

				// Select the mention
				setCursorAtEnd(editableDiv);
				fireEvent.keyDown(editableDiv, { key: 'ArrowLeft', shiftKey: true });
				fireEvent.keyUp(editableDiv, { key: 'ArrowLeft', shiftKey: true });
				expect(mentionPill).toHaveClass('mention-selected');

				// Move cursor without shift to collapse selection
				fireEvent.keyDown(editableDiv, { key: 'ArrowRight' });
				fireEvent.keyUp(editableDiv, { key: 'ArrowRight' });

				// Mention should no longer have selected class
				expect(mentionPill).not.toHaveClass('mention-selected');
			});

			it('selects multiple mentions correctly with Shift+Left', () => {
				const { container } = render(<Prompt initialValue="hi @[John Doe] and @[Jane Smith]" />);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				// Set cursor at the end
				setCursorAtEnd(editableDiv);

				// First Shift+Left - select second mention
				fireEvent.keyDown(editableDiv, { key: 'ArrowLeft', shiftKey: true });
				expect(getSelectionText()).toBe('@Jane Smith');

				// Second Shift+Left - extend to include " and "
				fireEvent.keyDown(editableDiv, { key: 'ArrowLeft', shiftKey: true });
				expect(getSelectionText()).toBe(' @Jane Smith');

				fireEvent.keyDown(editableDiv, { key: 'ArrowLeft', shiftKey: true });
				expect(getSelectionText()).toBe('d @Jane Smith');

				fireEvent.keyDown(editableDiv, { key: 'ArrowLeft', shiftKey: true });
				expect(getSelectionText()).toBe('nd @Jane Smith');

				fireEvent.keyDown(editableDiv, { key: 'ArrowLeft', shiftKey: true });
				expect(getSelectionText()).toBe('and @Jane Smith');

				fireEvent.keyDown(editableDiv, { key: 'ArrowLeft', shiftKey: true });
				expect(getSelectionText()).toBe(' and @Jane Smith');

				// Next Shift+Left - select first mention
				fireEvent.keyDown(editableDiv, { key: 'ArrowLeft', shiftKey: true });
				expect(getSelectionText()).toBe('@John Doe and @Jane Smith');
			});

			it('contracts selection with Shift+Right after selecting mention leftward', () => {
				const { container } = render(<Prompt initialValue="x @[John Doe]" />);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				// Set cursor at end
				setCursorAtEnd(editableDiv);

				// Select the mention going leftward
				fireEvent.keyDown(editableDiv, { key: 'ArrowLeft', shiftKey: true });
				expect(getSelectionText()).toBe('@John Doe');

				// Extend left to include space
				fireEvent.keyDown(editableDiv, { key: 'ArrowLeft', shiftKey: true });
				expect(getSelectionText()).toBe(' @John Doe');

				// Now contract with Shift+Right - should remove the space
				fireEvent.keyDown(editableDiv, { key: 'ArrowRight', shiftKey: true });
				expect(getSelectionText()).toBe('@John Doe');

				// Contract more - should remove the mention entirely
				fireEvent.keyDown(editableDiv, { key: 'ArrowRight', shiftKey: true });
				expect(getSelectionText()).toBe('');
			});

			it('contracts selection with Shift+Left after selecting mention rightward', () => {
				const { container } = render(<Prompt initialValue="@[John Doe] x" />);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				// Set cursor at start
				setCursorAtStart(editableDiv);

				// Select the mention going rightward
				fireEvent.keyDown(editableDiv, { key: 'ArrowRight', shiftKey: true });
				expect(getSelectionText()).toBe('@John Doe');

				// Extend right to include space
				fireEvent.keyDown(editableDiv, { key: 'ArrowRight', shiftKey: true });
				expect(getSelectionText()).toBe('@John Doe ');

				// Now contract with Shift+Left - should remove the space
				fireEvent.keyDown(editableDiv, { key: 'ArrowLeft', shiftKey: true });
				expect(getSelectionText()).toBe('@John Doe');

				// Contract more - should remove the mention entirely
				fireEvent.keyDown(editableDiv, { key: 'ArrowLeft', shiftKey: true });
				expect(getSelectionText()).toBe('');
			});

		});
	});

	describe('Submenus, Dividers, and Titles', () => {
		const nestedOptions = [
			{ id: 'title-people', label: 'People', type: 'title' as const },
			{ id: 'alice', label: 'Alice' },
			{ id: 'bob', label: 'Bob' },
			{ id: 'divider-1', label: '', type: 'divider' as const },
			{ id: 'title-folders', label: 'Folders', type: 'title' as const },
			{
				id: 'projects',
				label: 'Projects',
				children: [
					{ id: 'title-active', label: 'Active', type: 'title' as const },
					{ id: 'project-alpha', label: 'Project Alpha' },
					{ id: 'project-beta', label: 'Project Beta' },
					{ id: 'divider-2', label: '', type: 'divider' as const },
					{
						id: 'archived',
						label: 'Archived',
						children: [
							{ id: 'old-project', label: 'Old Project' },
						],
					},
				],
			},
			{ id: 'documents', label: 'Documents' },
		];

		describe('Menu Display with Titles and Dividers', () => {
			it('renders titles as non-selectable headers', () => {
				const { container } = render(<Prompt mentionOptions={nestedOptions} />);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				simulateTypingWithCursor(editableDiv, '@');

				// Title should be rendered
				expect(screen.getByText('People')).toBeInTheDocument();
				expect(screen.getByText('Folders')).toBeInTheDocument();

				// Titles should have the title class, not item class
				const titleElements = container.querySelectorAll('.mention-menu-title');
				expect(titleElements.length).toBe(2);
			});

			it('renders dividers as separators', () => {
				const { container } = render(<Prompt mentionOptions={nestedOptions} />);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				simulateTypingWithCursor(editableDiv, '@');

				// Dividers should be rendered with separator role
				const dividers = container.querySelectorAll('.mention-menu-divider');
				expect(dividers.length).toBe(1);
				expect(dividers[0]).toHaveAttribute('role', 'separator');
			});

			it('shows items with children with chevron indicator', () => {
				const { container } = render(<Prompt mentionOptions={nestedOptions} />);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				simulateTypingWithCursor(editableDiv, '@');

				// Projects should have chevron indicator
				const projectsItem = screen.getByText('Projects').closest('.mention-menu-item');
				expect(projectsItem).toHaveClass('mention-menu-item-has-children');

				// Should have chevron SVG
				const chevron = projectsItem?.querySelector('.mention-menu-chevron');
				expect(chevron).toBeInTheDocument();
			});
		});

		describe('Navigation with Titles and Dividers', () => {
			it('skips titles when navigating with ArrowDown', () => {
				const { container } = render(<Prompt mentionOptions={nestedOptions} />);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				simulateTypingWithCursor(editableDiv, '@');

				// First selectable item (Alice) should be selected by default (skipping title)
				const items = container.querySelectorAll('.mention-menu-item');
				expect(items[0]).toHaveClass('mention-menu-item-selected');
				expect(items[0]?.textContent).toContain('Alice');
			});

			it('skips dividers when navigating with ArrowDown', () => {
				const { container } = render(<Prompt mentionOptions={nestedOptions} />);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				simulateTypingWithCursor(editableDiv, '@');

				// Navigate down past Alice, Bob (skip divider and title), to Projects
				fireEvent.keyDown(editableDiv, { key: 'ArrowDown' }); // Bob
				fireEvent.keyDown(editableDiv, { key: 'ArrowDown' }); // Projects (skips divider + title)

				const items = container.querySelectorAll('.mention-menu-item');
				// Projects should be selected
				const selectedItem = container.querySelector('.mention-menu-item-selected');
				expect(selectedItem?.textContent).toContain('Projects');
			});

			it('skips titles and dividers when navigating with ArrowUp', () => {
				const { container } = render(<Prompt mentionOptions={nestedOptions} />);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				simulateTypingWithCursor(editableDiv, '@');

				// Navigate to Projects
				fireEvent.keyDown(editableDiv, { key: 'ArrowDown' }); // Bob
				fireEvent.keyDown(editableDiv, { key: 'ArrowDown' }); // Projects

				// Now go back up - should skip divider and title
				fireEvent.keyDown(editableDiv, { key: 'ArrowUp' }); // Bob (skips divider + title)

				const selectedItem = container.querySelector('.mention-menu-item-selected');
				expect(selectedItem?.textContent).toContain('Bob');
			});

			it('wraps around when navigating past end, skipping non-selectable items', () => {
				const { container } = render(<Prompt mentionOptions={nestedOptions} />);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				simulateTypingWithCursor(editableDiv, '@');

				// Navigate to Documents (last item)
				fireEvent.keyDown(editableDiv, { key: 'ArrowDown' }); // Bob
				fireEvent.keyDown(editableDiv, { key: 'ArrowDown' }); // Projects
				fireEvent.keyDown(editableDiv, { key: 'ArrowDown' }); // Documents

				// Navigate down once more - should wrap to Alice (first selectable)
				fireEvent.keyDown(editableDiv, { key: 'ArrowDown' });

				const selectedItem = container.querySelector('.mention-menu-item-selected');
				expect(selectedItem?.textContent).toContain('Alice');
			});
		});

		describe('Entering Submenus with Tab', () => {
			it('enters submenu when pressing Tab on item with children', () => {
				const { container } = render(<Prompt mentionOptions={nestedOptions} />);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				simulateTypingWithCursor(editableDiv, '@');

				// Navigate to Projects
				fireEvent.keyDown(editableDiv, { key: 'ArrowDown' }); // Bob
				fireEvent.keyDown(editableDiv, { key: 'ArrowDown' }); // Projects

				// Press Tab to enter submenu
				fireEvent.keyDown(editableDiv, { key: 'Tab' });

				// Should now see submenu items
				expect(screen.getByText('Project Alpha')).toBeInTheDocument();
				expect(screen.getByText('Project Beta')).toBeInTheDocument();
				expect(screen.getByText('Archived')).toBeInTheDocument();

				// Should show Back button
				expect(screen.getByText('Back')).toBeInTheDocument();
			});

			it('selects first selectable item in submenu (skipping title)', () => {
				const { container } = render(<Prompt mentionOptions={nestedOptions} />);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				simulateTypingWithCursor(editableDiv, '@');

				// Navigate to Projects and enter submenu
				fireEvent.keyDown(editableDiv, { key: 'ArrowDown' }); // Bob
				fireEvent.keyDown(editableDiv, { key: 'ArrowDown' }); // Projects
				fireEvent.keyDown(editableDiv, { key: 'Tab' }); // Enter submenu

				// First selectable item should be selected (Project Alpha, not the title)
				const selectedItem = container.querySelector('.mention-menu-item-selected');
				expect(selectedItem?.textContent).toContain('Project Alpha');
			});

			it('inserts mention when pressing Tab on item without children', () => {
				const { container } = render(<Prompt mentionOptions={nestedOptions} />);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				simulateTypingWithCursor(editableDiv, '@');

				// Alice doesn't have children, Tab should insert mention
				fireEvent.keyDown(editableDiv, { key: 'Tab' });

				const mentionPill = container.querySelector('[data-mention="Alice"]');
				expect(mentionPill).toBeInTheDocument();
			});

			it('can navigate deeply nested submenus', () => {
				const { container } = render(<Prompt mentionOptions={nestedOptions} />);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				simulateTypingWithCursor(editableDiv, '@');

				// Navigate to Projects
				fireEvent.keyDown(editableDiv, { key: 'ArrowDown' }); // Bob
				fireEvent.keyDown(editableDiv, { key: 'ArrowDown' }); // Projects
				fireEvent.keyDown(editableDiv, { key: 'Tab' }); // Enter Projects submenu

				// Navigate to Archived
				fireEvent.keyDown(editableDiv, { key: 'ArrowDown' }); // Project Beta
				fireEvent.keyDown(editableDiv, { key: 'ArrowDown' }); // Archived (skips divider)

				// Enter Archived submenu
				fireEvent.keyDown(editableDiv, { key: 'Tab' });

				// Should see deeply nested item
				expect(screen.getByText('Old Project')).toBeInTheDocument();
			});
		});

		describe('Exiting Submenus with Escape', () => {
			it('exits submenu back to parent when pressing Escape', () => {
				const { container } = render(<Prompt mentionOptions={nestedOptions} />);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				simulateTypingWithCursor(editableDiv, '@');

				// Navigate to Projects and enter submenu
				fireEvent.keyDown(editableDiv, { key: 'ArrowDown' }); // Bob
				fireEvent.keyDown(editableDiv, { key: 'ArrowDown' }); // Projects
				fireEvent.keyDown(editableDiv, { key: 'Tab' }); // Enter submenu

				// Verify we're in submenu
				expect(screen.getByText('Project Alpha')).toBeInTheDocument();

				// Press Escape to go back
				fireEvent.keyDown(editableDiv, { key: 'Escape' });

				// Should be back in root menu
				expect(screen.getByText('Alice')).toBeInTheDocument();
				expect(screen.getByText('Bob')).toBeInTheDocument();
				expect(screen.queryByText('Project Alpha')).not.toBeInTheDocument();
			});

			it('selects parent item after exiting submenu', () => {
				const { container } = render(<Prompt mentionOptions={nestedOptions} />);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				simulateTypingWithCursor(editableDiv, '@');

				// Navigate to Projects and enter submenu
				fireEvent.keyDown(editableDiv, { key: 'ArrowDown' }); // Bob
				fireEvent.keyDown(editableDiv, { key: 'ArrowDown' }); // Projects
				fireEvent.keyDown(editableDiv, { key: 'Tab' }); // Enter submenu

				// Press Escape to go back
				fireEvent.keyDown(editableDiv, { key: 'Escape' });

				// Projects should be selected
				const selectedItem = container.querySelector('.mention-menu-item-selected');
				expect(selectedItem?.textContent).toContain('Projects');
			});

			it('closes menu when pressing Escape at root level', () => {
				const { container } = render(<Prompt mentionOptions={nestedOptions} />);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				simulateTypingWithCursor(editableDiv, '@');
				expect(screen.getByText('Alice')).toBeInTheDocument();

				// Press Escape at root level
				fireEvent.keyDown(editableDiv, { key: 'Escape' });

				// Menu should be closed
				expect(screen.queryByText('Alice')).not.toBeInTheDocument();
			});

			it('exits multiple levels of submenus with multiple Escapes', () => {
				const { container } = render(<Prompt mentionOptions={nestedOptions} />);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				simulateTypingWithCursor(editableDiv, '@');

				// Navigate to Projects > Archived
				fireEvent.keyDown(editableDiv, { key: 'ArrowDown' }); // Bob
				fireEvent.keyDown(editableDiv, { key: 'ArrowDown' }); // Projects
				fireEvent.keyDown(editableDiv, { key: 'Tab' }); // Enter Projects

				fireEvent.keyDown(editableDiv, { key: 'ArrowDown' }); // Project Beta
				fireEvent.keyDown(editableDiv, { key: 'ArrowDown' }); // Archived
				fireEvent.keyDown(editableDiv, { key: 'Tab' }); // Enter Archived

				// Verify we're in deepest submenu
				expect(screen.getByText('Old Project')).toBeInTheDocument();

				// First Escape - back to Projects submenu
				fireEvent.keyDown(editableDiv, { key: 'Escape' });
				expect(screen.getByText('Project Alpha')).toBeInTheDocument();
				expect(screen.queryByText('Old Project')).not.toBeInTheDocument();

				// Second Escape - back to root
				fireEvent.keyDown(editableDiv, { key: 'Escape' });
				expect(screen.getByText('Alice')).toBeInTheDocument();
				expect(screen.queryByText('Project Alpha')).not.toBeInTheDocument();

				// Third Escape - close menu
				fireEvent.keyDown(editableDiv, { key: 'Escape' });
				expect(screen.queryByText('Alice')).not.toBeInTheDocument();
			});
		});

		describe('Back Button', () => {
			it('shows Back button when in submenu', () => {
				const { container } = render(<Prompt mentionOptions={nestedOptions} />);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				simulateTypingWithCursor(editableDiv, '@');

				// Initially no Back button
				expect(screen.queryByText('Back')).not.toBeInTheDocument();

				// Enter submenu
				fireEvent.keyDown(editableDiv, { key: 'ArrowDown' }); // Bob
				fireEvent.keyDown(editableDiv, { key: 'ArrowDown' }); // Projects
				fireEvent.keyDown(editableDiv, { key: 'Tab' });

				// Back button should appear
				expect(screen.getByText('Back')).toBeInTheDocument();
			});

			it('clicking Back button exits submenu', () => {
				const { container } = render(<Prompt mentionOptions={nestedOptions} />);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				simulateTypingWithCursor(editableDiv, '@');

				// Enter submenu
				fireEvent.keyDown(editableDiv, { key: 'ArrowDown' }); // Bob
				fireEvent.keyDown(editableDiv, { key: 'ArrowDown' }); // Projects
				fireEvent.keyDown(editableDiv, { key: 'Tab' });

				// Click Back button
				const backButton = screen.getByText('Back').closest('.mention-menu-back')!;
				fireEvent.mouseDown(backButton);

				// Should be back in root menu
				expect(screen.getByText('Alice')).toBeInTheDocument();
				expect(screen.queryByText('Project Alpha')).not.toBeInTheDocument();
			});
		});

		describe('Selecting Items in Submenus', () => {
			it('inserts mention from submenu with Enter', () => {
				const { container } = render(<Prompt mentionOptions={nestedOptions} />);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				simulateTypingWithCursor(editableDiv, '@');

				// Navigate to Projects and enter submenu
				fireEvent.keyDown(editableDiv, { key: 'ArrowDown' }); // Bob
				fireEvent.keyDown(editableDiv, { key: 'ArrowDown' }); // Projects
				fireEvent.keyDown(editableDiv, { key: 'Tab' }); // Enter submenu

				// Select Project Alpha with Enter
				fireEvent.keyDown(editableDiv, { key: 'Enter' });

				const mentionPill = container.querySelector('[data-mention="Project Alpha"]');
				expect(mentionPill).toBeInTheDocument();
			});

			it('inserts mention from submenu by clicking', () => {
				const { container } = render(<Prompt mentionOptions={nestedOptions} />);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				simulateTypingWithCursor(editableDiv, '@');

				// Navigate to Projects and enter submenu
				fireEvent.keyDown(editableDiv, { key: 'ArrowDown' }); // Bob
				fireEvent.keyDown(editableDiv, { key: 'ArrowDown' }); // Projects
				fireEvent.keyDown(editableDiv, { key: 'Tab' }); // Enter submenu

				// Click on Project Beta
				const projectBeta = screen.getByText('Project Beta');
				fireEvent.mouseDown(projectBeta);

				const mentionPill = container.querySelector('[data-mention="Project Beta"]');
				expect(mentionPill).toBeInTheDocument();
			});

			it('clicking on item with children enters submenu instead of selecting', () => {
				const { container } = render(<Prompt mentionOptions={nestedOptions} />);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				simulateTypingWithCursor(editableDiv, '@');

				// Click on Projects (which has children)
				const projectsItem = screen.getByText('Projects');
				fireEvent.mouseDown(projectsItem);

				// Should enter submenu, not insert mention
				expect(container.querySelector('[data-mention="Projects"]')).not.toBeInTheDocument();
				expect(screen.getByText('Project Alpha')).toBeInTheDocument();
			});
		});

		describe('Hover Selection in Submenus', () => {
			it('updates selection on hover', () => {
				const { container } = render(<Prompt mentionOptions={nestedOptions} />);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				simulateTypingWithCursor(editableDiv, '@');

				// Initially Alice is selected
				let selectedItem = container.querySelector('.mention-menu-item-selected');
				expect(selectedItem?.textContent).toContain('Alice');

				// Hover over Bob
				const bobItem = screen.getByText('Bob').closest('.mention-menu-item')!;
				fireEvent.mouseEnter(bobItem);

				// Bob should now be selected
				selectedItem = container.querySelector('.mention-menu-item-selected');
				expect(selectedItem?.textContent).toContain('Bob');
			});
		});

		describe('Search with Flat Results', () => {
			it('shows flat list of matching items when searching', () => {
				const { container } = render(<Prompt mentionOptions={nestedOptions} />);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				// Search for "Project" - should find items from nested structure
				simulateTypingWithCursor(editableDiv, '@Project');

				// Should see Project Alpha, Project Beta from nested submenu as flat list
				expect(screen.getByText('Project Alpha')).toBeInTheDocument();
				expect(screen.getByText('Project Beta')).toBeInTheDocument();

				// No Back button since results are flat (not in submenu)
				expect(screen.queryByText('Back')).not.toBeInTheDocument();
			});

			it('finds deeply nested items in flat search results', () => {
				const { container } = render(<Prompt mentionOptions={nestedOptions} />);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				// Search for "Old" - should find deeply nested item
				simulateTypingWithCursor(editableDiv, '@Old');

				// Should see the deeply nested item in flat results
				expect(screen.getByText('Old Project')).toBeInTheDocument();

				// Should be able to select it directly with Enter
				fireEvent.keyDown(editableDiv, { key: 'Enter' });

				const mentionPill = container.querySelector('[data-mention="Old Project"]');
				expect(mentionPill).toBeInTheDocument();
			});

			it('search results do not have chevron indicators (no children)', () => {
				const { container } = render(<Prompt mentionOptions={nestedOptions} />);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				// Search for "Project" 
				simulateTypingWithCursor(editableDiv, '@Project');

				// Items in search results should not have chevron (children are removed)
				const items = container.querySelectorAll('.mention-menu-item');
				items.forEach(item => {
					expect(item).not.toHaveClass('mention-menu-item-has-children');
					expect(item.querySelector('.mention-menu-chevron')).not.toBeInTheDocument();
				});
			});

			it('can select search result directly without navigating submenu', () => {
				const { container } = render(<Prompt mentionOptions={nestedOptions} />);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				// Search for "Beta"
				simulateTypingWithCursor(editableDiv, '@Beta');

				// Should be able to click directly on it
				const betaItem = screen.getByText('Project Beta');
				fireEvent.mouseDown(betaItem);

				// Mention should be inserted
				const mentionPill = container.querySelector('[data-mention="Project Beta"]');
				expect(mentionPill).toBeInTheDocument();
			});

			it('clears search and shows full menu when deleting search text', () => {
				const { container } = render(<Prompt mentionOptions={nestedOptions} />);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				// Type search
				simulateTypingWithCursor(editableDiv, '@Pro');

				// Verify search is active (only matching items shown)
				expect(screen.getByText('Projects')).toBeInTheDocument();
				expect(screen.queryByText('Alice')).not.toBeInTheDocument();

				// Clear search back to just @
				simulateTypingWithCursor(editableDiv, '@');

				// Full menu should be visible again with titles and structure
				expect(screen.getByText('Alice')).toBeInTheDocument();
				expect(screen.getByText('People')).toBeInTheDocument(); // Title
			});

			it('search results exclude titles and dividers', () => {
				const { container } = render(<Prompt mentionOptions={nestedOptions} />);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				// Search for "Peo" which would match the title "People"
				simulateTypingWithCursor(editableDiv, '@Peo');

				// Title should NOT appear in search results
				expect(screen.queryByText('People')).not.toBeInTheDocument();

				// No dividers should appear
				const dividers = container.querySelectorAll('.mention-menu-divider');
				expect(dividers.length).toBe(0);
			});

			it('shows items from multiple levels that match search', () => {
				const { container } = render(<Prompt mentionOptions={nestedOptions} />);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				// Search for "a" - should match Alice, Project Alpha, Archived
				simulateTypingWithCursor(editableDiv, '@a');

				// All matching items from different levels should appear
				expect(screen.getByText('Alice')).toBeInTheDocument();
				expect(screen.getByText('Project Alpha')).toBeInTheDocument();
				expect(screen.getByText('Archived')).toBeInTheDocument();
			});
		});
	});

	describe('Mention ID Format and Tracking', () => {
		const optionsWithIds = [
			{ id: 'user-123', label: 'John Doe' },
			{ id: 'user-456', label: 'Jane Smith' },
		];

		describe('ID in @[] Format', () => {
			it('serializes mention with id instead of label', () => {
				const handleChange = vi.fn();
				const { container } = render(
					<Prompt mentionOptions={optionsWithIds} onChange={handleChange} />
				);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				simulateTypingWithCursor(editableDiv, '@');
				fireEvent.keyDown(editableDiv, { key: 'Enter' }); // Select John Doe

				// Should serialize with id (user-123) not label (John Doe)
				expect(handleChange).toHaveBeenCalledWith(
					expect.stringContaining('@[user-123]'),
					expect.any(Array)
				);
			});

			it('parses initial value with id and displays label', () => {
				const { container } = render(
					<Prompt
						initialValue="Hello @[user-123]!"
						mentionOptions={optionsWithIds}
					/>
				);

				// Should display the label, not the id
				const mentionPill = container.querySelector('[data-mention="John Doe"]');
				expect(mentionPill).toBeInTheDocument();
				expect(mentionPill?.textContent).toBe('@John Doe');

				// Should have the id stored
				expect(mentionPill?.getAttribute('data-mention-id')).toBe('user-123');
			});

			it('falls back to id as label when option not found', () => {
				const { container } = render(
					<Prompt
						initialValue="Hello @[unknown-id]!"
						mentionOptions={optionsWithIds}
					/>
				);

				// Should use the id as both display and id
				const mentionPill = container.querySelector('[data-mention="unknown-id"]');
				expect(mentionPill).toBeInTheDocument();
				expect(mentionPill?.getAttribute('data-mention-id')).toBe('unknown-id');
			});

			it('stores both id and label in mention pill attributes', () => {
				const { container } = render(
					<Prompt mentionOptions={optionsWithIds} />
				);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				simulateTypingWithCursor(editableDiv, '@');
				fireEvent.keyDown(editableDiv, { key: 'Enter' }); // Select John Doe

				const mentionPill = container.querySelector('[data-mention]');
				expect(mentionPill?.getAttribute('data-mention')).toBe('John Doe'); // label
				expect(mentionPill?.getAttribute('data-mention-id')).toBe('user-123'); // id
			});
		});

		describe('onChange with mentions list', () => {
			it('calls onChange with empty mentions array when no mentions', () => {
				const handleChange = vi.fn();
				const { container } = render(
					<Prompt onChange={handleChange} mentionOptions={optionsWithIds} />
				);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				editableDiv.textContent = 'Hello world';
				fireEvent.input(editableDiv);

				expect(handleChange).toHaveBeenCalledWith('Hello world', []);
			});

			it('calls onChange with mentions array when content has mentions', () => {
				const handleChange = vi.fn();
				const { container } = render(
					<Prompt onChange={handleChange} mentionOptions={optionsWithIds} />
				);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				simulateTypingWithCursor(editableDiv, '@');
				fireEvent.keyDown(editableDiv, { key: 'Enter' }); // Select John Doe

				expect(handleChange).toHaveBeenLastCalledWith(
					'@[user-123] ',
					[{ id: 'user-123', label: 'John Doe' }]
				);
			});

			it('calls onChange with multiple mentions in array', () => {
				const handleChange = vi.fn();
				const { container } = render(
					<Prompt
						initialValue="@[user-123] and @[user-456]"
						onChange={handleChange}
						mentionOptions={optionsWithIds}
					/>
				);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				// Trigger a change
				editableDiv.textContent = '@John Doe and @Jane Smith more';

				// Recreate the mention pills
				editableDiv.innerHTML = '';
				const mention1 = document.createElement('span');
				mention1.setAttribute('data-mention', 'John Doe');
				mention1.setAttribute('data-mention-id', 'user-123');
				mention1.setAttribute('contenteditable', 'false');
				mention1.className = 'mention-pill';
				mention1.textContent = '@John Doe';

				const mention2 = document.createElement('span');
				mention2.setAttribute('data-mention', 'Jane Smith');
				mention2.setAttribute('data-mention-id', 'user-456');
				mention2.setAttribute('contenteditable', 'false');
				mention2.className = 'mention-pill';
				mention2.textContent = '@Jane Smith';

				editableDiv.appendChild(mention1);
				editableDiv.appendChild(document.createTextNode(' and '));
				editableDiv.appendChild(mention2);
				editableDiv.appendChild(document.createTextNode(' more'));

				fireEvent.input(editableDiv);

				expect(handleChange).toHaveBeenLastCalledWith(
					'@[user-123] and @[user-456] more',
					expect.arrayContaining([
						{ id: 'user-123', label: 'John Doe' },
						{ id: 'user-456', label: 'Jane Smith' },
					])
				);
			});
		});

		describe('onEnter with mentions list', () => {
			it('calls onEnter with empty mentions array when no mentions', () => {
				const handleEnter = vi.fn();
				const { container } = render(
					<Prompt onEnter={handleEnter} mentionOptions={optionsWithIds} />
				);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				editableDiv.textContent = 'Hello world';
				fireEvent.input(editableDiv);
				fireEvent.keyDown(editableDiv, { key: 'Enter' });

				expect(handleEnter).toHaveBeenCalledWith('Hello world', []);
			});

			it('calls onEnter with mentions array when content has mentions', () => {
				const handleEnter = vi.fn();
				const { container } = render(
					<Prompt
						initialValue="Hello @[user-123]!"
						onEnter={handleEnter}
						mentionOptions={optionsWithIds}
					/>
				);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				fireEvent.keyDown(editableDiv, { key: 'Enter' });

				expect(handleEnter).toHaveBeenCalledWith(
					'Hello @[user-123]!',
					[{ id: 'user-123', label: 'John Doe' }]
				);
			});

			it('calls onEnter with multiple mentions in array', () => {
				const handleEnter = vi.fn();
				const { container } = render(
					<Prompt
						initialValue="@[user-123] and @[user-456]"
						onEnter={handleEnter}
						mentionOptions={optionsWithIds}
					/>
				);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				fireEvent.keyDown(editableDiv, { key: 'Enter' });

				expect(handleEnter).toHaveBeenCalledWith(
					'@[user-123] and @[user-456]',
					expect.arrayContaining([
						{ id: 'user-123', label: 'John Doe' },
						{ id: 'user-456', label: 'Jane Smith' },
					])
				);
			});
		});

		describe('onMentionAdded callback', () => {
			it('calls onMentionAdded when mention is inserted via Enter', () => {
				const handleMentionAdded = vi.fn();
				const handleChange = vi.fn();
				const { container } = render(
					<Prompt
						onMentionAdded={handleMentionAdded}
						onChange={handleChange}
						mentionOptions={optionsWithIds}
					/>
				);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				simulateTypingWithCursor(editableDiv, '@');
				fireEvent.keyDown(editableDiv, { key: 'Enter' }); // Select John Doe

				expect(handleMentionAdded).toHaveBeenCalledWith({
					id: 'user-123',
					label: 'John Doe',
				});
			});

			it('calls onMentionAdded when mention is inserted via Tab', () => {
				const handleMentionAdded = vi.fn();
				const handleChange = vi.fn();
				const { container } = render(
					<Prompt
						onMentionAdded={handleMentionAdded}
						onChange={handleChange}
						mentionOptions={optionsWithIds}
					/>
				);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				simulateTypingWithCursor(editableDiv, '@');
				fireEvent.keyDown(editableDiv, { key: 'Tab' }); // Select John Doe

				expect(handleMentionAdded).toHaveBeenCalledWith({
					id: 'user-123',
					label: 'John Doe',
				});
			});

			it('calls onMentionAdded when mention is inserted via click', () => {
				const handleMentionAdded = vi.fn();
				const handleChange = vi.fn();
				const { container } = render(
					<Prompt
						onMentionAdded={handleMentionAdded}
						onChange={handleChange}
						mentionOptions={optionsWithIds}
					/>
				);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				simulateTypingWithCursor(editableDiv, '@');

				// Click on Jane Smith option
				const janeOption = screen.getByText('Jane Smith');
				fireEvent.mouseDown(janeOption);

				expect(handleMentionAdded).toHaveBeenCalledWith({
					id: 'user-456',
					label: 'Jane Smith',
				});
			});

			it('calls onMentionAdded for each mention when multiple are added', () => {
				const handleMentionAdded = vi.fn();
				const handleChange = vi.fn();
				const { container } = render(
					<Prompt
						onMentionAdded={handleMentionAdded}
						onChange={handleChange}
						mentionOptions={optionsWithIds}
					/>
				);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				// Add first mention
				simulateTypingWithCursor(editableDiv, '@');
				fireEvent.keyDown(editableDiv, { key: 'Enter' }); // Select John Doe

				expect(handleMentionAdded).toHaveBeenCalledWith({
					id: 'user-123',
					label: 'John Doe',
				});

				// Add second mention
				const currentText = editableDiv.textContent || '';
				simulateTypingWithCursor(editableDiv, currentText + ' @');

				// Need to recreate the first mention pill
				const mention1 = document.createElement('span');
				mention1.setAttribute('data-mention', 'John Doe');
				mention1.setAttribute('data-mention-id', 'user-123');
				mention1.setAttribute('contenteditable', 'false');
				mention1.className = 'mention-pill';
				mention1.textContent = '@John Doe';

				editableDiv.innerHTML = '';
				editableDiv.appendChild(mention1);
				editableDiv.appendChild(document.createTextNode(' @'));

				const textNode = editableDiv.lastChild!;
				const range = document.createRange();
				range.setStart(textNode, textNode.textContent!.length);
				range.setEnd(textNode, textNode.textContent!.length);
				window.getSelection()?.removeAllRanges();
				window.getSelection()?.addRange(range);

				fireEvent.input(editableDiv);

				// Select Jane Smith
				fireEvent.keyDown(editableDiv, { key: 'ArrowDown' });
				fireEvent.keyDown(editableDiv, { key: 'Enter' });

				expect(handleMentionAdded).toHaveBeenCalledWith({
					id: 'user-456',
					label: 'Jane Smith',
				});
			});

			it('does not call onMentionAdded for initial value mentions', () => {
				const handleMentionAdded = vi.fn();
				render(
					<Prompt
						initialValue="Hello @[user-123]!"
						onMentionAdded={handleMentionAdded}
						mentionOptions={optionsWithIds}
					/>
				);

				// onMentionAdded should NOT be called for mentions in initial value
				expect(handleMentionAdded).not.toHaveBeenCalled();
			});
		});

		describe('onMentionDeleted callback', () => {
			it('calls onMentionDeleted when mention is deleted via backspace', () => {
				const handleMentionDeleted = vi.fn();
				const handleChange = vi.fn();
				const { container } = render(
					<Prompt
						initialValue="@[user-123] "
						onMentionDeleted={handleMentionDeleted}
						onChange={handleChange}
						mentionOptions={optionsWithIds}
					/>
				);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				// Position cursor right after the mention
				const mentionPill = container.querySelector('[data-mention="John Doe"]')!;
				const textNodeAfter = mentionPill.nextSibling;

				const range = document.createRange();
				if (textNodeAfter) {
					range.setStart(textNodeAfter, 0);
				} else {
					range.setStartAfter(mentionPill);
				}
				range.collapse(true);
				window.getSelection()?.removeAllRanges();
				window.getSelection()?.addRange(range);

				// Press backspace to delete the mention
				mentionPill.remove();
				fireEvent.input(editableDiv);

				expect(handleMentionDeleted).toHaveBeenCalledWith({
					id: 'user-123',
					label: 'John Doe',
				});
			});

			it('calls onMentionDeleted when mention is deleted via delete button', () => {
				const handleMentionDeleted = vi.fn();
				const handleChange = vi.fn();
				const { container } = render(
					<Prompt
						initialValue="Hello @[user-123]!"
						onMentionDeleted={handleMentionDeleted}
						onChange={handleChange}
						mentionOptions={optionsWithIds}
					/>
				);

				// Find and click the delete button on the mention
				const deleteButton = container.querySelector('[data-mention-delete]');
				if (deleteButton) {
					fireEvent.mouseDown(deleteButton);

					expect(handleMentionDeleted).toHaveBeenCalledWith({
						id: 'user-123',
						label: 'John Doe',
					});
				}
			});

			it('calls onMentionDeleted when content is cleared', () => {
				const handleMentionDeleted = vi.fn();
				const handleChange = vi.fn();

				const { container } = render(
					<Prompt
						initialValue="@[user-123]"
						onMentionDeleted={handleMentionDeleted}
						onChange={handleChange}
						mentionOptions={optionsWithIds}
					/>
				);

				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				// Clear all content
				editableDiv.innerHTML = '';
				fireEvent.input(editableDiv);

				expect(handleMentionDeleted).toHaveBeenCalledWith({
					id: 'user-123',
					label: 'John Doe',
				});
			});

			it('calls onMentionDeleted for each deleted mention when multiple are removed', () => {
				const handleMentionDeleted = vi.fn();
				const handleChange = vi.fn();
				const { container } = render(
					<Prompt
						initialValue="@[user-123] and @[user-456]"
						onMentionDeleted={handleMentionDeleted}
						onChange={handleChange}
						mentionOptions={optionsWithIds}
					/>
				);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				// Clear all content
				editableDiv.innerHTML = '';
				fireEvent.input(editableDiv);

				expect(handleMentionDeleted).toHaveBeenCalledTimes(2);
				expect(handleMentionDeleted).toHaveBeenCalledWith({
					id: 'user-123',
					label: 'John Doe',
				});
				expect(handleMentionDeleted).toHaveBeenCalledWith({
					id: 'user-456',
					label: 'Jane Smith',
				});
			});

			it('does not call onMentionDeleted when no mentions exist', () => {
				const handleMentionDeleted = vi.fn();
				const handleChange = vi.fn();
				const { container } = render(
					<Prompt
						initialValue="Hello world"
						onMentionDeleted={handleMentionDeleted}
						onChange={handleChange}
						mentionOptions={optionsWithIds}
					/>
				);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				// Edit content
				editableDiv.textContent = 'Different text';
				fireEvent.input(editableDiv);

				expect(handleMentionDeleted).not.toHaveBeenCalled();
			});
		});

		describe('Combined add/delete tracking', () => {
			it('tracks add and delete in sequence', () => {
				const handleMentionAdded = vi.fn();
				const handleMentionDeleted = vi.fn();
				const handleChange = vi.fn();
				const { container } = render(
					<Prompt
						onMentionAdded={handleMentionAdded}
						onMentionDeleted={handleMentionDeleted}
						onChange={handleChange}
						mentionOptions={optionsWithIds}
					/>
				);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				// Add a mention
				simulateTypingWithCursor(editableDiv, '@');
				fireEvent.keyDown(editableDiv, { key: 'Enter' });

				expect(handleMentionAdded).toHaveBeenCalledTimes(1);
				expect(handleMentionDeleted).not.toHaveBeenCalled();

				// Delete the mention
				editableDiv.innerHTML = '';
				fireEvent.input(editableDiv);

				expect(handleMentionDeleted).toHaveBeenCalledTimes(1);
			});

			it('calls both onChange and onMentionAdded when mention is added', () => {
				const handleChange = vi.fn();
				const handleMentionAdded = vi.fn();
				const { container } = render(
					<Prompt
						onChange={handleChange}
						onMentionAdded={handleMentionAdded}
						mentionOptions={optionsWithIds}
					/>
				);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				simulateTypingWithCursor(editableDiv, '@');
				fireEvent.keyDown(editableDiv, { key: 'Enter' });

				expect(handleChange).toHaveBeenCalled();
				expect(handleMentionAdded).toHaveBeenCalled();

				// Verify onChange was called with mentions array
				const lastCall = handleChange.mock.calls[handleChange.mock.calls.length - 1] as [string, unknown[]];
				expect(lastCall?.[1]).toEqual([{ id: 'user-123', label: 'John Doe' }]);
			});
		});
	});

	describe('Copy/Paste', () => {
		/**
		 * Helper to create a ClipboardEvent with mock data
		 */
		function createClipboardEvent(type: 'copy' | 'cut' | 'paste', data?: { text?: string; html?: string }) {
			const clipboardData = {
				getData: vi.fn((format: string) => {
					if (format === 'text/plain') return data?.text || '';
					if (format === 'text/html') return data?.html || '';
					return '';
				}),
				setData: vi.fn(),
			};

			const event = new Event(type, { bubbles: true, cancelable: true }) as ClipboardEvent;
			Object.defineProperty(event, 'clipboardData', { value: clipboardData, writable: false });
			return { event, clipboardData };
		}

		/**
		 * Helper to set selection range in the editable div
		 */
		function setSelection(startNode: Node, startOffset: number, endNode?: Node, endOffset?: number) {
			const range = document.createRange();
			range.setStart(startNode, startOffset);
			if (endNode !== undefined && endOffset !== undefined) {
				range.setEnd(endNode, endOffset);
			} else {
				range.setEnd(startNode, startOffset);
			}
			const selection = window.getSelection();
			selection?.removeAllRanges();
			selection?.addRange(range);
			return range;
		}

		describe('Copy (Cmd+C)', () => {
			it('copies plain text selection to clipboard', () => {
				const { container } = render(<Prompt initialValue="Hello World" />);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				// Set selection on "World"
				const textNode = editableDiv.firstChild!;
				setSelection(textNode, 6, textNode, 11);

				const { event, clipboardData } = createClipboardEvent('copy');
				editableDiv.dispatchEvent(event);

				expect(clipboardData.setData).toHaveBeenCalledWith('text/plain', 'World');
			});

			it('copies mention as serialized format in text/plain', () => {
				const { container } = render(<Prompt initialValue="Hello @[John Doe] there" />);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				// Select all content
				const range = document.createRange();
				range.selectNodeContents(editableDiv);
				const selection = window.getSelection();
				selection?.removeAllRanges();
				selection?.addRange(range);

				const { event, clipboardData } = createClipboardEvent('copy');
				editableDiv.dispatchEvent(event);

				expect(clipboardData.setData).toHaveBeenCalledWith('text/plain', 'Hello @[John Doe] there');
			});

			it('copies mention along with surrounding text', () => {
				const { container } = render(<Prompt initialValue="Say hi to @[John Doe] please" />);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				// Select from "to " through the mention
				const range = document.createRange();
				range.selectNodeContents(editableDiv);
				const selection = window.getSelection();
				selection?.removeAllRanges();
				selection?.addRange(range);

				const { event, clipboardData } = createClipboardEvent('copy');
				editableDiv.dispatchEvent(event);

				// The copied text should include the mention in serialized format
				expect(clipboardData.setData).toHaveBeenCalledWith(
					'text/plain',
					'Say hi to @[John Doe] please'
				);
			});

			it('copies HTML with mention pill markup', () => {
				const { container } = render(<Prompt initialValue="Hi @[John Doe]!" />);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				// Select all
				const range = document.createRange();
				range.selectNodeContents(editableDiv);
				const selection = window.getSelection();
				selection?.removeAllRanges();
				selection?.addRange(range);

				const { event, clipboardData } = createClipboardEvent('copy');
				editableDiv.dispatchEvent(event);

				// HTML should preserve the mention pill structure
				const htmlCall = (clipboardData.setData.mock.calls as [string, string][]).find(
					(call) => call[0] === 'text/html'
				);
				expect(htmlCall).toBeDefined();
				expect(htmlCall![1]).toContain('data-mention="John Doe"');
			});

			it('copies multiple mentions correctly', () => {
				const { container } = render(
					<Prompt initialValue="@[John Doe] and @[Jane Smith] are here" />
				);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				// Select all
				const range = document.createRange();
				range.selectNodeContents(editableDiv);
				const selection = window.getSelection();
				selection?.removeAllRanges();
				selection?.addRange(range);

				const { event, clipboardData } = createClipboardEvent('copy');
				editableDiv.dispatchEvent(event);

				expect(clipboardData.setData).toHaveBeenCalledWith(
					'text/plain',
					'@[John Doe] and @[Jane Smith] are here'
				);
			});
		});

		describe('Cut (Cmd+X)', () => {
			it('cuts selected text and removes it from editor', () => {
				const handleChange = vi.fn();
				const { container } = render(<Prompt initialValue="Hello World" onChange={handleChange} />);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				// Select "World"
				const textNode = editableDiv.firstChild!;
				setSelection(textNode, 6, textNode, 11);

				const { event, clipboardData } = createClipboardEvent('cut');
				editableDiv.dispatchEvent(event);

				expect(clipboardData.setData).toHaveBeenCalledWith('text/plain', 'World');
				expect(editableDiv.textContent).toBe('Hello ');
			});

			it('cuts mention and removes it from editor', () => {
				const handleChange = vi.fn();
				const { container } = render(
					<Prompt initialValue="Hello @[John Doe] there" onChange={handleChange} />
				);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				// Select all
				const range = document.createRange();
				range.selectNodeContents(editableDiv);
				const selection = window.getSelection();
				selection?.removeAllRanges();
				selection?.addRange(range);

				const { event, clipboardData } = createClipboardEvent('cut');
				editableDiv.dispatchEvent(event);

				expect(clipboardData.setData).toHaveBeenCalledWith('text/plain', 'Hello @[John Doe] there');
				expect(editableDiv.textContent).toBe('');
			});
		});

		describe('Paste (Cmd+V)', () => {
			it('pastes plain text at cursor position', () => {
				const handleChange = vi.fn();
				const { container } = render(<Prompt onChange={handleChange} />);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				// Set cursor at beginning
				const textNode = document.createTextNode('');
				editableDiv.appendChild(textNode);
				setSelection(textNode, 0);

				const { event } = createClipboardEvent('paste', { text: 'Hello World' });
				editableDiv.dispatchEvent(event);

				expect(editableDiv.textContent).toBe('Hello World');
				expect(handleChange).toHaveBeenCalledWith('Hello World', []);
			});

			it('pastes text with serialized mention and converts to pill', () => {
				const handleChange = vi.fn();
				const { container } = render(<Prompt onChange={handleChange} />);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				// Set cursor at beginning
				const textNode = document.createTextNode('');
				editableDiv.appendChild(textNode);
				setSelection(textNode, 0);

				const { event } = createClipboardEvent('paste', { text: 'Hello @[john-doe]!' });
				editableDiv.dispatchEvent(event);

				// Should have created a mention pill (with fallback to id as label when not found)
				const mentionPill = container.querySelector('[data-mention]');
				expect(mentionPill).toBeInTheDocument();
				expect(handleChange).toHaveBeenCalledWith('Hello @[john-doe]!', expect.any(Array));
			});

			it('pastes text at cursor position in middle of existing content', () => {
				const handleChange = vi.fn();
				const { container } = render(<Prompt initialValue="Hello World" onChange={handleChange} />);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				// Set cursor after "Hello "
				const textNode = editableDiv.firstChild!;
				setSelection(textNode, 6);

				const { event } = createClipboardEvent('paste', { text: 'Beautiful ' });
				editableDiv.dispatchEvent(event);

				expect(editableDiv.textContent).toBe('Hello Beautiful World');
			});

			it('pastes text replacing selection', () => {
				const handleChange = vi.fn();
				const { container } = render(<Prompt initialValue="Hello World" onChange={handleChange} />);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				// Select "World"
				const textNode = editableDiv.firstChild!;
				setSelection(textNode, 6, textNode, 11);

				const { event } = createClipboardEvent('paste', { text: 'Universe' });
				editableDiv.dispatchEvent(event);

				expect(editableDiv.textContent).toBe('Hello Universe');
			});

			it('pastes multiple mentions from serialized text', () => {
				const handleChange = vi.fn();
				const { container } = render(<Prompt onChange={handleChange} />);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				const textNode = document.createTextNode('');
				editableDiv.appendChild(textNode);
				setSelection(textNode, 0);

				const { event } = createClipboardEvent('paste', {
					text: '@[John Doe] and @[Jane Smith] are here',
				});
				editableDiv.dispatchEvent(event);

				expect(container.querySelector('[data-mention="John Doe"]')).toBeInTheDocument();
				expect(container.querySelector('[data-mention="Jane Smith"]')).toBeInTheDocument();
			});

			it('pastes HTML with mention pills preserving structure', () => {
				const { container } = render(<Prompt />);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				const textNode = document.createTextNode('');
				editableDiv.appendChild(textNode);
				setSelection(textNode, 0);

				const { event } = createClipboardEvent('paste', {
					text: 'Hi @[John Doe]!',
					html: 'Hi <span contenteditable="false" data-mention="John Doe" class="mention-pill">@John Doe</span>!',
				});
				editableDiv.dispatchEvent(event);

				const mentionPill = container.querySelector('[data-mention="John Doe"]');
				expect(mentionPill).toBeInTheDocument();
			});

			it('preserves existing mentions when pasting', () => {
				const { container } = render(<Prompt initialValue="@[John Doe] says " />);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				// Find the text node after the mention
				const textNodes = Array.from(editableDiv.childNodes).filter(
					(n) => n.nodeType === Node.TEXT_NODE
				);
				const lastTextNode = textNodes[textNodes.length - 1];
				expect(lastTextNode).toBeDefined();

				// Set cursor at the end
				setSelection(lastTextNode!, lastTextNode!.textContent!.length);

				const { event } = createClipboardEvent('paste', { text: 'hello' });
				editableDiv.dispatchEvent(event);

				// Original mention should still exist
				expect(container.querySelector('[data-mention="John Doe"]')).toBeInTheDocument();
				expect(editableDiv.textContent).toContain('hello');
			});

			it('pastes after existing mention without breaking it', () => {
				const { container } = render(<Prompt initialValue="Hi @[John Doe]" />);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				// Get mention pill and set cursor after it
				const mentionPill = container.querySelector('[data-mention="John Doe"]')!;
				const range = document.createRange();
				range.setStartAfter(mentionPill);
				range.collapse(true);
				const selection = window.getSelection();
				selection?.removeAllRanges();
				selection?.addRange(range);

				const { event } = createClipboardEvent('paste', { text: ', how are you?' });
				editableDiv.dispatchEvent(event);

				expect(container.querySelector('[data-mention="John Doe"]')).toBeInTheDocument();
				expect(editableDiv.textContent).toContain('how are you?');
			});

			it('uses custom trigger when pasting mentions', () => {
				const { container } = render(<Prompt mentionTrigger="#" />);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				const textNode = document.createTextNode('');
				editableDiv.appendChild(textNode);
				setSelection(textNode, 0);

				const { event } = createClipboardEvent('paste', { text: 'Check #[important] tag' });
				editableDiv.dispatchEvent(event);

				const mentionPill = container.querySelector('[data-mention="important"]');
				expect(mentionPill).toBeInTheDocument();
				expect(mentionPill?.textContent).toBe('#important');
			});

			it('handles paste with no clipboard data gracefully', () => {
				const { container } = render(<Prompt initialValue="Hello" />);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				const { event } = createClipboardEvent('paste', { text: '', html: '' });
				editableDiv.dispatchEvent(event);

				// Should not crash, content should remain
				expect(editableDiv.textContent).toBe('Hello');
			});

			it('updates history after paste for undo support', () => {
				const { container } = render(<Prompt />);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				const textNode = document.createTextNode('');
				editableDiv.appendChild(textNode);
				setSelection(textNode, 0);

				// Paste some text
				const { event } = createClipboardEvent('paste', { text: 'Pasted text' });
				editableDiv.dispatchEvent(event);

				expect(editableDiv.textContent).toBe('Pasted text');

				// Undo should revert the paste
				fireEvent.keyDown(editableDiv, { key: 'z', ctrlKey: true });
				expect(editableDiv.textContent).toBe('');
			});
		});
	});

	describe('Menu Positioning', () => {
		const mockOptions = [
			{ id: 'alice', label: 'Alice' },
			{ id: 'bob', label: 'Bob' },
		];

		describe('mentionMenuPosition prop', () => {
			it('accepts mentionMenuPosition="below" prop', () => {
				const { container } = render(
					<Prompt mentionOptions={mockOptions} mentionMenuPosition="below" />
				);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				simulateTypingWithCursor(editableDiv, '@');

				const menu = container.querySelector('.mention-menu');
				expect(menu).toBeInTheDocument();
			});

			it('accepts mentionMenuPosition="above" prop', () => {
				const { container } = render(
					<Prompt mentionOptions={mockOptions} mentionMenuPosition="above" />
				);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				simulateTypingWithCursor(editableDiv, '@');

				const menu = container.querySelector('.mention-menu');
				expect(menu).toBeInTheDocument();
			});

			it('menu is fixed positioned', () => {
				const { container } = render(<Prompt mentionOptions={mockOptions} />);
				const editableDiv = container.querySelector('[contenteditable="true"]')!;

				simulateTypingWithCursor(editableDiv, '@');

				const menu = container.querySelector('.mention-menu') as HTMLElement;
				expect(menu).toBeInTheDocument();
				expect(menu.style.position).toBe('fixed');
			});
		});
	});
});
