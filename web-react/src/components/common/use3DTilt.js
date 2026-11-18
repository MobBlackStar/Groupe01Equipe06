import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * use3DTilt - High-performance mouse tracking 3D tilt hook with spring damping & glare reflection.
 *
 * Honors accessibility (prefers-reduced-motion) and disables on touch/mobile devices.
 * Uses requestAnimationFrame interpolation to guarantee 60fps silky smooth rendering.
 *
 * @param {Object} options Configuration options
 * @param {number} [options.maxTilt=12] Maximum tilt angle in degrees
 * @param {number} [options.perspective=1000] 3D perspective depth in px
 * @param {number} [options.scale=1.02] Scale multiplier on hover
 * @param {number} [options.damping=0.15] Lerp smoothing factor (0.05 = heavy spring, 0.25 = snappy)
 * @param {boolean} [options.glare=true] Enable dynamic glare reflection
 * @param {number} [options.maxGlare=0.3] Maximum opacity of the glare overlay
 * @param {boolean} [options.reverse=false] Invert tilt axis
 * @param {boolean} [options.disabled=false] Force disable tilt
 * @returns {Object} Ref, computed styles, glare styles, hover state, and event handlers
 */
export function use3DTilt({
  maxTilt = 12,
  perspective = 1000,
  scale = 1.02,
  damping = 0.15,
  glare = true,
  maxGlare = 0.3,
  reverse = false,
  disabled = false,
} = {}) {
  const elementRef = useRef(null);
  const rafIdRef = useRef(null);

  // Target values updated instantly by mouse move
  const targetRef = useRef({
    rx: 0,
    ry: 0,
    s: 1,
    glareX: 50,
    glareY: 50,
    glareOpacity: 0,
  });

  // Current interpolated values applied to style
  const currentRef = useRef({
    rx: 0,
    ry: 0,
    s: 1,
    glareX: 50,
    glareY: 50,
    glareOpacity: 0,
  });

  const [isHovered, setIsHovered] = useState(false);
  const [motionDisabled, setMotionDisabled] = useState(false);
  const [tiltStyle, setTiltStyle] = useState({
    transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
    transformStyle: 'preserve-3d',
    transition: 'transform 0.4s cubic-bezier(0.03, 0.98, 0.52, 0.99)',
  });
  const [glareStyle, setGlareStyle] = useState({
    opacity: 0,
    transform: 'translate(-50%, -50%)',
    background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%)',
  });

  // Detect touch screens and prefers-reduced-motion
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || window.matchMedia('(pointer: coarse)').matches;

    setMotionDisabled(Boolean(disabled || prefersReducedMotion || isTouch));
  }, [disabled]);

  // Animation frame loop for buttery-smooth damping
  const updateLoop = useCallback(() => {
    if (motionDisabled) return;

    const cur = currentRef.current;
    const tgt = targetRef.current;

    cur.rx += (tgt.rx - cur.rx) * damping;
    cur.ry += (tgt.ry - cur.ry) * damping;
    cur.s += (tgt.s - cur.s) * damping;
    cur.glareOpacity += (tgt.glareOpacity - cur.glareOpacity) * damping;
    cur.glareX += (tgt.glareX - cur.glareX) * damping;
    cur.glareY += (tgt.glareY - cur.glareY) * damping;

    // Check if movement is negligible to stop the RAF loop
    const delta =
      Math.abs(tgt.rx - cur.rx) +
      Math.abs(tgt.ry - cur.ry) +
      Math.abs(tgt.s - cur.s) +
      Math.abs(tgt.glareOpacity - cur.glareOpacity);

    setTiltStyle({
      transform: `perspective(${perspective}px) rotateX(${cur.rx.toFixed(2)}deg) rotateY(${cur.ry.toFixed(2)}deg) scale3d(${cur.s.toFixed(3)}, ${cur.s.toFixed(3)}, ${cur.s.toFixed(3)})`,
      transformStyle: 'preserve-3d',
      willChange: delta > 0.005 ? 'transform' : 'auto',
    });

    if (glare) {
      setGlareStyle({
        position: 'absolute',
        top: `${cur.glareY.toFixed(1)}%`,
        left: `${cur.glareX.toFixed(1)}%`,
        width: '180%',
        height: '180%',
        opacity: Math.max(0, Math.min(maxGlare, cur.glareOpacity)),
        transform: 'translate(-50%, -50%)',
        background: 'radial-gradient(circle at center, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.15) 30%, rgba(255,255,255,0) 70%)',
        pointerEvents: 'none',
        borderRadius: 'inherit',
        mixBlendMode: 'overlay',
      });
    }

    if (delta > 0.001 || tgt.s > 1) {
      rafIdRef.current = requestAnimationFrame(updateLoop);
    } else {
      rafIdRef.current = null;
    }
  }, [damping, glare, maxGlare, motionDisabled, perspective]);

  const scheduleUpdate = useCallback(() => {
    if (!rafIdRef.current && !motionDisabled) {
      rafIdRef.current = requestAnimationFrame(updateLoop);
    }
  }, [motionDisabled, updateLoop]);

  const onMouseMove = useCallback(
    (e) => {
      if (motionDisabled) return;
      const el = elementRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      // Bound between 0 and 1
      const clampedX = Math.max(0, Math.min(1, x));
      const clampedY = Math.max(0, Math.min(1, y));

      const dir = reverse ? -1 : 1;
      const rx = (clampedY - 0.5) * -2 * maxTilt * dir;
      const ry = (clampedX - 0.5) * 2 * maxTilt * dir;

      targetRef.current = {
        rx,
        ry,
        s: scale,
        glareX: clampedX * 100,
        glareY: clampedY * 100,
        glareOpacity: maxGlare,
      };

      scheduleUpdate();
    },
    [maxTilt, maxGlare, motionDisabled, reverse, scale, scheduleUpdate]
  );

  const onMouseEnter = useCallback(() => {
    if (motionDisabled) return;
    setIsHovered(true);
    targetRef.current.s = scale;
    scheduleUpdate();
  }, [motionDisabled, scale, scheduleUpdate]);

  const onMouseLeave = useCallback(() => {
    if (motionDisabled) return;
    setIsHovered(false);
    targetRef.current = {
      rx: 0,
      ry: 0,
      s: 1,
      glareX: 50,
      glareY: 50,
      glareOpacity: 0,
    };
    scheduleUpdate();
  }, [motionDisabled, scheduleUpdate]);

  // Clean up RAF on unmount
  useEffect(() => {
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  return {
    ref: elementRef,
    style: motionDisabled
      ? { transform: 'none', transformStyle: 'flat' }
      : tiltStyle,
    glareStyle: motionDisabled || !glare ? { display: 'none' } : glareStyle,
    isHovered,
    motionDisabled,
    handlers: {
      onMouseMove,
      onMouseEnter,
      onMouseLeave,
    },
  };
}

export default use3DTilt;
