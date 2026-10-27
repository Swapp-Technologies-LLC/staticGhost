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
      console.log('Connected to CDP. Triggering check for updates button click...');
      await send('Runtime.evaluate', {
        expression: "document.getElementById('btn-check-updates').click()"
      });

      // Wait 3 seconds for update check to finish
      await new Promise(r => setTimeout(r, 3000));

      let evalRes = await send('Runtime.evaluate', {
        expression: `(() => {
          const banner = document.getElementById('update-notification-banner');
          const chk = document.getElementById('chk-update-startup');
          const msg = document.getElementById('update-status-msg');
          const btn = banner ? banner.querySelector('button') : null;
          return {
            bannerDisplay: banner ? banner.style.display : null,
            bannerText: banner ? banner.textContent : null,
            buttonText: btn ? btn.textContent : null,
            chkStartup: chk ? chk.checked : null,
            msgText: msg ? msg.textContent : null
          };
        })()`,
        returnByValue: true
      });
      console.log('DOM State After Check:', JSON.stringify(evalRes.result.value, null, 2));

      // Capture screenshot of the available banner
      const screenshot1 = await send('Page.captureScreenshot', { format: 'png' });
      const fs = require('fs');
      fs.writeFileSync('update-banner-available.png', Buffer.from(screenshot1.data, 'base64'));
      console.log('Saved update-banner-available.png');

      // Now click "Download" if banner is available
      if (evalRes.result.value.bannerDisplay !== 'none' && evalRes.result.value.buttonText === 'Download') {
        console.log('Clicking Download button...');
        await send('Runtime.evaluate', {
          expression: "document.getElementById('update-notification-banner').querySelector('button').click()"
        });

        // Monitor progress until downloaded
        for (let i = 0; i < 30; i++) {
          await new Promise(r => setTimeout(r, 1000));
          evalRes = await send('Runtime.evaluate', {
            expression: `(() => {
              const banner = document.getElementById('update-notification-banner');
              const btn = banner ? banner.querySelector('button') : null;
              return {
                bannerDisplay: banner ? banner.style.display : null,
                bannerText: banner ? banner.textContent : null,
                buttonText: btn ? btn.textContent : null
              };
            })()`,
            returnByValue: true
          });
          console.log(`Poll ${i+1}:`, evalRes.result.value.bannerText, `Button: ${evalRes.result.value.buttonText}`);
          if (evalRes.result.value.buttonText === 'Restart to install') {
            console.log('Update downloaded successfully!');
            const screenshot2 = await send('Page.captureScreenshot', { format: 'png' });
            fs.writeFileSync('update-banner-downloaded.png', Buffer.from(screenshot2.data, 'base64'));
            console.log('Saved update-banner-downloaded.png');
            break;
          }
        }
      }

      ws.close();
    } catch (e) {
      console.error(e);
      ws.close();
    }
  };
}

run();
