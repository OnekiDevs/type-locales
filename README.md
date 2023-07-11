# Type Locales

A simple tool for typing your locales

Just move to the folder where your premises are located
```
.
├── locales
│   ├── en.json
│   └── es.json
└── src
    └── ...
```
```sh
cd locales
```

And run the tool
```sh
npx type-locales
```

will generate a local.ts file with the keys that you can use on your i18n
```
.
├── locales
│   ├── en.json
│   └── es.json
└── src
    └── ...
```

An example
```js
import { keys } from '../locales/locales'
import i18n from 'i18n'

console.log(i18n.__(keys.say.hello))
```