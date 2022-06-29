const fs = require('fs');
const iconv = require('iconv-lite');

const outFolder = 'out';
const iniFilePath = 'sscom51.ini';

function main() {
  const buf = fs.readFileSync(iniFilePath);
  const content = iconv.decode(buf, 'gbk').toString();
  const arr = content.replace(/\r\n\r\n/g, '\r\n').split('\r\n');
  const head = [], body = [], foot = [];
  const pack = [head, body, foot];

  let idx = 0;
  arr.forEach((line) => {
    const isBody = line.startsWith('N');
    switch(idx) {
      case 0:
        if (isBody && idx === 0) {
          ++idx;
        }
        break;

      case 1:
        if (!isBody && line !== '' && idx === 1) {
          ++idx;
        }
        break;
    }
    pack[idx].push(line);
  });

  let out = [head.join('\r\n')];

  idx = 0;
  let len = body.length;
  for(let i = 0; i < len; i+=2) {
    ++idx;

    const td = body[i].substr(body[i].indexOf('=')+1);
    const dd = body[i+1].substr(body[i+1].indexOf('=')+1);

    out.push(`N${100 + idx}=${td}\r\nN${idx}=${dd}\r\n`);
  }

  out.push(foot.join('\r\n'));

  if (!fs.existsSync(outFolder)) {
    fs.mkdirSync(outFolder);
  }

  fs.writeFileSync(`${outFolder}/${iniFilePath}`, iconv.encode(Buffer.from(out.join('\r\n')), 'gbk'));
}

main();
