import { AppState } from '../core/state.js';
export function requireAuth() { return !!AppState.profile; }
