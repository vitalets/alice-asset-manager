const fs = require('fs-extra');

describe('upload-changed', () => {

  beforeEach(() => {
    fs.emptyDirSync('temp');
  });

  it('dryRun', async () => {
    fs.copySync('test/data/alice.png', 'temp/alice[a].png');
    fs.copySync('test/data/phone.png', 'temp/phone[b].png');

    const result = await imageManager.uploadChanged({
      pattern: 'temp/*.png',
      dbFile: 'temp/images.json',
      dryRun: true,
    });

    assert.lengthOf(await imageManager.getItems(), 0);
    assert.deepEqual(result, {
      uploaded: [
        'temp/alice[a].png',
        'temp/phone[b].png'
      ],
      skipped: [],
    });
  });

  it('upload + create dbFile', async () => {
    fs.copySync('test/data/alice.png', 'temp/alice[a].png');
    fs.copySync('test/data/phone.png', 'temp/phone[b].png');

    const result = await imageManager.uploadChanged({
      pattern: 'temp/*.png',
      dbFile: 'temp/images.json',
    });

    const remoteItems = (await imageManager.getItems()).sort((a, b) => a.size - b.size);
    assert.lengthOf(remoteItems, 2);
    assert.deepEqual(result, {
      uploaded: [ 'temp/alice[a].png', 'temp/phone[b].png' ],
      skipped: [],
    });

    const dbFileData = fs.readJsonSync('temp/images.json');
    assert.deepEqual(dbFileData, {
      ids: {
        a: remoteItems[0].id,
        b: remoteItems[1].id,
      },
      meta: {
        a: {
          file: 'temp/alice[a].png',
          mtimeMs: fs.statSync('temp/alice[a].png').mtimeMs,
        },
        b: {
          file: 'temp/phone[b].png',
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

    const remoteItems2 = (await imageManager.getItems()).sort((a, b) => a.size - b.size);
    assert.deepEqual(remoteItems2, remoteItems);
    assert.deepEqual(result2, {
      uploaded: [],
      skipped: [ 'temp/alice-[a].png', 'temp/phone[b].png'],
    });
    dbFileData.meta.a.file = 'temp/alice-[a].png';
    assert.deepEqual(fs.readJsonSync('temp/images.json'), dbFileData);
  });

  it('upload changes: new file, mtime changed, removed from server', async () => {
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

    assert.deepEqual(result2, {
      uploaded: [ 'temp/alice[a].png', 'temp/phone[b].png', 'temp/tools[c].png' ],
      skipped: []
    });
    const remoteItems = (await imageManager.getItems()).sort((a, b) => a.size - b.size);
    assert.lengthOf(await imageManager.getItems(), 4);
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
          mtimeMs: dbFileData.meta.a.mtimeMs,
        },
        b: {
          file: 'temp/phone[b].png',
          mtimeMs: fs.statSync('temp/phone[b].png').mtimeMs,
        },
        c: {
          file: 'temp/tools[c].png',
          mtimeMs: fs.statSync('temp/tools[c].png').mtimeMs,
        },
      }
    });
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
      assert.include(e.message, 'getLocalId() вернула "null" для файла: temp/alice1.png');
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
      assert.include(e.message, 'getLocalId() вернула "null" для файла: temp/alice[].png');
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
      assert.include(e.message, 'getLocalId() вернула "" для файла: temp/alice[ ].png');
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
