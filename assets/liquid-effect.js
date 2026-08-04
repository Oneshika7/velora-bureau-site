/**
 * Vanilla JS adaptation of LiquidHover WebGL Effect for Video Background
 */

function initLiquidEffect(videoElement, canvasElement) {
    const gl = canvasElement.getContext("webgl", { alpha: true });
    if (!gl) {
        console.warn("WebGL not supported");
        return;
    }
    
    gl.clearColor(0, 0, 0, 0);

    const extHalfFloat = gl.getExtension("OES_texture_half_float");
    gl.getExtension("OES_texture_half_float_linear");
    const extFloat = gl.getExtension("OES_texture_float");
    gl.getExtension("OES_texture_float_linear");
    gl.getExtension("WEBGL_color_buffer_float");

    const texType = extHalfFloat ? extHalfFloat.HALF_FLOAT_OES : (extFloat ? gl.FLOAT : gl.UNSIGNED_BYTE);

    const resolution = 10;
    const cursorSize = 50;
    const intensity = 50;

    const cp = intensity / 100;
    const params = {
        cursorRadiusPx: cursorSize,
        cursorPower: 5 + ((cp - 0.1) * (50 - 5)) / (1 - 0.1),
        distortionPower: intensity / 100,
    };
    const overscanFactor = 1.2;
    const innerScale = 5 / 6;
    const pointer = {
        x: window.innerWidth * 0.65,
        y: window.innerHeight * 0.5,
        dx: 0,
        dy: 0,
        moved: false,
    };
    const res = { w: 0, h: 0 };
    let outputColor, velocity, divergence, pressure;
    let videoTexture = null;
    let imgRatio = 1;
    let isHovering = false;
    let rafId = null;

    const VERT = `
precision highp float;
varying vec2 vUv;
attribute vec2 a_position;
varying vec2 vL;
varying vec2 vR;
varying vec2 vT;
varying vec2 vB;
uniform vec2 u_texel;
void main () {
  vUv = .5 * (a_position + 1.);
  vL = vUv - vec2(u_texel.x, 0.);
  vR = vUv + vec2(u_texel.x, 0.);
  vT = vUv + vec2(0., u_texel.y);
  vB = vUv - vec2(0., u_texel.y);
  gl_Position = vec4(a_position, 0., 1.);
}
`;
    const FRAG_ADVECT = `
precision highp float;
precision highp sampler2D;
varying vec2 vUv;
uniform sampler2D u_velocity_texture;
uniform sampler2D u_input_texture;
uniform vec2 u_texel;
uniform vec2 u_output_textel;
uniform float u_dt;
uniform float u_dissipation;
vec4 bilerp (sampler2D sam, vec2 uv, vec2 tsize) {
  vec2 st = uv / tsize - 0.5;
  vec2 iuv = floor(st);
  vec2 fuv = fract(st);
  vec4 a = texture2D(sam, (iuv + vec2(0.5, 0.5)) * tsize);
  vec4 b = texture2D(sam, (iuv + vec2(1.5, 0.5)) * tsize);
  vec4 c = texture2D(sam, (iuv + vec2(0.5, 1.5)) * tsize);
  vec4 d = texture2D(sam, (iuv + vec2(1.5, 1.5)) * tsize);
  return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);
}
void main () {
  vec2 coord = vUv - u_dt * bilerp(u_velocity_texture, vUv, u_texel).xy * u_texel;
  vec4 velocity = bilerp(u_input_texture, coord, u_output_textel);
  gl_FragColor = u_dissipation * velocity;
}
`;
    const FRAG_DIVERGENCE = `
precision highp float;
precision highp sampler2D;
varying highp vec2 vUv;
varying highp vec2 vL;
varying highp vec2 vR;
varying highp vec2 vT;
varying highp vec2 vB;
uniform sampler2D u_velocity_texture;
void main () {
  float L = texture2D(u_velocity_texture, vL).x;
  float R = texture2D(u_velocity_texture, vR).x;
  float T = texture2D(u_velocity_texture, vT).y;
  float B = texture2D(u_velocity_texture, vB).y;
  float div = .25 * (R - L + T - B);
  gl_FragColor = vec4(div, 0., 0., 1.);
}
`;
    const FRAG_PRESSURE = `
precision highp float;
precision highp sampler2D;
varying highp vec2 vUv;
varying highp vec2 vL;
varying highp vec2 vR;
varying highp vec2 vT;
varying highp vec2 vB;
uniform sampler2D u_pressure_texture;
uniform sampler2D u_divergence_texture;
void main () {
  float L = texture2D(u_pressure_texture, vL).x;
  float R = texture2D(u_pressure_texture, vR).x;
  float T = texture2D(u_pressure_texture, vT).x;
  float B = texture2D(u_pressure_texture, vB).x;
  float divergence = texture2D(u_divergence_texture, vUv).x;
  float pressure = (L + R + B + T - divergence) * .25;
  gl_FragColor = vec4(pressure, 0., 0., 1.);
}
`;
    const FRAG_GRAD_SUB = `
precision highp float;
precision highp sampler2D;
varying highp vec2 vUv;
varying highp vec2 vL;
varying highp vec2 vR;
varying highp vec2 vT;
varying highp vec2 vB;
uniform sampler2D u_pressure_texture;
uniform sampler2D u_velocity_texture;
void main () {
  float L = texture2D(u_pressure_texture, vL).x;
  float R = texture2D(u_pressure_texture, vR).x;
  float T = texture2D(u_pressure_texture, vT).x;
  float B = texture2D(u_pressure_texture, vB).x;
  vec2 velocity = texture2D(u_velocity_texture, vUv).xy;
  velocity.xy -= vec2(R - L, T - B);
  gl_FragColor = vec4(velocity, 0., 1.);
}
`;
    const FRAG_POINT = `
precision highp float;
precision highp sampler2D;
varying vec2 vUv;
uniform sampler2D u_input_texture;
uniform float u_ratio;
uniform vec3 u_point_value;
uniform vec2 u_point;
uniform float u_point_size;
void main () {
  vec2 p = vUv - u_point.xy;
  p.x *= u_ratio;
  vec3 splat = .6 * pow(2., -dot(p, p) / u_point_size) * u_point_value;
  vec3 base = texture2D(u_input_texture, vUv).xyz;
  gl_FragColor = vec4(base + splat, 1.);
}
`;
    const FRAG_OUTPUT = `
precision highp float;
precision highp sampler2D;
varying vec2 vUv;
uniform float u_ratio;
uniform float u_img_ratio;
uniform float u_disturb_power;
uniform sampler2D u_output_texture;
uniform sampler2D u_velocity_texture;
uniform sampler2D u_text_texture;
uniform vec2 u_point;
uniform float u_canvas_scale;
uniform float u_inner_scale;
vec2 get_img_uv() {
  vec2 uv = vUv - 0.5;
  uv *= u_canvas_scale;
  uv /= u_inner_scale;
  float containerAspect = u_ratio;
  float imageAspect = u_img_ratio;
  vec2 scale = vec2(1.0);
  if (containerAspect > imageAspect) {
    scale.y = imageAspect / containerAspect;
  } else {
    scale.x = containerAspect / imageAspect;
  }
  uv *= scale;
  return uv + 0.5;
}
vec2 get_frame_uv() {
  vec2 uv = vUv - 0.5;
  uv *= u_canvas_scale;
  uv /= u_inner_scale;
  return uv + 0.5;
}
float get_img_frame_alpha(vec2 uv, float img_frame_width) {
  float img_frame_alpha = smoothstep(0., img_frame_width, uv.x) * smoothstep(1., 1. - img_frame_width, uv.x);
  img_frame_alpha *= smoothstep(0., img_frame_width, uv.y) * smoothstep(1., 1. - img_frame_width, uv.y);
  return img_frame_alpha;
}
vec3 sample_image_smooth(vec2 uv) {
  vec2 uvc = clamp(uv, 0.0, 1.0);
  // Video textures usually don't need Y flip in the same way, but let's keep the original logic
  vec3 base = texture2D(u_text_texture, vec2(uvc.x, 1.0 - uvc.y)).rgb;
  float yBelow = step(uv.y, 0.0);
  float yAbove = step(1.0, uv.y);
  float xLeft = step(uv.x, 0.0);
  float xRight = step(1.0, uv.x);
  float outOfBounds = max(max(yBelow, yAbove), max(xLeft, xRight));
  if (outOfBounds > 0.0) {
    float d = 0.002;
    vec3 sum = vec3(0.0);
    sum += texture2D(u_text_texture, vec2(clamp(uvc.x - d, 0.0, 1.0), 1.0 - clamp(uvc.y - d, 0.0, 1.0))).rgb;
    sum += texture2D(u_text_texture, vec2(clamp(uvc.x, 0.0, 1.0), 1.0 - clamp(uvc.y - d, 0.0, 1.0))).rgb;
    sum += texture2D(u_text_texture, vec2(clamp(uvc.x + d, 0.0, 1.0), 1.0 - clamp(uvc.y - d, 0.0, 1.0))).rgb;
    sum += texture2D(u_text_texture, vec2(clamp(uvc.x - d, 0.0, 1.0), 1.0 - clamp(uvc.y, 0.0, 1.0))).rgb;
    sum += texture2D(u_text_texture, vec2(clamp(uvc.x, 0.0, 1.0), 1.0 - clamp(uvc.y, 0.0, 1.0))).rgb;
    sum += texture2D(u_text_texture, vec2(clamp(uvc.x + d, 0.0, 1.0), 1.0 - clamp(uvc.y, 0.0, 1.0))).rgb;
    sum += texture2D(u_text_texture, vec2(clamp(uvc.x - d, 0.0, 1.0), 1.0 - clamp(uvc.y + d, 0.0, 1.0))).rgb;
    sum += texture2D(u_text_texture, vec2(clamp(uvc.x, 0.0, 1.0), 1.0 - clamp(uvc.y + d, 0.0, 1.0))).rgb;
    sum += texture2D(u_text_texture, vec2(clamp(uvc.x + d, 0.0, 1.0), 1.0 - clamp(uvc.y + d, 0.0, 1.0))).rgb;
    base = sum / 9.0;
  }
  return base;
}
void main () {
  float offset = texture2D(u_output_texture, vUv).r;
  vec2 velocity = texture2D(u_velocity_texture, vUv).xy;
  velocity += .001;
  vec2 img_uv = get_img_uv();
  img_uv -= u_disturb_power * normalize(velocity) * offset;
  img_uv -= u_disturb_power * normalize(velocity) * offset;
  vec2 frame_uv = get_frame_uv();
  frame_uv -= u_disturb_power * normalize(velocity) * offset;
  vec3 img = sample_image_smooth(img_uv);
  float opacity = get_img_frame_alpha(frame_uv, .002);
  gl_FragColor = vec4(img * opacity, opacity);
}
`;

    function createShader(source, type) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            throw new Error(gl.getShaderInfoLog(shader));
        }
        return shader;
    }

    function createProgramFromSources(vsSource, fsSource) {
        const program = gl.createProgram();
        const vs = createShader(vsSource, gl.VERTEX_SHADER);
        const fs = createShader(fsSource, gl.FRAGMENT_SHADER);
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.bindAttribLocation(program, 0, "a_position");
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            throw new Error(gl.getProgramInfoLog(program));
        }
        const uniforms = {};
        const uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
        for (let i = 0; i < uniformCount; i++) {
            const active = gl.getActiveUniform(program, i);
            if (!active) continue;
            uniforms[active.name] = gl.getUniformLocation(program, active.name);
        }
        return { program, uniforms };
    }

    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
    
    const ebo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);

    function blit(target = null) {
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(0);
        
        if (target == null) {
            gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        } else {
            gl.viewport(0, 0, target.width, target.height);
            gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
        }
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    }

    function createFBO(w, h) {
        gl.activeTexture(gl.TEXTURE0);
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, w, h, 0, gl.RGB, texType, null);
        const fbo = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
        gl.viewport(0, 0, w, h);
        gl.clear(gl.COLOR_BUFFER_BIT);
        return {
            fbo, width: w, height: h,
            attach(id) {
                gl.activeTexture(gl.TEXTURE0 + id);
                gl.bindTexture(gl.TEXTURE_2D, texture);
                return id;
            },
        };
    }

    function createDoubleFBO(w, h) {
        let fbo1 = createFBO(w, h);
        let fbo2 = createFBO(w, h);
        return {
            width: w, height: h,
            texelSizeX: 1 / w, texelSizeY: 1 / h,
            read: () => fbo1, write: () => fbo2,
            swap() { let tmp = fbo1; fbo1 = fbo2; fbo2 = tmp; },
        };
    }

    const splatProgram = createProgramFromSources(VERT, FRAG_POINT);
    const divergenceProgram = createProgramFromSources(VERT, FRAG_DIVERGENCE);
    const pressureProgram = createProgramFromSources(VERT, FRAG_PRESSURE);
    const gradientSubtractProgram = createProgramFromSources(VERT, FRAG_GRAD_SUB);
    const advectionProgram = createProgramFromSources(VERT, FRAG_ADVECT);
    const displayProgram = createProgramFromSources(VERT, FRAG_OUTPUT);

    resizeCanvas();
    initFBOs();
    setupEvents();
    setupVideoTexture();
    render(0);

    function initFBOs() {
        outputColor = createDoubleFBO(res.w, res.h);
        velocity = createDoubleFBO(res.w, res.h);
        divergence = createFBO(res.w, res.h);
        pressure = createDoubleFBO(res.w, res.h);
    }

    function updatePointerPosition(eX, eY) {
        pointer.moved = true;
        pointer.dx = 6 * (eX - pointer.x);
        pointer.dy = 6 * (eY - pointer.y);
        pointer.x = eX;
        pointer.y = eY;
    }

    function setupEvents() {
        const container = window;
        const onEnter = () => { isHovering = true; };
        const onLeave = () => { isHovering = false; pointer.moved = false; };
        const onMove = (e) => {
            isHovering = true;
            updatePointerPosition(e.clientX, e.clientY);
        };
        const onTouchMove = (e) => {
            isHovering = true;
            const t = e.targetTouches[0];
            updatePointerPosition(t.clientX, t.clientY);
        };
        let resizeTimeout;
        const onResize = () => {
            if (resizeTimeout) clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                resizeCanvas();
                initFBOs();
            }, 100);
        };

        window.addEventListener("mouseenter", onEnter);
        window.addEventListener("mouseleave", onLeave);
        window.addEventListener("mousemove", onMove);
        window.addEventListener("touchmove", onTouchMove, { passive: true });
        window.addEventListener("resize", onResize);
    }

    function resizeCanvas() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvasElement.width = Math.max(2, Math.round(width * overscanFactor * dpr));
        canvasElement.height = Math.max(2, Math.round(height * overscanFactor * dpr));
        const cssW = width * overscanFactor;
        const cssH = height * overscanFactor;
        canvasElement.style.width = `${cssW}px`;
        canvasElement.style.height = `${cssH}px`;
        
        // Centering the oversized canvas
        canvasElement.style.position = 'fixed';
        canvasElement.style.left = `-${(cssW - width) / 2}px`;
        canvasElement.style.top = `-${(cssH - height) / 2}px`;

        const ratio = cssW / cssH;
        const baseResolution = 128 + ((resolution - 1) * (512 - 128)) / 9;
        res.w = Math.round(baseResolution * ratio);
        res.h = Math.round(baseResolution);
    }

    function getPointerUV() {
        const cssW = window.innerWidth * overscanFactor;
        const cssH = window.innerHeight * overscanFactor;
        const dx = 0.5 * (cssW - window.innerWidth);
        const dy = 0.5 * (cssH - window.innerHeight);
        const u = (pointer.x + dx) / cssW;
        const v = 1 - (pointer.y + dy) / cssH;
        return { u, v };
    }

    function setupVideoTexture() {
        videoTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, videoTexture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }

    let videoReady = false;
    let debugText = "Initializing...";
    const debugDiv = document.createElement('div');
    debugDiv.style.position = 'fixed';
    debugDiv.style.top = '10px';
    debugDiv.style.left = '10px';
    debugDiv.style.color = '#fff';
    debugDiv.style.background = 'rgba(255,0,0,0.8)';
    debugDiv.style.padding = '10px';
    debugDiv.style.zIndex = '9999';
    debugDiv.style.fontFamily = 'monospace';
    document.body.appendChild(debugDiv);

    function updateVideoTexture() {
        if (videoElement.readyState >= 2) {
            try {
                imgRatio = videoElement.videoWidth / Math.max(1, videoElement.videoHeight);
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, videoTexture);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, videoElement);
                videoReady = true;
                debugDiv.style.display = 'none'; // Hide if successful
            } catch (e) {
                videoReady = false;
                debugText = "WebGL Error: " + e.message;
                debugDiv.innerText = debugText;
                debugDiv.style.display = 'block';
            }
        } else {
            debugText = "Waiting for video. readyState: " + videoElement.readyState;
            debugDiv.innerText = debugText;
        }
    }

    function render(_t) {
        updateVideoTexture();

        if (!videoReady) {
            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            rafId = requestAnimationFrame(render);
            return;
        }

        const dt = 1 / 60;
        if (pointer.moved) {
            pointer.moved = false;
            gl.useProgram(splatProgram.program);
            gl.uniform1i(splatProgram.uniforms.u_input_texture, velocity.read().attach(1));
            gl.uniform1f(splatProgram.uniforms.u_ratio, window.innerWidth / Math.max(1, window.innerHeight));
            const uv = getPointerUV();
            gl.uniform2f(splatProgram.uniforms.u_point, uv.u, uv.v);
            gl.uniform3f(splatProgram.uniforms.u_point_value, pointer.dx, -pointer.dy, 0);
            const ch = Math.max(1, window.innerHeight);
            const rr = params.cursorRadiusPx / ch;
            gl.uniform1f(splatProgram.uniforms.u_point_size, rr * rr);
            blit(velocity.write());
            velocity.swap();
            gl.uniform1i(splatProgram.uniforms.u_input_texture, outputColor.read().attach(1));
            gl.uniform3f(splatProgram.uniforms.u_point_value, params.cursorPower * 0.001, 0, 0);
            blit(outputColor.write());
            outputColor.swap();
        }
        gl.useProgram(divergenceProgram.program);
        gl.uniform2f(divergenceProgram.uniforms.u_texel, velocity.texelSizeX, velocity.texelSizeY);
        gl.uniform1i(divergenceProgram.uniforms.u_velocity_texture, velocity.read().attach(1));
        blit(divergence);
        gl.useProgram(pressureProgram.program);
        gl.uniform2f(pressureProgram.uniforms.u_texel, velocity.texelSizeX, velocity.texelSizeY);
        gl.uniform1i(pressureProgram.uniforms.u_divergence_texture, divergence.attach(1));
        for (let i = 0; i < 16; i++) {
            gl.uniform1i(pressureProgram.uniforms.u_pressure_texture, pressure.read().attach(2));
            blit(pressure.write());
            pressure.swap();
        }
        gl.useProgram(gradientSubtractProgram.program);
        gl.uniform2f(gradientSubtractProgram.uniforms.u_texel, velocity.texelSizeX, velocity.texelSizeY);
        gl.uniform1i(gradientSubtractProgram.uniforms.u_pressure_texture, pressure.read().attach(1));
        gl.uniform1i(gradientSubtractProgram.uniforms.u_velocity_texture, velocity.read().attach(2));
        blit(velocity.write());
        velocity.swap();
        gl.useProgram(advectionProgram.program);
        gl.uniform2f(advectionProgram.uniforms.u_texel, velocity.texelSizeX, velocity.texelSizeY);
        gl.uniform2f(advectionProgram.uniforms.u_output_textel, velocity.texelSizeX, velocity.texelSizeY);
        gl.uniform1i(advectionProgram.uniforms.u_velocity_texture, velocity.read().attach(1));
        gl.uniform1i(advectionProgram.uniforms.u_input_texture, velocity.read().attach(1));
        gl.uniform1f(advectionProgram.uniforms.u_dt, dt);
        gl.uniform1f(advectionProgram.uniforms.u_dissipation, 0.97);
        blit(velocity.write());
        velocity.swap();
        gl.useProgram(advectionProgram.program);
        gl.uniform2f(advectionProgram.uniforms.u_output_textel, outputColor.texelSizeX, outputColor.texelSizeY);
        gl.uniform1i(advectionProgram.uniforms.u_input_texture, outputColor.read().attach(2));
        gl.uniform1f(advectionProgram.uniforms.u_dt, 8 * dt);
        gl.uniform1f(advectionProgram.uniforms.u_dissipation, 0.98);
        blit(outputColor.write());
        outputColor.swap();
        gl.useProgram(displayProgram.program);
        const uv2 = getPointerUV();
        gl.uniform2f(displayProgram.uniforms.u_point, uv2.u, uv2.v);
        gl.uniform1i(displayProgram.uniforms.u_velocity_texture, velocity.read().attach(2));
        gl.uniform1f(displayProgram.uniforms.u_ratio, window.innerWidth / Math.max(1, window.innerHeight));
        gl.uniform1f(displayProgram.uniforms.u_img_ratio, imgRatio);
        gl.uniform1f(displayProgram.uniforms.u_disturb_power, params.distortionPower);
        gl.uniform1i(displayProgram.uniforms.u_output_texture, outputColor.read().attach(1));
        gl.uniform1f(displayProgram.uniforms.u_canvas_scale, 1);
        gl.uniform1f(displayProgram.uniforms.u_inner_scale, innerScale);
        if (videoTexture) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, videoTexture);
            gl.uniform1i(displayProgram.uniforms.u_text_texture, 0);
        }
        blit();
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
        
        rafId = requestAnimationFrame(render);
    }
}

function startLiquidEngine() {
    const video = document.getElementById('partner-video-element');
    const canvas = document.getElementById('partner-canvas');
    if (video && canvas) {
        try {
            initLiquidEffect(video, canvas);
        } catch (e) {
            const debugDiv = document.createElement('div');
            debugDiv.style.position = 'fixed';
            debugDiv.style.top = '10px';
            debugDiv.style.left = '10px';
            debugDiv.style.color = '#fff';
            debugDiv.style.background = 'rgba(255,0,0,0.8)';
            debugDiv.style.padding = '10px';
            debugDiv.style.zIndex = '9999';
            debugDiv.style.fontFamily = 'monospace';
            debugDiv.innerText = "WebGL Init Error: " + e.message;
            document.body.appendChild(debugDiv);
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startLiquidEngine);
} else {
    startLiquidEngine();
}
