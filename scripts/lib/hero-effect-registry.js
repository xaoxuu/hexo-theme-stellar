"use strict";

const INTERNAL = require("./internal-constants");
const OPTION_TYPES = new Set([
  "boolean",
  "enum",
  "hex_color",
  "hex_color_array",
  "nullable_positive_number",
  "nullable_string",
  "number",
  "number_array"
]);

function deepFreeze(value) {
  if (value == null || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.values(value).forEach(deepFreeze);
  return Object.freeze(value);
}

function optionMatches(rule, value) {
  if (rule.type === "boolean") return typeof value === "boolean";
  if (rule.type === "number") return typeof value === "number" && Number.isFinite(value);
  if (rule.type === "nullable_positive_number") {
    return value === null || (typeof value === "number" && Number.isFinite(value) && value > 0);
  }
  if (rule.type === "nullable_string") return value === null || (typeof value === "string" && value.trim().length > 0);
  if (rule.type === "number_array") {
    return Array.isArray(value) && value.every(item => typeof item === "number" && Number.isFinite(item));
  }
  if (rule.type === "enum") return typeof value === "string" && rule.values.includes(value);
  if (rule.type === "hex_color") return typeof value === "string" && /^#?[a-f\d]{6}$/i.test(value);
  if (rule.type === "hex_color_array") {
    return Array.isArray(value)
      && value.length >= 1
      && value.length <= 8
      && value.every(item => typeof item === "string" && /^#?[a-f\d]{6}$/i.test(item));
  }
  return false;
}

function defineHeroEffects(definitions) {
  const ids = new Set();
  for (const definition of definitions) {
    if (typeof definition.id !== "string" || !/^[a-z][a-z0-9-]*$/.test(definition.id)) {
      throw new TypeError("[stellar hero effects] id is invalid");
    }
    if (ids.has(definition.id)) throw new TypeError(`[stellar hero effects] duplicate id ${definition.id}`);
    ids.add(definition.id);
    if (typeof definition.label !== "string" || definition.label.length === 0) {
      throw new TypeError(`[stellar hero effects] ${definition.id} label is invalid`);
    }
    if (typeof definition.module !== "string" || !definition.module.startsWith("/js/runtime/hero-effects/") || !definition.module.endsWith(".js")) {
      throw new TypeError(`[stellar hero effects] ${definition.id} module is invalid`);
    }
    if (definition.options == null || typeof definition.options !== "object" || Array.isArray(definition.options)) {
      throw new TypeError(`[stellar hero effects] ${definition.id} options are invalid`);
    }
    if (definition.defaults == null || typeof definition.defaults !== "object" || Array.isArray(definition.defaults)) {
      throw new TypeError(`[stellar hero effects] ${definition.id} defaults are invalid`);
    }
    for (const [key, rule] of Object.entries(definition.options)) {
      if (!rule || !OPTION_TYPES.has(rule.type)) {
        throw new TypeError(`[stellar hero effects] ${definition.id}.${key} option rule is invalid`);
      }
      if (rule.type === "enum" && (!Array.isArray(rule.values) || rule.values.length === 0)) {
        throw new TypeError(`[stellar hero effects] ${definition.id}.${key} enum is empty`);
      }
      if (!Object.prototype.hasOwnProperty.call(definition.defaults, key) || !optionMatches(rule, definition.defaults[key])) {
        throw new TypeError(`[stellar hero effects] ${definition.id}.${key} default is invalid`);
      }
    }
    const unknownDefault = Object.keys(definition.defaults).find(key => !definition.options[key]);
    if (unknownDefault) throw new TypeError(`[stellar hero effects] ${definition.id}.${unknownDefault} default is not declared`);
    if (typeof definition.presentation !== "function") {
      throw new TypeError(`[stellar hero effects] ${definition.id} presentation is invalid`);
    }
  }
  return deepFreeze(definitions.slice());
}

const LIGHT_RAYS_ORIGINS = Object.freeze([
  "top-left",
  "top-center",
  "top-right",
  "left",
  "right",
  "bottom-left",
  "bottom-center",
  "bottom-right"
]);

const DEFINITIONS = defineHeroEffects([
  {
    id: "galaxy",
    label: "Galaxy",
    module: INTERNAL.assets.heroEffects.galaxy,
    options: {
      focal: { type: "number_array" },
      rotation: { type: "number_array" },
      starSpeed: { type: "number" },
      density: { type: "number" },
      hueShift: { type: "number" },
      disableAnimation: { type: "boolean" },
      speed: { type: "number" },
      mouseInteraction: { type: "boolean" },
      glowIntensity: { type: "number" },
      saturation: { type: "number" },
      mouseRepulsion: { type: "boolean" },
      repulsionStrength: { type: "number" },
      twinkleIntensity: { type: "number" },
      rotationSpeed: { type: "number" },
      autoCenterRepulsion: { type: "number" },
      transparent: { type: "boolean" }
    },
    defaults: {
      focal: [0.5, 0.5],
      rotation: [1, 0],
      starSpeed: 2,
      density: 2,
      hueShift: 140,
      disableAnimation: false,
      speed: 0.5,
      mouseInteraction: true,
      glowIntensity: 0.2,
      saturation: 0.1,
      mouseRepulsion: true,
      twinkleIntensity: 0.1,
      rotationSpeed: 0.1,
      repulsionStrength: 0.1,
      autoCenterRepulsion: 0,
      transparent: true
    },
    presentation() {
      return { background: "#000000" };
    }
  },
  {
    id: "light-rays",
    label: "Light Rays",
    module: INTERNAL.assets.heroEffects.lightRays,
    options: {
      raysOrigin: { type: "enum", values: LIGHT_RAYS_ORIGINS },
      raysColor: { type: "hex_color" },
      raysSpeed: { type: "number" },
      lightSpread: { type: "number" },
      rayLength: { type: "number" },
      pulsating: { type: "boolean" },
      fadeDistance: { type: "number" },
      saturation: { type: "number" },
      followMouse: { type: "boolean" },
      mouseInfluence: { type: "number" },
      noiseAmount: { type: "number" },
      distortion: { type: "number" },
      lightMode: { type: "boolean" }
    },
    defaults: {
      raysOrigin: "top-center",
      raysColor: "#ffffff",
      raysSpeed: 1,
      lightSpread: 0.5,
      rayLength: 3,
      pulsating: false,
      fadeDistance: 1,
      saturation: 1,
      followMouse: true,
      mouseInfluence: 0.1,
      noiseAmount: 0,
      distortion: 0,
      lightMode: false
    },
    presentation(options) {
      return { background: options?.lightMode === true ? "#ffffff" : "#000000" };
    }
  },
  {
    id: "ferrofluid",
    label: "Ferrofluid",
    module: INTERNAL.assets.heroEffects.ferrofluid,
    options: {
      colors: { type: "hex_color_array" },
      backgroundColor: { type: "hex_color" },
      speed: { type: "number" },
      scale: { type: "number" },
      turbulence: { type: "number" },
      fluidity: { type: "number" },
      rimWidth: { type: "number" },
      sharpness: { type: "number" },
      shimmer: { type: "number" },
      glow: { type: "number" },
      flowDirection: { type: "enum", values: ["up", "down", "left", "right"] },
      opacity: { type: "number" },
      mouseInteraction: { type: "boolean" },
      mouseStrength: { type: "number" },
      mouseRadius: { type: "number" },
      mouseDampening: { type: "number" },
      paused: { type: "boolean" },
      dpr: { type: "nullable_positive_number" },
      mixBlendMode: { type: "nullable_string" }
    },
    defaults: {
      colors: ["#ffffff", "#ffffff", "#ffffff"],
      backgroundColor: "#03010A",
      speed: 0.5,
      scale: 1.6,
      turbulence: 1,
      fluidity: 0.1,
      rimWidth: 0.2,
      sharpness: 2.5,
      shimmer: 1.5,
      glow: 2,
      flowDirection: "down",
      opacity: 1,
      mouseInteraction: true,
      mouseStrength: 1,
      mouseRadius: 0.35,
      mouseDampening: 0.15,
      paused: false,
      dpr: null,
      mixBlendMode: null
    },
    presentation(options) {
      const color = typeof options?.backgroundColor === "string" ? options.backgroundColor : "#03010A";
      return { background: color.startsWith("#") ? color : `#${color}` };
    }
  }
]);

const BY_ID = new Map(DEFINITIONS.map(definition => [definition.id, definition]));
const HERO_EFFECT_IDS = Object.freeze(DEFINITIONS.map(definition => definition.id));

function getHeroEffectDefinition(id) {
  return BY_ID.get(id) || null;
}

function heroEffectDefinitions() {
  return DEFINITIONS.slice();
}

function projectHeroEffect(effect) {
  const definition = getHeroEffectDefinition(effect?.type);
  if (!definition) return effect;
  return {
    ...effect,
    presentation: definition.presentation(effect.options || {})
  };
}

module.exports = {
  HERO_EFFECT_IDS,
  getHeroEffectDefinition,
  heroEffectDefinitions,
  projectHeroEffect
};
