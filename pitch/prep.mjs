import sharp from 'sharp';
const round = async (src, out, { radius, crop, border = 0, borderColor = '#e5e7df' }) => {
  let img = sharp(`shots/${src}.png`);
  if (crop) img = img.extract(crop);
  const buf = await img.png().toBuffer();
  const { width, height } = await sharp(buf).metadata();
  const mask = Buffer.from(`<svg width="${width}" height="${height}"><rect width="${width}" height="${height}" rx="${radius}" ry="${radius}" fill="#fff"/></svg>`);
  let rounded = await sharp(buf).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
  if (border) {
    const ring = Buffer.from(`<svg width="${width}" height="${height}"><rect x="${border/2}" y="${border/2}" width="${width-border}" height="${height-border}" rx="${radius}" ry="${radius}" fill="none" stroke="${borderColor}" stroke-width="${border}"/></svg>`);
    rounded = await sharp(rounded).composite([{ input: ring }]).png().toBuffer();
  }
  await sharp(rounded).toFile(`assets/${out}.png`);
  console.log(out, width, height);
};
// phones: 780x1688 → rounded like a device screen
for (const n of ['mobile-today','mobile-checkin','mobile-toughday-strategies','mobile-night','mobile-today-night','mobile-circle-public','mobile-goals','mobile-help'])
  await round(n, n, { radius: 90, border: 10, borderColor: n.includes('night') ? '#3a362d' : '#dfe3da' });
// desktop: 2160x1350
await round('desktop-today', 'desktop-today', { radius: 36, border: 6 });
await round('desktop-patterns', 'desktop-patterns', { radius: 36, border: 6, crop: { left: 520, top: 0, width: 1640, height: 1350 } });
await round('desktop-report', 'desktop-report', { radius: 36, border: 6, crop: { left: 520, top: 0, width: 1640, height: 1350 } });
// logo petals (from Figma Brand SVG)
const petals = (fill) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width="512" height="512"><g fill="${fill}"><path d="M18 17.8C6 15.2 7 4.9 11.3 4.1c4.5-.9 6.4 5.7 6.7 13.7Z"/><path d="M18 17.8C30 15.2 29 4.9 24.7 4.1c-4.5-.9-6.4 5.7-6.7 13.7Z"/><path d="M18 18.2C6 20.8 7 31.1 11.3 31.9c4.5.9 6.4-5.7 6.7-13.7Z"/><path d="M18 18.2c12 2.6 11 12.9 6.7 13.7-4.5.9-6.4-5.7-6.7-13.7Z"/></g></svg>`;
for (const [n, c] of [['petals-forest', '#3F6959'], ['petals-cream', '#F8F5EF'], ['petals-peach', '#E9B9A0'], ['petals-amber', '#E0A46B'], ['petals-sage', '#DFEAE2']])
  await sharp(Buffer.from(petals(c))).png().toFile(`assets/${n}.png`);
// large faint petal motif for dark slides (white at low alpha baked in)
await sharp(Buffer.from(petals('rgba(255,255,255,0.07)'))).resize(1400, 1400).png().toFile('assets/petals-ghost.png');
console.log('done');
