// deno-fmt-ignore-file

import * as path from 'https://deno.land/std@0.83.0/path/mod.ts';
// import * as Fae from 'https://deno.land/x/fae@v1.0.0/mod.ts';
import * as R from 'https://deno.land/x/ramda@v0.27.2/mod.ts';
import { replace } from 'https://deno.land/x/ramda@v0.27.2/mod.ts';

export * from './mod.ts';
import { desc, env, glob, log, makeDir, quote, run, runIfMain, sh, shCapture, task, writeFile } from './mod.ts';

// import { desc, env, log, run, sh, task } from 'https://deno.land/x/drake@v1.4.6/mod.ts';
// import { isMain } from './isMain.ts';

// log(
// 	Deno.inspect({ main: Deno.mainModule, exec: Deno.execPath(), args: Deno.args, meta: import.meta })
// );

// console.warn({ exec: Deno.execPath(), main: Deno.mainModule, args: Deno.args });

const quiet = env('--quiet') ? '--quiet' : '';
const cwd = path.resolve('.');
const repoDir = path.resolve(path.join(cwd, '..'));

env('--default-task', 'test');

class ExtendedMap<K, V> extends Map<K, V> {
	public filter(filterFn: (value: V, key: K) => boolean) {
		const filtered = new ExtendedMap<K, V>();
		this.forEach((value, key) => {
			if (filterFn(value, key)) {
				filtered.set(key, value);
			}
		});
		return filtered;
	}

	public map(mapFn: (value: V, key: K) => V) {
		const mapped = new ExtendedMap<K, V>();
		this.forEach((value, key) => mapped.set(key, mapFn(value, key)));
		return mapped;
	}

	public toArray() {
		const arr: (K | V)[] = [];
		this.forEach((value, key) => arr.push(key, value));
		return arr;
	}

	public toObject() {
		const obj: Record<string, V> = {};
		this.forEach((value, key) => (obj[`${key}`] = value));
		return obj;
	}

	public toPairs() {
		const pairs: [K, V][] = [];
		this.forEach((value, key) => pairs.push([key, value]));
		return pairs;
	}
}

// const fileSetGlobs = new ExtendedMap([
// 	['source', ['+(lib|mod)[.]ts', 'src/**/!(*[.]d)[.]ts']],
// 	['examples', ['examples/!(*[.]d)[.]ts']],
// 	['other', ['taskfile.ts']],
// 	['tests', ['tests/!(*[.]d)[.]ts']],
// ]);

// const fileSets = fileSetGlobs.map((value) => value.flatMap((v) => glob(v)));
// const allFiles = [...fileSets.values()].flat();

const fileSetGlobs = {
	source: ['+(lib|mod).ts', 'src/**/!(*.d).ts'],
	examples: ['examples/!(*.d).ts'],
	other: ['taskfile.ts'],
	tests: ['tests/!(*.d).ts'],
};

const fileSets = R.map((value: string[]) => value.flatMap((v) => glob(v)), fileSetGlobs);
const allFiles = [...R.values(fileSets)].flat();
const lintableFiles = R.flatten(R.values(R.props(['source', 'examples', 'other'], fileSets)));

// console.log({
// 	fileSets,
// 	// 	// 	// source: [...fileSets.filter((_value, key) => ['source'].includes(key)).values()].flat(),
// 	// 	// 	// other: [...fileSets.filter((_value, key) => ['examples', 'tests'].includes(key)).values()].flat(),
// 	// 	// 	// // all: Array.from(fileSets.values()).flat(),
// 	// 	// 	// all: [...fileSets.values()].flat(),
// 	allFiles,
// 	lintableFiles,
// });

// const toObject = fileSets.toObject();
// const toPairs = fileSets.toPairs();
// const entries: [string, string[]][] = Array.from(fileSets.entries());
// // const faeEntries = Fae.fromPairs(entries);
// const faeEntries = Fae.fromPairs(fileSets.toPairs());
// // const subset = Fae.paths(['source', 'tasks'], faeEntries);
// const subset = Fae.paths(['source', 'tasks'], toObject);
// // console.log(Fae.head(Fae.fromPairs(entries)));
// console.log({ toObject, toPairs, entries, faeEntries, subset });

// Deno.exit(0);

// const TS_FILES = [...glob('*.ts'), ...glob('src/**/*.ts'), ...glob('+(examples|tests)/*.ts')].filter(
// 	(p) => !p.endsWith('.d.ts')
// );

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
	// dprint-0.11.1 works on gitignore-style PATTERNs (not FILEs)
	// * convert files to gitignore-style patterns
	const files = allFiles.map((v) => v.replace('\\', '/'));
	await sh(`dprint fmt ${quiet} ${quote(files)}`);
});
task('format', ['fmt']);

desc('check for package "lint"');
task('lint', ['lint:code', 'lint:style']);

desc('check for code lint (using `deno lint ...`)');
task('lint:code', [], async function () {
	await shCapture(`deno lint ${quiet} --unstable ${quote(lintableFiles)}`, { stderr: 'inherit', stdout: 'inherit' });
});

desc('check for format imperfections (using `dprint`)');
task('lint:style', [], async function () {
	// dprint-0.11.1 works on gitignore-style PATTERNs (not FILEs)
	// * convert files to gitignore-style patterns
	const files = allFiles.map((v) => v.replace('\\', '/'));
	await shCapture(`dprint check ${quiet} ${quote(files)}`, {
		stderr: 'inherit',
		stdout: 'inherit',
	});
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
		await sh(
			`genhtml -o coverage/html --prefix "${repoDir}" coverage/coverage.lcov --branch-coverage --function-coverage`
		);
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
