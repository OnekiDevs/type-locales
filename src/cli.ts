import { readdir, writeFile, watch, readFile, realpath } from 'node:fs/promises'
import { parseArgs } from 'node:util'
import { dirname, join } from 'node:path'
import { Root } from './Tree.js'
import { fileURLToPath } from 'node:url'

export async function cli({
    INPUT_ROOT,
    OUTPUT_JS,
    OUTPUT_DTS,
}: {
    INPUT_ROOT: string
    OUTPUT_JS: string
    OUTPUT_DTS: string
}) {
    const dir = await readdir(INPUT_ROOT, { withFileTypes: true })
    const root = new Root()
    for (const file of dir.filter(
        f => f.isFile() && f.name.endsWith('.json'),
    )) {
        const lang = JSON.parse(
            await readFile(join(process.cwd(), INPUT_ROOT, file.name), {
                encoding: 'utf-8',
            }),
        )
        root.process(file.name.replace('.json', ''), lang)
    }
    await writeFile(
        OUTPUT_JS,
        `export const localeKeys = ${JSON.stringify(
            root.js(),
            null,
            4,
        )}\nexport default localeKeys`,
    )
    await writeFile(OUTPUT_DTS, root.dts())
}

if (
    (await realpath(fileURLToPath(import.meta.url))) ===
    (await realpath(process.argv[1]))
) {
    let timeoutId: NodeJS.Timeout | null = null
    const {
        positionals: [input],
        values: { watch: WATCH, quiet: QUIET, version, help },
    } = parseArgs({
        args: process.argv.slice(2),
        options: {
            quiet: {
                type: 'boolean',
                default: false,
                short: 'q',
                multiple: false,
            },
            watch: {
                type: 'boolean',
                default: false,
                short: 'w',
                multiple: false,
            },
            version: {
                type: 'boolean',
                default: false,
                short: 'v',
                multiple: false,
            },
            help: {
                type: 'boolean',
                default: false,
                short: 'h',
                multiple: false,
            },
        },
        allowPositionals: true,
        strict: false,
    })

    if (version) {
        await import(import.meta.resolve('../package.json'), {
            with: { type: 'json' },
        }).then(i => {
            console.log(`type-routes v${i.default.version}`)
        })
        process.exit(0)
    }

    if (help) {
        console.log(`
Usage: type-locales [path] [options]

Arguments:
  path                   path to translate

Options:
  -v, --version          output the version number
  -w --watch             watch for changes in the input directory (default: false)
  -q, --quiet            quiet mode (default: false)
  -h, --help             display help for command`)
        process.exit(0)
    }

    const runCli = () => {
        const { promise, resolve } = Promise.withResolvers<void>()
        if (timeoutId !== null) {
            clearTimeout(timeoutId)
        }
        timeoutId = setTimeout(() => {
            cli({
                INPUT_ROOT,
                OUTPUT_JS,
                OUTPUT_DTS,
            })
                .then(() => {
                    if (!QUIET) console.log('[type-routes] Routes typed')
                    resolve()
                })
                .catch(error => {
                    if (
                        (error as Error).message.includes(
                            'no such file or directory',
                        ) &&
                        !QUIET
                    )
                        console.error(
                            `[type-routes] Error: ${INPUT_ROOT} does not exist or is not a directory`,
                        )
                    if (
                        (error as Error).message.includes(
                            'Conflict encountered',
                        ) &&
                        !QUIET
                    ) {
                        console.error(error.message)
                        resolve()
                    }
                })
        }, 500)
        return promise
    }

    const INPUT_ROOT = input || './locales'
    const OUTPUT_JS = join(
        dirname(await realpath(fileURLToPath(import.meta.url))),
        'keys.js',
    )
    const OUTPUT_DTS = join(
        dirname(await realpath(fileURLToPath(import.meta.url))),
        'keys.d.ts',
    )

    const runWatch = async () => {
        if (WATCH) {
            try {
                const watcher = watch(INPUT_ROOT)
                for await (const event of watcher) {
                    if (!event.filename?.endsWith('.json')) continue
                    runCli().catch(() => void 0)
                }
            } catch (error) {
                if (
                    (error as Error).message.includes(
                        'no such file or directory',
                    )
                ) {
                    console.error(
                        `[type-routes] Error: ${INPUT_ROOT} does not exist or is not a directory`,
                    )
                }
            }
        }
    }

    runCli()
        .then(runWatch)
        .catch(error => {
            if ((error as Error).message.includes('Conflict encountered'))
                runWatch()
        })
}
