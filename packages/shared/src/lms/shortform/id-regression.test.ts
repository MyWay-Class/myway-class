import assert from 'node:assert/strict';
import { createId } from './data';

function testCreateIdIsUnique(): void {
  const first = createId('sfv', 0);
  const second = createId('sfv', 0);

  assert.ok(first.startsWith('sfv_001_'));
  assert.ok(second.startsWith('sfv_001_'));
  assert.notEqual(first, second);
}

testCreateIdIsUnique();

console.log('shortform id regressions passed');
