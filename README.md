# Type Locales

A simple tool for typing your locales and a util for easy manage of i18n with typescript

If you have the following structure

```
.
├── locales
│   ├── en.json
│   └── es.json
└── src
│   └── ...
└── package.json
```

Just run the tool

```sh
npx type-locales ./locales
```

and it will generate a locales keys that you can use on your i18n with intelisence autocomplete importing them from `type-locales` module like

```
import { localeKeys } from 'type-locales'
```

## An example using i18n vanilla

```ts
// src/index.ts
import { localeKeys } from 'type-locales'
import i18n from 'i18n'

i18n.configure({...})

console.log(
    i18n.__mf({
        locale: 'en',
        phrase: localeKeys.say.hello
    }, {
        to: 'Jonh Doe'
    })
)
```

An example using type-locales utils

```ts
// src/index.ts
import { Translator, localeKeys } from 'type-locales'
import i18n from 'i18n'

i18n.configure({...})

const translate = Translator('en')
console.log(
    translate(keys.say.hello, {
        to: 'Jonh Doe'
    })
)
```

## Why?

i18n is a wonderful tool, but it has a problem, the phrases to translate are handled in external and static files, which makes it easy to do many things except the DX when trying to remember the keys and their parameters to replace. This tool checks all your json files and generates a typed object which you can import to use the autocomplete so you don't have to remember and check the translation files.

## The cli

The biggest magic of this tool is in its cli, which is where you can generate the code needed to have the wonderful type autocompletion.

You can use `npx type-locals --help` to see the help

```sh
Usage: type-locales [path] [options]

Arguments:
  path                   path to translate

Options:
  -V, --version          output the version number
  -w --watch             watch for changes in the input directory (default: false)
  -q, --quiet            quiet mode (default: false)
  -h, --help             display help for command
```

Even without using the keys you can have autocomplete if you use the module utility after running cli

```ts
// src/index.ts
import Translator from 'type-locales'
import i18n from 'i18n'

i18n.configure({...})

const translate = Translator('en')
console.log( // has autocomplete without keys
    translate('say.hello', {
        to: 'Jonh Doe'
    })
)
```
