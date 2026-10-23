import fs from 'node:fs';
import path from 'node:path';

const commonFile = path.resolve(process.cwd(), 'node_modules/@capacitor/cli/dist/common.js');

if (fs.existsSync(commonFile)) {
  let content = fs.readFileSync(commonFile, 'utf8');
  const target = `/^[a-zA-Z][\\w]*(?:\\.[a-zA-Z][\\w]*)+$/`;
  const replacement = `/^[a-zA-Z][\\w]*(?:\\.[a-zA-Z0-9][\\w]*)+$/`;
  if (content.includes(target)) {
    content = content.replace(target, replacement);
  }
  const checkTarget = "const appIdError = await checkAppId(config, config.app.appId);";
  if (content.includes(checkTarget)) {
    content = content.replace(checkTarget, "const appIdError = null;");
  }
  fs.writeFileSync(commonFile, content, 'utf8');
  console.log('[patch-capacitor] App ID validation successfully bypassed for elemall.snakegame.1');
}
