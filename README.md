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
- [Изображения](#%D0%B8%D0%B7%D0%BE%D0%B1%D1%80%D0%B0%D0%B6%D0%B5%D0%BD%D0%B8%D1%8F)
    + [new ImageManager()](#new-imagemanager)
    + [.getQuota()](#getquota)
    + [.upload()](#upload)
    + [.getItems()](#getitems)
    + [.getItem()](#getitem)
    + [.getUrl()](#geturl)
    + [.delete()](#delete)
    + [.uploadChanged()](#uploadchanged)
    + [.deleteUnused()](#deleteunused)
- [Звуки](#%D0%B7%D0%B2%D1%83%D0%BA%D0%B8)
    + [Инициализация](#%D0%B8%D0%BD%D0%B8%D1%86%D0%B8%D0%B0%D0%BB%D0%B8%D0%B7%D0%B0%D1%86%D0%B8%D1%8F)
    + [Данные о занятом месте](#%D0%B4%D0%B0%D0%BD%D0%BD%D1%8B%D0%B5-%D0%BE-%D0%B7%D0%B0%D0%BD%D1%8F%D1%82%D0%BE%D0%BC-%D0%BC%D0%B5%D1%81%D1%82%D0%B5)
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

## Изображения

#### new ImageManager()
Создает инстанс менеджера изображений.

Параметры:
```js
  /**
   * @param {string} token OAuth-токен
   * @param {string} skillId идентификатор навыка
   */
```
Как получить `token` и `skillId` - описано в [документации](https://yandex.ru/dev/dialogs/alice/doc/resource-upload-docpage/#http-load).

Пример:
```js
const { ImageManager } = require('alice-asset-manager');

const imageManager = new ImageManager({
  token: 'TOKEN',
  skillId: 'SKILL_ID',
});
```

#### .getQuota()
Получить данные о занятом месте.
```js
await imageManager.getQuota();
/*
{
  total: 104857600,
  used: 379850
}
*/
```

#### .upload()
Загрузить изображение из файла.

Параметры:
```js
  /**
   * @param {string} filePath путь до файла
   * @returns {Promise}
   */
```

Пример:
```js
await imageManager.upload('images/test.jpg');
/*
{
  id: '213044/aef2a365f198b4435611',
  size: 8596,
  createdAt: '2019-12-09T06:05:35.035Z',
  url: 'https://avatars.mds.yandex.net/get-dialogs-skill-card/213044/aef2a365f198b4435611/orig'
}
*/
```

#### .getItems()
Получить список всех изображений на сервере.
```js
await imageManager.getItems();
/*
[
  {
    id: '213044/aef2a365f198b4435611',
    origUrl: null,
    size: 8596,
    createdAt: '2019-12-09T06:05:35.035Z',
    url: 'https://avatars.mds.yandex.net/get-dialogs-skill-card/213044/aef2a365f198b4435611/orig'
  }
  ...
]
*/
```

#### .getItem()
Получить данные об отдельном изображении.

Параметры:
```js
  /**
   * @param {string} imageId
   * @returns {Promise}
   */
```

Пример:
```js
await imageManager.getItem('213044/aef2a365f198b4435611');
/*
{
  id: '213044/aef2a365f198b4435611',
  origUrl: null,
  size: 8596,
  createdAt: '2019-12-09T06:05:35.035Z',
  url: 'https://avatars.mds.yandex.net/get-dialogs-skill-card/213044/aef2a365f198b4435611/orig'
}
*/
```

#### .getUrl()
Получить ссылку на изображение.

Параметры:
```js
  /**
   * @param {string} imageId
   * @returns {string}
   */
```

Пример:
```js
imageManager.getUrl('213044/aef2a365f198b4435611');
/*
'https://avatars.mds.yandex.net/get-dialogs-skill-card/213044/aef2a365f198b4435611/orig'
*/
```

#### .delete()
Удалить изображение с сервера.

Параметры:
```js
  /**
   * @param {string} imageId
   * @returns {Promise}
   */
```

Пример:
```js
await imageManager.delete('213044/aef2a365f198b4435611');
```

#### .uploadChanged()
Загрузить новые и измененные изображения на сервер.

Параметры:
```js
  /**
   * @param {string} pattern путь/паттерн до папки с изображениями
   * @param {string} dbFile путь до файла с данными о загрузках
   * @param {function} [getLocalId] функция вычисления localId по имени файла
   * @param {boolean} [dryRun=false] запуск без зфактической загрузки файлов
   * @returns {Promise}
   */
```

**Как это работает:**

При каждом вызове `uploadChanged()` сохраняет результаты загрузки во вспомогательный файл
и при последующих вызовах использует сохраненную информацию, чтобы определить файлы для загрузки.

Чтобы избежать повторной загрузки файла при переименовании,
для каждого файла вычисляется `localId` - уникальный идентификатор,
который должен сохраняться при переименовании.
По умолчанию `localId` ищется в квадратных скобках `[]` в имени файла:
```
image[foo].png -> foo
```

**Пример:**

В папке `images` лежат два изображения `my_image_1[alice].png` и `my_image_2[bob].png`.

Их `localId` следующие:
```
my_image_1[alice].png -> alice
my_image_2[bob].png -> bob
```

Запускаем первую зарузку - на сервер загрузятся оба файла:
```js
await imageManager.uploadChanged({
  pattern: 'images/*.png', // путь/паттерн до папки с изображениями
  dbFile: 'images.json',   // путь до файла с данными о загрузках (изначально файла нет)
});
/*
{
  uploaded: [ 'images/my_image_1[alice].png', 'images/my_image_2[bob].png' ],
  skipped: []
}
*/
```

В `images.json` запишется примерно следующее:
```json
{
  "ids": {
    "alice": "213044/aef2a365f198b4435611",
    "bob": "834732/sdg3s44fjh234524j2h4"
  },
  "meta": {
    "alice": {
      "file": "images/my_image_1[alice].png",
      "url": "https://avatars.mds.yandex.net/get-dialogs-skill-card/213044/aef2a365f198b4435611/orig",
      "mtimeMs": 1576249136829.0754
    },
    "bob": {
      "file": "images/my_image_2[bob].png",
      "url": "https://avatars.mds.yandex.net/get-dialogs-skill-card/834732/sdg3s44fjh234524j2h4/orig",
      "mtimeMs": 1576249136830.0842
    }
  }
}
```

Файл `images.json` удобно использовать в коде вашего навыка, вставляя изображения по их `localId`.
Главный плюс в том, что при изменении изображения и получении нового `image_id` на сервере,
в коде навыка ничего менять не нужно - новый `image_id` подтянется автоматически:
```js
const images = require('./images.json').ids;
// ...
response.card.image_id = images.alice;
```

Если повторно вызвать `uploadChanged()`, то загрузок не произойдет, т.к. файлы не изменились:
```js
await imageManager.uploadChanged({
  pattern: 'images/*.png',
  dbFile: 'images.json',
});
/*
{
  uploaded: [],
  skipped: [ 'images/my_image_1[alice].png', 'images/my_image_2[bob].png' ]
}
*/
```

Если изменить в фоторедакторе один из файлов (например `my_image_1[alice].png`),
то при вызове `uploadChanged()` загрузится только этот измененный файл:
```js
await imageManager.uploadChanged({
  pattern: 'images/*.png',
  dbFile: 'images.json',
});
/*
{
  uploaded: [ 'images/my_image_1[alice].png' ],
  skipped: [ 'images/my_image_2[bob].png' ]
}
*/
```
Информация в `images.json` также обновится. А в коде навыка автоматически будет использоваться новый `image_id`:
```js
const images = require('./images.json').ids;
// ...
response.card.image_id = images.alice;
```

#### .deleteUnused()
Удалить неиспользуемые изображения с сервера.

Параметры:
```js
  /**
   * @param {string} dbFile путь до файла с данными о загрузках, созданный методом uploadChanged()
   * @param {boolean} [dryRun=false] запуск без фактического удаления изображений
   * @returns {Promise}
   */
```

Работает только в связке с `.uploadChanged()`.
При многократных вызовах `.uploadChanged()` на сервере накапливаются неиспользуемые файлы.
Их нужно периодически удалять, чтобы освободить место.
Метод `.deleteUnused()` сравнивает то, что записано в `dbFile` с тем что на сервере, и удаляет с сервера лишнее.

**Пример:**

В навыке используются два изображения `my_image_1[alice].png` и `my_image_2[bob].png`.
Они были загружены на сервер через `.uploadChanged()` и информация сохранена в `dbFile: 'images.json'`.

В новой версии навыка файл `my_image_1[alice].png` не используется и был удален.
После вызова `.uploadChanged()` в `images.json` останется только запись про второй файл `images/my_image_2[bob].png`:
```json
{
  "ids": {
    "bob": "834732/sdg3s44fjh234524j2h4"
  },
  "meta": {
    "bob": {
      "file": "images/my_image_2[bob].png",
      "url": "https://avatars.mds.yandex.net/get-dialogs-skill-card/834732/sdg3s44fjh234524j2h4/orig",
      "mtimeMs": 1576249136830.0842
    }
  }
}
```
Но на сервере все еще лежат два файла.
Это нужно для того, чтобы текущая версия навыка продолжала нормально работать.
Когда новая версия навыка выкатится, запись про `my_image_1[alice].png` можно удалить с сервера:
```js
await imageManager.deleteUnused({
  dbFile: 'images.json',
});
/*
{
  deleted: [ '213044/aef2a365f198b4435611' ],
  used: [ 'images/my_image_2[bob].png' ]
}
*/
```
Чтобы предварительно посмотреть, какие изображения будут удалены с сервера - можно вызвать метод
с параметром `dryRun: true`:
```js
await imageManager.deleteUnused({
  dbFile: 'images.json',
  dryRun: true
});
```

## Звуки
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



