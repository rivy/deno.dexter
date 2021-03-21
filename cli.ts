// requiredPermissions: --allow-all

import * as Path from 'https://deno.land/std@0.90.0/path/mod.ts';
import { walkSync } from 'https://deno.land/std@0.90.0/fs/walk.ts';
// import xdgAppPaths from 'https://deno.land/x/xdg_app_paths@v7.3.0/src/mod.deno.ts';

import * as XTR from './mod.ts';

function defaultTaskfile(root?: string): string | undefined {
	const DEFAULT_TASKFILE = [/.?taskfile[.]ts/i];
	return walkSync(root || '.', { maxDepth: 1, followSymlinks: true, match: DEFAULT_TASKFILE }).next().value?.name;
}

XTR.debug('debug', { Deno });

const amCompiled = Path.parse(Deno.execPath()).name !== 'deno';
XTR.debug('debug', { execPath: Deno.execPath(), amCompiled });

const root = '.';
const taskfile = defaultTaskfile(root);
XTR.debug('debug', "taskfile='" + taskfile + "'");
if (taskfile) {
	if (!amCompiled) {
		// import paths *must* start with './' or '../'
		const importPath = './' + Path.relative(root, taskfile);
		const Taskfile = await import(importPath);
		Taskfile.run();
	} else {
		const process = Deno.run({ cmd: ['deno', 'run', '-A', taskfile, ...Deno.args] });
		const status = await process.status();
		process.close();
		if (!status.success) {
			Deno.exit(status.code);
		}
	}
} else {
	XTR.run();
}
