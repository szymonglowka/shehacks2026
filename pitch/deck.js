// Otula pitch deck (ImpactHer @ HackYeah 2026). Build: node deck.js → otula-pitch.pptx
const pptxgen = require('pptxgenjs');
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const sharp = require('sharp');
const lu = require('react-icons/lu');
const { applyTheme } = require(
  '/Users/szymonglowka/Library/Application Support/Claude/local-agent-mode-sessions/skills-plugin/82d20b7b-5879-4b82-ada4-84195bbd6aef/e15bce50-1a38-4a0c-ab77-029cb5ae1121/skills/pptx/scripts/apply_theme.js',
);

// Brand palette from the Figma tokens (docs/design/README.md)
const THEME = {
  name: 'Otula',
  headFontFace: 'Georgia',
  bodyFontFace: 'Arial',
  colors: {
    dk1: '25342F', // ink
    lt1: 'FFFDF9', // paper
    dk2: '315648', // forest deep
    lt2: 'F8F5EF', // cream (brand background)
    accent1: '3F6959', // forest
    accent2: 'E9B9A0', // peach
    accent3: 'DFEAE2', // sage
    accent4: 'DDD8E9', // lavender
    accent5: 'E0A46B', // night amber
    accent6: '1B1A17', // night
    hlink: '3F6959',
    folHlink: '315648',
  },
};
// hex copies for options that only take hex
const HEX = {
  ink: '25342F', muted: '5D6F67', forest: '3F6959', deep: '315648', cream: 'F8F5EF', paper: 'FFFDF9',
  sage: 'DFEAE2', sageLight: 'F1F5F0', peach: 'E9B9A0', peachSoft: 'F5E1D6', peachInk: '684B3D',
  lav: 'DDD8E9', lavBg: 'F1EFF5', line: 'E5E7DF', night: '1B1A17', nightCard: '24221E',
  amber: 'E0A46B', nightInk: 'F3E6D3', nightMuted: 'B8A88F', clay: 'B4533C',
};

const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE'; // 13.333 x 7.5
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
pres.title = 'Otula — care for the mother, not just the baby';
pres.author = 'Otula team';
pres.subject = 'ImpactHer: Technology for Real Change — HackYeah 2026';
const C = pres.SchemeColor;

const W = 13.333;
const H = 7.5;
const M = 0.6; // outer margin
const A = (n) => `assets/${n}.png`;
const PHONE_RATIO = 1688 / 780;
const DESK_RATIO = 1350 / 2160;
const CROP_RATIO = 1350 / 1640;

async function icon(Comp, color, size = 256) {
  const svg = ReactDOMServer.renderToStaticMarkup(
    React.createElement(Comp, { color: `#${color}`, size: String(size), strokeWidth: 1.8 }),
  );
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return 'image/png;base64,' + png.toString('base64');
}

// ---------- layouts ----------
pres.defineSlideMaster({
  title: 'TITLE_DARK',
  background: { color: HEX.forest },
  objects: [{ image: { path: A('logo-ghost'), x: 7.9, y: -0.9, w: 6.6, h: 6.6 * (262 / 231) } }],
});
pres.defineSlideMaster({
  title: 'CONTENT_LIGHT',
  background: { color: HEX.cream },
  margin: [0.5, M, 0.5, M],
  objects: [
    { image: { path: A('logo-mark'), x: W - M - 0.28, y: H - 0.56, w: 0.28, h: 0.28 * (262 / 231) } },
    {
      placeholder: {
        options: { name: 'title', type: 'title', x: M, y: 0.45, w: 9.3, h: 0.9, fontFace: 'Georgia', fontSize: 32, color: C.text1, align: 'left', valign: 'top', margin: 0 },
        text: '',
      },
    },
    {
      placeholder: {
        options: { name: 'kicker', type: 'body', x: M, y: 0.18, w: 8, h: 0.3, fontFace: 'Arial', fontSize: 11, bold: true, color: C.accent1, charSpacing: 2, margin: 0 },
        text: '',
      },
    },
  ],
  slideNumber: { x: W - M - 0.9, y: H - 0.5, w: 0.5, h: 0.25, fontFace: 'Arial', fontSize: 10, color: HEX.muted, align: 'right' },
});
pres.defineSlideMaster({
  title: 'CONTENT_NIGHT',
  background: { color: HEX.night },
  objects: [
    { image: { path: A('logo-mark'), x: W - M - 0.28, y: H - 0.56, w: 0.28, h: 0.28 * (262 / 231) } },
    {
      placeholder: {
        options: { name: 'title', type: 'title', x: M, y: 0.45, w: 9.3, h: 0.9, fontFace: 'Georgia', fontSize: 32, color: HEX.nightInk, align: 'left', valign: 'top', margin: 0 },
        text: '',
      },
    },
    {
      placeholder: {
        options: { name: 'kicker', type: 'body', x: M, y: 0.18, w: 8, h: 0.3, fontFace: 'Arial', fontSize: 11, bold: true, color: HEX.amber, charSpacing: 2, margin: 0 },
        text: '',
      },
    },
  ],
  slideNumber: { x: W - M - 0.9, y: H - 0.5, w: 0.5, h: 0.25, fontFace: 'Arial', fontSize: 10, color: HEX.nightMuted, align: 'right' },
});

const shadow = () => ({ type: 'outer', color: '374C42', blur: 18, offset: 6, angle: 90, opacity: 0.18 });
const nightShadow = () => ({ type: 'outer', color: '000000', blur: 20, offset: 6, angle: 90, opacity: 0.5 });

function phone(slide, name, x, y, h, opts = {}) {
  const w = h / PHONE_RATIO;
  slide.addImage({ path: A(name), x, y, w, h, shadow: opts.night ? nightShadow() : shadow(), objectName: `phone ${name}` });
  return w;
}

function text(slide, value, opts) {
  slide.addText(value, { isTextBox: true, margin: 0, fontFace: 'Arial', color: HEX.ink, valign: 'top', ...opts });
}

async function build() {
  const ic = {
    baby: await icon(lu.LuBaby, HEX.forest),
    calendarX: await icon(lu.LuCalendarX, HEX.forest),
    hash: await icon(lu.LuHash, HEX.forest),
    check: await icon(lu.LuClipboardCheck, HEX.forest),
    heart: await icon(lu.LuHeartHandshake, HEX.forest),
    target: await icon(lu.LuTarget, HEX.forest),
    book: await icon(lu.LuBookOpen, HEX.forest),
    shield: await icon(lu.LuShieldCheck, HEX.forest),
    stethoscope: await icon(lu.LuStethoscope, HEX.forest),
    alert: await icon(lu.LuTriangleAlert, HEX.forest),
    phone: await icon(lu.LuPhone, HEX.forest),
    msg: await icon(lu.LuMessageCircleHeart, HEX.forest),
    lock: await icon(lu.LuLock, HEX.forest),
    sparkle: await icon(lu.LuListChecks, HEX.forest),
    arrow: await icon(lu.LuArrowRight, HEX.muted),
  };

  // ---------- 1. Title ----------
  pres.addSection({ title: 'Opening' });
  {
    const s = pres.addSlide({ masterName: 'TITLE_DARK', sectionTitle: 'Opening' });
    s.addImage({ path: A('logo-lockup-cream'), x: M, y: 0.55, w: 0.85 * (2394 / 1048), h: 0.85, objectName: 'Otula logo' });
    text(s, 'Care for the mother,\nnot just the baby.', { x: M, y: 2.0, w: 7.2, h: 2.2, fontFace: 'Georgia', fontSize: 48, color: HEX.paper, valign: 'top', lineSpacingMultiple: 1.0 });
    text(s, 'A wellbeing companion for the fourth trimester — and every cycle after it. Daily check-ins, support on hard days, and a safety net that notices when it is more than a bad week.', {
      x: M, y: 4.35, w: 6.4, h: 1.2, fontSize: 16, color: HEX.sage,
    });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: M, y: 6.05, w: 3.9, h: 0.5, rectRadius: 0.25, fill: { color: HEX.deep }, line: { color: HEX.deep }, objectName: 'event pill' });
    text(s, 'ImpactHer · HackYeah 2026', { x: M, y: 6.05, w: 3.9, h: 0.5, fontSize: 13, bold: true, color: HEX.peachSoft, align: 'center', valign: 'middle' });
    phone(s, 'mobile-today', 8.55, 0.75, 6.1);
    s.addNotes('Open with the line: care follows the baby — Otula follows the mother. 15 seconds.');
  }

  // ---------- 2. Problem ----------
  pres.addSection({ title: 'Problem' });
  {
    const s = pres.addSlide({ masterName: 'CONTENT_LIGHT', sectionTitle: 'Problem' });
    s.addText('THE PROBLEM', { placeholder: 'kicker' });
    s.addText('After birth, the mother drops off the radar', { placeholder: 'title' });
    // big stat card
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: M, y: 1.75, w: 5.2, h: 4.85, rectRadius: 0.3, fill: { color: HEX.forest }, line: { color: HEX.forest }, objectName: 'stat card' });
    text(s, '13%', { x: M + 0.45, y: 2.1, w: 4.5, h: 1.7, fontFace: 'Georgia', fontSize: 96, color: HEX.paper });
    text(s, 'of women who have just given birth experience a mental disorder — primarily depression.', { x: M + 0.45, y: 3.9, w: 4.4, h: 1.3, fontSize: 18, color: HEX.paper });
    text(s, 'Source: World Health Organization, maternal mental health.', { x: M + 0.45, y: 5.95, w: 4.4, h: 0.35, fontSize: 11, color: HEX.sage, italic: true });
    const rows = [
      [ic.baby, 'Care follows the baby', 'Visits, checklists and apps are built around the newborn. The mother’s sleep, pain and mood are nobody’s job.'],
      [ic.calendarX, 'Alone after week six', 'After the 6-week check-up the system goes quiet — right when exhaustion peaks and “baby blues” can turn into depression.'],
      [ic.hash, 'Apps count days, not feelings', 'Cycle trackers predict periods. None of them help on a hard day, or notice when “a bad week” is something more.'],
    ];
    rows.forEach(([img, head, body], i) => {
      const y = 1.8 + i * 1.62;
      s.addShape(pres.shapes.OVAL, { x: 6.45, y, w: 0.72, h: 0.72, fill: { color: HEX.sage }, line: { color: HEX.sage }, objectName: `problem icon bg ${i + 1}` });
      s.addImage({ data: img, x: 6.61, y: y + 0.16, w: 0.4, h: 0.4, objectName: `problem icon ${i + 1}` });
      text(s, head, { x: 7.45, y: y - 0.02, w: 5.2, h: 0.4, fontFace: 'Georgia', fontSize: 20, bold: true });
      text(s, body, { x: 7.45, y: y + 0.43, w: 5.25, h: 0.95, fontSize: 14, color: HEX.muted });
    });
    s.addNotes('WHO: about 13% of women who have just given birth experience a mental disorder, primarily depression. Then the three gaps.');
  }

  // ---------- 3. Persona ----------
  {
    const s = pres.addSlide({ masterName: 'CONTENT_LIGHT', sectionTitle: 'Problem' });
    s.addText('WHO WE BUILD FOR', { placeholder: 'kicker' });
    s.addText('Meet Marta, day 39 after a C-section', { placeholder: 'title' });
    text(s, '“Is this still baby blues, or should I tell someone?”', { x: M, y: 1.75, w: 6.6, h: 1.1, fontFace: 'Georgia', fontSize: 24, italic: true, color: HEX.forest });
    const facts = [['39', 'days postpartum'], ['4.4 h', 'average sleep'], ['2.5 / 5', 'average mood']];
    facts.forEach(([n, l], i) => {
      const x = M + i * 2.2;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 3.05, w: 2.0, h: 1.4, rectRadius: 0.2, fill: { color: HEX.paper }, line: { color: HEX.line }, objectName: `fact card ${i + 1}` });
      text(s, n, { x: x + 0.22, y: 3.2, w: 1.7, h: 0.7, fontFace: 'Georgia', fontSize: 30, color: HEX.forest });
      text(s, l, { x: x + 0.22, y: 3.9, w: 1.7, h: 0.4, fontSize: 13, color: HEX.muted });
    });
    text(s, [
      { text: 'Breastfeeding, recovering from surgery, partner back at work. She will not open a medical app at 3 a.m. — but she will tap a number between 1 and 5.', options: { breakLine: true } },
      { text: ' ', options: { breakLine: true, fontSize: 6 } },
      { text: 'Also for Kasia, 29: ', options: { bold: true, color: HEX.ink } },
      { text: 'no baby, but mood swings across her cycle she wants to understand and get ahead of.', options: {} },
    ], { x: M, y: 4.75, w: 6.6, h: 1.8, fontSize: 15, color: HEX.muted });
    phone(s, 'mobile-checkin', 8.75, 0.55, 6.4);
    text(s, 'The 30-second daily check-in', { x: 7.6, y: 6.98, w: 5.0, h: 0.3, fontSize: 11, color: HEX.muted, align: 'center', italic: true });
    s.addNotes('Personas are composites. The numbers are from Marta’s demo data, which follows a realistic six-week story.');
  }

  // ---------- 4. Solution ----------
  pres.addSection({ title: 'Solution' });
  {
    const s = pres.addSlide({ masterName: 'CONTENT_LIGHT', sectionTitle: 'Solution' });
    s.addText('THE SOLUTION', { placeholder: 'kicker' });
    s.addText('One minute a day, and someone who notices', { placeholder: 'title' });
    const dw = 7.35;
    s.addImage({ path: A('desktop-today'), x: W - M - dw, y: 1.6, w: dw, h: dw * DESK_RATIO, shadow: shadow(), objectName: 'desktop today' });
    const pillars = [
      [ic.check, 'Daily check-in', 'Mood, sleep, energy, pain — 30 seconds, one hand.'],
      [ic.heart, 'Tough-day mode', 'Breathing first, then what helped you before.'],
      [ic.target, 'Goals & reminders', 'Tiny steps she sets herself, with push reminders.'],
      [ic.book, 'Knowledge', '16 calm, sourced articles for her week.'],
      [ic.shield, 'Safety net', 'EPDS screening, red flags, crisis help.'],
    ];
    pillars.forEach(([img, head, body], i) => {
      const y = 1.62 + i * 1.0;
      s.addShape(pres.shapes.OVAL, { x: M, y, w: 0.6, h: 0.6, fill: { color: HEX.sage }, line: { color: HEX.sage }, objectName: `pillar icon bg ${i + 1}` });
      s.addImage({ data: img, x: M + 0.14, y: y + 0.14, w: 0.32, h: 0.32, objectName: `pillar icon ${i + 1}` });
      text(s, head, { x: M + 0.8, y: y - 0.04, w: 3.9, h: 0.35, fontSize: 16, bold: true });
      text(s, body, { x: M + 0.8, y: y + 0.32, w: 4.0, h: 0.55, fontSize: 13, color: HEX.muted });
    });
    text(s, 'Responsive PWA: phone, tablet and desktop · Polish and English', { x: W - M - dw, y: 6.35, w: dw, h: 0.3, fontSize: 11, color: HEX.muted, italic: true, align: 'right' });
    s.addNotes('Walk through the Today screen: stage pill, check-in, forecast, best-matching strategy, goals.');
  }

  // ---------- 5. Innovation: adaptive support ----------
  pres.addSection({ title: 'Innovation' });
  {
    const s = pres.addSlide({ masterName: 'CONTENT_LIGHT', sectionTitle: 'Innovation' });
    s.addText('WHAT IS NEW · 1 / 3', { placeholder: 'kicker' });
    s.addText('Support that learns what actually helps her', { placeholder: 'title' });
    const steps = [
      ['1', 'She tells us', 'Onboarding asks what helps on hard days — a walk, a call, a nap — and what drains her.'],
      ['2', 'Hard day', 'One tap on the heart: a minute of breathing, then her top strategies, ranked.'],
      ['3', '“Did it help?”', 'Yes · a bit · no. Each answer updates a Bayesian score per strategy.'],
      ['4', 'It adapts', 'Next time the list is reordered — with the evidence shown back to her.'],
    ];
    steps.forEach(([n, head, body], i) => {
      const y = 1.7 + i * 1.18;
      s.addShape(pres.shapes.OVAL, { x: M, y, w: 0.62, h: 0.62, fill: { color: i === 3 ? HEX.forest : HEX.paper }, line: { color: HEX.forest, width: 1.25 }, objectName: `step dot ${n}` });
      text(s, n, { x: M, y, w: 0.62, h: 0.62, fontFace: 'Georgia', fontSize: 20, color: i === 3 ? HEX.paper : HEX.forest, align: 'center', valign: 'middle' });
      text(s, head, { x: M + 0.85, y: y - 0.02, w: 5.6, h: 0.38, fontSize: 17, bold: true });
      text(s, body, { x: M + 0.85, y: y + 0.36, w: 5.7, h: 0.7, fontSize: 14, color: HEX.muted });
    });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 7.2, y: 2.4, w: 2.55, h: 2.6, rectRadius: 0.25, fill: { color: HEX.forest }, line: { color: HEX.forest }, objectName: 'evidence card' });
    text(s, '3 of 4', { x: 7.45, y: 2.65, w: 2.3, h: 0.9, fontFace: 'Georgia', fontSize: 44, color: HEX.paper });
    text(s, 'harder days a short walk helped Marta — so it is suggested first.', { x: 7.45, y: 3.6, w: 2.15, h: 1.2, fontSize: 14, color: HEX.sage });
    phone(s, 'mobile-toughday-strategies', 10.05, 0.55, 5.6);
    text(s, 'Tough day, step 3: ranked strategies + ask Tomek for help', { x: 9.7, y: 6.3, w: 3.0, h: 0.6, fontSize: 11, color: HEX.muted, italic: true, align: 'center' });
    s.addNotes('Ranking = (survey prior × 2 + helped score) / (2 + uses). Simple, explainable, no black box. “Ask for support” prepares an SMS/WhatsApp message to her trusted person.');
  }

  // ---------- 6. Innovation: night shift + circle ----------
  {
    const s = pres.addSlide({ masterName: 'CONTENT_NIGHT', sectionTitle: 'Innovation' });
    s.addText('WHAT IS NEW · 2 / 3', { placeholder: 'kicker' });
    s.addText('3 a.m. is not lonely anymore', { placeholder: 'title' });
    const pw = phone(s, 'mobile-night', M, 1.55, 5.3, { night: true });
    text(s, 'Night Shift', { x: M + pw + 0.35, y: 1.65, w: 3.3, h: 0.45, fontFace: 'Georgia', fontSize: 22, color: HEX.amber });
    text(s, 'From 22:00 to 6:00 the app turns warm and dim: big one-hand buttons, a 1-tap check-in, breathing, “can’t sleep”, and a note for the morning.', { x: M + pw + 0.35, y: 2.2, w: 3.3, h: 1.9, fontSize: 14, color: HEX.nightInk });
    text(s, '“12 mums from Otula are awake right now.”', { x: M + pw + 0.35, y: 4.2, w: 3.3, h: 0.9, fontFace: 'Georgia', fontSize: 16, italic: true, color: HEX.amber });
    text(s, 'Anonymous count, hidden below 5 people.', { x: M + pw + 0.35, y: 5.15, w: 3.3, h: 0.4, fontSize: 11, color: HEX.nightMuted });
    const cx = 7.55;
    const pw2 = phone(s, 'mobile-circle-public', cx, 1.55, 5.3, { night: true });
    text(s, 'Support circle', { x: cx + pw2 + 0.35, y: 1.65, w: 2.75, h: 0.45, fontFace: 'Georgia', fontSize: 22, color: HEX.amber });
    text(s, 'She lists concrete asks — dinner on Thursday, the 2 a.m. feed. Family opens a link, no account, and taps “I’ll take it”. She gets a push.', { x: cx + pw2 + 0.35, y: 2.2, w: 2.75, h: 2.4, fontSize: 14, color: HEX.nightInk });
    text(s, 'Turns “let me know if you need anything” into real help.', { x: cx + pw2 + 0.35, y: 4.65, w: 2.75, h: 0.9, fontFace: 'Georgia', fontSize: 15, italic: true, color: HEX.amber });
    s.addNotes('Be honest: in the demo the awake count comes from seeded demo accounts. The public page never shows notes, symptoms or screening results.');
  }

  // ---------- 7. Innovation: patterns + visit report ----------
  {
    const s = pres.addSlide({ masterName: 'CONTENT_LIGHT', sectionTitle: 'Innovation' });
    s.addText('WHAT IS NEW · 3 / 3', { placeholder: 'kicker' });
    s.addText('From daily taps to a report for the midwife', { placeholder: 'title' });
    // patterns behind, report on top (pre-cropped in assets)
    const pw = 5.2;
    s.addImage({ path: A('patterns-main'), x: 6.15, y: 1.5, w: pw, h: pw * (1220 / 1300), shadow: shadow(), objectName: 'patterns screenshot' });
    const rw = 5.3;
    s.addImage({ path: A('report-top'), x: W - M - rw, y: 3.75, w: rw, h: rw * (950 / 1600), shadow: shadow(), objectName: 'report screenshot' });
    const items = [
      ['+24%', 'better mood after nights with ≥ 6 h of sleep — patterns are written as sentences, with notes on the chart.'],
      ['1 tap', 'builds a printable visit report: mood & sleep, EPDS trend, symptoms, red flags and her own questions.'],
      ['3 a.m.', '“Save as a question for my visit” — thoughts captured when they happen, not forgotten in the office.'],
    ];
    items.forEach(([n, body], i) => {
      const y = 1.75 + i * 1.6;
      text(s, n, { x: M, y, w: 1.8, h: 0.75, fontFace: 'Georgia', fontSize: 34, color: HEX.forest });
      text(s, body, { x: M + 1.95, y: y + 0.05, w: 3.2, h: 1.35, fontSize: 14, color: HEX.muted });
    });
    s.addNotes('“In the doctor’s office everything slips my mind” — the report solves that. Print or save as PDF straight from the browser.');
  }

  // ---------- 8. Safety ----------
  pres.addSection({ title: 'Safety' });
  {
    const s = pres.addSlide({ masterName: 'CONTENT_LIGHT', sectionTitle: 'Safety' });
    s.addText('SAFETY BY DESIGN', { placeholder: 'kicker' });
    s.addText('Kind by default, serious when it matters', { placeholder: 'title' });
    const cards = [
      [ic.stethoscope, 'EPDS screening', 'The validated Edinburgh scale every 14 days postpartum, with a trend over time.'],
      [ic.sparkle, 'Risk engine', '8 transparent rules over check-ins and EPDS: from a gentle nudge to urgent help.'],
      [ic.alert, 'Red flags after birth', 'Heavy bleeding, fever, chest pain… one tap shows “call a doctor now” with tel: links.'],
      [ic.phone, 'Crisis page, no login', '112 and Polish crisis lines, two taps from every screen — even logged out.'],
      [ic.msg, 'Never a diagnosis', '“Your result suggests it may help to talk to a specialist” — not “you have depression”.'],
      [ic.lock, 'Private by design', 'Notes encrypted at rest, JSON export, one-click delete, no trackers (GDPR).'],
    ];
    cards.forEach(([img, head, body], i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const x = M + col * 4.1;
      const y = 1.65 + row * 2.55;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: 3.85, h: 2.3, rectRadius: 0.2, fill: { color: HEX.paper }, line: { color: HEX.line }, objectName: `safety card ${i + 1}` });
      s.addShape(pres.shapes.OVAL, { x: x + 0.3, y: y + 0.3, w: 0.62, h: 0.62, fill: { color: HEX.sage }, line: { color: HEX.sage }, objectName: `safety icon bg ${i + 1}` });
      s.addImage({ data: img, x: x + 0.45, y: y + 0.45, w: 0.32, h: 0.32, objectName: `safety icon ${i + 1}` });
      text(s, head, { x: x + 0.3, y: y + 1.05, w: 3.3, h: 0.35, fontSize: 16, bold: true });
      text(s, body, { x: x + 0.3, y: y + 1.42, w: 3.3, h: 0.8, fontSize: 13, color: HEX.muted });
    });
    s.addNotes('Otula is not a medical device. Helpline numbers are verified before launch. EPDS: Cox, Holden & Sagovsky, 1987.');
  }

  // ---------- 9. What we built ----------
  pres.addSection({ title: 'Build' });
  {
    const s = pres.addSlide({ masterName: 'CONTENT_LIGHT', sectionTitle: 'Build' });
    s.addText('WHAT WE BUILT IN 24 HOURS', { placeholder: 'kicker' });
    s.addText('A working product, not a mock-up', { placeholder: 'title' });
    // architecture
    const box = (label, sub, x, y, w, fill, ink) => {
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h: 0.95, rectRadius: 0.15, fill: { color: fill }, line: { color: fill === HEX.paper ? HEX.line : fill }, objectName: `arch ${label}` });
      text(s, label, { x: x + 0.2, y: y + 0.13, w: w - 0.4, h: 0.35, fontSize: 15, bold: true, color: ink });
      text(s, sub, { x: x + 0.2, y: y + 0.5, w: w - 0.4, h: 0.35, fontSize: 11, color: ink === HEX.paper ? HEX.sage : HEX.muted });
    };
    box('React PWA', 'TypeScript · Vite · TanStack Query', M, 1.75, 3.3, HEX.forest, HEX.paper);
    box('Django REST API', '55 endpoints · JWT · OpenAPI', M + 4.0, 1.75, 3.3, HEX.forest, HEX.paper);
    box('PostgreSQL', 'encrypted notes', M + 4.0, 3.25, 3.3, HEX.paper, HEX.ink);
    box('Celery + Redis', 'reminders · nightly jobs', M, 3.25, 3.3, HEX.paper, HEX.ink);
    box('Web push', 'service worker · VAPID', M, 4.75, 3.3, HEX.paper, HEX.ink);
    box('Docker Compose', 'one command: make up', M + 4.0, 4.75, 3.3, HEX.paper, HEX.ink);
    s.addImage({ data: ic.arrow, x: M + 3.45, y: 2.05, w: 0.4, h: 0.4, objectName: 'arrow pwa api' });
    // stats
    const stats = [['295', 'backend tests'], ['51 + 2', 'unit + end-to-end tests'], ['21', 'screens, PL & EN']];
    stats.forEach(([n, l], i) => {
      const y = 1.7 + i * 1.25;
      text(s, n, { x: 8.75, y, w: 3.9, h: 0.75, fontFace: 'Georgia', fontSize: 38, color: HEX.forest });
      text(s, l, { x: 8.75, y: y + 0.72, w: 3.9, h: 0.35, fontSize: 13, color: HEX.muted });
    });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: M, y: 5.95, w: W - 2 * M, h: 0.85, rectRadius: 0.15, fill: { color: HEX.sageLight }, line: { color: HEX.sage }, objectName: 'ai disclosure' });
    text(s, [
      { text: 'How: ', options: { bold: true, color: HEX.ink } },
      { text: '10 AI coding agents (Meta Muse Code) working in parallel git worktrees on a shared API contract, with Claude Code integrating, testing and fixing — every merge verified against the real API in a browser.', options: {} },
    ], { x: M + 0.3, y: 6.05, w: W - 2 * M - 0.6, h: 0.65, fontSize: 13, color: HEX.muted, valign: 'middle' });
    s.addNotes('We can explain every part: contract-first API, per-domain apps, pure-logic modules with unit tests (risk, ranking, forecast), MSW mocks so frontend and backend could work in parallel.');
  }

  // ---------- 10. Impact & close ----------
  pres.addSection({ title: 'Close' });
  {
    const s = pres.addSlide({ masterName: 'TITLE_DARK', sectionTitle: 'Close' });
    text(s, 'IMPACT & NEXT STEPS', { x: M, y: 0.45, w: 6, h: 0.3, fontSize: 11, bold: true, color: HEX.peach, charSpacing: 2 });
    text(s, 'Otula covers the weeks when nobody else is watching.', { x: M, y: 0.85, w: 7.4, h: 1.5, fontFace: 'Georgia', fontSize: 34, color: HEX.paper });
    const next = [
      ['Pilot with midwives and primary care', 'Visit report as the bridge between home and the patronage visit.'],
      ['Clinical review', 'Validate the Polish EPDS flow and risk thresholds with perinatal psychologists.'],
      ['Partners and foundations', 'Circle and partner guide with maternal-health NGOs; verified helpline network.'],
    ];
    next.forEach(([head, body], i) => {
      const y = 2.75 + i * 1.12;
      s.addShape(pres.shapes.OVAL, { x: M, y: y + 0.05, w: 0.42, h: 0.42, fill: { color: HEX.peach }, line: { color: HEX.peach }, objectName: `next dot ${i + 1}` });
      text(s, String(i + 1), { x: M, y: y + 0.05, w: 0.42, h: 0.42, fontSize: 13, bold: true, color: HEX.deep, align: 'center', valign: 'middle' });
      text(s, head, { x: M + 0.65, y, w: 6.6, h: 0.38, fontSize: 17, bold: true, color: HEX.paper });
      text(s, body, { x: M + 0.65, y: y + 0.4, w: 6.6, h: 0.5, fontSize: 13, color: HEX.sage });
    });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 8.55, y: 2.75, w: 4.2, h: 3.25, rectRadius: 0.2, fill: { color: HEX.deep }, line: { color: HEX.deep }, objectName: 'disclosure card' });
    text(s, 'Resources & disclosure', { x: 8.85, y: 2.95, w: 3.7, h: 0.35, fontSize: 14, bold: true, color: HEX.peachSoft });
    text(s, [
      { text: 'EPDS — Cox, Holden & Sagovsky, 1987', options: { bullet: { indent: 12 }, breakLine: true } },
      { text: 'WHO maternal mental health data', options: { bullet: { indent: 12 }, breakLine: true } },
      { text: 'Open source: Django, DRF, React, Vite, Recharts, Celery', options: { bullet: { indent: 12 }, breakLine: true } },
      { text: 'AI: Meta Muse Code, Claude Code; design in Figma Make', options: { bullet: { indent: 12 }, breakLine: true } },
      { text: 'Concept and design drafted before the start; first code commits 22:55 on Oct 3 — full git history in the repo', options: { bullet: { indent: 12 } } },
    ], { x: 8.85, y: 3.4, w: 3.7, h: 2.5, fontSize: 11, color: HEX.sage, paraSpaceAfter: 4 });
    s.addImage({ path: A('logo-mark'), x: M, y: 6.3, w: 0.46 * (231 / 262), h: 0.46, objectName: 'Otula logo mark' });
    text(s, 'Otula — care for the mother, not just the baby.', { x: M + 0.6, y: 6.35, w: 7, h: 0.42, fontFace: 'Georgia', fontSize: 16, italic: true, color: HEX.cream, valign: 'middle' });
    s.addNotes('Close: thank the jury. Offer the live demo (make demo-reset, demo user Marta). Every statement about AI and pre-event work matches the README disclosure.');
  }

  await pres.writeFile({ fileName: 'otula-pitch.pptx' });
  await applyTheme('otula-pitch.pptx', THEME);
  console.log('written otula-pitch.pptx');
}

build().catch((e) => {
  console.error(e);
  process.exit(1);
});
