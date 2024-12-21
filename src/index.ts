import i18n from 'i18n'
import { LocaleKeys } from './keys.js'

type NestedKeyOf<T> = {
    [K in keyof T]: T[K] extends string
        ? T[K]
        : `${K & string}.${NestedKeyOf<T[K]>}`
}[keyof T]

interface Translate<T extends LocaleKeys = LocaleKeys> {
    <K extends NestedKeyOf<T>>(
        phrase: K,
        options?: Record<string, string>,
    ): string
}

export function Translator<T extends LocaleKeys = LocaleKeys>(locale: string) {
    const translate: Translate<T> = (phrase, options) => {
        return i18n.__mf({ phrase: phrase as string, locale }, options)
    }
    return translate
}

export default Translator
