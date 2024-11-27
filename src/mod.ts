import i18n from 'i18n'
import { type LocalesMap } from './LocalesMap.js'

interface Translate<T extends Record<string, Record<string, string>>> {
    <K extends keyof T>(phrase: K, options?: T[K]): string
}

export function Translator<
    T extends Record<string, Record<string, string>> = LocalesMap,
>(locale: string) {
    const translate: Translate<T> = (phrase, options) => {
        return i18n.__mf({ phrase: phrase as string, locale }, options)
    }
    return translate
}
export default Translator
