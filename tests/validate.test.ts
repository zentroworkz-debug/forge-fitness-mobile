import test from 'node:test';
import assert from 'node:assert/strict';
import { isEmail, isPhone, hasLen } from '../lib/validate.ts';

test('email', () => { assert.ok(isEmail('a@b.co')); assert.ok(!isEmail('a@b')); assert.ok(!isEmail('a b@c.d')); });
test('phone (same regex as website)', () => { assert.ok(isPhone('+91 98765 43210')); assert.ok(!isPhone('12345')); });
test('length', () => { assert.ok(hasLen('abcdefghij', 10)); assert.ok(!hasLen('  a  ', 2)); });
