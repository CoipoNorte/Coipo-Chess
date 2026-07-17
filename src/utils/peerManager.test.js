import test from 'node:test';
import assert from 'node:assert/strict';
import PeerManager from './peerManager.js';

test('mantiene todos los handlers de datos registrados', () => {
  const pm = new PeerManager();
  const calls = [];

  pm.onData((data) => calls.push(`first:${data.type}`));
  pm.onData((data) => calls.push(`second:${data.type}`));

  const conn = {
    open: true,
    on: () => {},
    send: () => {},
    close: () => {},
  };

  pm._handleConnection(conn);
  pm._triggerData({ type: 'MOVE' });

  assert.deepStrictEqual(calls, ['first:MOVE', 'second:MOVE']);
});
