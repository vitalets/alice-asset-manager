const fs = require('fs-extra');
const User = require('alice-tester');
const getPort = require('get-port');
const ms = require('ms');

describe('create-view-server', () => {

  // Смещает дату на заданное значение и возвращает в формате ISO
  const getCreatedAt = str => new Date(Date.now() + ms(str)).toISOString();
  let server;

  beforeEach(() => {
    fs.emptyDirSync('temp');
  });

  afterEach(async () => {
    if (server && server.listening) {
      await server.close();
    }
  });

  it('serve images without dbFile', async () => {
    sinon.stub(imageManager, 'getItems').resolves([
      {
        id: 'IMAGE_ID_A',
        origUrl: null,
        size: 2000,
        createdAt: getCreatedAt('-1d'),
      },
      {
        id: 'IMAGE_ID_B',
        origUrl: null,
        size: 5000,
        createdAt: getCreatedAt('-2h'),
      }
    ]);

    server = imageManager.createViewServer();
    await server.listen(await getPort());

    const user = new User(`http://localhost:${server.address().port}`);

    await user.enter();
    assert.deepEqual(user.response, {
      text: '~2 hours ago, 5Kb',
      tts: 'sil <[100]>',
      card: {
        type: 'BigImage',
        image_id: 'IMAGE_ID_B',
        title: 'текст',
        description: '~2 hours ago, 5Kb'
      },
      buttons: [
        { title: 'Дальше', hide: true }
      ],
      end_session: false
    });

    await user.say('Дальше');
    assert.deepEqual(user.response, {
      text: '~1 day ago, 2Kb',
      tts: 'sil <[100]>',
      card: {
        type: 'BigImage',
        image_id: 'IMAGE_ID_A',
        title: 'текст',
        description: '~1 day ago, 2Kb'
      },
      buttons: [
        { title: 'Дальше', hide: true }
      ],
      end_session: false
    });

    await user.say('Дальше');
    assert.equal(user.response.card.image_id, 'IMAGE_ID_B');
  });

  it('serve images with dbFile', async () => {
    sinon.stub(imageManager, 'getItems').resolves([
      {
        id: 'IMAGE_ID_A',
        origUrl: null,
        size: 2000,
        createdAt: getCreatedAt('-1d'),
      },
      {
        id: 'IMAGE_ID_B',
        origUrl: null,
        size: 5000,
        createdAt: getCreatedAt('-2h'),
      }
    ]);

    const dbFileData = {
      ids: {
        a: 'IMAGE_ID_A',
        b: 'IMAGE_ID_B',
      },
      meta: {
        a: {
          file: 'temp/alice[a].png',
          mtimeMs: 0,
        },
        b: {
          file: 'temp/phone[b].png',
          mtimeMs: 0,
        },
      }
    };
    fs.outputJsonSync('temp/images.json', dbFileData);

    server = imageManager.createViewServer({dbFile: 'temp/images.json'});
    await server.listen(await getPort());

    const user = new User(`http://localhost:${server.address().port}`);

    await user.enter();
    assert.deepEqual(user.response, {
      text: 'phone[b].png\n~2 hours ago, 5Kb',
      tts: 'sil <[100]>',
      card: {
        type: 'BigImage',
        image_id: 'IMAGE_ID_B',
        title: 'phone[b].png',
        description: '~2 hours ago, 5Kb'
      },
      buttons: [
        { title: 'Дальше', hide: true }
      ],
      end_session: false
    });

    await user.say('Дальше');
    assert.deepEqual(user.response, {
      text: 'alice[a].png\n~1 day ago, 2Kb',
      tts: 'sil <[100]>',
      card: {
        type: 'BigImage',
        image_id: 'IMAGE_ID_A',
        title: 'alice[a].png',
        description: '~1 day ago, 2Kb'
      },
      buttons: [
        { title: 'Дальше', hide: true }
      ],
      end_session: false
    });
  });

  it('serve empty images list', async () => {
    sinon.stub(imageManager, 'getItems').resolves([]);
    server = imageManager.createViewServer();
    await server.listen(await getPort());
    const user = new User(`http://localhost:${server.address().port}`);

    await user.enter();
    assert.deepEqual(user.response, {
      text: 'Нет ресурсов на сервере.',
      tts: 'sil <[100]>',
      end_session: false
    });
  });

  it('serve sounds with dbFile', async () => {
    sinon.stub(soundManager, 'getItems').resolves([
      {
        id: 'SOUND_ID_A',
        skillId: 'SKILL_ID',
        size: 2000,
        originalName: 'test[a].mp3',
        createdAt: getCreatedAt('-1d'),
        tts: soundManager.getTts('SOUND_ID_A'),
      },
      {
        id: 'SOUND_ID_B',
        skillId: 'SKILL_ID',
        size: 5000,
        originalName: 'test[b].mp3',
        createdAt: getCreatedAt('-2h'),
        tts: soundManager.getTts('SOUND_ID_B'),
      },
    ]);

    const dbFileData = {
      ids: {
        a: 'SOUND_ID_A',
        b: 'SOUND_ID_B',
      },
      meta: {
        a: {
          file: 'temp/test[a].png',
          mtimeMs: 0,
        },
        b: {
          file: 'temp/test[b].png',
          mtimeMs: 0,
        },
      }
    };
    fs.outputJsonSync('temp/sounds.json', dbFileData);

    server = soundManager.createViewServer({dbFile: 'temp/sounds.json'});
    await server.listen(await getPort());

    const user = new User(`http://localhost:${server.address().port}`);

    await user.enter();
    assert.deepEqual(user.response, {
      text: 'test[b].png\n~2 hours ago, 5Kb',
      tts: soundManager.getTts('SOUND_ID_B'),
      buttons: [
        { title: 'Дальше', hide: true }
      ],
      end_session: false
    });

    await user.say('Дальше');
    assert.deepEqual(user.response, {
      text: 'test[a].png\n~1 day ago, 2Kb',
      tts: soundManager.getTts('SOUND_ID_A'),
      buttons: [
        { title: 'Дальше', hide: true }
      ],
      end_session: false
    });
  });

});
