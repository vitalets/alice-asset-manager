const pWaitFor = require('p-wait-for');

describe('sound-manager', () => {
  it('getQuota', async () => {
    assert.hasAllKeys(await soundManager.getQuota(), ['total', 'used']);
  });

  it('upload + getItems / getItem + delete', async () => {
    assert.lengthOf(await soundManager.getItems(), 0);

    const uploadResult = await soundManager.upload('test/data/test.mp3');
    assert.containsAllKeys(uploadResult, ['id', 'originalName', 'createdAt']);
    assert.equal(uploadResult.isProcessed, false);
    assert.equal(uploadResult.size, null);
    assert.equal(uploadResult.error, null);

    const items = await soundManager.getItems();
    assert.lengthOf(items, 1);
    assert.deepInclude(items[0], {
      id: uploadResult.id,
      createdAt: uploadResult.createdAt,
      originalName: uploadResult.originalName,
    });

    const item = await soundManager.getItem(uploadResult.id);
    assert.deepInclude(item, {
      id: uploadResult.id,
      createdAt: uploadResult.createdAt,
      originalName: uploadResult.originalName,
    });

    // ждем окончания обработки аудио
    await pWaitFor(async () => {
      return (await soundManager.getItem(uploadResult.id)).isProcessed;
    }, {interval: 1000, timeout: 10 * 1000});

    await soundManager.delete(uploadResult.id);
    assert.lengthOf(await soundManager.getItems(), 0);
  });
});
