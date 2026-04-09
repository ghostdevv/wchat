# Migration Plan: jazz.tools → Automerge

## Overview

Replace jazz.tools sync/persistence with Automerge while maintaining Svelte 5 reactive patterns. Start fresh - no data migration needed.

## Architecture

### Document Structure

**Root Document** (embedded in IndexedDB):

```typescript
interface RootDocument {
	providers: ProviderData[];
	nameGenSettings: NameGenSettingsData;
	chatSettings: ChatSettingsData;
	chats: ChatReference[];
}

interface ChatReference {
	url: AutomergeUrl; // required to find the document
	name?: string;
}
```

**Chat Documents** (separate, loaded on demand):

```typescript
interface ChatDocument {
	providerId: string | null;
	modelId: string | null;
	messages: UIMessage[];
	locked: boolean;
	name?: string;
}
```

### File Structure

```
src/lib/state/
├── repo.svelte.ts          # Repo singleton + storage/network setup
├── handle.svelte.ts        # Reactive DocHandle wrapper (NEW)
├── db.svelte.ts            # TypeScript interfaces + Zod validation
├── provider.svelte.ts      # Single provider class (REWRITE)
├── providers.svelte.ts     # Providers container + cache (REWRITE)
├── chat.svelte.ts          # Chat class - own doc (REWRITE)
└── settings.svelte.ts      # NameGenSettings, ChatSettings (REWRITE)
```

---

## Phase 1: Infrastructure

### 1.1 repo.svelte.ts

- Export the Repo instance as singleton so other modules can use it
- Keep existing BroadcastChannelNetworkAdapter + IndexedDBStorageAdapter
- Keep PersistedState for sync enabled/root URL

### 1.2 handle.svelte.ts (NEW)

Reactive wrapper around DocHandle using Svelte 5 runes:

```typescript
class DocHandle<T> {
	#handle: DocHandle<T>;
	ready = $derived(this.#handle.isReady());
	doc = $derived(this.#handle.docSync()); // throws if not ready - use carefully

	constructor(url: AutomergeUrl) {
		this.#handle = repo.find(url);
	}

	async whenReady() {
		return this.#handle.whenReady();
	}

	change(fn: (doc: T) => void) {
		this.#handle.change(fn);
	}
}
```

**Key advantage over jazz:** In async contexts, just `await handle.whenReady()` instead of checking `$isLoaded` and throwing.

---

## Phase 2: Schema

### 2.1 db.svelte.ts

Convert jazz schemas to TypeScript interfaces + Zod for runtime validation:

```typescript
// Root document types
export const ProviderSchema = z.object({
	type: z.literal('openai'),
	name: z.string().min(1).max(30),
	baseURL: z.string().url(),
	apiKey: z.string().nullable(),
	models: z.array(
		z.object({
			id: z.string().min(1),
			name: z.string().min(1),
		}),
	),
});

export type ProviderData = z.infer<typeof ProviderSchema>;

export const NameGenSettingsSchema = z.object({
	enabled: z.boolean(),
	providerId: z.string().min(1).nullable(),
	modelId: z.string().min(1).nullable(),
	prompt: z.string().min(1),
});

export const ChatSettingsSchema = z.object({
	defaultProviderId: z.string().min(1).nullable(),
	defaultModelId: z.string().min(1).nullable(),
});

export const ChatReferenceSchema = z.object({
	url: z.string(), // AutomergeUrl
	name: z.string().optional(),
});

export const RootDocumentSchema = z.object({
	providers: z.array(ProviderSchema),
	nameGenSettings: NameGenSettingsSchema,
	chatSettings: ChatSettingsSchema,
	chats: z.array(ChatReferenceSchema),
});

// Chat document (separate)
export const ChatDocumentSchema = z.object({
	providerId: z.string().min(1).nullable(),
	modelId: z.string().min(1).nullable(),
	messages: z.array(z.any()), // UIMessage is complex, use z.any()
	locked: z.boolean(),
	name: z.string().optional(),
});

export type ChatDocumentData = z.infer<typeof ChatDocumentSchema>;
```

---

## Phase 3: State Classes

### 3.1 provider.svelte.ts

Replace `CoState` with handle-based approach:

```typescript
export class Provider {
	#handle: DocHandle<ProviderData>;
	current = $derived(this.#handle.docSync());
	ready = $derived(this.#handle.isReady());

	constructor(url: AutomergeUrl) {
		this.#handle = repo.find(url);
	}

	async ensureReady() {
		await this.#handle.whenReady();
	}

	update(name?: string, baseURL?: string, apiKey?: string | null) {
		this.#handle.change((doc) => {
			if (name) doc.name = name;
			if (baseURL) doc.baseURL = baseURL;
			if (apiKey !== undefined) doc.apiKey = apiKey;
		});
	}

	async refreshModels() {
		const doc = await this.#handle.whenReady();
		// fetch and update models...
	}
}
```

### 3.2 providers.svelte.ts

Root-backed collection with caching:

```typescript
export class Providers {
	#rootHandle: DocHandle<RootDocument>;
	#cache = new Map<string, Provider>();

	ready = $derived(this.#rootHandle.isReady());
	current = $derived(this.#rootHandle.docSync());

	constructor() {
		this.#rootHandle = repo.find(rootUrl);
	}

	async whenReady() {
		return this.#rootHandle.whenReady();
	}

	get providers(): ProviderData[] {
		const doc = this.#rootHandle.docSync();
		return doc?.providers ?? [];
	}

	async create(name: string, baseURL: string, apiKey: string | null) {
		const doc = await this.#rootHandle.whenReady();
		// create new provider doc, add to root.providers
	}

	getProvider(id: string): Provider {
		// return cached or new Provider
	}
}
```

### 3.3 chat.svelte.ts

Own document, separate from root:

```typescript
export class Chat<M extends UIMessage = UIMessage> {
	#handle: DocHandle<ChatDocumentData>;

	ready = $derived(this.#handle.isReady());

	constructor(url: AutomergeUrl) {
		this.#handle = repo.find(url);
	}

	async whenReady() {
		return this.#handle.whenReady();
	}

	get providerId(): string | null {
		return this.#handle.docSync()?.providerId ?? null;
	}

	set providerId(id: string | null) {
		this.#handle.change((doc) => {
			doc.providerId = id;
		});
	}

	get messages(): M[] {
		return (this.#handle.docSync()?.messages as M[]) ?? [];
	}
}
```

### 3.4 settings.svelte.ts

Load from root document:

```typescript
export class NameGenSettings {
	#rootHandle: DocHandle<RootDocument>;

	constructor() {
		this.#rootHandle = repo.find(rootUrl);
	}

	get enabled(): boolean {
		return this.#rootHandle.docSync()?.nameGenSettings?.enabled ?? false;
	}

	set enabled(value: boolean) {
		this.#rootHandle.change((doc) => {
			doc.nameGenSettings.enabled = value;
		});
	}
	// ... same pattern for providerId, modelId, prompt
}
```

---

## Phase 4: Integration

Update imports across components as they migrate from jazz to automerge state classes.

---

## Key Differences from Jazz

| Jazz                                 | Automerge                                       |
| ------------------------------------ | ----------------------------------------------- |
| `$isLoaded` checks + throwing errors | `await handle.whenReady()` in async contexts    |
| `CoState` wraps individual docs      | `DocHandle` wraps individual docs               |
| `AccountCoState` for root access     | `DocHandle` for root doc                        |
| `CoMap` schema                       | TypeScript interfaces + Zod                     |
| `$jazz` mutation API                 | Direct property mutation in `change()` callback |

---

## Next Steps

1. Confirm this plan matches your expectations
2. Ready to begin Phase 1
