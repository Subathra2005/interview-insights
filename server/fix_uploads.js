const fs = require('fs');
const path = require('path');

const UPLOAD_DIR = path.join(__dirname, 'uploads');

function isProbablyBase64Text(sample) {
  return sample.includes(';base64,') || /^[A-Za-z0-9+/=\n\r ]{16,}$/.test(sample);
}

function fixFile(filePath) {
  const data = fs.readFileSync(filePath, { encoding: 'utf8' });
  const idx = data.indexOf(',');
  if (idx === -1) return false;
  const header = data.slice(0, idx);
  if (!header.includes('base64')) return false;
  const b64 = data.slice(idx + 1).replace(/\s+/g, '');
  try {
    const buf = Buffer.from(b64, 'base64');
    fs.writeFileSync(filePath, buf);
    console.log('Fixed:', path.basename(filePath), '->', buf.length, 'bytes');
    return true;
  } catch (err) {
    console.error('Failed to decode', filePath, err.message);
    return false;
  }
}

function run() {
  const files = fs.readdirSync(UPLOAD_DIR);
  let fixed = 0;
  for (const f of files) {
    const p = path.join(UPLOAD_DIR, f);
    const stat = fs.statSync(p);
    if (!stat.isFile()) continue;
    // read a small sample to decide
    const sample = fs.readFileSync(p, { encoding: 'utf8', flag: 'r' , start: 0, end: 1024 });
    if (isProbablyBase64Text(sample)) {
      if (fixFile(p)) fixed++;
    }
  }
  console.log('Done. Fixed files:', fixed);
}

run();
