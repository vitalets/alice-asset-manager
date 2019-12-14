const pWaitFor = require('p-wait-for');

describe('sound-manager', () => {
  it('getQuota', async () => {
    assert.hasAllKeys(await soundManager.getQuota(), ['total', 'used']);
  });

  it('upload + getItems / getItem + delete', async () => {
    assert.lengthOf(await soundManager.getItems(), 0);

    const uploadResult = await soundManager.upload('test/data/alice.mp3');
    assert.containsAllKeys(uploadResult, ['id', 'originalName', 'createdAt', 'tts', 'url']);
    assert.equal(uploadResult.isProcessed, false);
    assert.equal(uploadResult.size, null);
    assert.equal(uploadResult.error, null);

    const items = await soundManager.getItems();
    assert.lengthOf(items, 1);
    assert.deepInclude(items[0], {
      id: uploadResult.id,
      createdAt: uploadResult.createdAt,
      originalName: uploadResult.originalName,
      tts: uploadResult.tts,
      url: uploadResult.url,
    });

    const item = await soundManager.getItem(uploadResult.id);
    assert.deepInclude(item, {
      id: uploadResult.id,
      createdAt: uploadResult.createdAt,
      originalName: uploadResult.originalName,
      tts: uploadResult.tts,
      url: uploadResult.url,
    });

    // ждем окончания обработки аудио
    await pWaitFor(async () => {
      const item = await soundManager.getItem(uploadResult.id);
      return item.isProcessed;
    }, {interval: 1000, timeout: 6 * 1000});

    await soundManager.delete(uploadResult.id);
    assert.lengthOf(await soundManager.getItems(), 0);
  });
});
