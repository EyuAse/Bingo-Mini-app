async function checkBundle() {
  const res = await fetch('https://bingo-mini-app-3li9.onrender.com');
  const html = await res.text();
  console.log('HTML length:', html.length);
  const m = html.match(/src="(\/assets\/index-[^"]+\.js)"/);
  if (!m) {
    console.log('No script tag found!');
    return;
  }
  console.log('Found script:', m[1]);
  const jsRes = await fetch('https://bingo-mini-app-3li9.onrender.com' + m[1]);
  const js = await jsRes.text();
  console.log('Has 30pe:', js.includes('bingo-mini-app-30pe'));
  console.log('Has 3li9:', js.includes('bingo-mini-app-3li9'));
}

checkBundle().catch(console.error);
