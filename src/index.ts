import i18n from 'i18n'
import { LocaleKeys } from './keys.js'

interface Translate<T extends LocaleKeys = LocaleKeys> {
    <K extends keyof T>(phrase: K, options?: T[K]): string
}
// TODO: Fix the type of the phrase parameter
export function Translator<T extends LocaleKeys = LocaleKeys>(locale: string) {
    const translate: Translate<T> = (phrase, options) => {
        return i18n.__mf({ phrase: phrase as string, locale }, options)
    }
    return translate
}

export default Translator
