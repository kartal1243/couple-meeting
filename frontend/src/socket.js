import io from 'socket.io-client';
import { BACKEND_URL } from './constants';

const socket = io(BACKEND_URL, {
  transports: ['polling', 'websocket'],
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000
});

export { socket };
