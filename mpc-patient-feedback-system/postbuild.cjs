// postbuild.cjs — runs after vite build to create per-route HTML with custom OG tags
const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'dist');
const indexHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');

function makeRouteHtml(html, overrides) {
  let result = html;
  result = result.replace(
    /<title>[^<]*<\/title>/,
    `<title>${overrides.title}</title>`
  );
  result = result.replace(
    /<meta name="description" content="[^"]*" \/>/,
    `<meta name="description" content="${overrides.description}" />`
  );
  result = result.replace(
    /<meta property="og:title" content="[^"]*" \/>/,
    `<meta property="og:title" content="${overrides.title}" />`
  );
  result = result.replace(
    /<meta property="og:description" content="[^"]*" \/>/,
    `<meta property="og:description" content="${overrides.description}" />`
  );
  result = result.replace(
    /<meta property="og:url" content="[^"]*" \/>/,
    `<meta property="og:url" content="${overrides.url}" />`
  );
  result = result.replace(
    /<meta name="twitter:title" content="[^"]*" \/>/,
    `<meta name="twitter:title" content="${overrides.title}" />`
  );
  result = result.replace(
    /<meta name="twitter:description" content="[^"]*" \/>/,
    `<meta name="twitter:description" content="${overrides.description}" />`
  );
  return result;
}

// Create /feedback/index.html
const feedbackDir = path.join(distDir, 'feedback');
fs.mkdirSync(feedbackDir, { recursive: true });
fs.writeFileSync(
  path.join(feedbackDir, 'index.html'),
  makeRouteHtml(indexHtml, {
    title: 'Patient Feedback Form – My Pain Clinic Global',
    description: 'Share your experience at MPC Bandra West Clinic. Your feedback helps us improve patient care and clinical services.',
    url: 'https://mpc-patient-form.web.app/feedback',
  })
);
console.log('✓ Created dist/feedback/index.html');

// Create /referral/index.html
const referralDir = path.join(distDir, 'referral');
fs.mkdirSync(referralDir, { recursive: true });
fs.writeFileSync(
  path.join(referralDir, 'index.html'),
  makeRouteHtml(indexHtml, {
    title: 'Patient Referral Portal – My Pain Clinic Global',
    description: 'Refer a friend or family member to MPC Bandra West Clinic and earn a referral reward.',
    url: 'https://mpc-patient-form.web.app/referral',
  })
);
console.log('✓ Created dist/referral/index.html');

console.log('✓ Postbuild complete — per-route OG meta tags ready.');
