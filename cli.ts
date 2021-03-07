// requiredPermissions: --allow-all

import * as Path from 'https://deno.land/std@0.90.0/path/mod.ts';
import { walkSync } from 'https://deno.land/std@0.90.0/fs/walk.ts';
// import xdgAppPaths from 'https://deno.land/x/xdg_app_paths@v7.3.0/src/mod.deno.ts';

import * as XTR from './mod.ts';

function defaultTaskfile(root?: string): string | undefined {
	const DEFAULT_TASKFILE = [/.?taskfile[.]ts/i];
	return walkSync(root || '.', { maxDepth: 1, followSymlinks: true, match: DEFAULT_TASKFILE }).next().value.name;
}

const root = '.';
const taskfile = defaultTaskfile(root);
XTR.debug('debug', "taskfile='" + taskfile + "'");
if (taskfile) {
	// import paths *must* start with './' or '../'
	const importPath = './' + Path.relative(root, taskfile);
	const Taskfile = await import(importPath);
	Taskfile.run();
} else {
	XTR.run();
}
