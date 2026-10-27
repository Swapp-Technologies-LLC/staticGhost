async function run() {
  const res = await fetch('http://127.0.0.1:9222/json');
  const targets = await res.json();
  const pageTarget = targets.find(t => t.type === 'page');
  if (!pageTarget) {
    console.error('No page target found');
    process.exit(1);
  }

  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  let id = 1;

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const msgId = id++;
      const handler = (event) => {
        const data = JSON.parse(event.data);
        if (data.id === msgId) {
          ws.removeEventListener('message', handler);
          if (data.error) reject(data.error);
          else resolve(data.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  ws.onopen = async () => {
    try {
      console.log('Connected to CDP. Triggering Restart to install button click...');
      await send('Runtime.evaluate', {
        expression: "document.getElementById('update-notification-banner').querySelector('button').click()"
      });
      console.log('Clicked Restart to install. Waiting for app to quit and update...');
      ws.close();
    } catch (e) {
      console.error(e);
      ws.close();
    }
  };
}

run();
