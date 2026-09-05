"use strict";

const UI_CAPABILITIES = Object.freeze({
  interactive: "ui-interactive",
  interactiveSpotlight: "ui-interactive card-hover card-hover--spotlight",
  collectionItem: "ui-collection__item ui-interactive card-hover card-hover--spotlight",
  spotlight: "card-hover card-hover--spotlight",
  hoverCard: "card-hover card-hover--spotlight card-hover--tilt"
});

function appendTokens(target, value) {
  if (typeof value !== "string") return;
  for (const token of value.trim().split(/\s+/)) {
    if (token && !target.includes(token)) target.push(token);
  }
}

function composeUiClasses(baseClass, capability = "interactiveSpotlight", modifiers = "") {
  if (!Object.prototype.hasOwnProperty.call(UI_CAPABILITIES, capability)) {
    throw new TypeError(`unknown UI capability: ${capability}`);
  }
  const classes = [];
  appendTokens(classes, baseClass);
  appendTokens(classes, UI_CAPABILITIES[capability]);
  appendTokens(classes, modifiers);
  return classes.join(" ");
}

module.exports = {
  UI_CAPABILITIES,
  composeUiClasses
};
