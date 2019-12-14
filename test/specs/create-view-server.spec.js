const fs = require('fs-extra');
const User = require('alice-tester');
const getPort = require('get-port');

describe('create-view-server', () => {

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
        createdAt: '2019-12-09T06:04:35.035Z',
      },
      {
        id: 'IMAGE_ID_B',
        origUrl: null,
        size: 5000,
        createdAt: '2019-12-09T06:05:35.035Z',
      }
    ]);

    server = imageManager.createViewServer();
    await server.listen(await getPort());

    const user = new User(`http://localhost:${server.address().port}`);

    await user.enter();
    assert.deepEqual(user.response, {
      text: '',
      card: {
        type: 'BigImage',
        image_id: 'IMAGE_ID_B',
        title: '',
        description: '(~3 минуты назад, 5Kb)'
      },
      buttons: [
        { title: 'Дальше' }
      ],
      end_session: false
    });

    await user.say('Дальше');
    assert.deepEqual(user.response, {
      text: '',
      card: {
        type: 'BigImage',
        image_id: 'IMAGE_ID_A',
        title: '',
        description: '(~3 минуты назад, 2Kb)'
      },
      buttons: [
        { title: 'Дальше' }
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
        createdAt: '2019-12-09T06:05:34.035Z',
      },
      {
        id: 'IMAGE_ID_B',
        origUrl: null,
        size: 5000,
        createdAt: '2019-12-09T06:05:35.035Z',
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
      text: '',
      card: {
        type: 'BigImage',
        image_id: 'IMAGE_ID_B',
        title: 'b',
        description: 'phone[b].png (~3 минуты назад, 5Kb)'
      },
      buttons: [
        { title: 'Дальше' }
      ],
      end_session: false
    });

    await user.say('Дальше');
    assert.deepEqual(user.response, {
      text: '',
      card: {
        type: 'BigImage',
        image_id: 'IMAGE_ID_A',
        title: 'a',
        description: 'alice[a].png (~3 минуты назад, 2Kb)'
      },
      buttons: [
        { title: 'Дальше' }
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
      text: 'Не ресурсов на сервере.',
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
        createdAt: '2019-11-09T06:19:48.317Z',
        tts: soundManager.getTts('SOUND_ID_A'),
      },
      {
        id: 'SOUND_ID_B',
        skillId: 'SKILL_ID',
        size: 5000,
        originalName: 'test[b].mp3',
        createdAt: '2019-12-09T06:19:48.317Z',
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
      text: 'b\ntest[b].png (~3 минуты назад, 5Kb)',
      tts: soundManager.getTts('SOUND_ID_B'),
      buttons: [
        { title: 'Дальше' }
      ],
      end_session: false
    });

    await user.say('Дальше');
    assert.deepEqual(user.response, {
      text: 'a\ntest[a].png (~3 минуты назад, 2Kb)',
      tts: soundManager.getTts('SOUND_ID_A'),
      buttons: [
        { title: 'Дальше' }
      ],
      end_session: false
    });
  });

});
