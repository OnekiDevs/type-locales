import i18n from 'i18n'
import type { Locale } from './Tree.js'

interface Translate<T extends Locale> {
    <K extends keyof T>(phrase: K, options?: T[K]): string
}

export function Translator<T extends Locale = Locale>(locale: string) {
    const translate: Translate<T> = (phrase, options) => {
        return i18n.__mf({ phrase: phrase as string, locale }, options)
    }
    return translate
}
export default Translator
