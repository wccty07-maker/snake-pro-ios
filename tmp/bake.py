with open('src/components/ModernGameCanvas.tsx', 'r') as f:
    code = f.read()

# 1. Update renderOffscreenBackground signature and body
old_sig = '''  // Helper to render static background layers (Moat, Grid, Themed Obstacles, Outer Boundary Wall) onto offscreen cache
  const renderOffscreenBackground = useCallback(
    (
      targetCanvas: HTMLCanvasElement,
      w: number,
      h: number,
      gX: number,
      gY: number,
      gW: number,
      gH: number,
      cW: number,
      cH: number,
      enableGlow: boolean
    ) => {'''

new_sig = '''  // Helper to render static background layers (Moat, Grid, Themed Obstacles, Outer Boundary Wall) onto offscreen cache
  const renderOffscreenBackground = useCallback(
    (
      targetCanvas: HTMLCanvasElement,
      w: number,
      h: number,
      gX: number,
      gY: number,
      gW: number,
      gH: number,
      cW: number,
      cH: number,
      enableGlow: boolean,
      currentObstacles?: Point[],
      mission?: LevelMission
    ) => {'''

assert old_sig in code, 'old_sig not found'
code = code.replace(old_sig, new_sig)

# 2. Add obstacle drawing into renderOffscreenBackground
old_wall_end = '''      // Subtle glint on top edge of boundary wall
      offCtx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      offCtx.lineWidth = 1.5;
      offCtx.beginPath();
      offCtx.moveTo(14, 2.5);
      offCtx.lineTo(w - 14, 2.5);
      offCtx.stroke();
      offCtx.restore();
    },
    [arena, showGrid]
  );'''

new_wall_end = '''      // Subtle glint on top edge of boundary wall
      offCtx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      offCtx.lineWidth = 1.5;
      offCtx.beginPath();
      offCtx.moveTo(14, 2.5);
      offCtx.lineTo(w - 14, 2.5);
      offCtx.stroke();
      offCtx.restore();

      // 4. Bake Themed Obstacles into offscreen cache (saves hundreds of path operations per frame!)
      if (currentObstacles && currentObstacles.length > 0) {
        const worldId = mission?.worldId || 1;
        currentObstacles.forEach((obs) => {
          const ox = gX + obs.x * cW;
          const oy = gY + obs.y * cH;
          offCtx.save();
          if (worldId === 2) {
            offCtx.fillStyle = '#0f766e';
            offCtx.strokeStyle = '#2dd4bf';
            offCtx.lineWidth = 1.8;
            offCtx.beginPath();
            offCtx.roundRect(ox + 2, oy + 2, cW - 4, cH - 4, 6);
            offCtx.fill();
            offCtx.stroke();
            offCtx.fillStyle = '#5eead4';
            offCtx.beginPath();
            offCtx.arc(ox + cW / 2, oy + cH / 2, 2.5, 0, Math.PI * 2);
            offCtx.fill();
          } else if (worldId === 3) {
            offCtx.fillStyle = '#db2777';
            offCtx.strokeStyle = '#f472b6';
            offCtx.lineWidth = 1.8;
            offCtx.beginPath();
            offCtx.roundRect(ox + 2, oy + 2, cW - 4, cH - 4, 6);
            offCtx.fill();
            offCtx.stroke();
            offCtx.fillStyle = '#fdf2f8';
            offCtx.fillRect(ox + 4, oy + cH / 2 - 1.5, cW - 8, 3);
          } else if (worldId === 4) {
            offCtx.fillStyle = '#290e05';
            offCtx.strokeStyle = '#f97316';
            offCtx.lineWidth = 1.8;
            offCtx.beginPath();
            offCtx.roundRect(ox + 2, oy + 2, cW - 4, cH - 4, 6);
            offCtx.fill();
            offCtx.stroke();
            offCtx.strokeStyle = '#fb923c';
            offCtx.lineWidth = 1.2;
            offCtx.beginPath();
            offCtx.moveTo(ox + 4, oy + 4);
            offCtx.lineTo(ox + cW / 2, oy + cH / 2);
            offCtx.lineTo(ox + cW - 4, oy + cH - 4);
            offCtx.stroke();
          } else if (worldId === 5) {
            offCtx.fillStyle = '#0f172a';
            offCtx.strokeStyle = '#38bdf8';
            offCtx.lineWidth = 1.8;
            offCtx.beginPath();
            offCtx.roundRect(ox + 2, oy + 2, cW - 4, cH - 4, 5);
            offCtx.fill();
            offCtx.stroke();
            offCtx.strokeStyle = '#f43f5e';
            offCtx.lineWidth = 1.2;
            offCtx.beginPath();
            offCtx.moveTo(ox + cW / 2, oy + 4);
            offCtx.lineTo(ox + cW / 2, oy + cH - 4);
            offCtx.stroke();
          } else if (worldId === 6) {
            offCtx.fillStyle = '#2e1065';
            offCtx.strokeStyle = '#a855f7';
            offCtx.lineWidth = 1.8;
            offCtx.beginPath();
            offCtx.roundRect(ox + 2, oy + 2, cW - 4, cH - 4, 6);
            offCtx.fill();
            offCtx.stroke();
            offCtx.fillStyle = '#c084fc';
            offCtx.beginPath();
            offCtx.arc(ox + cW / 2, oy + cH / 2, 2.5, 0, Math.PI * 2);
            offCtx.fill();
          } else if (worldId === 7) {
            offCtx.fillStyle = '#0c4a6e';
            offCtx.strokeStyle = '#38bdf8';
            offCtx.lineWidth = 1.8;
            offCtx.beginPath();
            offCtx.roundRect(ox + 2, oy + 2, cW - 4, cH - 4, 7);
            offCtx.fill();
            offCtx.stroke();
            offCtx.fillStyle = '#7dd3fc';
            offCtx.beginPath();
            offCtx.arc(ox + cW / 2, oy + cH / 2, 2.5, 0, Math.PI * 2);
            offCtx.fill();
          } else if (worldId === 8 || worldId === 16) {
            offCtx.fillStyle = '#075985';
            offCtx.strokeStyle = '#38bdf8';
            offCtx.lineWidth = 1.8;
            offCtx.beginPath();
            offCtx.roundRect(ox + 2, oy + 2, cW - 4, cH - 4, 6);
            offCtx.fill();
            offCtx.stroke();
            offCtx.fillStyle = '#e0f2fe';
            offCtx.beginPath();
            offCtx.arc(ox + cW / 2, oy + cH / 2, 2, 0, Math.PI * 2);
            offCtx.fill();
          } else if (worldId === 9) {
            offCtx.fillStyle = '#18181b';
            offCtx.strokeStyle = '#f43f5e';
            offCtx.lineWidth = 2.2;
            offCtx.beginPath();
            offCtx.roundRect(ox + 2, oy + 2, cW - 4, cH - 4, 6);
            offCtx.fill();
            offCtx.stroke();
            offCtx.strokeStyle = '#fb7185';
            offCtx.lineWidth = 1.4;
            offCtx.beginPath();
            offCtx.moveTo(ox + 5, oy + cH / 2);
            offCtx.lineTo(ox + cW - 5, oy + cH / 2);
            offCtx.moveTo(ox + cW / 2, oy + 5);
            offCtx.lineTo(ox + cW / 2, oy + cH - 5);
            offCtx.stroke();
            offCtx.fillStyle = '#e11d48';
            offCtx.beginPath();
            offCtx.arc(ox + cW / 2, oy + cH / 2, 2.5, 0, Math.PI * 2);
            offCtx.fill();
          } else if (worldId === 10 || worldId === 17) {
            offCtx.fillStyle = '#1e293b';
            offCtx.strokeStyle = '#ef4444';
            offCtx.lineWidth = 2;
            offCtx.beginPath();
            offCtx.roundRect(ox + 2, oy + 2, cW - 4, cH - 4, 6);
            offCtx.fill();
            offCtx.stroke();
            offCtx.strokeStyle = '#f59e0b';
            offCtx.lineWidth = 1.5;
            offCtx.beginPath();
            offCtx.moveTo(ox + 4, oy + cH - 4);
            offCtx.lineTo(ox + cW - 4, oy + 4);
            offCtx.stroke();
          } else if (worldId === 11) {
            offCtx.fillStyle = '#581c87';
            offCtx.strokeStyle = '#c084fc';
            offCtx.lineWidth = 1.8;
            offCtx.beginPath();
            offCtx.roundRect(ox + 2, oy + 2, cW - 4, cH - 4, 6);
            offCtx.fill();
            offCtx.stroke();
            offCtx.fillStyle = '#f43f5e';
            offCtx.beginPath();
            offCtx.arc(ox + cW / 2, oy + cH / 2, 2.5, 0, Math.PI * 2);
            offCtx.fill();
          } else {
            offCtx.fillStyle = '#78350f';
            offCtx.strokeStyle = '#b45309';
            offCtx.lineWidth = 1.6;
            offCtx.beginPath();
            offCtx.roundRect(ox + 2, oy + 2, cW - 4, cH - 4, 7);
            offCtx.fill();
            offCtx.stroke();
            offCtx.strokeStyle = '#92400e';
            offCtx.lineWidth = 1;
            offCtx.beginPath();
            offCtx.moveTo(ox + 4, oy + cH / 2);
            offCtx.lineTo(ox + cW - 4, oy + cH / 2);
            offCtx.moveTo(ox + cW / 2, oy + 4);
            offCtx.lineTo(ox + cW / 2, oy + cH - 4);
            offCtx.stroke();
            offCtx.fillStyle = '#fef3c7';
            offCtx.beginPath();
            offCtx.arc(ox + cW / 2, oy + cH / 2, 2, 0, Math.PI * 2);
            offCtx.fill();
          }
          offCtx.restore();
        });
      }
    },
    [arena, showGrid]
  );'''

assert old_wall_end in code, 'old_wall_end not found'
code = code.replace(old_wall_end, new_wall_end)

# 3. Update offscreen background cache call
idx_call = code.find('// 1. Offscreen background layer caching')
assert idx_call != -1, 'idx_call not found'
idx_blit = code.find('// High performance single texture blit', idx_call)
assert idx_blit != -1, 'idx_blit not found'

new_call = '''// 1. Offscreen background layer caching (caches static backdrop, grid mat, grid lines, boundary wall, AND obstacles)
    const currentBgKey = `${width}x${height}_${arena.id}_${showGrid}_${batterySaverEnabled}_${currentMission?.id || 0}_${obstacles?.length || 0}`;
    if (
      !offscreenCanvasRef.current ||
      offscreenCanvasRef.current.width !== width ||
      offscreenCanvasRef.current.height !== height ||
      bgCacheKeyRef.current !== currentBgKey
    ) {
      if (!offscreenCanvasRef.current) {
        offscreenCanvasRef.current = document.createElement('canvas');
      }
      offscreenCanvasRef.current.width = width;
      offscreenCanvasRef.current.height = height;
      bgCacheKeyRef.current = currentBgKey;
      renderOffscreenBackground(
        offscreenCanvasRef.current,
        width,
        height,
        gridX,
        gridY,
        gridWidth,
        gridHeight,
        cellW,
        cellH,
        enableGlow,
        obstacles,
        currentMission
      );
    }
    '''

code = code[:idx_call] + new_call + code[idx_blit:]

# 4. Remove the dynamic obstacle loop in render()
import re
code = re.sub(r'    // 3\.8\. Draw Themed Obstacles dynamically.*?    // 4\. Draw Food Items', '    // 4. Draw Food Items', code, flags=re.DOTALL)

with open('src/components/ModernGameCanvas.tsx', 'w') as f:
    f.write(code)

print('SUCCESS!')
