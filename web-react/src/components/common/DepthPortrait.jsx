import React, { useEffect, useRef, useState } from 'react';

/**
 * DepthPortrait - Interactive WebGL 2D+Depth fragment displacement shader component.
 *
 * Implements the Framer Althea 3D engine:
 * - Uses RGBA portrait texture and grayscale depth map
 * - Shifts foreground pixels relative to mouse/pointer coordinates
 * - Alpha transparent canvas allows background SVG rings / gradients to show through
 * - Smooth lerp physics and reduced-motion fallback
 *
 * @param {Object} props
 * @param {string} props.imageSrc RGBA Transparent image URL
 * @param {string} [props.depthSrc] Grayscale depth map image URL
 * @param {string} [props.fallbackSrc] Fallback image if WebGL is unavailable
 * @param {number} [props.intensity=0.025] Displacement shift amplitude
 * @param {boolean} [props.invertDepth=false] Invert depth map values
 * @param {string} [props.className='']
 * @param {string} [props.alt='3D Portrait']
 */
export function DepthPortrait({
  imageSrc,
  depthSrc,
  fallbackSrc,
  intensity = 0.025,
  invertDepth = false,
  className = '',
  alt = '3D Portrait',
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [webGlSupported, setWebGlSupported] = useState(true);
  const targetOffsetRef = useRef({ x: 0, y: 0 });
  const currentOffsetRef = useRef({ x: 0, y: 0 });
  const animFrameRef = useRef(null);

  useEffect(() => {
    // If no depth map provided, render fallback <img>
    if (!depthSrc || typeof window === 'undefined') {
      setWebGlSupported(false);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    let gl;
    try {
      gl = canvas.getContext('webgl', { premultipliedAlpha: false, alpha: true });
    } catch {
      setWebGlSupported(false);
      return;
    }

    if (!gl) {
      setWebGlSupported(false);
      return;
    }

    // Vertex Shader (Fullscreen Quad)
    const vsSource = `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
      }
    `;

    // Fragment Shader (Depth Displacement)
    const fsSource = `
      precision mediump float;
      uniform sampler2D u_image;
      uniform sampler2D u_depth;
      uniform vec2 u_offset;
      uniform float u_intensity;
      uniform bool u_invertDepth;
      varying vec2 v_texCoord;

      void main() {
        float depth = texture2D(u_depth, v_texCoord).r;
        if (u_invertDepth) depth = 1.0 - depth;
        vec2 displacement = u_offset * depth * u_intensity;
        vec2 displaced = v_texCoord + displacement;
        gl_FragColor = texture2D(u_image, displaced);
      }
    `;

    function createShader(glCtx, type, source) {
      const shader = glCtx.createShader(type);
      glCtx.shaderSource(shader, source);
      glCtx.compileShader(shader);
      if (!glCtx.getShaderParameter(shader, glCtx.COMPILE_STATUS)) {
        console.warn('Shader error:', glCtx.getShaderInfoLog(shader));
        glCtx.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) {
      setWebGlSupported(false);
      return;
    }

    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      setWebGlSupported(false);
      return;
    }

    gl.useProgram(program);

    // Geometry buffers
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1, -1,
         1, -1,
        -1,  1,
        -1,  1,
         1, -1,
         1,  1,
      ]),
      gl.STATIC_DRAW
    );

    const posLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(posLocation);
    gl.vertexAttribPointer(posLocation, 2, gl.FLOAT, false, 0, 0);

    const texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        0, 1,
        1, 1,
        0, 0,
        0, 0,
        1, 1,
        1, 0,
      ]),
      gl.STATIC_DRAW
    );

    const texCoordLocation = gl.getAttribLocation(program, 'a_texCoord');
    gl.enableVertexAttribArray(texCoordLocation);
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

    const uOffsetLoc = gl.getUniformLocation(program, 'u_offset');
    const uIntensityLoc = gl.getUniformLocation(program, 'u_intensity');
    const uInvertDepthLoc = gl.getUniformLocation(program, 'u_invertDepth');
    const uImageLoc = gl.getUniformLocation(program, 'u_image');
    const uDepthLoc = gl.getUniformLocation(program, 'u_depth');

    gl.uniform1f(uIntensityLoc, intensity);
    gl.uniform1i(uInvertDepthLoc, invertDepth ? 1 : 0);
    gl.uniform1i(uImageLoc, 0);
    gl.uniform1i(uDepthLoc, 1);

    // Textures loader
    let loadedCount = 0;
    const imgTex = gl.createTexture();
    const depthTex = gl.createTexture();

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;

    const depthImg = new Image();
    depthImg.crossOrigin = 'anonymous';
    depthImg.src = depthSrc;

    function initTexture(texture, imageObj, unit) {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageObj);
    }

    function checkStart() {
      loadedCount++;
      if (loadedCount === 2) {
        canvas.width = img.width || 800;
        canvas.height = img.height || 1000;
        gl.viewport(0, 0, canvas.width, canvas.height);
        initTexture(imgTex, img, 0);
        initTexture(depthTex, depthImg, 1);
        startRenderLoop();
      }
    }

    img.onload = checkStart;
    depthImg.onload = checkStart;
    img.onerror = () => setWebGlSupported(false);
    depthImg.onerror = () => setWebGlSupported(false);

    function startRenderLoop() {
      function render() {
        // Smooth lerp towards target
        const cur = currentOffsetRef.current;
        const tgt = targetOffsetRef.current;
        cur.x += (tgt.x - cur.x) * 0.08;
        cur.y += (tgt.y - cur.y) * 0.08;

        gl.uniform2f(uOffsetLoc, cur.x, cur.y);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        animFrameRef.current = requestAnimationFrame(render);
      }
      render();
    }

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [imageSrc, depthSrc, intensity, invertDepth]);

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    targetOffsetRef.current = { x: nx, y: ny };
  };

  const handleMouseLeave = () => {
    targetOffsetRef.current = { x: 0, y: 0 };
  };

  if (!webGlSupported) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <img
          src={fallbackSrc || imageSrc}
          alt={alt}
          className="w-full h-full object-contain"
          onError={(e) => {
            e.currentTarget.onerror = null;
          }}
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden flex items-center justify-center ${className}`}
    >
      <canvas ref={canvasRef} className="w-full h-full object-contain" />
    </div>
  );
}

export default DepthPortrait;
