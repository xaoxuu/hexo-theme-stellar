/* Adapted from React Bits Strands (MIT, Copyright (c) 2026 David Haz).
 * See legal/THIRD-PARTY-NOTICES.md. Native WebGL2 renderer for Stellar. */

const VERT = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAG = `#version 300 es
precision highp float;

uniform float uTime;
uniform vec2 uResolution;
uniform vec3 uColors[8];
uniform int uColorCount;
uniform int uStrandCount;
uniform float uSpeed;
uniform float uAmplitude;
uniform float uWaviness;
uniform float uThickness;
uniform float uGlow;
uniform float uTaper;
uniform float uSpread;
uniform float uHueShift;
uniform float uIntensity;
uniform float uOpacity;
uniform float uScale;
uniform float uSaturation;

out vec4 fragColor;

const float PI = 3.14159265;

vec3 spectrum(float t) {
  return 0.5 + 0.5 * cos(2.0 * PI * (t + vec3(0.00, 0.33, 0.67)));
}

vec3 samplePalette(float t) {
  t = fract(t);
  float scaled = t * float(uColorCount);
  int idx = int(floor(scaled));
  float blend = fract(scaled);
  int nextIdx = idx + 1;
  if (nextIdx >= uColorCount) nextIdx = 0;
  return mix(uColors[idx], uColors[nextIdx], blend);
}

vec3 strandColor(float t) {
  if (uColorCount > 0) return samplePalette(t);
  return spectrum(t);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y;
  uv /= max(uScale, 0.0001);

  float e = 0.06 + uIntensity * 0.94;
  float env = pow(max(cos(uv.x * PI * 1.3), 0.0), uTaper);

  vec3 col = vec3(0.0);

  for (int i = 0; i < 12; i++) {
    if (i >= uStrandCount) break;

    float fi = float(i);
    float ph = fi * 1.7 * uSpread;
    float freq = (2.0 + fi * 0.35) * uWaviness;
    float spd = 1.4 + fi * 1.2;

    float tt = uTime * uSpeed;
    float w = sin(uv.x * freq + tt * spd + ph) * 0.60
            + sin(uv.x * freq * 1.1 - tt * spd * 0.7 + ph * 1.7) * 0.40;

    float amp = (0.1 + 0.02 * e) * env * uAmplitude;
    float y = w * amp;

    float d = abs(uv.y - y);
    float thick = (0.001 + 0.05 * e) * (0.35 + env) * uThickness;
    float g = thick / (d + thick * 0.45);
    g = g * g;

    float h = fi / float(uStrandCount) + uv.x * 0.30 + uTime * 0.04 + uHueShift;
    col += strandColor(h) * g * env;
  }

  col *= 0.45 + 0.7 * e;
  col = 1.0 - exp(-col * uGlow);

  float gray = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col = max(mix(vec3(gray), col, uSaturation), 0.0);

  float lum = max(max(col.r, col.g), col.b);
  float alpha = clamp(lum, 0.0, 1.0) * uOpacity;

  fragColor = vec4(col * uOpacity, alpha);
}
`;

const GLASS_FRAG = `#version 300 es
precision highp float;

uniform sampler2D uScene;
uniform vec2 uResolution;
uniform float uRadius;
uniform float uRefraction;
uniform float uDispersion;

out vec4 fragColor;

vec2 toUv(vec2 p) {
  return p * (uResolution.y / uResolution) + 0.5;
}

void main() {
  vec2 p = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y;
  float d = length(p);
  float r = uRadius;

  float edge = fwidth(d) * 1.5;
  float mask = 1.0 - smoothstep(r - edge, r + edge, d);
  if (mask <= 0.0) {
    fragColor = vec4(0.0);
    return;
  }

  // sphere height: 0 at the rim, 1 at the center
  float z = sqrt(max(r * r - d * d, 0.0)) / r;
  float nd = d / r; // 0 at the center, 1 at the rim

  // refraction is confined to a narrow band near the rim; the rest stays undistorted
  vec2 dir = d > 0.0 ? p / d : vec2(0.0);
  float lens = smoothstep(0.85, 1.0, nd) * pow(nd, 6.0);
  vec2 offset = -dir * lens * uRefraction * 0.15;
  vec2 disp = -dir * lens * uDispersion * 0.012;

  vec3 light;
  light.r = texture(uScene, toUv(p + offset - disp)).r;
  light.g = texture(uScene, toUv(p + offset)).g;
  light.b = texture(uScene, toUv(p + offset + disp)).b;

  // neutral fresnel rim (no color tint so the glass stays clear)
  float fres = pow(1.0 - z, 3.0);
  vec3 rim = vec3(1.0) * fres * 0.18;

  // specular highlight from the upper-left
  vec2 lightDir = normalize(vec2(-0.55, 0.6));
  float spec = pow(max(dot(p / max(r, 1e-4), lightDir), 0.0), 6.0);
  spec *= (1.0 - smoothstep(r * 0.55, r, d));

  vec3 emissive = light + rim + vec3(spec) * 0.4;
  float emissiveA = clamp(max(max(emissive.r, emissive.g), emissive.b), 0.0, 1.0);

  // almost clear glass body: only a faint neutral darkening, mostly near the rim
  float bodyA = 0.05 + fres * 0.05;

  // composite emissive light over the clear body (premultiplied)
  float outA = emissiveA + bodyA * (1.0 - emissiveA);
  vec3 outRGB = emissive;

  outRGB *= mask;
  outA *= mask;

  fragColor = vec4(outRGB, outA);
}
`;

export function createRenderer(canvas, options, defaults) {
  if (!canvas) return null;
  let gl;
  try {
    gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false });
  } catch {
    return null;
  }
  if (!gl) return null;
  const params = { ...defaults, ...options };
  const programs = [];
  const shaders = [];
  let buffer;
  let texture;
  let framebuffer;
  let destroyed = false;

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    if (buffer) gl.deleteBuffer(buffer);
    if (texture) gl.deleteTexture(texture);
    if (framebuffer) gl.deleteFramebuffer(framebuffer);
    programs.forEach(program => gl.deleteProgram(program));
    shaders.forEach(shader => gl.deleteShader(shader));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  }

  function programFor(fragment) {
    const program = gl.createProgram();
    programs.push(program);
    for (const [type, source] of [[gl.VERTEX_SHADER, VERT], [gl.FRAGMENT_SHADER, fragment]]) {
      const shader = gl.createShader(type);
      shaders.push(shader);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
      gl.attachShader(program, shader);
    }
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
    return program;
  }

  try {
    const scene = programFor(FRAG);
    const glass = params.glass ? programFor(GLASS_FRAG) : null;
    buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    function use(program) {
      gl.useProgram(program);
      const position = gl.getAttribLocation(program, 'position');
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    }
    function scalar(program, name, value) {
      gl.uniform1f(gl.getUniformLocation(program, name), value);
    }
    use(scene);
    const palette = params.colors.slice(0, 8);
    const colors = Array.from({ length: 8 }, (_, index) => {
      const hex = (palette[index] || palette[palette.length - 1] || '#ffffff').replace(/^#/, '');
      return [0, 2, 4].map(offset => parseInt(hex.slice(offset, offset + 2), 16) / 255);
    }).flat();
    gl.uniform3fv(gl.getUniformLocation(scene, 'uColors[0]'), colors);
    gl.uniform1i(gl.getUniformLocation(scene, 'uColorCount'), palette.length);
    gl.uniform1i(gl.getUniformLocation(scene, 'uStrandCount'), Math.min(12, Math.max(1, Math.round(params.count))));
    for (const name of ['speed', 'amplitude', 'waviness', 'thickness', 'glow', 'taper', 'spread', 'hueShift', 'intensity', 'opacity', 'scale', 'saturation']) {
      let value = params[name];
      if (name !== 'speed' && name !== 'hueShift') value = Math.max(0, value);
      if (name === 'thickness' || name === 'scale') value = Math.max(0.0001, value);
      if (name === 'opacity') value = Math.min(1, value);
      scalar(scene, `u${name[0].toUpperCase()}${name.slice(1)}`, value);
    }
    const timeLocation = gl.getUniformLocation(scene, 'uTime');
    if (glass) {
      use(glass);
      scalar(glass, 'uRadius', Math.max(0.0001, 0.46 * params.glassSize));
      scalar(glass, 'uRefraction', params.refraction);
      scalar(glass, 'uDispersion', params.dispersion);
      gl.uniform1i(gl.getUniformLocation(glass, 'uScene'), 0);
      texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      framebuffer = gl.createFramebuffer();
    }
    let width = 0;
    let height = 0;
    return Object.freeze({
      pointer: false,
      resize(rect, devicePixelRatio) {
        const dpr = Math.min(devicePixelRatio || 1, 2);
        const nextWidth = Math.max(1, Math.round(rect.width * dpr));
        const nextHeight = Math.max(1, Math.round(rect.height * dpr));
        if (width === nextWidth && height === nextHeight) return;
        width = canvas.width = nextWidth;
        height = canvas.height = nextHeight;
        gl.viewport(0, 0, width, height);
        for (const program of [scene, glass].filter(Boolean)) {
          use(program);
          gl.uniform2f(gl.getUniformLocation(program, 'uResolution'), width, height);
        }
        if (glass) {
          gl.bindTexture(gl.TEXTURE_2D, texture);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
          gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
          gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
          gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        }
      },
      render(time) {
        if (destroyed) return;
        use(scene);
        gl.bindFramebuffer(gl.FRAMEBUFFER, glass ? framebuffer : null);
        gl.uniform1f(timeLocation, time * 0.001);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        if (glass) {
          use(glass);
          gl.bindFramebuffer(gl.FRAMEBUFFER, null);
          gl.bindTexture(gl.TEXTURE_2D, texture);
          gl.drawArrays(gl.TRIANGLES, 0, 3);
        }
      },
      destroy
    });
  } catch {
    destroy();
    return null;
  }
}
