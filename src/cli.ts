import { readdir, writeFile, watch } from 'fs/promises'
import { parseArgs } from 'node:util'
import { Root } from './Tree.js'
import { join } from 'path'

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
        const { default: lang } = await import(
            'file://' + join(process.cwd(), INPUT_ROOT, file.name),
            {
                with: { type: 'json' },
            }
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function debounce<T extends (...args: any[]) => Promise<void>>(
    func: T,
    wait: number,
): (...args: Parameters<T>) => Promise<void> {
    let timeoutId: NodeJS.Timeout | null = null
    return (...args: Parameters<T>): Promise<void> => {
        const { promise, resolve } = Promise.withResolvers()
        if (timeoutId !== null) clearTimeout(timeoutId)
        timeoutId = setTimeout(() => func(...args).then(resolve), wait)
        return promise as Promise<void>
    }
}

const debounceCli = debounce(cli, 200)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function wrap<T extends (...args: any) => unknown, K = ReturnType<T>>(
    func: T,
): [Error, null] | [null, K] {
    try {
        return [null, func() as K]
    } catch (error) {
        return [error as Error, null]
    }
}

if (
    import.meta.url.replace(/\\/g, '/') ===
    `file:///${process.argv[1]}`.replace(/\\/g, '/')
) {
    let args = { positionals: [''], values: { watch: false, quiet: false } }
    try {
        args = parseArgs({
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
            },
            allowPositionals: true,
        })
        // eslint-disable-next-line no-empty
    } catch {}

    const {
        positionals: [input],
        values: { watch: WATCH, quiet: QUIET },
    } = args!

    const runCli = async () => {
        try {
            await debounceCli({ INPUT_ROOT, OUTPUT_JS, OUTPUT_DTS })
            if (!QUIET) console.log('[type-routes] Routes typed')
        } catch (error) {
            console.log('[type-routes] Error encountered')
            if (!QUIET) console.log((error as Error).message)
        }
    }

    const INPUT_ROOT = input || './langs'
    const OUTPUT_JS = './build/keys.js'
    const OUTPUT_DTS = './build/keys.d.ts'

    runCli()
    if (WATCH) {
        const watcher = watch(INPUT_ROOT)
        for await (const event of watcher) {
            if (!event.filename?.endsWith('.json')) continue
            runCli()
        }
    }
}
