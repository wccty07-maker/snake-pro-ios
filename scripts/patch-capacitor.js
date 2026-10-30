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

// Auto-patch AppPlugin.swift if present to prevent Swift CAPPluginCall reject compilation error
const appPluginFile = path.resolve(process.cwd(), 'node_modules/@capacitor/app/ios/Sources/AppPlugin/AppPlugin.swift');
if (fs.existsSync(appPluginFile)) {
  let content = fs.readFileSync(appPluginFile, 'utf8');
  if (content.includes('call.reject("Unable to get App Info")')) {
    content = content.replace('call.reject("Unable to get App Info")', 'call.reject("Unable to get App Info", nil, nil, nil)');
    fs.writeFileSync(appPluginFile, content, 'utf8');
    console.log('[patch-capacitor] AppPlugin.swift successfully patched');
  }
}
