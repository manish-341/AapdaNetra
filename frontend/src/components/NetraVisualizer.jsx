import React, { useEffect, useRef } from 'react';

/**
 * NetraVisualizer: Interactive 60fps Canvas displaying "AapdaNetra"
 * (The Watchful Disaster Intelligence Eye / Geospatial Sensor Mesh)
 * Responds dynamically to mouse movement and theme changes.
 */
export default function NetraVisualizer({ isDark = true, activeRole = 'OFFICER' }) {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;
    let width = (canvas.width = canvas.offsetWidth * window.devicePixelRatio);
    let height = (canvas.height = canvas.offsetHeight * window.devicePixelRatio);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      height = canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    };
    window.addEventListener('resize', handleResize);

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = (e.clientX - rect.left) * window.devicePixelRatio;
      const clientY = (e.clientY - rect.top) * window.devicePixelRatio;
      mouseRef.current.targetX = (clientX - width / 2) / (width / 2);
      mouseRef.current.targetY = (clientY - height / 2) / (height / 2);
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Sensor mesh nodes (simulating flood sensors, weather stations, satellite feeds)
    const nodesCount = 28;
    const nodes = [];
    for (let i = 0; i < nodesCount; i++) {
      const angle = (i / nodesCount) * Math.PI * 2;
      const radius = 100 + Math.random() * 160;
      nodes.push({
        baseAngle: angle,
        speed: (Math.random() * 0.003 + 0.001) * (i % 2 === 0 ? 1 : -1),
        currentAngle: angle,
        baseRadius: radius,
        radius: radius,
        size: Math.random() * 3 + 2,
        pulseOffset: Math.random() * Math.PI * 2,
        isAlert: i % 7 === 0,
      });
    }

    let angleSweep = 0;

    const render = (time) => {
      // Smooth mouse interpolation
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      ctx.clearRect(0, 0, width, height);

      const cx = width / 2 + mouseRef.current.x * 25;
      const cy = height / 2 + mouseRef.current.y * 25;
      const scale = Math.min(width, height) / 600;

      // Theme-based colors
      const ringColor = isDark ? 'rgba(56, 189, 248, 0.18)' : 'rgba(2, 132, 199, 0.22)';
      const accentColor = isDark ? '#38bdf8' : '#0284c7';
      const alertColor = '#f43f5e';
      const gridColor = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)';

      // 1. Draw subtle background coordinate grid
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;
      const gridSize = 40 * scale;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 2. Draw Concentric Eye ("Netra") Aperture Rings
      const ringRadii = [60, 110, 160, 220].map((r) => r * scale);

      ringRadii.forEach((r, idx) => {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = ringColor;
        ctx.lineWidth = idx === 1 ? 2 : 1;
        if (idx === 2) ctx.setLineDash([4 * scale, 6 * scale]);
        else ctx.setLineDash([]);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // 3. Rotating Compass Degree Ticks on Outer Ring
      const outerR = ringRadii[3];
      const tickCount = 48;
      ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.35)' : 'rgba(2, 132, 199, 0.35)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < tickCount; i++) {
        const theta = (i / tickCount) * Math.PI * 2 + time * 0.0002;
        const len = i % 4 === 0 ? 10 * scale : 4 * scale;
        const x1 = cx + Math.cos(theta) * (outerR - len);
        const y1 = cy + Math.sin(theta) * (outerR - len);
        const x2 = cx + Math.cos(theta) * outerR;
        const y2 = cy + Math.sin(theta) * outerR;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      // 4. Scanning Radar Sector (AapdaNetra Surveillance Sweep)
      angleSweep = (time * 0.001) % (Math.PI * 2);
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, outerR, angleSweep - 0.5, angleSweep);
      ctx.closePath();
      const sweepGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, outerR);
      sweepGrad.addColorStop(0, isDark ? 'rgba(56, 189, 248, 0.25)' : 'rgba(2, 132, 199, 0.2)');
      sweepGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = sweepGrad;
      ctx.fill();
      ctx.restore();

      // 5. Connective Mesh Lines between Nodes
      ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.08)' : 'rgba(2, 132, 199, 0.08)';
      ctx.lineWidth = 1;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const n1 = nodes[i];
          const n2 = nodes[j];
          const x1 = cx + Math.cos(n1.currentAngle) * (n1.radius * scale);
          const y1 = cy + Math.sin(n1.currentAngle) * (n1.radius * scale);
          const x2 = cx + Math.cos(n2.currentAngle) * (n2.radius * scale);
          const y2 = cy + Math.sin(n2.currentAngle) * (n2.radius * scale);
          const dist = Math.hypot(x1 - x2, y1 - y2);
          if (dist < 90 * scale) {
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
          }
        }
      }

      // 6. Draw Sensor Nodes & Alert Blips
      nodes.forEach((node) => {
        node.currentAngle += node.speed;
        const x = cx + Math.cos(node.currentAngle) * (node.radius * scale);
        const y = cy + Math.sin(node.currentAngle) * (node.radius * scale);
        const pulse = Math.sin(time * 0.004 + node.pulseOffset);

        ctx.beginPath();
        ctx.arc(x, y, (node.size + pulse * 1.5) * scale, 0, Math.PI * 2);
        ctx.fillStyle = node.isAlert ? alertColor : accentColor;
        ctx.shadowColor = node.isAlert ? alertColor : accentColor;
        ctx.shadowBlur = 10 * scale;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Radiating pulse ring for critical alerts
        if (node.isAlert) {
          ctx.beginPath();
          ctx.arc(x, y, (12 + pulse * 6) * scale, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(244, 63, 94, 0.4)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      });

      // 7. Center "Pupil / Aperture Core" (The Netra Core)
      const coreRadius = (32 + Math.sin(time * 0.003) * 3) * scale;
      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreRadius);
      coreGrad.addColorStop(0, isDark ? '#38bdf8' : '#0284c7');
      coreGrad.addColorStop(0.5, isDark ? 'rgba(2, 132, 199, 0.8)' : 'rgba(37, 99, 235, 0.7)');
      coreGrad.addColorStop(1, 'transparent');

      ctx.beginPath();
      ctx.arc(cx, cy, coreRadius, 0, Math.PI * 2);
      ctx.fillStyle = coreGrad;
      ctx.fill();

      // Center crosshair and coordinates
      ctx.strokeStyle = isDark ? '#ffffff' : '#ffffff';
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.arc(cx, cy, 14 * scale, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, 4 * scale, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isDark, activeRole]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        pointerEvents: 'auto',
      }}
    />
  );
}
