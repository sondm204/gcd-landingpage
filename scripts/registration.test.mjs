import {test} from 'node:test';
import assert from 'node:assert/strict';
import {registrationSchema} from '../lib/registrations/validation.ts';
const valid={full_name:'  Nguyen   An ',birth_date:'2001-02-28',phone:'0912 345 678',email:' AN@GMAIL.COM ',facebook_url:'facebook.com/nguyen.an',is_jci:false,chapter:'Ignored when not a member',consent:true,website_confirm:''};
test('registration normalizes contacts and discards an irrelevant chapter',()=>{
  const result=registrationSchema.parse(valid);
  assert.equal(result.full_name,'Nguyen An');assert.equal(result.phone,'+84912345678');assert.equal(result.email,'an@gmail.com');assert.equal(result.facebook_url,'https://facebook.com/nguyen.an');assert.equal(result.chapter,'');
});
test('JCI members must provide a chapter',()=>{
  assert(!registrationSchema.safeParse({...valid,is_jci:true,chapter:''}).success);
  assert.equal(registrationSchema.parse({...valid,is_jci:true,chapter:' JCI Ha Noi '}).chapter,'JCI Ha Noi');
});
test('birth dates must exist and cannot be in the future',()=>{
  for(const birth_date of ['2026-02-30','1900-02-29','1899-12-31','2999-01-01','not-a-date'])assert(!registrationSchema.safeParse({...valid,birth_date}).success,birth_date);
  assert(registrationSchema.safeParse({...valid,birth_date:'2000-02-29'}).success);
});
test('rejects impersonated Facebook domains, bad contacts, missing consent and honeypots',()=>{
  for(const facebook_url of ['https://facebook.com.evil.test/an','https://evilfacebook.com/an','javascript:alert(1)','https://facebook.com/','https://evil@facebook.com/an'])assert(!registrationSchema.safeParse({...valid,facebook_url}).success);
  for(const override of [{phone:'123'},{email:'bad'},{consent:false},{website_confirm:'spam'},{is_jci:'no'}])assert(!registrationSchema.safeParse({...valid,...override}).success);
  assert(registrationSchema.safeParse({...valid,facebook_url:'https://www.facebook.com/profile.php?id=123'}).success);
});
