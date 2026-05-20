import { toStandardJsonSchema } from '@valibot/to-json-schema';
import { type JsonColumn, schema as s } from 'jazz-tools';
import type { Message } from './state/chats.svelte';
import * as v from 'valibot';

const NameGenSettingsSchema = v.object({
	enabled: v.boolean(),
	providerId: v.nullable(v.string()),
	modelId: v.nullable(v.string()),
	prompt: v.string(),
});

export type NameGenSettings = v.InferOutput<typeof NameGenSettingsSchema>;

const ChatSettingsSchema = v.object({
	defaultProviderId: v.nullable(v.string()),
	defaultModelId: v.nullable(v.string()),
});

export type ChatSettings = v.InferOutput<typeof ChatSettingsSchema>;

const ModelData = v.object({
	id: v.string(),
	name: v.string(),
});

export const schema = {
	chats: s.table({
		providerId: s.ref('providers').optional(),
		modelId: s.string().optional(),
		messages: s.json() as unknown as JsonColumn<Message[]>,
		locked: s.boolean(),
		name: s.string().optional(),
	}),
	providers: s.table({
		type: s.enum('openai'),
		name: s.string(),
		baseURL: s.string(),
		apiKey: s.string().optional(),
		models: s.json(toStandardJsonSchema(v.array(ModelData))),
	}),
	kv: s.table({
		key: s.enum('settings::name-gen', 'settings::chat'),
		value: s.json(
			toStandardJsonSchema(
				v.union([ChatSettingsSchema, NameGenSettingsSchema]),
			),
		),
	}),
};

export const app = s.defineApp(schema);

export type KV = s.RowOf<typeof app.kv>;
export type ChatData = s.RowOf<typeof app.chats>;
