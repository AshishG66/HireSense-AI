import net from 'net';

const host = 'ep-twilight-pond-ahklppqd.c-3.us-east-1.aws.neon.tech';
const port = 5432;

console.log(`Connecting to ${host}:${port}...`);
const socket = net.connect(port, host, () => {
  console.log('Successfully connected to host!');
  socket.end();
});

socket.on('error', (err) => {
  console.error('Connection failed:', err);
});
