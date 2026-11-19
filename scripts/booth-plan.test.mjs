import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { conceptPositions, BOOTH_COUNT, POSITION_COUNT, positionCode, isBookablePosition, isCommercialPosition } from '../lib/booths/types.ts';
import { calculatePayment, transferMemo } from '../lib/booths/payment.ts';

test('40-position plan preserves IDs and exposes only TM/TT for registration', () => {
  const positions = conceptPositions();
  assert.equal(positions.length, POSITION_COUNT);
  assert.equal(new Set(positions.map(p => p.code)).size, 40);
  assert.equal(positions.filter(p => p.is_bookable).length, BOOTH_COUNT);
  for (const [prefix, count] of [['TM',24],['TT',8],['VH',5],['BTC',3]]) {
    assert.equal(positions.filter(p => p.code.startsWith(prefix)).length, count);
  }
  assert.equal(positionCode(34), 'TM21');
  assert.equal(positionCode(29), 'VH04');
  assert.equal(positionCode(30), 'VH05');
  for (const p of positions) assert.equal(isBookablePosition(p.id), p.is_bookable);
  // All booth rectangles are inside the hall and do not overlap each other.
  for (const p of positions) {
    assert(p.x * 16 >= 82 && (p.x + p.width) * 16 <= 1568);
    assert(p.y * 16 >= 405 && (p.y + p.height) * 16 <= 1265);
    for (const q of positions.filter(q => q.id > p.id)) {
      assert(!(p.x < q.x+q.width && p.x+p.width > q.x && p.y < q.y+q.height && p.y+p.height > q.y), `${p.code} overlaps ${q.code}`);
    }
  }
});

test('new commercial booths support discounts and correct transfer codes', () => {
  for (const [id, code] of [[35,'TM22'],[36,'TM23'],[37,'TM24']]) {
    assert(isCommercialPosition(id));
    assert.equal(calculatePayment(id, 'TEN', '[{"code":"TEN","type":"percent","value":10}]').amount, 4500000);
    assert.equal(transferMemo(id, 'Brand'), `JCITL GCD ${code} BRAND`);
  }
  for (const id of [38,39,40]) {
    assert(isBookablePosition(id));
    assert.equal(calculatePayment(id, ''), null);
    assert.throws(() => calculatePayment(id, 'TEN'));
  }
});

test('migration coordinates and codes match the preview plan exactly', () => {
  const sql = readFileSync('db/migrations/V11__expanded_forty_position_plan.sql','utf8');
  const reordered = readFileSync('db/migrations/V12__sequential_booth_clusters.sql','utf8');
  for (const p of conceptPositions()) {
    if (p.id === 29 || p.id === 30) {
      const restored = readFileSync('db/migrations/V13__restore_cultural_booth_labels.sql','utf8');
      assert(restored.includes(`code='${p.code}',zone='${p.zone}',is_bookable=false where id=${p.id}`));
      continue;
    }
    assert(sql.includes(`(${p.id},'${p.code}','${p.zone}',`), p.code);
    if ((p.id >= 21 && p.id <= 25) || p.id === 38) {
      const sponsorOrder = readFileSync('db/migrations/V14__sponsor_l_shape_order.sql','utf8');
      assert(sponsorOrder.includes(`(${p.id},${p.x},${p.y})`), p.code);
      continue;
    }
    if (p.is_bookable) assert(reordered.includes(`(${p.id},${p.x},${p.y},${p.width},${p.height})`), p.code);
    else assert(sql.includes(`(${p.id},'${p.code}','${p.zone}',${p.x},${p.y},${p.width},${p.height},${p.is_bookable})`), p.code);
  }
});

test('each commercial cluster has consecutive numbers along its row or column', () => {
  const plan = conceptPositions();
  for (const [first,last,axis] of [[1,4,'y'],[5,11,'x'],[12,16,'y'],[18,24,'x']]) {
    const cluster=plan.filter(p=>Number(p.code.slice(2))>=first && Number(p.code.slice(2))<=last && p.code.startsWith('TM')).sort((a,b)=>a[axis]-b[axis]);
    assert.deepEqual(cluster.map(p=>Number(p.code.slice(2))), Array.from({length:last-first+1},(_,i)=>first+i));
  }
});
