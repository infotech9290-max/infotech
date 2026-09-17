'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  KeyRound, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  GraduationCap, 
  CheckCircle2, 
  Cpu
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
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

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [portalBrand, setPortalBrand] = useState('ADMISSION PORTAL');

  // 3D Card Interactive Tilt
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const rotateX = -(y / (rect.height / 2)) * 6;
    const rotateY = (x / (rect.width / 2)) * 6;
    setTilt({ x: rotateX, y: rotateY });
  };

  const handleCardMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  // Clean storage on explicit logout
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('logged_out') === 'true' || params.get('logout') === 'true') {
        try {
          localStorage.removeItem('portal_auth_role');
          localStorage.removeItem('portal_auth_user');
          localStorage.removeItem('infotech_portal_auth_role');
          localStorage.removeItem('infotech_portal_auth_user');
          sessionStorage.clear();
        } catch {
          // non-blocking
        }
      }
    }
  }, []);

  // Fetch dynamic branding from settings
  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((json) => {
        if (json?.data?.brand?.websiteName) {
          setPortalBrand(json.data.brand.websiteName.toUpperCase());
        }
      })
      .catch(() => {});
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsAuthenticating(true);

    try {
      if (!email.includes('@')) {
        setErrorMsg('Invalid email format');
        setIsAuthenticating(false);
        return;
      }

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.success && data.user) {
        login(data.user.role, data.user);
      } else {
        setErrorMsg(data.error || 'Invalid email or password');
        setIsAuthenticating(false);
      }
    } catch {
      setErrorMsg('Network error occurred during login. Please try again.');
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#070b14] relative overflow-hidden font-sans p-4 select-none">
      
      {/* 1. Interactive 3D Canvas Background */}
      <Canvas3DBackground />

      {/* 2. Cyber Horizon 3D Perspective Grid */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(59, 130, 246, 0.15) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(59, 130, 246, 0.15) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          transform: 'perspective(600px) rotateX(60deg) translateY(120px)',
          transformOrigin: 'bottom center',
          maskImage: 'radial-gradient(ellipse at 50% 60%, black 20%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 50% 60%, black 20%, transparent 75%)',
        }}
      />

      {/* 3. Deep Radiant Aurora Orbs */}
      <div className="absolute top-[-10%] left-[-5%] w-[550px] h-[550px] rounded-full bg-blue-600/15 blur-[140px] pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute bottom-[-10%] right-[-5%] w-[550px] h-[550px] rounded-full bg-emerald-600/15 blur-[140px] pointer-events-none animate-pulse" style={{ animationDuration: '10s' }} />
      <div className="absolute top-[40%] right-[25%] w-[350px] h-[350px] rounded-full bg-indigo-600/10 blur-[130px] pointer-events-none" />

      {/* 4. Ambient Floating 3D Holographic Badges (Desktop visible) */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3, duration: 0.7 }}
        className="hidden xl:flex absolute left-[8%] top-[35%] flex-col gap-2 p-4 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-2xl z-10 max-w-[210px]"
      >
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-white uppercase tracking-wider">Session 2026-27</p>
            <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" /> Live Admissions
            </span>
          </div>
        </div>
        <p className="text-[10px] text-slate-400 leading-tight">
          Role-attributed counselor ledger & student management.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4, duration: 0.7 }}
        className="hidden xl:flex absolute right-[8%] top-[45%] flex-col gap-2 p-4 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-2xl z-10 max-w-[210px]"
      >
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-white uppercase tracking-wider">Zero-Trust Guard</p>
            <span className="text-[10px] text-blue-400 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-blue-400" /> SHA-256 Secured
            </span>
          </div>
        </div>
        <p className="text-[10px] text-slate-400 leading-tight">
          Timing-safe credential hashing & monotonic sequential IDs.
        </p>
      </motion.div>

      {/* 5. Main 3D Glassmorphic Interactive Login Card */}
      <motion.div
        ref={cardRef}
        onMouseMove={handleCardMouseMove}
        onMouseLeave={handleCardMouseLeave}
        style={{
          transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transition: 'transform 0.15s ease-out',
        }}
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md bg-slate-900/80 backdrop-blur-3xl rounded-[2rem] shadow-[0_30px_90px_rgba(0,0,0,0.8),0_0_50px_rgba(59,130,246,0.15)] border border-white/10 p-8 sm:p-10 relative z-10 group"
      >
        {/* Subtle Top Rim Light */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent" />

        {/* 3D Holographic Shield Icon with double neon rings */}
        <div className="text-center space-y-3 mb-7">
          <div className="flex justify-center relative">
            <div className="relative">
              {/* Outer pulsing ring */}
              <div className="absolute -inset-2 rounded-2xl bg-gradient-to-r from-blue-600/30 to-cyan-500/30 blur-md animate-pulse" />
              <div className="w-16 h-16 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl flex items-center justify-center shadow-xl border border-white/15 relative z-10">
                <ShieldCheck className="w-8 h-8 text-blue-400 drop-shadow-[0_0_12px_rgba(96,165,250,0.7)]" />
              </div>
            </div>
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center justify-center gap-2">
              {portalBrand}
            </h1>
            <p className="text-[11px] text-slate-400 font-semibold tracking-wider uppercase mt-1">
              Official Authentication Terminal
            </p>
          </div>
        </div>

        {/* Forms Container */}
        <AnimatePresence mode="wait">
          {!isForgotPassword ? (
            <motion.form
              key="login-form"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleLogin}
              className="space-y-4"
            >
              {/* Email Input */}
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Registered Email
                </Label>
                <div className="relative">
                  <Input
                    type="email"
                    placeholder="e.g. infotech9290@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    suppressHydrationWarning
                    className="h-12 bg-slate-950/70 border-slate-700/80 text-white pl-10 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent rounded-xl text-sm transition-all"
                    required
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-4 pointer-events-none" />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Security Password
                  </Label>
                  <button 
                    type="button" 
                    onClick={() => setIsForgotPassword(true)}
                    className="text-[11px] font-bold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    suppressHydrationWarning
                    className="h-12 bg-slate-950/70 border-slate-700/80 text-white pl-10 pr-10 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent rounded-xl text-sm transition-all"
                    required
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-4 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Production Gateway Version */}
              <div className="flex items-center justify-end pt-1">
                <span className="text-[10px] text-slate-500 font-mono">v2.4 Production Gateway</span>
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                disabled={isAuthenticating}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all cursor-pointer flex items-center justify-center gap-2 mt-2 group"
              >
                {isAuthenticating ? (
                  <span>Authenticating Session...</span>
                ) : (
                  <>
                    <span>Enter Portal</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </motion.form>
          ) : (
            <motion.div
              key="forgot-form"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-700/60 text-center space-y-3">
                <div className="w-11 h-11 rounded-2xl bg-blue-500/15 text-blue-400 flex items-center justify-center mx-auto border border-blue-500/30">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Institutional Security Protocol</h3>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Account credentials follow enterprise cloud compliance standards.
                  </p>
                </div>

                <div className="text-left bg-slate-900/90 rounded-xl p-3.5 border border-slate-800 space-y-2.5 text-xs">
                  <div>
                    <span className="font-bold text-blue-400 block text-[11px]">👥 Counselor / Staff:</span>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Contact your Institute Director at <strong className="text-slate-300">infotech9290@gmail.com</strong>. The Director can reset your PIN directly from the Workers Fleet dashboard.
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-800">
                    <span className="font-bold text-purple-400 block text-[11px]">🛡️ Super Administrator:</span>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Root access is strictly protected. For cloud security compliance, master credentials can only be managed from within the authenticated Admin Settings or directly via the 2FA-secured Supabase Cloud console.
                    </p>
                  </div>
                </div>
              </div>

              <Button
                type="button"
                onClick={() => setIsForgotPassword(false)}
                className="w-full h-11 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs transition-all cursor-pointer"
              >
                Back to Login
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Feedback */}
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-rose-400 font-semibold text-center bg-rose-500/10 p-3 rounded-xl border border-rose-500/25 mt-4"
          >
            {errorMsg}
          </motion.div>
        )}

        {/* Footer Security Watermark */}
        <div className="pt-5 mt-5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-medium">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            256-Bit Encrypted Gateway
          </span>
          <span className="text-emerald-400/90 font-mono text-[10px]">● System Online</span>
        </div>
      </motion.div>

    </div>
  );
}
