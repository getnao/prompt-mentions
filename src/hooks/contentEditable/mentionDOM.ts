import type { ReactNode, ReactElement } from "react";
import type { MentionOption } from "../useMentions";
import type { MentionConfig, SelectedMention } from "./types";

export const escapeRegex = (str: string): string =>
	str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const normalizeValue = (raw: string): string =>
	raw.replace(/\u00A0/g, " ").trim() ? raw : "";

/**
 * Flatten nested options into a flat array for icon lookup
 */
export const flattenOptions = (options: MentionOption[]): MentionOption[] => {
	const result: MentionOption[] = [];
	for (const opt of options) {
		result.push(opt);
		if (opt.children) {
			result.push(...flattenOptions(opt.children));
		}
	}
	return result;
};

/**
 * Convert a React element to an HTML string without using react-dom/server.
 * This is a simplified renderer that handles basic React elements like SVG icons.
 */
const reactElementToHTML = (element: ReactElement): string => {
	const { type, props } = element;

	// Handle string types (like 'div', 'svg', 'span')
	if (typeof type === "string") {
		const propsObj = (props || {}) as Record<string, unknown>;
		const attrs = Object.entries(propsObj)
			.filter(([key]) => key !== "children")
			.map(([key, value]) => {
				// Convert React prop names to HTML attribute names
				const attrName = key === "className" ? "class" :
					key === "htmlFor" ? "for" :
						key === "strokeWidth" ? "stroke-width" :
							key === "strokeLinecap" ? "stroke-linecap" :
								key === "strokeLinejoin" ? "stroke-linejoin" :
									key === "fillRule" ? "fill-rule" :
										key === "clipRule" ? "clip-rule" :
											key === "viewBox" ? "viewBox" :
												key.replace(/([A-Z])/g, "-$1").toLowerCase();

				if (typeof value === "boolean") {
					return value ? attrName : "";
				}
				return `${attrName}="${String(value).replace(/"/g, "&quot;")}"`;
			})
			.filter(Boolean)
			.join(" ");

		const openTag = attrs ? `<${type} ${attrs}>` : `<${type}>`;

		// Handle children
		const children = propsObj.children;
		if (children === undefined || children === null) {
			// Self-closing tags
			const selfClosing = ["path", "circle", "ellipse", "line", "polygon", "polyline", "rect", "use", "img", "br", "hr", "input"];
			if (selfClosing.includes(type)) {
				return attrs ? `<${type} ${attrs}/>` : `<${type}/>`;
			}
			return `${openTag}</${type}>`;
		}

		const childrenHTML = renderChildren(children);
		return `${openTag}${childrenHTML}</${type}>`;
	}

	// Handle function components (only works for simple function components, not class components)
	if (typeof type === "function") {
		try {
			// Check if it's a class component by looking for prototype.isReactComponent
			const isClassComponent = type.prototype && type.prototype.isReactComponent;
			if (isClassComponent) {
				return ""; // Skip class components
			}
			const result = (type as (props: unknown) => ReactElement | null)(props);
			if (result && typeof result === "object" && "type" in result) {
				return reactElementToHTML(result as ReactElement);
			}
			return "";
		} catch {
			return "";
		}
	}

	return "";
};

const renderChildren = (children: unknown): string => {
	if (children === null || children === undefined) return "";
	if (typeof children === "string" || typeof children === "number") {
		return String(children);
	}
	if (Array.isArray(children)) {
		return children.map(renderChildren).join("");
	}
	if (typeof children === "object" && "type" in (children as object)) {
		return reactElementToHTML(children as ReactElement);
	}
	return "";
};

export const iconToHTML = (icon: ReactNode): string => {
	if (!icon) return "";
	if (typeof icon === "string") return icon;
	try {
		return reactElementToHTML(icon as ReactElement);
	} catch {
		return "";
	}
};

export const MentionDOM = {
	createHTML(id: string, label: string, trigger: string, icon?: ReactNode, showTrigger = false): string {
		// X icon SVG for delete
		const deleteIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M18 6L6 18M6 6l12 12"/></svg>`;
		// Icon container with both original icon and delete X (swaps on hover)
		const iconHTML = icon
			? `<span class="mention-pill-icon" data-mention-delete="true"><span class="mention-pill-icon-original">${iconToHTML(icon)}</span><span class="mention-pill-icon-delete">${deleteIconSVG}</span></span>`
			: "";
		// Store icon HTML in data attribute for later reconstruction
		const iconAttr = icon ? ` data-icon="${encodeURIComponent(iconToHTML(icon))}"` : "";
		// Display text - optionally include trigger
		const displayText = showTrigger ? `${trigger}${label}` : label;
		// Store showTrigger in data attribute for cursor position calculations
		const showTriggerAttr = showTrigger ? "" : ` data-hide-trigger="true"`;
		// Store id, label, and trigger - data-mention stores the label for display, data-mention-id stores the id for serialization
		return `<span contenteditable="false" data-mention="${label}" data-mention-id="${id}" data-mention-trigger="${trigger}"${iconAttr}${showTriggerAttr} class="mention-pill">${iconHTML}${displayText}</span>`;
	},

	isMentionElement(node: Node): node is HTMLElement {
		return (
			node.nodeType === Node.ELEMENT_NODE &&
			(node as HTMLElement).hasAttribute("data-mention")
		);
	},

	/**
	 * Parse value with multiple triggers
	 */
	parseValueMulti(value: string, configs: MentionConfig[]): string {
		let result = value;
		for (const config of configs) {
			const flatOptions = flattenOptions(config.options);
			const showTrigger = config.showTrigger ?? false;
			const regex = new RegExp(`${escapeRegex(config.trigger)}\\[([^\\]]+)\\]`, "g");
			result = result.replace(regex, (_, idOrLabel) => {
				// Try to find the option by id first, then by label (for backward compatibility)
				const option = flatOptions.find(opt => opt.id === idOrLabel) || flatOptions.find(opt => opt.label === idOrLabel);
				const id = option?.id || idOrLabel;
				const label = option?.label || idOrLabel;
				return this.createHTML(id, label, config.trigger, option?.icon, showTrigger);
			});
		}
		return result;
	},

	/**
	 * Reconstruct mention HTML including icons from stored data attributes.
	 * Used when parsing existing content that may have icon data.
	 */
	parseValueWithIcons(value: string, trigger: string): string {
		const regex = new RegExp(`${escapeRegex(trigger)}\\[([^\\]]+)\\]`, "g");
		return value.replace(regex, (_, idOrLabel) => this.createHTML(idOrLabel, idOrLabel, trigger));
	},

	/**
	 * Extract serialized value with multiple triggers
	 */
	extractValueMulti(element: HTMLElement, triggers: string[]): string {
		let result = "";
		// Default trigger for mentions without data-mention-trigger attribute
		const defaultTrigger = triggers[0] ?? "@";

		const walk = (node: Node) => {
			if (node.nodeType === Node.TEXT_NODE) {
				result += node.textContent || "";
			} else if (this.isMentionElement(node)) {
				// Use the id for serialization if available, otherwise fall back to label
				const id = node.getAttribute("data-mention-id") || node.getAttribute("data-mention");
				const trigger = node.getAttribute("data-mention-trigger") || defaultTrigger;
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
	extractMentions(element: HTMLElement, defaultTrigger = "@"): SelectedMention[] {
		const mentions: SelectedMention[] = [];
		const mentionElements = element.querySelectorAll("[data-mention]");
		mentionElements.forEach((el) => {
			const label = el.getAttribute("data-mention") || "";
			const id = el.getAttribute("data-mention-id") || label;
			const trigger = el.getAttribute("data-mention-trigger") || defaultTrigger;
			mentions.push({ id, label, trigger });
		});
		return mentions;
	},

	/**
	 * Convert a text position (from innerText) to a serialized position with multiple triggers.
	 * This is needed because mention spans display as "@Name" but serialize as "@[id]".
	 */
	textPosToSerializedPosMulti(element: HTMLElement, textPos: number, triggers: string[]): number {
		let textOffset = 0;
		let serializedOffset = 0;
		const defaultTrigger = triggers[0] ?? "@";

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
				// Use id for serialization and get the trigger from the element
				const id = node.getAttribute("data-mention-id") || node.getAttribute("data-mention") || "";
				const trigger = node.getAttribute("data-mention-trigger") || defaultTrigger;
				const serializedLen = trigger.length + id.length + 2; // trigger[id]

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

