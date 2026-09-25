// Read-only snapshot of the design source in Figma, run through use_figma
// (Figma file "Evrone Post Builder", key b98SroxNlvHXWPNKJLfUZ6).
// The result is compared with design/figma-baseline.json to find what changed
// since the last sync; see docs/figma-sync.md.

const rgbHex = c => '#' + [c.r, c.g, c.b].map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('').toUpperCase();

// Variables: every value per mode, plus the code name it maps to
const collections = await figma.variables.getLocalVariableCollectionsAsync();
const allVars = await Promise.all(collections.flatMap(c => c.variableIds).map(id => figma.variables.getVariableByIdAsync(id)));
const variables = {};
for (const c of collections) {
  for (const v of allVars.filter(v => v && v.variableCollectionId === c.id)) {
    const values = {};
    for (const m of c.modes) {
      const val = v.valuesByMode[m.modeId];
      values[m.name] = v.resolvedType === 'COLOR' ? rgbHex(val) : val;
    }
    variables[v.name] = { collection: c.name, code: v.codeSyntax.WEB || null, values };
  }
}

// Text styles
const textStyles = {};
for (const s of await figma.getLocalTextStylesAsync()) {
  textStyles[s.name] = {
    family: s.fontName.family, style: s.fontName.style, axes: s.fontName.variationSettings || null,
    size: s.fontSize, lineHeight: s.lineHeight, letterSpacing: s.letterSpacing, textCase: s.textCase,
  };
}

// Components and post templates: geometry that the code mirrors
const describe = n => {
  const o = { w: Math.round(n.width), h: Math.round(n.height) };
  if ('layoutMode' in n && n.layoutMode !== 'NONE') {
    Object.assign(o, { layout: n.layoutMode, gap: n.itemSpacing, pad: [n.paddingTop, n.paddingRight, n.paddingBottom, n.paddingLeft] });
  }
  if ('strokeWeight' in n && n.strokes && n.strokes.length) o.stroke = n.strokeWeight;
  if ('dashPattern' in n && n.dashPattern && n.dashPattern.length) o.dash = n.dashPattern;
  if ('cornerRadius' in n && typeof n.cornerRadius === 'number') o.radius = n.cornerRadius;
  const bound = n.boundVariables || {};
  const names = {};
  for (const [k, v] of Object.entries(bound)) {
    const ref = Array.isArray(v) ? v[0] : v;
    const found = ref && allVars.find(x => x && x.id === ref.id);
    if (found) names[k] = found.name;
  }
  if (Object.keys(names).length) o.vars = names;
  return o;
};
const componentsPage = figma.root.children.find(p => p.name === 'Components');
const templatesPage = figma.root.children.find(p => p.name === 'Post templates');
await componentsPage.loadAsync(); await templatesPage.loadAsync();
const components = {};
for (const n of componentsPage.findAllWithCriteria({ types: ['COMPONENT'] })) {
  const key = n.parent.type === 'COMPONENT_SET' ? `${n.parent.name} / ${n.name}` : n.name;
  components[key] = describe(n);
}
const templates = {};
for (const n of templatesPage.findAllWithCriteria({ types: ['COMPONENT'] })) {
  const key = n.parent.type === 'COMPONENT_SET' ? `${n.parent.name} / ${n.name}` : n.name;
  templates[key] = Object.fromEntries(n.children.map(c => [c.name, { x: Math.round(c.x), y: Math.round(c.y), ...describe(c) }]));
}

return { readAt: new Date().toISOString(), variables, textStyles, components, templates };
