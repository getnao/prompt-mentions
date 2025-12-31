# prompt-mentions

A beautiful React component library for building AI prompts with @mentions. Features a sleek mention menu, nested submenus, keyboard navigation, custom theming, and file extension icons.

[![npm version](https://img.shields.io/npm/v/prompt-mentions.svg)](https://www.npmjs.com/package/prompt-mentions)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

<p align="center">
  <img src="https://raw.githubusercontent.com/getnao/prompt-mentions/main/.github/demo.gif" alt="prompt-mentions demo" width="600" />
</p>

## Features

- 🎨 **Multiple preset themes** — Light, Cursor Dark, GitHub Dark, Minimal
- 🎯 **Multiple trigger characters** — Use `@`, `#`, `/`, or any character
- 📁 **Nested menus** — Navigate hierarchical options with Tab/Escape
- ⌨️ **Full keyboard navigation** — Arrow keys, Enter, Tab, Escape
- 🔍 **Real-time search** — Filter options as you type
- 🏷️ **Mention pills** — Beautiful styled tags for selected mentions
- 🖼️ **Custom icons** — Add icons to menu items
- 📄 **Auto file icons** — Automatic icons based on file extensions
- 🎛️ **Imperative API** — Programmatically append mentions via ref
- 📱 **Message component** — Render sent messages with formatted mentions
- 🎨 **Fully customizable** — CSS variables and theme objects

## Installation

```bash
npm install prompt-mentions
```

```bash
yarn add prompt-mentions
```

```bash
pnpm add prompt-mentions
```

## Quick Start

```tsx
import { Prompt } from 'prompt-mentions';
import 'prompt-mentions/style.css';

const options = [
  { id: 'alice', label: 'Alice Johnson' },
  { id: 'bob', label: 'Bob Smith' },
  { id: 'main-ts', label: 'main.ts' },
];

function App() {
  return (
    <Prompt
      placeholder="Type @ to mention..."
      mentionConfigs={[{ trigger: '@', options }]}
      onChange={(value, mentions) => {
        console.log('Value:', value);
        console.log('Mentions:', mentions);
      }}
    />
  );
}
```

## Components

### `<Prompt />`

The main input component with mention support.

```tsx
import { Prompt } from 'prompt-mentions';
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `initialValue` | `string` | `""` | Initial text content with optional mentions in `@[id]` format |
| `placeholder` | `string` | `""` | Placeholder text when input is empty |
| `mentionConfigs` | `MentionConfig[]` | `[{ trigger: '@', options: [] }]` | Array of mention trigger configurations |
| `theme` | `PresetThemeName \| PromptTheme` | — | Theme preset name or custom theme object |
| `className` | `string` | `""` | Additional CSS class name |
| `style` | `CSSProperties` | — | Inline styles |
| `extensionIcons` | `boolean` | `false` | Auto-add file icons based on extension |
| `onChange` | `(value: string, mentions: SelectedMention[]) => void` | — | Called on every text change |
| `onEnter` | `(value: string, mentions: SelectedMention[]) => void` | — | Called when Enter is pressed |
| `onMentionAdded` | `(mention: SelectedMention) => void` | — | Called when a mention is selected |
| `onMentionDeleted` | `(mention: SelectedMention) => void` | — | Called when a mention is removed |
| `onMentionClick` | `(mention: SelectedMention) => void` | — | Called when a mention pill is clicked |

#### MentionConfig

```typescript
interface MentionConfig {
  trigger: string;           // Character that triggers the menu (e.g., '@', '#', '/')
  options: MentionOption[];  // Array of mention options
  menuPosition?: 'above' | 'below';  // Menu position relative to cursor
  showTrigger?: boolean;     // Show trigger character in pill (default: false)
}
```

#### MentionOption

```typescript
interface MentionOption {
  id: string;                // Unique identifier
  label: string;             // Display text
  icon?: ReactNode;          // Optional icon component
  type?: 'item' | 'divider' | 'title';  // Item type
  children?: MentionOption[];  // Nested submenu items
  labelRight?: string;       // Secondary label (e.g., file path)
  indent?: number;           // Visual indent level
}
```

### `<Message />`

Display sent messages with formatted mention pills.

```tsx
import { Message } from 'prompt-mentions';

<Message
  value="Hello @[alice]! Please review @[main-ts]"
  mentionConfigs={[{ trigger: '@', options }]}
  onMentionClick={(mention) => console.log('Clicked:', mention)}
/>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | — | Message text with mentions in `trigger[id]` format |
| `mentionConfigs` | `MessageMentionConfig[]` | `[{ trigger: '@' }]` | Mention configurations for label/icon lookup |
| `theme` | `PresetThemeName \| PromptTheme` | — | Theme preset or custom theme |
| `className` | `string` | `""` | Additional CSS class name |
| `style` | `CSSProperties` | — | Inline styles |
| `extensionIcons` | `boolean` | `false` | Auto-add file icons based on extension |
| `onMentionClick` | `(mention) => void` | — | Called when a mention pill is clicked |

## Theming

### Preset Themes

```tsx
<Prompt theme="light" />       // Default light theme
<Prompt theme="cursorDark" />  // Cursor IDE dark theme
<Prompt theme="githubDark" />  // GitHub dark theme
<Prompt theme="minimal" />     // Clean minimal theme
```

### Custom Theme

Pass a `PromptTheme` object for full control:

```tsx
const customTheme: PromptTheme = {
  backgroundColor: '#1a1625',
  color: '#e0d4f7',
  placeholderColor: '#6b5b8c',
  fontSize: '14px',
  borderRadius: '12px',
  borderColor: '#2d2640',
  focusBorderColor: '#9c6ade',
  
  menu: {
    backgroundColor: '#1a1625',
    borderColor: '#2d2640',
    color: '#c4b5dc',
    itemHoverColor: '#2d2640',
  },
  
  pill: {
    backgroundColor: 'linear-gradient(135deg, #7c3aed, #c026d3)',
    borderRadius: '8px',
    color: 'white',
  },
};

<Prompt theme={customTheme} />
```

### Partial Overrides

Override only specific properties:

```tsx
<Prompt
  theme={{
    focusBorderColor: '#f43f5e',
    pill: {
      backgroundColor: '#16a34a',
    },
  }}
/>
```

### CSS Variables

All styling is controlled via CSS variables. Override them in your CSS:

```css
.prompt-container {
  --prompt-background-color: white;
  --prompt-color: black;
  --prompt-placeholder-color: #9ca3af;
  --prompt-border-radius: 0.375rem;
  --prompt-border-color: #d1d5db;
  --prompt-focus-border-color: #6366f1;
  
  --prompt-mention-pill-background-color: linear-gradient(135deg, #6366f1, #8b5cf6);
  --prompt-mention-pill-color: white;
  --prompt-mention-pill-border-radius: 9999px;
  
  --prompt-mention-menu-background-color: white;
  --prompt-mention-menu-border-color: #e5e7eb;
  --prompt-mention-menu-item-hover-color: #f3f4f6;
}
```

## Advanced Usage

### Multiple Triggers

Configure different triggers for different types of mentions:

```tsx
<Prompt
  placeholder="Type @, #, or / ..."
  mentionConfigs={[
    { trigger: '@', options: peopleOptions },
    { trigger: '#', options: tagOptions },
    { trigger: '/', options: commandOptions, menuPosition: 'above' },
  ]}
/>
```

### Nested Menus

Create hierarchical option structures:

```tsx
const options = [
  {
    id: 'team',
    label: 'Team Members',
    icon: <UsersIcon />,
    children: [
      { id: 'alice', label: 'Alice Johnson' },
      { id: 'bob', label: 'Bob Smith' },
    ],
  },
  {
    id: 'projects',
    label: 'Projects',
    icon: <FolderIcon />,
    children: [
      { id: 'alpha', label: 'Project Alpha' },
      { id: 'beta', label: 'Project Beta' },
    ],
  },
];
```

Navigate with:
- **Tab** or **→** — Enter submenu
- **Escape** or **←** — Exit submenu

### Icons and Labels

Add icons and secondary labels to options:

```tsx
const fileOptions = [
  { 
    id: 'prompt-tsx', 
    label: 'Prompt.tsx', 
    labelRight: 'src/components/',
    icon: <TypeScriptIcon />,
    indent: 1,
  },
];
```

### Auto File Extension Icons

Automatically add file type icons based on file extensions:

```tsx
<Prompt
  extensionIcons={true}
  mentionConfigs={[{ trigger: '@', options: fileOptions }]}
/>
```

Supports: `.ts`, `.tsx`, `.js`, `.jsx`, `.css`, `.html`, `.json`, `.md`, `.py`, `.go`, `.rs`, `.sql`, and [many more](src/utils/extensionIcons.tsx).

### Dividers and Titles

Organize options with visual separators:

```tsx
const options = [
  { id: 'title-people', label: 'People', type: 'title' },
  { id: 'alice', label: 'Alice' },
  { id: 'bob', label: 'Bob' },
  { id: 'divider-1', label: '', type: 'divider' },
  { id: 'title-files', label: 'Files', type: 'title' },
  { id: 'readme', label: 'README.md' },
];
```

### Programmatic Control (Ref)

Use the imperative handle to control the prompt externally:

```tsx
import { useRef } from 'react';
import { Prompt, PromptHandle, MentionOption } from 'prompt-mentions';

function MyComponent() {
  const promptRef = useRef<PromptHandle>(null);

  const handleAddMention = (option: MentionOption) => {
    // Append mention with default trigger (@)
    promptRef.current?.appendMention(option);
    
    // Or with a specific trigger
    promptRef.current?.appendMention(option, '#');
    
    // Focus the input
    promptRef.current?.focus();
  };

  return (
    <>
      <Prompt
        ref={promptRef}
        mentionConfigs={[
          { trigger: '@', options: userOptions },
          { trigger: '#', options: tagOptions },
        ]}
      />
      <button onClick={() => handleAddMention({ id: 'alice', label: 'Alice' })}>
        Add @Alice
      </button>
    </>
  );
}
```

### Initial Value with Mentions

Pre-populate the input with existing mentions:

```tsx
<Prompt
  initialValue="Hello @[alice]! Please check @[main-ts]"
  mentionConfigs={[{ trigger: '@', options }]}
/>
```

The format is `trigger[id]` where `id` matches an option's `id` field.

## Exports

```typescript
// Components
export { Prompt, Message } from 'prompt-mentions';

// Types
export type { 
  MentionOption, 
  MentionItemType,
  SelectedMention,
  PromptTheme,
  PresetThemeName,
} from 'prompt-mentions';

// Theme utilities
export { 
  themeToStyles, 
  presetThemes, 
  defaultTheme,
} from 'prompt-mentions';

// Extension icon utilities
export {
  getExtensionIcon,
  extensionIconMap,
  filenameIconMap,
  DefaultFileIcon,
  DefaultFolderIcon,
} from 'prompt-mentions';
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `↑` / `↓` | Navigate menu options |
| `Enter` | Select highlighted option |
| `Tab` / `→` | Enter submenu (if available) |
| `Escape` / `←` | Exit submenu or close menu |
| `Backspace` | Delete mention (when cursor is adjacent) |

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Development

```bash
# Install dependencies
npm install

# Run Storybook for development
npm run storybook

# Run tests
npm run test

# Build the library
npm run build
```

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests to the main repository.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT © [getnao](https://github.com/getnao)

---

Made with ❤️ by [nao](https://getnao.ai)

