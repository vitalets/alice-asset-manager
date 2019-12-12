const fs = require('fs-extra');

describe('upload-changed', () => {

  beforeEach(() => {
    fs.emptyDirSync('temp');
  });

  it('no dbFile, dryRun', async () => {
    fs.copySync('test/data/test.png', 'temp/test[a].png');
    fs.copySync('test/data/test.png', 'temp/test[b].png');

    const result = await imageManager.uploadChanged({
      pattern: 'temp/*.png',
      dbFile: 'temp/images.json',
      dryRun: true,
    });

    assert.deepEqual(result, [
      {
        file: 'temp/test[a].png',
        localId: 'a',
        mtimeMs: fs.statSync('temp/test[a].png').mtimeMs,
        upload: true,
      },
      {
        file: 'temp/test[b].png',
        localId: 'b',
        mtimeMs: fs.statSync('temp/test[b].png').mtimeMs,
        upload: true,
      }
    ]);
  });

  it('upload + create dbFile', async () => {
    fs.copySync('test/data/test.png', 'temp/test[a].png');
    fs.copySync('test/data/test.png', 'temp/test[b].png');

    const result = await imageManager.uploadChanged({
      pattern: 'temp/*.png',
      dbFile: 'temp/images.json',
    });

    const remoteItems = await imageManager.getItems();
    const remoteItemA = remoteItems.find(item => item.id === result[0].id);
    const remoteItemB = remoteItems.find(item => item.id === result[1].id);
    assert.lengthOf(remoteItems, 2);
    assert.deepEqual(result, [
      {
        file: 'temp/test[a].png',
        localId: 'a',
        id: remoteItemA.id,
        mtimeMs: fs.statSync('temp/test[a].png').mtimeMs,
        upload: true,
      },
      {
        file: 'temp/test[b].png',
        localId: 'b',
        id: remoteItemB.id,
        mtimeMs: fs.statSync('temp/test[b].png').mtimeMs,
        upload: true,
      }
    ]);

    const dbFileData = fs.readJsonSync('temp/images.json');
    assert.deepEqual(dbFileData, {
      ids: {
        a: remoteItemA.id,
        b: remoteItemB.id,
      },
      meta: {
        a: {
          file: 'temp/test[a].png',
          mtimeMs: result[0].mtimeMs,
        },
        b: {
          file: 'temp/test[b].png',
          mtimeMs: result[1].mtimeMs,
        },
      }
    });

    // вызываем uploadChanged еще раз с теми же параметрами - ничего загрузиться не должно
    // (заодно переименовываем 1 файл)
    fs.moveSync('temp/test[a].png', 'temp/test-[a].png');
    const result2 = await imageManager.uploadChanged({
      pattern: 'temp/*.png',
      dbFile: 'temp/images.json',
    });

    const remoteItems2 = await imageManager.getItems();
    assert.deepEqual(remoteItems2, remoteItems);
    assert.deepEqual(result2, [
      {
        file: 'temp/test-[a].png',
        localId: 'a',
        id: remoteItemA.id,
        mtimeMs: result[0].mtimeMs,
      },
      {
        file: 'temp/test[b].png',
        localId: 'b',
        id: remoteItemB.id,
        mtimeMs: result[1].mtimeMs,
      }
    ]);
    dbFileData.meta.a.file = 'temp/test-[a].png';
    assert.deepEqual(fs.readJsonSync('temp/images.json'), dbFileData);
  });

  it('upload changes: new file, mtime changed, removed from server', async () => {
    fs.copySync('test/data/test.png', 'temp/test[a].png');
    fs.copySync('test/data/test.png', 'temp/test[b].png');

    const result = await imageManager.uploadChanged({
      pattern: 'temp/*.png',
      dbFile: 'temp/images.json',
    });

    const remoteItems = await imageManager.getItems();
    const remoteItemA = remoteItems.find(item => item.id === result[0].id);

    // добавляем новый файл "c"
    fs.copySync('test/data/test.png', 'temp/test[c].png');

    // удаляем на сервере файла "a"
    await imageManager.delete(remoteItemA.id);

    // меняем файл "b"
    const dbFileData = fs.readJsonSync('temp/images.json');
    dbFileData.meta.b.mtimeMs += 1;
    fs.outputJsonSync('temp/images.json', dbFileData, {spaces: 2});

    // грузим еще раз
    const result2 = await imageManager.uploadChanged({
      pattern: 'temp/*.png',
      dbFile: 'temp/images.json',
    });

    assert.lengthOf(result2, 3);
    assert.lengthOf(await imageManager.getItems(), 4);
    assert.notEqual(result2[0].id, result[0].id);
    assert.notEqual(result2[1].id, result[1].id);
    assert.deepEqual(fs.readJsonSync('temp/images.json'), {
      ids: {
        a: result2[0].id,
        b: result2[1].id,
        c: result2[2].id,
      },
      meta: {
        a: {
          file: 'temp/test[a].png',
          mtimeMs: dbFileData.meta.a.mtimeMs,
        },
        b: {
          file: 'temp/test[b].png',
          mtimeMs: fs.statSync('temp/test[b].png').mtimeMs,
        },
        c: {
          file: 'temp/test[c].png',
          mtimeMs: fs.statSync('temp/test[c].png').mtimeMs,
        },
      }
    });
  });

  it('duplicated localId', async () => {
    fs.copySync('test/data/test.png', 'temp/test[a].png');
    fs.copySync('test/data/test.png', 'temp/test[ a ].png');
    fs.copySync('test/data/test.png', 'temp/test-[a].png');
    const promise = imageManager.uploadChanged({
      pattern: 'temp/*.png',
      dbFile: 'temp/images.json',
      dryRun: true,
    });

    await assert.rejects(promise, e => {
      assert.equal(e.message.replace(/\s/g, ''),
        'ДубликатыlocalId:{"a":["temp/test-[a].png","temp/test[a].png","temp/test[a].png"]}'
      );
      return true;
    });
  });

  it('no localId', async () => {
    fs.copySync('test/data/test.png', 'temp/test1.png');
    const promise = imageManager.uploadChanged({
      pattern: 'temp/*.png',
      dbFile: 'temp/images.json',
      dryRun: true,
    });

    await assert.rejects(promise, e => {
      assert.include(e.message, 'getLocalId() вернула "null" для файла: temp/test1.png');
      return true;
    });
  });

  it('empty localId', async () => {
    fs.copySync('test/data/test.png', 'temp/test[].png');
    const promise = imageManager.uploadChanged({
      pattern: 'temp/*.png',
      dbFile: 'temp/images.json',
      dryRun: true,
    });

    await assert.rejects(promise, e => {
      assert.include(e.message, 'getLocalId() вернула "null" для файла: temp/test[].png');
      return true;
    });
  });

  it('empty localId with spaces', async () => {
    fs.copySync('test/data/test.png', 'temp/test[ ].png');
    const promise = imageManager.uploadChanged({
      pattern: 'temp/*.png',
      dbFile: 'temp/images.json',
      dryRun: true,
    });

    await assert.rejects(promise, e => {
      assert.include(e.message, 'getLocalId() вернула "" для файла: temp/test[ ].png');
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
});
