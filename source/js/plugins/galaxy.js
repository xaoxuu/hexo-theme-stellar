/*
 * Wiki Galaxy WebGL background.
 * Shader adapted from React Bits Galaxy: https://github.com/DavidHDev/react-bits
 * React Bits is MIT licensed; see THIRD-PARTY-NOTICES.md.
 */

(function () {
  'use strict';

  const vertexShader = `
attribute vec2 position;

varying vec2 vUv;

void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

  const fragmentShader = `
precision highp float;

uniform float uTime;
uniform vec3 uResolution;
uniform vec2 uFocal;
uniform vec2 uRotation;
uniform float uStarSpeed;
uniform float uDensity;
uniform float uHueShift;
uniform float uSpeed;
uniform vec2 uMouse;
uniform float uGlowIntensity;
uniform float uSaturation;
uniform bool uMouseRepulsion;
uniform float uTwinkleIntensity;
uniform float uRotationSpeed;
uniform float uRepulsionStrength;
uniform float uMouseActiveFactor;
uniform float uAutoCenterRepulsion;
uniform bool uTransparent;

varying vec2 vUv;

#define NUM_LAYER 4.0
#define STAR_COLOR_CUTOFF 0.2
#define MAT45 mat2(0.7071, -0.7071, 0.7071, 0.7071)
#define PERIOD 3.0

float Hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float tri(float x) {
  return abs(fract(x) * 2.0 - 1.0);
}

float tris(float x) {
  float t = fract(x);
  return 1.0 - smoothstep(0.0, 1.0, abs(2.0 * t - 1.0));
}

float trisn(float x) {
  float t = fract(x);
  return 2.0 * (1.0 - smoothstep(0.0, 1.0, abs(2.0 * t - 1.0))) - 1.0;
}

vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

float Star(vec2 uv, float flare) {
  float d = length(uv);
  float m = (0.05 * uGlowIntensity) / d;
  float rays = smoothstep(0.0, 1.0, 1.0 - abs(uv.x * uv.y * 1000.0));
  m += rays * flare * uGlowIntensity;
  uv *= MAT45;
  rays = smoothstep(0.0, 1.0, 1.0 - abs(uv.x * uv.y * 1000.0));
  m += rays * 0.3 * flare * uGlowIntensity;
  m *= smoothstep(1.0, 0.2, d);
  return m;
}

vec3 StarLayer(vec2 uv) {
  vec3 col = vec3(0.0);
  vec2 gv = fract(uv) - 0.5;
  vec2 id = floor(uv);

  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 offset = vec2(float(x), float(y));
      vec2 si = id + offset;
      float seed = Hash21(si);
      float size = fract(seed * 345.32);
      float glossLocal = tri(uStarSpeed / (PERIOD * seed + 1.0));
      float flareSize = smoothstep(0.9, 1.0, size) * glossLocal;

      float red = smoothstep(STAR_COLOR_CUTOFF, 1.0, Hash21(si + 1.0)) + STAR_COLOR_CUTOFF;
      float blu = smoothstep(STAR_COLOR_CUTOFF, 1.0, Hash21(si + 3.0)) + STAR_COLOR_CUTOFF;
      float grn = min(red, blu) * seed;
      vec3 base = vec3(red, grn, blu);

      float hue = atan(base.g - base.r, base.b - base.r) / (2.0 * 3.14159) + 0.5;
      hue = fract(hue + uHueShift / 360.0);
      float sat = length(base - vec3(dot(base, vec3(0.299, 0.587, 0.114)))) * uSaturation;
      float val = max(max(base.r, base.g), base.b);
      base = hsv2rgb(vec3(hue, sat, val));

      vec2 pad = vec2(
        tris(seed * 34.0 + uTime * uSpeed / 10.0),
        tris(seed * 38.0 + uTime * uSpeed / 30.0)
      ) - 0.5;

      float star = Star(gv - offset - pad, flareSize);
      float twinkle = trisn(uTime * uSpeed + seed * 6.2831) * 0.5 + 1.0;
      twinkle = mix(1.0, twinkle, uTwinkleIntensity);
      star *= twinkle;
      col += star * size * base;
    }
  }

  return col;
}

void main() {
  vec2 focalPx = uFocal * uResolution.xy;
  vec2 uv = (vUv * uResolution.xy - focalPx) / uResolution.y;
  vec2 mouseNorm = uMouse - vec2(0.5);

  if (uAutoCenterRepulsion > 0.0) {
    vec2 centerUV = vec2(0.0, 0.0);
    float centerDist = length(uv - centerUV);
    vec2 repulsion = normalize(uv - centerUV) * (uAutoCenterRepulsion / (centerDist + 0.1));
    uv += repulsion * 0.05;
  } else if (uMouseRepulsion) {
    vec2 mousePosUV = (uMouse * uResolution.xy - focalPx) / uResolution.y;
    float mouseDist = length(uv - mousePosUV);
    vec2 repulsion = normalize(uv - mousePosUV) * (uRepulsionStrength / (mouseDist + 0.1));
    uv += repulsion * 0.05 * uMouseActiveFactor;
  } else {
    vec2 mouseOffset = mouseNorm * 0.1 * uMouseActiveFactor;
    uv += mouseOffset;
  }

  float autoRotAngle = uTime * uRotationSpeed;
  mat2 autoRot = mat2(cos(autoRotAngle), -sin(autoRotAngle), sin(autoRotAngle), cos(autoRotAngle));
  uv = autoRot * uv;
  uv = mat2(uRotation.x, -uRotation.y, uRotation.y, uRotation.x) * uv;

  vec3 col = vec3(0.0);
  for (float i = 0.0; i < 1.0; i += 1.0 / NUM_LAYER) {
    float depth = fract(i + uStarSpeed * uSpeed);
    float scale = mix(20.0 * uDensity, 0.5 * uDensity, depth);
    float fade = depth * smoothstep(1.0, 0.9, depth);
    col += StarLayer(uv * scale + i * 453.32) * fade;
  }

  if (uTransparent) {
    float alpha = smoothstep(0.0, 0.3, length(col));
    gl_FragColor = vec4(col, min(alpha, 1.0));
  } else {
    gl_FragColor = vec4(col, 1.0);
  }
}
`;

  const defaultParams = {
    focal: [0.5, 0.5],
    rotation: [1.0, 0.0],
    starSpeed: 2.0,
    density: 2.0,
    hueShift: 140.0,
    speed: 0.5,
    glowIntensity: 0.2,
    saturation: 0.1,
    mouseRepulsion: true,
    twinkleIntensity: 0.1,
    rotationSpeed: 0.1,
    repulsionStrength: 0.1,
    autoCenterRepulsion: 0.0,
    transparent: true
  };

  function isFiniteNumber(value) {
    return typeof value === 'number' && Number.isFinite(value);
  }

  function finiteOrDefault(value, fallback) {
    return isFiniteNumber(value) ? value : fallback;
  }

  function nonNegativeOrDefault(value, fallback) {
    return isFiniteNumber(value) && value >= 0 ? value : fallback;
  }

  function booleanOrDefault(value, fallback) {
    return typeof value === 'boolean' ? value : fallback;
  }

  function pairOrDefault(value, fallback, clampToUnit) {
    if (!Array.isArray(value) || value.length !== 2 || !isFiniteNumber(value[0]) || !isFiniteNumber(value[1])) {
      return fallback.slice();
    }
    if (clampToUnit) {
      return value.map(function (item) {
        return Math.max(0, Math.min(1, item));
      });
    }
    return value.slice();
  }

  function normalizeHue(value, fallback) {
    if (!isFiniteNumber(value)) return fallback;
    return ((value % 360) + 360) % 360;
  }

  function normalizeParams(value) {
    const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    return {
      focal: pairOrDefault(source.focal, defaultParams.focal, true),
      rotation: pairOrDefault(source.rotation, defaultParams.rotation, false),
      starSpeed: nonNegativeOrDefault(source.starSpeed, defaultParams.starSpeed),
      density: nonNegativeOrDefault(source.density, defaultParams.density),
      hueShift: normalizeHue(source.hueShift, defaultParams.hueShift),
      speed: nonNegativeOrDefault(source.speed, defaultParams.speed),
      glowIntensity: nonNegativeOrDefault(source.glowIntensity, defaultParams.glowIntensity),
      saturation: nonNegativeOrDefault(source.saturation, defaultParams.saturation),
      mouseRepulsion: booleanOrDefault(source.mouseRepulsion, defaultParams.mouseRepulsion),
      twinkleIntensity: nonNegativeOrDefault(source.twinkleIntensity, defaultParams.twinkleIntensity),
      rotationSpeed: finiteOrDefault(source.rotationSpeed, defaultParams.rotationSpeed),
      repulsionStrength: nonNegativeOrDefault(source.repulsionStrength, defaultParams.repulsionStrength),
      autoCenterRepulsion: nonNegativeOrDefault(source.autoCenterRepulsion, defaultParams.autoCenterRepulsion),
      transparent: booleanOrDefault(source.transparent, defaultParams.transparent)
    };
  }

  function readParams(canvas) {
    const raw = canvas.getAttribute('data-galaxy-params');
    if (!raw) return normalizeParams({});
    try {
      return normalizeParams(JSON.parse(raw));
    } catch (e) {
      return normalizeParams({});
    }
  }

  function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const message = gl.getShaderInfoLog(shader) || 'Unknown shader compilation error';
      gl.deleteShader(shader);
      throw new Error(message);
    }
    return shader;
  }

  function createProgram(gl) {
    const vertex = createShader(gl, gl.VERTEX_SHADER, vertexShader);
    const fragment = createShader(gl, gl.FRAGMENT_SHADER, fragmentShader);
    const program = gl.createProgram();
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const message = gl.getProgramInfoLog(program) || 'Unknown WebGL program link error';
      gl.deleteProgram(program);
      throw new Error(message);
    }
    return program;
  }

  function uniformLocations(gl, program) {
    const names = [
      'uTime', 'uResolution', 'uFocal', 'uRotation', 'uStarSpeed', 'uDensity',
      'uHueShift', 'uSpeed', 'uMouse', 'uGlowIntensity', 'uSaturation',
      'uMouseRepulsion', 'uTwinkleIntensity', 'uRotationSpeed',
      'uRepulsionStrength', 'uMouseActiveFactor', 'uAutoCenterRepulsion',
      'uTransparent'
    ];
    const result = {};
    names.forEach(function (name) {
      result[name] = gl.getUniformLocation(program, name);
    });
    return result;
  }

  function mount(canvas) {
    if (!canvas || canvas.dataset.galaxyMounted === 'true') return;

    const background = canvas.parentElement;
    const interactionTarget = canvas.closest('.wiki-hero') || background;
    if (!background || !interactionTarget) return;
    const params = readParams(canvas);

    let gl;
    try {
      gl = canvas.getContext('webgl', {
        alpha: params.transparent,
        antialias: false,
        premultipliedAlpha: false,
        powerPreference: 'high-performance'
      });
    } catch (e) {
      return;
    }
    if (!gl) return;

    let program;
    try {
      program = createProgram(gl);
    } catch (e) {
      const loseContext = gl.getExtension('WEBGL_lose_context');
      if (loseContext) loseContext.loseContext();
      return;
    }

    canvas.dataset.galaxyMounted = 'true';
    const locations = uniformLocations(gl, program);
    const position = gl.getAttribLocation(program, 'position');
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1.0, -1.0,
      3.0, -1.0,
      -1.0, 3.0
    ]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    gl.useProgram(program);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0.0, 0.0, 0.0, 0.0);

    gl.uniform2f(locations.uFocal, params.focal[0], params.focal[1]);
    gl.uniform2f(locations.uRotation, params.rotation[0], params.rotation[1]);
    gl.uniform1f(locations.uDensity, params.density);
    gl.uniform1f(locations.uHueShift, params.hueShift);
    gl.uniform1f(locations.uSpeed, params.speed);
    gl.uniform1f(locations.uGlowIntensity, params.glowIntensity);
    gl.uniform1f(locations.uSaturation, params.saturation);
    gl.uniform1i(locations.uMouseRepulsion, params.mouseRepulsion ? 1 : 0);
    gl.uniform1f(locations.uTwinkleIntensity, params.twinkleIntensity);
    gl.uniform1f(locations.uRotationSpeed, params.rotationSpeed);
    gl.uniform1f(locations.uRepulsionStrength, params.repulsionStrength);
    gl.uniform1f(locations.uAutoCenterRepulsion, params.autoCenterRepulsion);
    gl.uniform1i(locations.uTransparent, params.transparent ? 1 : 0);

    const targetMouse = { x: 0.5, y: 0.5 };
    const smoothMouse = { x: 0.5, y: 0.5 };
    let targetMouseActive = 0.0;
    let smoothMouseActive = 0.0;
    let animationFrame = null;
    let isInViewport = true;
    let isDestroyed = false;

    function resize() {
      const rect = background.getBoundingClientRect();
      const width = Math.max(1, Math.round(rect.width));
      const height = Math.max(1, Math.round(rect.height));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
        gl.uniform3f(locations.uResolution, width, height, width / height);
      }
    }

    function shouldRender() {
      return !isDestroyed && isInViewport && !document.hidden;
    }

    function render(time) {
      animationFrame = null;
      if (!shouldRender()) return;

      const seconds = time * 0.001;
      const lerpFactor = 0.05;
      smoothMouse.x += (targetMouse.x - smoothMouse.x) * lerpFactor;
      smoothMouse.y += (targetMouse.y - smoothMouse.y) * lerpFactor;
      smoothMouseActive += (targetMouseActive - smoothMouseActive) * lerpFactor;

      gl.uniform1f(locations.uTime, seconds);
      gl.uniform1f(locations.uStarSpeed, seconds * params.starSpeed / 10.0);
      gl.uniform2f(locations.uMouse, smoothMouse.x, smoothMouse.y);
      gl.uniform1f(locations.uMouseActiveFactor, smoothMouseActive);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      animationFrame = window.requestAnimationFrame(render);
    }

    function start() {
      if (shouldRender() && animationFrame === null) {
        animationFrame = window.requestAnimationFrame(render);
      }
    }

    function stop() {
      if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }
    }

    function handleMouseMove(event) {
      const rect = background.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      targetMouse.x = (event.clientX - rect.left) / rect.width;
      targetMouse.y = 1.0 - (event.clientY - rect.top) / rect.height;
      targetMouseActive = 1.0;
    }

    function handleMouseLeave() {
      targetMouseActive = 0.0;
    }

    function handleVisibilityChange() {
      if (document.hidden) {
        stop();
      } else {
        start();
      }
    }

    interactionTarget.addEventListener('mousemove', handleMouseMove);
    interactionTarget.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    let resizeObserver = null;
    if (window.ResizeObserver) {
      resizeObserver = new window.ResizeObserver(resize);
      resizeObserver.observe(background);
    } else {
      window.addEventListener('resize', resize);
    }

    let viewportObserver = null;
    if (window.IntersectionObserver) {
      viewportObserver = new window.IntersectionObserver(function (entries) {
        isInViewport = entries[0].isIntersecting;
        if (isInViewport) {
          start();
        } else {
          stop();
        }
      });
      viewportObserver.observe(background);
    }

    function destroy() {
      if (isDestroyed) return;
      isDestroyed = true;
      stop();
      interactionTarget.removeEventListener('mousemove', handleMouseMove);
      interactionTarget.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pagehide', destroy);
      if (resizeObserver) resizeObserver.disconnect();
      if (viewportObserver) viewportObserver.disconnect();
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      const loseContext = gl.getExtension('WEBGL_lose_context');
      if (loseContext) loseContext.loseContext();
      delete canvas.dataset.galaxyMounted;
    }

    window.addEventListener('pagehide', destroy);
    resize();
    start();
  }

  window.stellar = window.stellar || {};
  window.stellar.galaxy = {
    mountAll: function (canvases) {
      Array.prototype.forEach.call(canvases || [], mount);
    }
  };
})();
