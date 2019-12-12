
describe('image-manager', () => {
  it('getQuota', async () => {
    assert.hasAllKeys(await imageManager.getQuota(), ['total', 'used']);
  });

  it('upload + getItems / getItem + delete', async () => {
    assert.lengthOf(await imageManager.getItems(), 0);

    const uploadResult = await imageManager.upload('test/data/alice.png');
    assert.hasAllKeys(uploadResult, ['id', 'size', 'createdAt']);

    const items = await imageManager.getItems();
    assert.lengthOf(items, 1);
    assert.deepInclude(items[0], uploadResult);

    const item = await imageManager.getItem(uploadResult.id);
    assert.deepEqual(item, items[0]);

    await imageManager.delete(uploadResult.id);
    assert.lengthOf(await imageManager.getItems(), 0);
  });
});
