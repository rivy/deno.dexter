import { shCapture, vers } from '../src/lib/utils.ts';
import { assertEquals, assertStringIncludes, path } from './deps.ts';

Deno.test('cli_test', async function () {
	const denoRun = 'deno run -A --quiet';
	const dexter = `${denoRun} taskfile.ts`;

	let { code, output, error } = await shCapture(`${dexter} --version`);
	assertEquals(code, 0);
	assertEquals(output.trimRight(), vers());

	({ code, output, error } = await shCapture(`${denoRun} --unstable taskfile.ts --version`));
	assertEquals(code, 0);
	assertEquals(output.trimRight(), vers());

	({ code, output } = await shCapture(`${dexter} --help`));
	assertEquals(code, 0);
	assertStringIncludes(output, 'a make-like task runner for Deno.');

	({ code, output } = await shCapture(`${dexter} --list-tasks`, { env: { NO_COLOR: 'true' } }));
	assertEquals(code, 0);
	assertStringIncludes(output, 'Display tasks');

	({ code, output } = await shCapture(`${dexter} -L`, { env: { NO_COLOR: 'true' } }));
	assertEquals(code, 0);
	assertStringIncludes(output, '     lint\n');

	// for Win10/PowerShell-v5, this fails due to PoSH returning a non-error exit codes
	// * (Windows 2019/PowerShell-v7) succeeds
	// fix: [2021-03-08;rivy] use more PowerShell surrounding code (a `try ... catch`? and `exit $LASTEXITCODE`) to correct
	// !... vs `cmd /c/d ...` (quoting issues)
	// !... vs BAT/CMD file (see older `drake` version for example)

	// ({ code, error } = await shCapture(`${dexter} --foobar`, { stderr: 'piped' }));
	// assertEquals(code, 1);
	// assertStringIncludes(error, 'illegal option: --foobar');

	// ({ code, error } = await shCapture(`${dexter} nonexistent-task`, { stderr: 'piped' }));
	// assertEquals(code, 1);
	// assertStringIncludes(error, 'missing task: nonexistent-task');

	// ({ code, error } = await shCapture(
	// 	`${dexter} --cache ${path.join('non-existent-dir', 'cache.json')}`,
	// 	{ stderr: 'piped' }
	// ));
	// assertEquals(code, 1);
	// assertStringIncludes(error, '--cache file directory missing or not a directory');

	// ({ code, error } = await shCapture(`${dexter} -d missing-directory`, { stderr: 'piped' }));
	// assertEquals(code, 1);
	// assertStringIncludes(error, '--directory missing or not a directory');

	({ code, output } = await shCapture(`${denoRun} examples/examples-taskfile.ts cwd --quiet`));
	assertEquals(code, 0);
	assertEquals(output.trimRight(), Deno.cwd());

	({ code, output } = await shCapture(
		`${denoRun} examples/examples-taskfile.ts cwd --quiet --directory .`
	));
	assertEquals(code, 0);
	assertEquals(output.trimRight(), Deno.cwd());

	({ code, output } = await shCapture(
		`${denoRun} examples/examples-taskfile.ts cwd --quiet --directory examples`
	));
	assertEquals(code, 0);
	assertEquals(output.trimRight(), path.join(Deno.cwd(), 'examples'));

	// ({ code, error } = await shCapture(`${denoRun} examples/examples-taskfile.ts abort`, {
	// 	stderr: 'piped',
	// 	env: { NO_COLOR: 'true' },
	// }));
	// assertEquals(code, 1);
	// assertStringIncludes(error, 'error: abort message');

	// ({ code, error } = await shCapture(`${denoRun} examples/examples-taskfile.ts abort --debug`, {
	// 	stderr: 'piped',
	// 	env: { NO_COLOR: 'true' },
	// }));
	// assertEquals(code, 1);
	// assertStringIncludes(error, 'at async run');
});
