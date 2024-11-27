import { readdir } from 'node:fs/promises'
import { join } from 'node:path'

interface Locale {
    [key: string]: Locale | string
}

class BaseNode {
    protected children: Map<string, Node> = new Map()
    protected langs: Set<string> = new Set()
    protected value: string = ''
    key: string

    constructor(key: string) {
        this.key = key
    }

    hasConflict(): boolean {
        return !!(this.children.size && this.value)
    }

    checkConflict() {
        if (this.hasConflict()) {
            throw new Error(
                `[type-locales] Conflict encountered at key: ${this.key}`,
            )
        }
    }

    process(id: string, locale: Locale | string): this {
        this.langs.add(id)
        if (typeof locale === 'string') {
            this.value = locale
            this.checkConflict()
            return this
        }
        for (const [k, v] of Object.entries(locale)) {
            const child = this.children.get(k) ?? new Node(k)
            this.children.set(k, child)
            child.process(id, v)
        }
        this.checkConflict()
        return this
    }
}

class Root extends BaseNode {
    constructor() {
        super('')
    }

    js(): Locale {
        const locale: Locale = {}
        for (const [k, v] of this.children.entries()) {
            Object.assign(locale, v.resolve(''))
        }
        return locale
    }
}

class Node extends BaseNode {
    resolve(parent: string): Locale | string {
        const kid = !parent.length ? this.key : `${parent}.${this.key}`
        console.log(kid)

        if (this.value) {
            return kid
        }
        const locale: Locale = {}
        for (const [k, v] of this.children.entries()) {
            Object.assign(locale, v.resolve(kid))
        }
        return locale
    }
}

async function exec() {
    const dir = await readdir('./lang', { withFileTypes: true })
    const root = new Root()
    for (const file of dir.filter(
        f => f.isFile() && f.name.endsWith('.json'),
    )) {
        const { default: lang } = await import(
            'file://' + join(process.cwd(), 'lang', file.name),
            {
                with: { type: 'json' },
            }
        )
        root.process(file.name.replace('.json', ''), lang)
        console.log(root.js())
        break
    }
}
exec()
