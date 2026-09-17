'use client';

import React, { useRef, useEffect } from 'react';

export default /**
 * 3D Interactive Canvas: Renders rotating 3D geometric polyhedrons
 * and a deep constellation of glowing nodes with mouse parallax.
 */
function Canvas3DBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Mouse tracking for 3D parallax
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = (e.clientX - width / 2) * 0.0008;
      targetMouseY = (e.clientY - height / 2) * 0.0008;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // 3D Star/Particle field
    const particleCount = 65;
    const particles = Array.from({ length: particleCount }, () => ({
      x: (Math.random() - 0.5) * width * 1.5,
      y: (Math.random() - 0.5) * height * 1.5,
      z: Math.random() * 800 + 200,
      baseRadius: Math.random() * 1.8 + 0.8,
      color: Math.random() > 0.4 ? 'rgba(59, 130, 246, ' : 'rgba(16, 185, 129, ',
      alpha: Math.random() * 0.6 + 0.2,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
    }));

    // 3D Wireframe Cube Vertices
    const cubeSize = 130;
    const cubeVertices = [
      [-cubeSize, -cubeSize, -cubeSize],
      [cubeSize, -cubeSize, -cubeSize],
      [cubeSize, cubeSize, -cubeSize],
      [-cubeSize, cubeSize, -cubeSize],
      [-cubeSize, -cubeSize, cubeSize],
      [cubeSize, -cubeSize, cubeSize],
      [cubeSize, cubeSize, cubeSize],
      [-cubeSize, cubeSize, cubeSize],
    ];

    const cubeEdges = [
      [0, 1], [1, 2], [2, 3], [3, 0],
      [4, 5], [5, 6], [6, 7], [7, 4],
      [0, 4], [1, 5], [2, 6], [3, 7],
    ];

    // 3D Wireframe Octahedron Vertices
    const octSize = 90;
    const octVertices = [
      [0, -octSize, 0],
      [octSize, 0, 0],
      [0, 0, octSize],
      [-octSize, 0, 0],
      [0, 0, -octSize],
      [0, octSize, 0],
    ];

    const octEdges = [
      [0, 1], [0, 2], [0, 3], [0, 4],
      [5, 1], [5, 2], [5, 3], [5, 4],
      [1, 2], [2, 3], [3, 4], [4, 1],
    ];

    let angleX = 0;
    let angleY = 0;
    let angleZ = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Smooth mouse interpolation
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      angleX += 0.004 + mouseY * 0.05;
      angleY += 0.006 + mouseX * 0.05;
      angleZ += 0.002;

      // 1. Draw 3D Particle Cloud
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < -width) p.x = width;
        if (p.x > width) p.x = -width;
        if (p.y < -height) p.y = height;
        if (p.y > height) p.y = -height;

        // Apply mouse parallax rotation
        const cosY = Math.cos(mouseX);
        const sinY = Math.sin(mouseX);
        const rx = p.x * cosY - p.z * sinY;
        const rz = p.x * sinY + p.z * cosY;

        const fov = 400;
        const scale = fov / (fov + rz);
        const projX = rx * scale + width / 2;
        const projY = p.y * scale + height / 2;

        if (scale > 0 && projX > 0 && projX < width && projY > 0 && projY < height) {
          ctx.beginPath();
          ctx.arc(projX, projY, Math.max(0.5, p.baseRadius * scale), 0, Math.PI * 2);
          ctx.fillStyle = `${p.color}${Math.min(1, p.alpha * scale)})`;
          ctx.shadowBlur = 8 * scale;
          ctx.shadowColor = 'rgba(59, 130, 246, 0.5)';
          ctx.fill();
        }
      });
      ctx.shadowBlur = 0;

      // Helper function to project 3D point to 2D
      const project3D = (
        point: number[],
        centerX: number,
        centerY: number,
        depth: number,
        rotX: number,
        rotY: number,
        rotZ: number
      ) => {
        let [x, y, z] = point;

        // Rotate around X
        const cosX = Math.cos(rotX);
        const sinX = Math.sin(rotX);
        const y1 = y * cosX - z * sinX;
        const z1 = y * sinX + z * cosX;

        // Rotate around Y
        const cosY = Math.cos(rotY);
        const sinY = Math.sin(rotY);
        const x2 = x * cosY + z1 * sinY;
        const z2 = -x * sinY + z1 * cosY;

        // Rotate around Z
        const cosZ = Math.cos(rotZ);
        const sinZ = Math.sin(rotZ);
        const x3 = x2 * cosZ - y1 * sinZ;
        const y3 = x2 * sinZ + y1 * cosZ;

        const fov = 450;
        const scale = fov / (fov + z2 + depth);
        return {
          x: x3 * scale + centerX,
          y: y3 * scale + centerY,
          scale,
        };
      };

      // 2. Draw 3D Floating Cube (Top Left)
      const cubeCenterX = width * 0.18 + mouseX * 80;
      const cubeCenterY = height * 0.28 + mouseY * 80;
      const projectedCube = cubeVertices.map((v) =>
        project3D(v, cubeCenterX, cubeCenterY, 300, angleX, angleY, angleZ)
      );

      ctx.strokeStyle = 'rgba(59, 130, 246, 0.22)';
      ctx.lineWidth = 1.4;
      cubeEdges.forEach(([i, j]) => {
        const p1 = projectedCube[i];
        const p2 = projectedCube[j];
        if (p1.scale > 0 && p2.scale > 0) {
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      });

      // Vertices dots
      projectedCube.forEach((p) => {
        if (p.scale > 0) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 2.5 * p.scale, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(96, 165, 250, 0.7)';
          ctx.fill();
        }
      });

      // 3. Draw 3D Floating Octahedron (Bottom Right)
      const octCenterX = width * 0.82 - mouseX * 80;
      const octCenterY = height * 0.72 - mouseY * 80;
      const projectedOct = octVertices.map((v) =>
        project3D(v, octCenterX, octCenterY, 320, -angleY * 1.2, angleX * 1.2, angleZ)
      );

      ctx.strokeStyle = 'rgba(16, 185, 129, 0.22)';
      ctx.lineWidth = 1.3;
      octEdges.forEach(([i, j]) => {
        const p1 = projectedOct[i];
        const p2 = projectedOct[j];
        if (p1.scale > 0 && p2.scale > 0) {
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      });

      projectedOct.forEach((p) => {
        if (p.scale > 0) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 2.2 * p.scale, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(52, 211, 153, 0.7)';
          ctx.fill();
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0"
      style={{ opacity: 0.85 }}
    />
  );
}
