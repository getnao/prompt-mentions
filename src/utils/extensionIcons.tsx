import type { ReactNode } from "react";
import {
	SiTypescript,
	SiJavascript,
	SiReact,
	SiCss,
	SiHtml5,
	SiJson,
	SiMarkdown,
	SiPython,
	SiGo,
	SiRust,
	SiYaml,
	SiShell,
	SiImagej,
	SiSvg,
	SiGit,
	SiSass,
	SiSvelte,
	SiPhp,
	SiRuby,
	SiGraphql,
	SiDocker,
	SiDotenv,
} from '@icons-pack/react-simple-icons';

/**
 * File extension to icon mapping
 * 
 * This file configures which icon is displayed for each file extension
 * when extensionIcons is enabled on the Prompt component.
 */

// Generic file icon (fallback)
const FileIcon = () => (
	<svg viewBox="0 0 20 20" fill="currentColor">
		<path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
	</svg>
);

// Folder icon
const FolderIcon = () => (
	<svg viewBox="0 0 20 20" fill="currentColor">
		<path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
	</svg>
);

// TypeScript icon
const TypeScriptIcon = () => (
	<SiTypescript />
);

// JavaScript icon
const JavaScriptIcon = () => (
	<SiJavascript />
);

// React/JSX icon
const ReactIcon = () => (
	<SiReact />
);

// CSS icon
const CSSIcon = () => (
	<SiCss />
);

// HTML icon
const HTMLIcon = () => (
	<SiHtml5 />
);

// JSON icon
const JSONIcon = () => (
	<SiJson />
);

// Markdown icon
const MarkdownIcon = () => (
	<SiMarkdown />
);

// Python icon
const PythonIcon = () => (
	<SiPython />
);

// Go icon
const GoIcon = () => (
	<SiGo />
);

// Rust icon
const RustIcon = () => (
	<SiRust />
);

// YAML icon
const YAMLIcon = () => (
	<SiYaml />
);

// Shell/Bash icon
const ShellIcon = () => (
	<SiShell />
);

// Image icon
const ImageIcon = () => (
	<SiImagej />
);

// SVG icon
const SVGIcon = () => (
	<SiSvg />
);

// Config/Settings icon
const ConfigIcon = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
		<path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915" />
		<circle cx="12" cy="12" r="3" />
	</svg>
);

// Git icon
const GitIcon = () => (
	<SiGit />
);

// Text/Document icon
const TextIcon = () => (
	<FileIcon />
);

// SCSS/Sass icon
const SassIcon = () => (
	<SiSass />
);

// Vue icon
const VueIcon = () => (
	<FileIcon />
);

// Svelte icon
const SvelteIcon = () => (
	<SiSvelte />
);

// C/C++ icon
const CppIcon = () => (
	<FileIcon />
);

// Java icon
const JavaIcon = () => (
	<FileIcon />
);

// PHP icon
const PHPIcon = () => (
	<SiPhp />
);

// Ruby icon
const RubyIcon = () => (
	<SiRuby />
);

// SQL icon
const SQLIcon = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
		<ellipse cx="12" cy="5" rx="9" ry="3" />
		<path d="M3 5V19A9 3 0 0 0 21 19V5" />
		<path d="M3 12A9 3 0 0 0 21 12" />
	</svg>
);

// GraphQL icon
const GraphQLIcon = () => (
	<SiGraphql />
);

// Docker icon
const DockerIcon = () => (
	<SiDocker />
);

// Dotenv icon
const DotenvIcon = () => (
	<SiDotenv />
);

/**
 * Extension to icon mapping
 * 
 * Add more mappings here as needed.
 * The key should be the file extension (without the dot).
 * The value is a React component that renders an SVG icon.
 */
export const extensionIconMap: Record<string, () => ReactNode> = {
	// TypeScript
	ts: TypeScriptIcon,
	tsx: ReactIcon,
	mts: TypeScriptIcon,
	cts: TypeScriptIcon,

	// JavaScript
	js: JavaScriptIcon,
	jsx: ReactIcon,
	mjs: JavaScriptIcon,
	cjs: JavaScriptIcon,

	// Styles
	css: CSSIcon,
	scss: SassIcon,
	sass: SassIcon,
	less: CSSIcon,

	// Markup
	html: HTMLIcon,
	htm: HTMLIcon,
	vue: VueIcon,
	svelte: SvelteIcon,

	// Data formats
	json: JSONIcon,
	yaml: YAMLIcon,
	yml: YAMLIcon,
	toml: ConfigIcon,
	xml: HTMLIcon,

	// Documentation
	md: MarkdownIcon,
	mdx: MarkdownIcon,
	txt: TextIcon,
	rst: TextIcon,

	// Languages
	py: PythonIcon,
	pyw: PythonIcon,
	go: GoIcon,
	rs: RustIcon,
	c: CppIcon,
	cpp: CppIcon,
	cc: CppIcon,
	h: CppIcon,
	hpp: CppIcon,
	java: JavaIcon,
	php: PHPIcon,
	rb: RubyIcon,

	// Database
	sql: SQLIcon,
	graphql: GraphQLIcon,
	gql: GraphQLIcon,

	// Shell
	sh: ShellIcon,
	bash: ShellIcon,
	zsh: ShellIcon,
	fish: ShellIcon,

	// Images
	png: ImageIcon,
	jpg: ImageIcon,
	jpeg: ImageIcon,
	gif: ImageIcon,
	webp: ImageIcon,
	ico: ImageIcon,
	svg: SVGIcon,

	// Config files
	gitignore: GitIcon,
	gitattributes: GitIcon,
	env: DotenvIcon,
	"env.local": DotenvIcon,
	"env.development": DotenvIcon,
	"env.production": DotenvIcon,

	// Docker
	dockerfile: DockerIcon,
	dockerignore: DockerIcon,

	config: ConfigIcon,
	rc: ConfigIcon,
};

/**
 * Special filename to icon mapping
 * These are matched by full filename (case-insensitive)
 */
export const filenameIconMap: Record<string, () => ReactNode> = {
	"package.json": JSONIcon,
	"tsconfig.json": TypeScriptIcon,
	"jsconfig.json": JavaScriptIcon,
	".gitignore": GitIcon,
	".gitattributes": GitIcon,
	".env": DotenvIcon,
	".env.local": DotenvIcon,
	".env.development": DotenvIcon,
	".env.production": DotenvIcon,
	"dockerfile": DockerIcon,
	"docker-compose.yml": DockerIcon,
	"docker-compose.yaml": DockerIcon,
	"readme.md": MarkdownIcon,
	"license": TextIcon,
	"license.md": TextIcon,
};

/**
 * Get the icon component for a given filename or label
 * 
 * @param label - The filename or label to get an icon for
 * @returns The icon component, or undefined if no match found
 */
export function getExtensionIcon(label: string): ReactNode | undefined {
	const lowercaseLabel = label.toLowerCase();

	// Check for exact filename match first
	if (filenameIconMap[lowercaseLabel]) {
		return filenameIconMap[lowercaseLabel]();
	}

	// Check if it looks like a folder (ends with /)
	if (label.endsWith("/")) {
		return <FolderIcon />;
	}

	// Extract extension from the label
	const lastDotIndex = label.lastIndexOf(".");
	if (lastDotIndex === -1 || lastDotIndex === label.length - 1) {
		// No extension found, return undefined (use default or no icon)
		return undefined;
	}

	const extension = label.slice(lastDotIndex + 1).toLowerCase();

	// Look up the icon
	const IconComponent = extensionIconMap[extension];
	if (IconComponent) {
		return IconComponent();
	}

	// Fallback to generic file icon
	return <FileIcon />;
}

/**
 * Default file icon for items without a recognized extension
 */
export const DefaultFileIcon = FileIcon;

/**
 * Default folder icon
 */
export const DefaultFolderIcon = FolderIcon;

