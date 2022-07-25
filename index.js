const fs = require('fs');
const crc = require('crc');
const iconv = require('iconv-lite');

const outFolder = 'out';
const iniFilePath = 'sscom51.ini';
const PACK_STRUCT_HEAD = 'BB';
const PACK_STRUCT_FOOT = 'EE';

crc.crcDefault8 = (arr) => arr.reduce((p, c) => p + c, 0) & 0xff;

function main() {
  const checksum = process.argv.find(v => v.startsWith('-c'));
  const checksumMode = (checksum ? checksum.replace(/^\-c=?/, '') : null) || 'crcDefault8';
  const checksumBit = checksumMode.match(/\d+/)?.[0] || 8;
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

    let td = body[i].substr(body[i].indexOf('=')+1);
    let dd = body[i+1].substr(body[i+1].indexOf('=')+1);

    if (checksum && crc[checksumMode]) {
      let [type, msg] = dd.split(',');

      if (msg.indexOf(PACK_STRUCT_HEAD) > -1 && msg.indexOf(PACK_STRUCT_FOOT) > -1) {
        let addr = msg.substring(0, msg.indexOf(PACK_STRUCT_HEAD) - 1);
        let info = msg.substring(msg.indexOf(PACK_STRUCT_HEAD) + 3, msg.lastIndexOf(PACK_STRUCT_FOOT) - 4);
        let buf = Int8Array.from(info.split(' ').map((v) => parseInt(v, 16)));
        let sum = crc[checksumMode](buf);

        dd = `${type},${addr} ${PACK_STRUCT_HEAD} ${info} ${sum.toString(16).toUpperCase().split('').reduce((p, v) => `${p}${p.length === 2 ? ' ' : ''}${v}`, '')} ${PACK_STRUCT_FOOT}`;
      }
    }

    out.push(`N${100 + idx}=${td}\r\nN${idx}=${dd}\r\n`);
  }

  out.push(foot.join('\r\n'));

  if (!fs.existsSync(outFolder)) {
    fs.mkdirSync(outFolder);
  }

  fs.writeFileSync(`${outFolder}/${iniFilePath}`, iconv.encode(Buffer.from(out.join('\r\n')), 'gbk'));
}

main();
