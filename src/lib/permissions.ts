import { schema as s } from 'jazz-tools';
import { app } from './schema';

export default s.definePermissions(app, ({ policy }) => {
	policy.providers.managedByCreator();
	policy.chats.managedByCreator();
	policy.kv.managedByCreator();
});
