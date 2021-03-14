// deno-fmt-ignore-file

export * from './mod.ts';
import { desc, env, glob, log, makeDir, quote, run, runIfMain, sh, shCapture, task, writeFile } from './mod.ts';

import * as path from 'https://deno.land/std@0.83.0/path/mod.ts';

// import { desc, env, log, run, sh, task } from 'https://deno.land/x/drake@v1.4.6/mod.ts';
// import { isMain } from './isMain.ts';

// log(
// 	Deno.inspect({ main: Deno.mainModule, exec: Deno.execPath(), args: Deno.args, meta: import.meta })
// );

// console.warn({ exec: Deno.execPath(), main: Deno.mainModule, args: Deno.args });

const quiet = env('--quiet') ? '--quiet' : '';
const cwd = path.resolve('.');

env('--default-task', 'test');

const TS_FILES = [...glob('*.ts'), ...glob('src/**/*.ts'), ...glob('+(examples|tests)/*.ts')].filter(
	(p) => !p.endsWith('.d.ts')
);

desc('Minimal task');
task('hello', [], function () {
	console.log('Hello World!');
});

desc('Display tasks');
task('help', [], async function () {
	console.log({
		main: Deno.mainModule,
		meta: import.meta,
		exec: Deno.execPath(),
		permissions: Deno.permissions.query({ name: 'write', path: '..' }),
	});
	await sh('deno run -A ' + import.meta.url + ' --list-tasks');
});

desc('test package');
task('test', ['lint'], async function () {
	await sh(`deno test -A ${quiet} tests`, env('--debug') ? { env: { DRAKE_DEBUG: 'true' } } : {});
});

desc("format source files [alias 'format']");
task('fmt', [], async function () {
	// dprint-0.11.1 requires nix-style paths for correct matching
	const files = TS_FILES.map((s) => s.replaceAll('\\', '/'));
	await sh(`dprint fmt ${quiet} ${quote(files)}`);
});
task('format', ['fmt']);

desc('check for package "lint"');
task('lint', ['lint:code', 'lint:style']);

desc('check for code lint (using `deno lint ...`)');
task('lint:code', [], async function () {
	await sh(`deno lint ${quiet} --unstable ${quote(TS_FILES)}`);
});

desc('check for format imperfections (using `dprint`)');
task('lint:style', [], async function () {
	// dprint-0.11.1 requires nix-style paths for correct matching
	const files = TS_FILES.map((s) => s.replaceAll('\\', '/'));
	await sh(`dprint check ${quiet} ${quote(files)}`);
});

desc("calculate and display code coverage [alias 'cov']");
task('coverage', [], async function () {
	await sh(`deno test -A ${quiet} --coverage=coverage --unstable`);
	// await sh(`deno coverage coverage ${quiet} --unstable --lcov > coverage/coverage.lcov`);
	const { code: status, output: out, error: err } = await shCapture(
		`deno coverage coverage ${quiet} --unstable --lcov --exclude=taskfile.ts --exclude=examples --exclude=tests`
	);
	if (status !== 0) {
		console.log(err);
	} else {
		makeDir('coverage');
		writeFile('coverage/coverage.lcov', out);
		// await sh(`genhtml -o coverage/html --prefix "${cwd}" coverage/coverage.lcov --branch-coverage --function-coverage`);
		// await sh(`genhtml -o coverage/html coverage/coverage.lcov --branch-coverage --function-coverage`);
	}
});
task('cov', ['coverage']);

// task('hello', [], function () {
// 	console.log('Hello#2 World!');
// });

// console.log({ isMain: isMain() });

// export { x };
// if (Deno.mainModule === import.meta.url) {
// if (isMain()) {
// run();
// }
runIfMain();

// throw 'test';
// Deno.exit(100);
