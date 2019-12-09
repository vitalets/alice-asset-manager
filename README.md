# alice-asset-manager

[![npm](https://img.shields.io/npm/v/alice-tester.svg)](https://www.npmjs.com/package/alice-tester)
[![license](https://img.shields.io/npm/l/alice-tester.svg)](https://www.npmjs.com/package/alice-tester)

Node.js API для загрузки изображений и звуков в навык Алисы.

Позволяет:
* загружать, просматривать, удалять изображения и звуки
* в режиме синхронизации загружать только измененные файлы
* удалять неиспользуемые файлы с сервера

## Содержание

<!-- toc -->

- [Установка](#%D1%83%D1%81%D1%82%D0%B0%D0%BD%D0%BE%D0%B2%D0%BA%D0%B0)
- [Работа с изображениями](#%D1%80%D0%B0%D0%B1%D0%BE%D1%82%D0%B0-%D1%81-%D0%B8%D0%B7%D0%BE%D0%B1%D1%80%D0%B0%D0%B6%D0%B5%D0%BD%D0%B8%D1%8F%D0%BC%D0%B8)
    + [Инициализация](#%D0%B8%D0%BD%D0%B8%D1%86%D0%B8%D0%B0%D0%BB%D0%B8%D0%B7%D0%B0%D1%86%D0%B8%D1%8F)
    + [Данные о занятом месте](#%D0%B4%D0%B0%D0%BD%D0%BD%D1%8B%D0%B5-%D0%BE-%D0%B7%D0%B0%D0%BD%D1%8F%D1%82%D0%BE%D0%BC-%D0%BC%D0%B5%D1%81%D1%82%D0%B5)
    + [Загрузить изображение из файла](#%D0%B7%D0%B0%D0%B3%D1%80%D1%83%D0%B7%D0%B8%D1%82%D1%8C-%D0%B8%D0%B7%D0%BE%D0%B1%D1%80%D0%B0%D0%B6%D0%B5%D0%BD%D0%B8%D0%B5-%D0%B8%D0%B7-%D1%84%D0%B0%D0%B9%D0%BB%D0%B0)
    + [Список всех изображений](#%D1%81%D0%BF%D0%B8%D1%81%D0%BE%D0%BA-%D0%B2%D1%81%D0%B5%D1%85-%D0%B8%D0%B7%D0%BE%D0%B1%D1%80%D0%B0%D0%B6%D0%B5%D0%BD%D0%B8%D0%B9)
    + [Данные об отдельном изображении](#%D0%B4%D0%B0%D0%BD%D0%BD%D1%8B%D0%B5-%D0%BE%D0%B1-%D0%BE%D1%82%D0%B4%D0%B5%D0%BB%D1%8C%D0%BD%D0%BE%D0%BC-%D0%B8%D0%B7%D0%BE%D0%B1%D1%80%D0%B0%D0%B6%D0%B5%D0%BD%D0%B8%D0%B8)
    + [Удалить изображение](#%D1%83%D0%B4%D0%B0%D0%BB%D0%B8%D1%82%D1%8C-%D0%B8%D0%B7%D0%BE%D0%B1%D1%80%D0%B0%D0%B6%D0%B5%D0%BD%D0%B8%D0%B5)
- [Работа со звуками](#%D1%80%D0%B0%D0%B1%D0%BE%D1%82%D0%B0-%D1%81%D0%BE-%D0%B7%D0%B2%D1%83%D0%BA%D0%B0%D0%BC%D0%B8)
    + [Инициализация](#%D0%B8%D0%BD%D0%B8%D1%86%D0%B8%D0%B0%D0%BB%D0%B8%D0%B7%D0%B0%D1%86%D0%B8%D1%8F-1)
    + [Данные о занятом месте](#%D0%B4%D0%B0%D0%BD%D0%BD%D1%8B%D0%B5-%D0%BE-%D0%B7%D0%B0%D0%BD%D1%8F%D1%82%D0%BE%D0%BC-%D0%BC%D0%B5%D1%81%D1%82%D0%B5-1)
    + [Загрузить звук из файла](#%D0%B7%D0%B0%D0%B3%D1%80%D1%83%D0%B7%D0%B8%D1%82%D1%8C-%D0%B7%D0%B2%D1%83%D0%BA-%D0%B8%D0%B7-%D1%84%D0%B0%D0%B9%D0%BB%D0%B0)
    + [Список всех звуков](#%D1%81%D0%BF%D0%B8%D1%81%D0%BE%D0%BA-%D0%B2%D1%81%D0%B5%D1%85-%D0%B7%D0%B2%D1%83%D0%BA%D0%BE%D0%B2)
    + [Данные об отдельном звуке](#%D0%B4%D0%B0%D0%BD%D0%BD%D1%8B%D0%B5-%D0%BE%D0%B1-%D0%BE%D1%82%D0%B4%D0%B5%D0%BB%D1%8C%D0%BD%D0%BE%D0%BC-%D0%B7%D0%B2%D1%83%D0%BA%D0%B5)
    + [Удалить звук](#%D1%83%D0%B4%D0%B0%D0%BB%D0%B8%D1%82%D1%8C-%D0%B7%D0%B2%D1%83%D0%BA)
- [Лицензия](#%D0%BB%D0%B8%D1%86%D0%B5%D0%BD%D0%B7%D0%B8%D1%8F)

<!-- tocstop -->

## Установка
```bash
npm i alice-asset-manager --save-dev
```

## Работа с изображениями
[Официальная документация](https://yandex.ru/dev/dialogs/alice/doc/resource-upload-docpage/#http-load).

#### Инициализация
```js
const { ImageManager } = require('alice-asset-manager');

const imageManager = new ImageManager({
  token: 'TOKEN',
  skillId: 'SKILL_ID',
});
```

#### Данные о занятом месте
```js
await imageManager.getQuota();
/*
{ 
  total: 104857600, 
  used: 379850 
}
*/
```

#### Загрузить изображение из файла
```js
await imageManager.upload('images/test.jpg');
/*
{ 
  id: '213044/aef2a365f198b4435611',
  size: 8596,
  createdAt: '2019-12-09T06:05:35.035Z' 
}
*/
```

#### Список всех изображений
```js
await imageManager.getItems();
/*
[ 
  { 
    id: '213044/aef2a365f198b4435611',
    origUrl: null,
    size: 8596,
    createdAt: '2019-12-09T06:05:35.035Z' 
  }
  ...
]
*/
```

#### Данные об отдельном изображении
```js
await imageManager.getItem('213044/aef2a365f198b4435611');
/*
{ 
  id: '213044/aef2a365f198b4435611',
  origUrl: null,
  size: 8596,
  createdAt: '2019-12-09T06:05:35.035Z' 
}
*/
```

#### Удалить изображение
```js
await imageManager.delete('213044/aef2a365f198b4435611');
```

## Работа со звуками
[Официальная документация](https://yandex.ru/dev/dialogs/alice/doc/resource-sounds-upload-docpage/#http-load).

#### Инициализация
```js
const { SoundManager } = require('alice-asset-manager');

const soundManager = new SoundManager({
  token: 'TOKEN',
  skillId: 'SKILL_ID',
});
```

#### Данные о занятом месте
```js
await soundManager.getQuota();
/*
{ 
  total: 104857600, 
  used: 379850 
}
*/
```

#### Загрузить звук из файла
```js
await soundManager.upload('images/test.mp3');
/*
{ 
  id: 'c72463ae-01b5-48a1-a7f2-e657e4594166',
  skillId: 'SKILL_ID',
  size: null,
  originalName: 'test.mp3',
  createdAt: '2019-12-09T06:13:49.595Z',
  isProcessed: false,
  error: null
}
*/
```

#### Список всех звуков
```js
await soundManager.getItems();
/*
[ 
  { 
    id: 'c72463ae-01b5-48a1-a7f2-e657e4594166',
    skillId: 'SKILL_ID',
    size: 24915,
    originalName: 'test.mp3',
    createdAt: '2019-12-09T06:19:48.317Z',
    isProcessed: true,
    error: null 
  }
  ...
]
*/
```

#### Данные об отдельном звуке
```js
await soundManager.getItem('213044/aef2a365f198b4435611');
/*
{ 
  id: 'c72463ae-01b5-48a1-a7f2-e657e4594166',
  skillId: 'SKILL_ID',
  size: 24915,
  originalName: 'test.mp3',
  createdAt: '2019-12-09T06:19:48.317Z',
  isProcessed: true,
  error: null 
}
*/
```

#### Удалить звук
```js
await soundManager.delete('213044/aef2a365f198b4435611');
```

## Лицензия
MIT @ [Vitaliy Potapov](https://github.com/vitalets)



