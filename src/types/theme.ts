/**
 * Theme configuration for the Prompt component.
 * All properties are optional - unspecified values will use CSS variable defaults.
 */
export interface PromptTheme {
	/** Background color of the prompt input */
	backgroundColor?: string;
	/** Text color of the prompt input */
	color?: string;
	/** Placeholder text color */
	placeholderColor?: string;
	/** Font size of the prompt (e.g., "14px", "0.875rem") */
	fontSize?: string;
	/** Font family of the prompt */
	fontFamily?: string;
	/** Border radius of the prompt input */
	borderRadius?: string;
	/** Border color of the prompt input */
	borderColor?: string;
	/** Padding inside the prompt input */
	padding?: string;
	/** Border color when the prompt is focused */
	focusBorderColor?: string;
	/** Box shadow when the prompt is focused (e.g., "0 0 0 2px rgba(99, 102, 241, 0.2)" or "none") */
	focusBoxShadow?: string;
	/** Line height of the prompt input */
	lineHeight?: string;
	/** Border width of the prompt input */
	borderWidth?: string;
	/** Minimum height of the prompt input */
	minHeight?: string;
	/** Size of each indent level in the menu (e.g., "1rem", "16px") */
	indentSize?: string;

	/** Mention menu configuration */
	menu?: {
		/** Background color of the menu */
		backgroundColor?: string;
		/** Border color of the menu */
		borderColor?: string;
		/** Text color in the menu */
		color?: string;
		/** Background color of hovered/selected menu items */
		itemHoverColor?: string;
		/** Color of the chevron icons */
		chevronColor?: string;
		/** Color of chevron icons when item is hovered */
		chevronHoverColor?: string;
		/** Minimum width of the menu (e.g., "180px", "240px") */
		minWidth?: string;
		/** Maximum height of the menu (e.g., "200px", "300px") */
		maxHeight?: string;
		/** Menu item configuration */
		item?: {
			/** Height of menu items (e.g., "auto", "20px") */
			height?: string;
			/** Padding inside menu items */
			padding?: string;
			/** Gap between icon and label */
			gap?: string;
			/** Font size of the label */
			labelFontSize?: string;
			/** Font weight of the label */
			labelFontWeight?: string | number;
			/** Height of the icon */
			iconHeight?: string;
			/** Font size of the right label (e.g., file path) */
			labelRightFontSize?: string;
			/** Color of the right label */
			labelRightColor?: string;
		};
		/** Menu title/header configuration */
		title?: {
			/** Padding of the title */
			padding?: string;
			/** Top padding of the title */
			paddingTop?: string;
			/** Height of the title row */
			height?: string;
			/** Font size of the title label */
			labelFontSize?: string;
			/** Font weight of the title label */
			labelFontWeight?: string | number;
			/** Color of the title label */
			labelColor?: string;
			/** Text transform (e.g., "uppercase", "none") */
			labelTextTransform?: string;
			/** Letter spacing */
			labelLetterSpacing?: string;
			/** Opacity of the title label */
			labelOpacity?: string | number;
		};
	};

	/** Mention pill (tag) configuration */
	pill?: {
		/** Background of the pill (can be a gradient like "linear-gradient(...)") */
		backgroundColor?: string;
		/** Border radius of the pill */
		borderRadius?: string;
		/** Text color of the pill */
		color?: string;
		/** Padding inside the pill */
		padding?: string;
		/** Line height of the pill */
		lineHeight?: string;
	};
}

/**
 * Default theme values that match the CSS variable defaults in index.css.
 * This serves as the single source of truth for all default styling.
 */
export const defaultTheme: Required<
	Pick<PromptTheme, 'backgroundColor' | 'color' | 'placeholderColor' | 'fontSize' | 'fontFamily' | 'borderRadius' | 'borderColor' | 'padding' | 'focusBorderColor' | 'focusBoxShadow' | 'lineHeight' | 'borderWidth' | 'minHeight'>
> & {
	menu: Required<NonNullable<PromptTheme['menu']>>;
	pill: Required<NonNullable<PromptTheme['pill']>>;
} = {
	// Prompt input defaults
	backgroundColor: 'white',
	color: 'black',
	placeholderColor: '#9ca3af',
	fontSize: '14px',
	fontFamily: "'Inter', sans-serif",
	borderRadius: '0.375rem',
	borderColor: '#d1d5db',
	padding: '0.5rem',
	focusBorderColor: '#6366f1',
	focusBoxShadow: '0 0 0 2px rgba(99, 102, 241, 0.2)',
	lineHeight: '1.7',
	borderWidth: '1px',
	minHeight: '100px',

	// Menu defaults
	menu: {
		backgroundColor: 'white',
		borderColor: '#e5e7eb',
		color: 'inherit',
		itemHoverColor: '#f3f4f6',
		chevronColor: '#9ca3af',
		chevronHoverColor: '#6366f1',
		minWidth: '180px',
		maxHeight: '300px',
		item: {
			height: 'auto',
			padding: '0.5rem 0.75rem',
			gap: '4px',
			labelFontSize: '0.875rem',
			labelFontWeight: 500,
			iconHeight: '1.25rem',
			labelRightFontSize: '0.75rem',
			labelRightColor: '#6b7280',
		},
		title: {
			padding: '0.5rem 0.75rem',
			paddingTop: '0.75rem',
			height: 'auto',
			labelFontSize: '0.6875rem',
			labelFontWeight: 600,
			labelColor: '#9ca3af',
			labelTextTransform: 'uppercase',
			labelLetterSpacing: '0.05em',
			labelOpacity: 1,
		},
	},

	// Pill defaults
	pill: {
		backgroundColor: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
		borderRadius: '9999px',
		color: 'white',
		padding: '0.125rem 0.5rem',
		lineHeight: '1.4',
	},
};

/**
 * Converts a PromptTheme object to CSS custom properties.
 * Returns an object suitable for use as React inline styles.
 */
export function themeToStyles(theme?: PromptTheme): React.CSSProperties {
	if (!theme) return {};

	const styles: Record<string, string> = {};

	// Prompt input styles
	if (theme.backgroundColor) styles['--prompt-background-color'] = theme.backgroundColor;
	if (theme.color) styles['--prompt-color'] = theme.color;
	if (theme.placeholderColor) styles['--prompt-placeholder-color'] = theme.placeholderColor;
	if (theme.fontSize) styles['--prompt-font-size'] = theme.fontSize;
	if (theme.fontFamily) styles['--prompt-font-family'] = theme.fontFamily;
	if (theme.borderRadius) styles['--prompt-border-radius'] = theme.borderRadius;
	if (theme.borderColor) styles['--prompt-border-color'] = theme.borderColor;
	if (theme.padding) styles['--prompt-padding'] = theme.padding;
	if (theme.focusBorderColor) styles['--prompt-focus-border-color'] = theme.focusBorderColor;
	if (theme.focusBoxShadow) styles['--prompt-focus-box-shadow'] = theme.focusBoxShadow;
	if (theme.lineHeight) styles['--prompt-line-height'] = theme.lineHeight;
	if (theme.borderWidth) styles['--prompt-border-width'] = theme.borderWidth;
	if (theme.minHeight) styles['--prompt-min-height'] = theme.minHeight;
	if (theme.indentSize) styles['--prompt-mention-menu-item-indent-size'] = theme.indentSize;

	// Menu styles
	if (theme.menu) {
		if (theme.menu.backgroundColor) styles['--prompt-mention-menu-background-color'] = theme.menu.backgroundColor;
		if (theme.menu.borderColor) styles['--prompt-mention-menu-border-color'] = theme.menu.borderColor;
		if (theme.menu.color) styles['--prompt-mention-menu-color'] = theme.menu.color;
		if (theme.menu.itemHoverColor) styles['--prompt-mention-menu-item-hover-color'] = theme.menu.itemHoverColor;
		if (theme.menu.chevronColor) styles['--prompt-mention-menu-chevron-color'] = theme.menu.chevronColor;
		if (theme.menu.chevronHoverColor) styles['--prompt-mention-menu-chevron-hover-color'] = theme.menu.chevronHoverColor;
		if (theme.menu.minWidth) styles['--prompt-mention-menu-min-width'] = theme.menu.minWidth;
		if (theme.menu.maxHeight) styles['--prompt-mention-menu-max-height'] = theme.menu.maxHeight;

		// Menu item styles
		if (theme.menu.item) {
			if (theme.menu.item.height) styles['--prompt-mention-menu-item-height'] = theme.menu.item.height;
			if (theme.menu.item.padding) styles['--prompt-mention-menu-item-padding'] = theme.menu.item.padding;
			if (theme.menu.item.gap) styles['--prompt-mention-menu-item-gap'] = theme.menu.item.gap;
			if (theme.menu.item.labelFontSize) styles['--prompt-mention-menu-item-label-font-size'] = theme.menu.item.labelFontSize;
			if (theme.menu.item.labelFontWeight !== undefined) styles['--prompt-mention-menu-item-label-font-weight'] = String(theme.menu.item.labelFontWeight);
			if (theme.menu.item.iconHeight) styles['--prompt-mention-menu-item-icon-height'] = theme.menu.item.iconHeight;
			if (theme.menu.item.labelRightFontSize) styles['--prompt-mention-menu-item-label-right-font-size'] = theme.menu.item.labelRightFontSize;
			if (theme.menu.item.labelRightColor) styles['--prompt-mention-menu-item-label-right-color'] = theme.menu.item.labelRightColor;
		}

		// Menu title styles
		if (theme.menu.title) {
			if (theme.menu.title.padding) styles['--prompt-mention-menu-title-padding'] = theme.menu.title.padding;
			if (theme.menu.title.paddingTop) styles['--prompt-mention-menu-title-padding-top'] = theme.menu.title.paddingTop;
			if (theme.menu.title.height) styles['--prompt-mention-menu-title-height'] = theme.menu.title.height;
			if (theme.menu.title.labelFontSize) styles['--prompt-mention-menu-title-label-font-size'] = theme.menu.title.labelFontSize;
			if (theme.menu.title.labelFontWeight !== undefined) styles['--prompt-mention-menu-title-label-font-weight'] = String(theme.menu.title.labelFontWeight);
			if (theme.menu.title.labelColor) styles['--prompt-mention-menu-title-label-color'] = theme.menu.title.labelColor;
			if (theme.menu.title.labelTextTransform) styles['--prompt-mention-menu-title-label-text-transform'] = theme.menu.title.labelTextTransform;
			if (theme.menu.title.labelLetterSpacing) styles['--prompt-mention-menu-title-label-letter-spacing'] = theme.menu.title.labelLetterSpacing;
			if (theme.menu.title.labelOpacity !== undefined) styles['--prompt-mention-menu-title-label-opacity'] = String(theme.menu.title.labelOpacity);
		}
	}

	// Pill styles
	if (theme.pill) {
		if (theme.pill.backgroundColor) styles['--prompt-mention-pill-background-color'] = theme.pill.backgroundColor;
		if (theme.pill.borderRadius) styles['--prompt-mention-pill-border-radius'] = theme.pill.borderRadius;
		if (theme.pill.color) styles['--prompt-mention-pill-color'] = theme.pill.color;
		if (theme.pill.padding) styles['--prompt-mention-pill-padding'] = theme.pill.padding;
		if (theme.pill.lineHeight) styles['--prompt-mention-pill-line-height'] = theme.pill.lineHeight;
	}

	return styles as React.CSSProperties;
}

/**
 * Helper to deep merge theme objects, using defaults as base.
 */
function mergeTheme(base: typeof defaultTheme, overrides: PromptTheme): PromptTheme {
	return {
		...base,
		...overrides,
		menu: overrides.menu ? {
			...base.menu,
			...overrides.menu,
			item: overrides.menu.item ? {
				...base.menu.item,
				...overrides.menu.item,
			} : base.menu.item,
			title: overrides.menu.title ? {
				...base.menu.title,
				...overrides.menu.title,
			} : base.menu.title,
		} : base.menu,
		pill: overrides.pill ? {
			...base.pill,
			...overrides.pill,
		} : base.pill,
	};
}

/**
 * Preset themes that can be used out of the box.
 * All preset themes are complete - they include all default values.
 */
export const presetThemes = {
	/** Light theme (default) - uses all default values */
	light: mergeTheme(defaultTheme, {
		fontFamily: 'inherit',
		menu: {
			color: 'black',
			item: {
				labelRightColor: '#9ca3af',
			},
		},
	}),

	/** Dark theme similar to Cursor IDE */
	cursorDark: mergeTheme(defaultTheme, {
		backgroundColor: '#22242C',
		color: '#d8dee9',
		placeholderColor: '#585C65',
		fontSize: '13px',
		fontFamily: '-apple-system, "system-ui", sans-serif',
		borderRadius: '8px',
		borderColor: '#2F353F',
		padding: '.375rem .5rem .25rem',
		focusBorderColor: '#2F353F',
		focusBoxShadow: 'none',
		indentSize: '5px',
		menu: {
			backgroundColor: '#1A1C21',
			borderColor: '#282C35',
			color: '#7A88A1',
			itemHoverColor: '#21262E',
			chevronColor: '#373C48',
			chevronHoverColor: '#373C48',
			minWidth: '240px',
			item: {
				height: '20px',
				padding: '2px 6px',
				gap: '0px',
				labelFontSize: '12px',
				labelFontWeight: 300,
				iconHeight: '12px',
				labelRightFontSize: '11px',
				labelRightColor: '#585C65',
			},
			title: {
				padding: '2px 6px',
				paddingTop: '2px',
				height: '20px',
				labelFontSize: '11px',
				labelFontWeight: 300,
				labelColor: '#d8dee9',
				labelTextTransform: 'none',
				labelLetterSpacing: '0',
				labelOpacity: 0.4,
			},
		},
		pill: {
			backgroundColor: '#283B56',
			borderRadius: '4px',
			color: '#d8dee9',
			padding: '1px 4px 2px 4px',
			lineHeight: '1.4',
		},
	}),

	/** GitHub-inspired dark theme */
	githubDark: mergeTheme(defaultTheme, {
		backgroundColor: '#0d1117',
		color: '#c9d1d9',
		placeholderColor: '#484f58',
		fontFamily: 'inherit',
		borderRadius: '6px',
		borderColor: '#30363d',
		padding: '0.5rem 0.75rem',
		focusBorderColor: '#58a6ff',
		focusBoxShadow: '0 0 0 2px rgba(88, 166, 255, 0.2)',
		menu: {
			backgroundColor: '#161b22',
			borderColor: '#30363d',
			color: '#c9d1d9',
			itemHoverColor: '#21262d',
			chevronColor: '#484f58',
			chevronHoverColor: '#58a6ff',
			item: {
				labelRightColor: '#484f58',
			},
			title: {
				labelColor: '#8b949e',
			},
		},
		pill: {
			backgroundColor: '#388bfd26',
			borderRadius: '6px',
			color: '#58a6ff',
		},
	}),

	/** Minimal/clean theme */
	minimal: mergeTheme(defaultTheme, {
		backgroundColor: '#fafafa',
		color: '#18181b',
		placeholderColor: '#a1a1aa',
		fontSize: '15px',
		fontFamily: 'inherit',
		borderRadius: '8px',
		borderColor: '#e4e4e7',
		padding: '0.75rem',
		focusBorderColor: '#18181b',
		focusBoxShadow: '0 0 0 2px rgba(24, 24, 27, 0.1)',
		menu: {
			backgroundColor: '#ffffff',
			borderColor: '#e4e4e7',
			color: '#3f3f46',
			itemHoverColor: '#f4f4f5',
			chevronColor: '#a1a1aa',
			chevronHoverColor: '#18181b',
			item: {
				labelRightColor: '#a1a1aa',
			},
			title: {
				labelColor: '#a1a1aa',
			},
		},
		pill: {
			backgroundColor: '#18181b',
			borderRadius: '4px',
			color: '#fafafa',
		},
	}),
} as const;

export type PresetThemeName = keyof typeof presetThemes;

