const fs = require('fs-extra');

describe('delete-unused', () => {

  beforeEach(() => {
    fs.emptyDirSync('temp');
  });

  it('delete-unused', async () => {
    fs.copySync('test/data/alice.png', 'temp/alice[a].png');
    fs.copySync('test/data/phone.png', 'temp/phone[b].png');

    await imageManager.uploadChanged({
      pattern: 'temp/*.png',
      dbFile: 'temp/images.json',
    });

    fs.removeSync('temp/phone[b].png');

    await imageManager.uploadChanged({
      pattern: 'temp/*.png',
      dbFile: 'temp/images.json',
    });

    const result = await imageManager.deleteUnused({
      dbFile: 'temp/images.json',
      dryRun: true,
    });

    const remoteItems = (await imageManager.getItems()).sort((a, b) => a.size - b.size);
    assert.lengthOf(remoteItems, 2);
    assert.deepEqual(result, {
      deleted: [
        `https://avatars.mds.yandex.net/get-dialogs-skill-card/${remoteItems[1].id}/orig`
      ],
      used: [ 'temp/alice[a].png' ]
    });

    const result2 = await imageManager.deleteUnused({
      dbFile: 'temp/images.json',
      dryRun: false,
    });

    const remoteItems2 = await imageManager.getItems();
    assert.lengthOf(remoteItems2, 1);
    assert.deepEqual(remoteItems2[0], remoteItems[0]);
    assert.deepEqual(result2, result);
  });

});
