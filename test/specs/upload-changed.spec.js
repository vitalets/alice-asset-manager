const fs = require('fs-extra');

describe('upload-changed', () => {

  beforeEach(() => {
    fs.emptyDirSync('temp');
  });

  it('initial upload images (dryRun)', async () => {
    fs.copySync('test/data/alice.png', 'temp/alice[a].png');
    fs.copySync('test/data/phone.png', 'temp/phone[b].png');

    const result = await imageManager.uploadChanged({
      pattern: 'temp/*.png',
      dbFile: 'temp/images.json',
      dryRun: true,
    });

    assert.lengthOf(await imageManager.getItems(), 0);
    assert.deepEqual(result, [
      {
        file: 'temp/alice[a].png',
        localId: 'a',
        mtimeMs: fs.statSync('temp/alice[a].png').mtimeMs,
        upload: 'new'
      },
      {
        file: 'temp/phone[b].png',
        localId: 'b',
        mtimeMs: fs.statSync('temp/phone[b].png').mtimeMs,
        upload: 'new'
      }
    ]);
  });

  it('initial upload images', async () => {
    fs.copySync('test/data/alice.png', 'temp/alice[a].png');
    fs.copySync('test/data/phone.png', 'temp/phone[b].png');

    const result = await imageManager.uploadChanged({
      pattern: 'temp/*.png',
      dbFile: 'temp/images.json',
    });

    const remoteItems = await imageManager.getItems();
    remoteItems.sort((a, b) => a.size - b.size);
    assert.lengthOf(remoteItems, 2);
    assert.deepEqual(result, [
      {
        file: 'temp/alice[a].png',
        localId: 'a',
        mtimeMs: fs.statSync('temp/alice[a].png').mtimeMs,
        upload: 'new',
        id: remoteItems[0].id,
      },
      {
        file: 'temp/phone[b].png',
        localId: 'b',
        mtimeMs: fs.statSync('temp/phone[b].png').mtimeMs,
        upload: 'new',
        id: remoteItems[1].id,
      }
    ]);

    const dbFileData = fs.readJsonSync('temp/images.json');
    assert.deepEqual(dbFileData, {
      ids: {
        a: remoteItems[0].id,
        b: remoteItems[1].id,
      },
      meta: {
        a: {
          file: 'temp/alice[a].png',
          url: `https://avatars.mds.yandex.net/get-dialogs-skill-card/${remoteItems[0].id}/orig`,
          mtimeMs: fs.statSync('temp/alice[a].png').mtimeMs,
        },
        b: {
          file: 'temp/phone[b].png',
          url: `https://avatars.mds.yandex.net/get-dialogs-skill-card/${remoteItems[1].id}/orig`,
          mtimeMs: fs.statSync('temp/phone[b].png').mtimeMs,
        },
      }
    });

    // вызываем uploadChanged еще раз с теми же параметрами - ничего загрузиться не должно
    // (заодно переименовываем 1 файл)
    fs.moveSync('temp/alice[a].png', 'temp/alice-[a].png');
    const result2 = await imageManager.uploadChanged({
      pattern: 'temp/*.png',
      dbFile: 'temp/images.json',
    });

    const remoteItems2 = await imageManager.getItems();
    remoteItems2.sort((a, b) => a.size - b.size);
    assert.deepEqual(remoteItems2, remoteItems);
    assert.deepEqual(result2, [
      {
        file: 'temp/alice-[a].png',
        localId: 'a',
        mtimeMs: fs.statSync('temp/alice-[a].png').mtimeMs,
        id: remoteItems[0].id,
      },
      {
        file: 'temp/phone[b].png',
        localId: 'b',
        mtimeMs: fs.statSync('temp/phone[b].png').mtimeMs,
        id: remoteItems[1].id,
      }
    ]);
    dbFileData.meta.a.file = 'temp/alice-[a].png';
    assert.deepEqual(fs.readJsonSync('temp/images.json'), dbFileData);
  });

  it('upload changed images: new file, mtime changed, removed from server', async () => {
    fs.copySync('test/data/alice.png', 'temp/alice[a].png');
    fs.copySync('test/data/phone.png', 'temp/phone[b].png');

    await imageManager.uploadChanged({
      pattern: 'temp/*.png',
      dbFile: 'temp/images.json',
    });

    const [itemA] = (await imageManager.getItems()).sort((a, b) => a.size - b.size);

    // добавляем новый файл "c"
    fs.copySync('test/data/tools.png', 'temp/tools[c].png');

    // удаляем на сервере файл "a"
    await imageManager.delete(itemA.id);

    // меняем файл "b"
    const dbFileData = fs.readJsonSync('temp/images.json');
    dbFileData.meta.b.mtimeMs += 1;
    fs.outputJsonSync('temp/images.json', dbFileData, {spaces: 2});

    // грузим еще раз
    const result2 = await imageManager.uploadChanged({
      pattern: 'temp/*.png',
      dbFile: 'temp/images.json',
    });

    const remoteItems = (await imageManager.getItems()).sort((a, b) => a.size - b.size);
    assert.lengthOf(await imageManager.getItems(), 4);
    assert.deepEqual(result2, [
      {
        file: 'temp/alice[a].png',
        localId: 'a',
        mtimeMs: fs.statSync('temp/alice[a].png').mtimeMs,
        upload: 'deleted_on_server',
        id: remoteItems[0].id,
      },
      {
        file: 'temp/phone[b].png',
        localId: 'b',
        mtimeMs: fs.statSync('temp/phone[b].png').mtimeMs,
        upload: 'changed',
        id: remoteItems[1].id,
      },
      {
        file: 'temp/tools[c].png',
        localId: 'c',
        mtimeMs: fs.statSync('temp/tools[c].png').mtimeMs,
        upload: 'new',
        id: remoteItems[3].id,
      }
    ]);
    const dbFileData2 = fs.readJsonSync('temp/images.json');
    assert.notEqual(dbFileData2.ids.a, dbFileData.ids.a);
    assert.notEqual(dbFileData2.ids.b, dbFileData.ids.b);
    assert.deepEqual(fs.readJsonSync('temp/images.json'), {
      ids: {
        a: remoteItems[0].id,
        b: remoteItems[1].id,
        // remoteItems[2] is previous version of phone[b].png
        c: remoteItems[3].id,
      },
      meta: {
        a: {
          file: 'temp/alice[a].png',
          url: `https://avatars.mds.yandex.net/get-dialogs-skill-card/${remoteItems[0].id}/orig`,
          mtimeMs: dbFileData.meta.a.mtimeMs,
        },
        b: {
          file: 'temp/phone[b].png',
          url: `https://avatars.mds.yandex.net/get-dialogs-skill-card/${remoteItems[1].id}/orig`,
          mtimeMs: fs.statSync('temp/phone[b].png').mtimeMs,
        },
        c: {
          file: 'temp/tools[c].png',
          url: `https://avatars.mds.yandex.net/get-dialogs-skill-card/${remoteItems[3].id}/orig`,
          mtimeMs: fs.statSync('temp/tools[c].png').mtimeMs,
        },
      }
    });
  });

  it('initial upload sounds', async () => {
    fs.copySync('test/data/alice.mp3', 'temp/alice[a].mp3');
    fs.copySync('test/data/phone.mp3', 'temp/phone[b].mp3');

    const result = await soundManager.uploadChanged({
      pattern: 'temp/*.mp3',
      dbFile: 'temp/sounds.json',
    });

    const remoteItems = await soundManager.getItems();
    // сортируем по originalName т.к. size=null пока не закончится обработка
    remoteItems.sort((a, b) => a.originalName.localeCompare(b.originalName));
    assert.lengthOf(remoteItems, 2);
    assert.deepEqual(result, [
      {
        file: 'temp/alice[a].mp3',
        localId: 'a',
        mtimeMs: fs.statSync('temp/alice[a].mp3').mtimeMs,
        upload: 'new',
        id: remoteItems[0].id,
      },
      {
        file: 'temp/phone[b].mp3',
        localId: 'b',
        mtimeMs: fs.statSync('temp/phone[b].mp3').mtimeMs,
        upload: 'new',
        id: remoteItems[1].id,
      }
    ]);

    const dbFileData = fs.readJsonSync('temp/sounds.json');
    assert.deepEqual(dbFileData, {
      ids: {
        a: remoteItems[0].id,
        b: remoteItems[1].id,
      },
      tts: {
        a: soundManager.getTts(remoteItems[0].id),
        b: soundManager.getTts(remoteItems[1].id),
      },
      meta: {
        a: {
          file: 'temp/alice[a].mp3',
          url: soundManager.getUrl(remoteItems[0].id),
          mtimeMs: fs.statSync('temp/alice[a].mp3').mtimeMs,
        },
        b: {
          file: 'temp/phone[b].mp3',
          url: soundManager.getUrl(remoteItems[1].id),
          mtimeMs: fs.statSync('temp/phone[b].mp3').mtimeMs,
        },
      }
    });

    // вызываем uploadChanged еще раз с теми же параметрами - ничего загрузиться не должно
    const result2 = await soundManager.uploadChanged({
      pattern: 'temp/*.mp3',
      dbFile: 'temp/sounds.json',
    });

    const remoteItems2 = await soundManager.getItems();
    remoteItems2.sort((a, b) => a.originalName.localeCompare(b.originalName));
    assert.lengthOf(remoteItems2, 2);
    assert.deepEqual(result2, [
      {
        file: 'temp/alice[a].mp3',
        localId: 'a',
        mtimeMs: fs.statSync('temp/alice[a].mp3').mtimeMs,
        id: remoteItems[0].id,
      },
      {
        file: 'temp/phone[b].mp3',
        localId: 'b',
        mtimeMs: fs.statSync('temp/phone[b].mp3').mtimeMs,
        id: remoteItems[1].id,
      }
    ]);
    assert.deepEqual(fs.readJsonSync('temp/sounds.json'), dbFileData);
  });

  it('duplicated localId', async () => {
    fs.copySync('test/data/alice.png', 'temp/alice[a].png');
    fs.copySync('test/data/alice.png', 'temp/alice[ a ].png');
    fs.copySync('test/data/alice.png', 'temp/alice-[a].png');
    const promise = imageManager.uploadChanged({
      pattern: 'temp/*.png',
      dbFile: 'temp/images.json',
      dryRun: true,
    });

    await assert.rejects(promise, e => {
      assert.equal(e.message.replace(/\s/g, ''),
        'ДубликатыlocalId:{"a":["temp/alice-[a].png","temp/alice[a].png","temp/alice[a].png"]}'
      );
      return true;
    });
  });

  it('no localId', async () => {
    fs.copySync('test/data/alice.png', 'temp/alice1.png');
    const promise = imageManager.uploadChanged({
      pattern: 'temp/*.png',
      dbFile: 'temp/images.json',
      dryRun: true,
    });

    await assert.rejects(promise, e => {
      assert.include(e.message, 'Пустой localId "null" для файла: temp/alice1.png');
      return true;
    });
  });

  it('empty localId', async () => {
    fs.copySync('test/data/alice.png', 'temp/alice[].png');
    const promise = imageManager.uploadChanged({
      pattern: 'temp/*.png',
      dbFile: 'temp/images.json',
      dryRun: true,
    });

    await assert.rejects(promise, e => {
      assert.include(e.message, 'Пустой localId "null" для файла: temp/alice[].png');
      return true;
    });
  });

  it('empty localId with spaces', async () => {
    fs.copySync('test/data/alice.png', 'temp/alice[ ].png');
    const promise = imageManager.uploadChanged({
      pattern: 'temp/*.png',
      dbFile: 'temp/images.json',
      dryRun: true,
    });

    await assert.rejects(promise, e => {
      assert.include(e.message, 'Пустой localId "" для файла: temp/alice[ ].png');
      return true;
    });
  });

  it('no dbFile provided', async () => {
    const promise = imageManager.uploadChanged({
      pattern: 'temp/*.png',
      dryRun: true,
    });

    await assert.rejects(promise, e => {
      assert.include(e.message, 'dbFile is required.');
      return true;
    });
  });

  it('upload images: transform', async () => {
    fs.copySync('test/data/alice.png', 'temp/alice[a].png');

    const transform = sinon.stub().resolvesArg(0);
    await imageManager.uploadChanged({
      pattern: 'temp/*.png',
      dbFile: 'temp/images.json',
      transform,
    });

    const remoteItems = await imageManager.getItems();
    assert.lengthOf(remoteItems, 1);

    sinon.assert.calledOnce(transform);
    assert.instanceOf(transform.getCall(0).args[0], Buffer);
    assert.equal(transform.getCall(0).args[1], 'temp/alice[a].png');
  });

});
