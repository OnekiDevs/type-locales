export interface Locale {
    [key: string]: Locale | string
}

export class BaseNode {
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

    checkConflict(lang: string = '') {
        if (this.hasConflict()) {
            throw new Error(
                `[type-locales] Conflict encountered${
                    lang ? ` in the file "${lang}.json"` : ''
                } at key: ${this.key}`,
            )
        }
    }

    process(id: string, locale: Locale | string): this {
        this.langs.add(id)
        if (typeof locale === 'string') {
            this.value = locale
            this.checkConflict(id)
            return this
        }
        for (const [k, v] of Object.entries(locale)) {
            const child = this.children.get(k) ?? new Node(k)
            this.children.set(k, child)
            child.process(id, v)
        }
        this.checkConflict(id)
        return this
    }

    has(langs: Set<string>) {
        return langs.isSubsetOf(this.langs)
    }

    toJSON(): Record<string, unknown> {
        return {
            key: this.key,
            children: [...this.children.values().map(v => v.toJSON())],
        }
    }
}

export class Root extends BaseNode {
    constructor() {
        super('')
    }

    js(): Locale {
        const locale: Locale = {}
        for (const [k, v] of this.children.entries())
            Object.assign(locale, { [k]: v.resolve('') })

        return locale
    }

    dts(): string {
        return [
            'export interface LocaleKeys {',
            ...this.children.values().map(v => v.generateDTS(this.langs)),
            '}',
            'export default LocaleKeys',
            'export const localeKeys: LocaleKeys',
        ].join('\n')
    }
}

export class Node extends BaseNode {
    resolve(parent: string): Locale | string {
        const kid = !parent.length ? this.key : `${parent}.${this.key}`
        if (this.value) return kid
        const locale: Locale = {}
        for (const [k, v] of this.children.entries())
            Object.assign(locale, { [k]: v.resolve(kid) })

        return locale
    }

    generateDTS(langs: Set<string>, kid = '', tab = 4) {
        let out = `${' '.repeat(tab)}'${this.key}'`
        if (!this.has(langs)) out += '?'
        out += ': '
        const nkid = kid.length ? kid + '.' + this.key : this.key
        if (!this.children.size) out += `\`${this.resolve(kid)}\``
        else
            out += [
                '{',
                ...this.children
                    .values()
                    .map(v => v.generateDTS(langs, nkid, tab + 4)),
                ' '.repeat(tab) + '}',
            ].join('\n')
        return out
    }
}
