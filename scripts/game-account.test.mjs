import { test } from 'node:test';
import assert from 'node:assert/strict';
import { accountSchema } from '../lib/games/validation.ts';
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
