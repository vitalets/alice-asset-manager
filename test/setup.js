require('dotenv').config();
const chai = require('chai');
const sinon = require('sinon');
const assertRejects = require('assert').rejects;
const { ImageManager, SoundManager } = require('..');

chai.config.truncateThreshold = 0;
chai.assert.rejects = assertRejects;

const imageManager = new ImageManager({
  token: process.env.ALICE_TOKEN,
  skillId: process.env.SKILL_ID,
});

const soundManager = new SoundManager({
  token: process.env.ALICE_TOKEN,
  skillId: process.env.SKILL_ID,
});

Object.assign(global, {
  assert: chai.assert,
  sinon,
  imageManager,
  soundManager,
});

beforeEach(async () => {
  await Promise.all([
    deleteAllItems(imageManager),
    deleteAllItems(soundManager),
  ]);
});

afterEach(() => {
  sinon.restore();
});

async function deleteAllItems(manager) {
  const items = await manager.getItems();
  const tasks = items.map(async item => manager.delete(item.id));
  await Promise.all(tasks);
}
