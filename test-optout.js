const fs = require('fs');
const path = require('path');

async function testOptOut() {
  const appData = process.env.APPDATA;
  const settingsFile = path.join(appData, 'staticghost', 'app-settings.json');
  fs.writeFileSync(settingsFile, JSON.stringify({ checkUpdatesOnStartup: false }, null, 2), 'utf8');
  console.log('Wrote checkUpdatesOnStartup: false to', settingsFile);

  const { spawn } = require('child_process');
  const exePath = 'C:\\Users\\olaba\\AppData\\Local\\Programs\\staticghost\\staticghost.exe';
  const child = spawn(exePath, ['--remote-debugging-port=9223'], { detached: true, stdio: 'ignore' });
  child.unref();

  console.log('Spawned app on port 9223. Waiting 3 seconds for load...');
  await new Promise(r => setTimeout(r, 3500));

  const res = await fetch('http://127.0.0.1:9223/json');
  const targets = await res.json();
  const pageTarget = targets.find(t => t.type === 'page');

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
      const evalRes = await send('Runtime.evaluate', {
        expression: `(() => {
          const banner = document.getElementById('update-notification-banner');
          const chk = document.getElementById('chk-update-startup');
          const msg = document.getElementById('update-status-msg');
          return {
            bannerDisplay: banner ? banner.style.display : null,
            bannerText: banner ? banner.textContent : null,
            chkStartup: chk ? chk.checked : null,
            msgText: msg ? msg.textContent : null
          };
        })()`,
        returnByValue: true
      });
      console.log('Opt-out DOM State:', JSON.stringify(evalRes.result.value, null, 2));

      // Capture screenshot
      const screenshot = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync('update-optout-screenshot.png', Buffer.from(screenshot.data, 'base64'));
      console.log('Saved update-optout-screenshot.png');

      ws.close();
      process.exit(0);
    } catch (e) {
      console.error(e);
      ws.close();
      process.exit(1);
    }
  };
}

testOptOut();
