import type { ChangeFn, DocHandle } from '@automerge/automerge-repo';
import { createSubscriber } from 'svelte/reactivity';
import { PersistedState } from 'runed';

// class Sync {
// 	#enabled = new PersistedState('wchat::sync-enabled', false);

// 	set enabled(value: boolean) {
// 		this.#enabled.current = value;
// 	}

// 	get enabled(): boolean {
// 		return this.#enabled.current;
// 	}
// }

export class ReactiveDoc<T> {
	#handle;
	#subscribe;

	constructor(handle: DocHandle<T>) {
		this.#handle = handle;
		this.#subscribe = createSubscriber((update) => {
			this.#handle.on('change', update);
			return () => this.#handle.off('change', update);
		});
	}

	get handle() {
		return this.#handle;
	}

	get current() {
		this.#subscribe();
		return this.#handle.doc();
	}

	change(fn: ChangeFn<T>) {
		return this.#handle.change(fn);
	}
}
