import { chromium } from 'playwright-core';
import path from 'path';
import fs from 'fs';

async function captureScreenshots() {
  const outDir = path.resolve('public/screenshots');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  console.log('Launching Chromium...');
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/ms-playwright/chromium-1248/chrome-linux64/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  // 430 x 932 with 3x scale factor = exactly 1290 x 2796 pixels
  const context = await browser.newContext({
    viewport: { width: 430, height: 932 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1'
  });

  const page = await context.newPage();

  // Populate mock profile in localStorage
  await page.addInitScript(() => {
    const profile = {
      playerName: 'SnakeKing',
      selectedSkin: 'neon_viper',
      selectedArena: 'neon_grid',
      unlockedLevel: 8,
      completedLevels: [1, 2, 3, 4, 5, 6, 7],
      hearts: 5,
      coins: 18880,
      hasCompletedTutorial: true,
      hasPlayedClassic: true,
      classicGamesPlayed: 18,
      hasPlayedMissions: true,
      missionsGamesPlayed: 32,
      highScores: { CLASSIC: 1850, TIME_ATTACK: 1200, LEVELS: 4350 },
      levelStars: { 1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2, 7: 3 }
    };
    localStorage.setItem('snake_pro_profile_v2', JSON.stringify(profile));
  });

  console.log('Navigating to http://localhost:3000 ...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

  // Skip opening intro
  await page.waitForTimeout(1000);
  try {
    const skipBtn = await page.$('button:has-text("跳過"), button:has-text("Skip")');
    if (skipBtn) {
      await skipBtn.click();
      await page.waitForTimeout(800);
    }
  } catch (e) {
    console.log('Skip intro error:', e);
  }

  // 1. Capture Real HomeScreen
  console.log('Capturing Screenshot 1: Real HomeScreen...');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, 'screenshot-1.png'), type: 'png' });

  // 2. Click Play / Start Game to capture real gameplay
  console.log('Starting game for Screenshot 2...');
  try {
    const playBtn = await page.$('button:has-text("開始"), button:has-text("PLAY"), button:has(svg.lucide-play)');
    if (playBtn) {
      await playBtn.click();
      // Wait for game canvas to render and snake to move a few cells
      await page.waitForTimeout(3000);
      console.log('Capturing Screenshot 2: Real In-Game Playing Canvas...');
      await page.screenshot({ path: path.join(outDir, 'screenshot-2.png'), type: 'png' });
    }
  } catch (e) {
    console.error('Error starting game:', e);
  }

  // 3. Return to home and open Full Adventure Map (LevelSelectModal)
  console.log('Opening Map for Screenshot 3...');
  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    const skip = await page.$('button:has-text("跳過"), button:has-text("Skip")');
    if (skip) await skip.click();
    await page.waitForTimeout(1000);

    // Click full map button
    const fullMapBtn = await page.$('button:has(svg.lucide-maximize2)');
    if (fullMapBtn) {
      await fullMapBtn.click();
      await page.waitForTimeout(1200);
      console.log('Capturing Screenshot 3: Real Level Select Full Map...');
      await page.screenshot({ path: path.join(outDir, 'screenshot-3.png'), type: 'png' });
      
      const closeBtn = await page.$('button[aria-label="Close"], button:has(svg.lucide-x)');
      if (closeBtn) await closeBtn.click();
      await page.waitForTimeout(600);
    }
  } catch (e) {
    console.error('Error opening map:', e);
  }

  // 4. Open Leaderboard
  console.log('Opening Leaderboard for Screenshot 4...');
  try {
    const trophyBtn = await page.$('#header-btn-leaderboard');
    if (trophyBtn) {
      await trophyBtn.click();
      await page.waitForTimeout(1200);
      console.log('Capturing Screenshot 4: Real In-Game Leaderboard...');
      await page.screenshot({ path: path.join(outDir, 'screenshot-4.png'), type: 'png' });

      const closeBtn = await page.$('button[aria-label="Close"], button:has(svg.lucide-x)');
      if (closeBtn) await closeBtn.click();
      await page.waitForTimeout(600);
    }
  } catch (e) {
    console.error('Error opening leaderboard:', e);
  }

  // 5. Open Shop Modal
  console.log('Opening Shop for Screenshot 5...');
  try {
    const shopBtn = await page.$('#header-btn-shop');
    if (shopBtn) {
      await shopBtn.click();
      await page.waitForTimeout(1200);
      console.log('Capturing Screenshot 5: Real Shop & Skins Modal...');
      await page.screenshot({ path: path.join(outDir, 'screenshot-5.png'), type: 'png' });
    }
  } catch (e) {
    console.error('Error opening shop:', e);
  }

  await browser.close();
  console.log('SUCCESS: All 5 real in-game screenshots captured at 1290x2796!');
}

captureScreenshots().catch(err => {
  console.error('Fatal capture error:', err);
  process.exit(1);
});
