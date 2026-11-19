import { test } from 'node:test';
import assert from 'node:assert/strict';
import { accountSchema, phoneLoginSchema } from '../lib/games/validation.ts';
import { extractPassportCode } from '../lib/games/passport-types.ts';
test('Vietnamese phone formats identify the same account',()=>{
  for(const phone of ['0912 345 678','+84 (912) 345-678','84912345678','0084912345678']) {
    const parsed=accountSchema.parse({phone,display_name:'  Nguyễn   An  '});
    assert.equal(parsed.phone,'+84912345678');assert.equal(parsed.display_name,'Nguyễn An');
  }
});
test('names normalize unicode and whitespace and reject invalid account inputs',()=>{
  assert.equal(accountSchema.parse({phone:'+12025550123',display_name:'Ａｎ   Bình'}).display_name,'An Bình');
  for(const display_name of ['a','<script>','x'.repeat(41)]) assert(!accountSchema.safeParse({phone:'0912345678',display_name}).success);
  for(const phone of ['0912','abc','+00012345678','0912345678901234567']) assert(!accountSchema.safeParse({phone,display_name:'An Bình'}).success);
});
test('phone-first login accepts a normalized phone without a display name',()=>{
  assert.equal(phoneLoginSchema.parse({phone:'0912 345 678'}).phone,'+84912345678');
  assert(!phoneLoginSchema.safeParse({phone:'abc'}).success);
  assert(!phoneLoginSchema.safeParse({phone:'0912345678',display_name:'a'}).success);
});
test('passport input extracts only the expected QR kind and rejects malformed links',()=>{
  const code='a1'.repeat(32);
  assert.equal(extractPassportCode(code,'station'),code);
  assert.equal(extractPassportCode(`https://example.test/game/check-in#code=${code}`,'station'),code);
  assert.equal(extractPassportCode(`https://example.test/game/admin#card=${code}`,'card'),code);
  for(const value of [`https://example.test/game/check-in?code=${code}`,`https://example.test/game/admin#card=${code}`,'javascript:alert(1)','bad']) assert.equal(extractPassportCode(value,'station'),null);
});
