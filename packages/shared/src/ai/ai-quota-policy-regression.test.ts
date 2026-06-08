import assert from 'node:assert/strict';
import {
  resolveAiQuotaLimit,
  resolveAiQuotaBaseLimit,
  resolveAiQuotaFeatureWeight,
} from './ai-quota-policy';

function testRoleSpecificDefaults(): void {
  const student = resolveAiQuotaLimit('STUDENT', 'summary');
  const instructor = resolveAiQuotaLimit('INSTRUCTOR', 'summary');
  const admin = resolveAiQuotaLimit('ADMIN', 'summary');

  assert.equal(student.role, 'STUDENT');
  assert.equal(student.base_limit, 100);
  assert.equal(student.feature_weight, 1.2);
  assert.equal(student.effective_limit, 83);

  assert.equal(instructor.base_limit, 200);
  assert.equal(instructor.effective_limit, 166);
  assert.ok(instructor.effective_limit > student.effective_limit);

  assert.equal(admin.base_limit, 500);
  assert.equal(admin.effective_limit, 416);
  assert.ok(admin.effective_limit > instructor.effective_limit);
}

function testUserOverrideBeatsRoleDefault(): void {
  const override = resolveAiQuotaLimit('STUDENT', 'rag', {
    daily_limit: 42,
    role_daily_limits: { STUDENT: 10, INSTRUCTOR: 20, ADMIN: 30 },
    feature_weights: { rag: 2 },
  });

  assert.equal(override.base_limit, 42);
  assert.equal(override.feature_weight, 2);
  assert.equal(override.effective_limit, 21);
}

function testFeatureWeightsApplyPerFeature(): void {
  const summaryWeight = resolveAiQuotaFeatureWeight('summary');
  const quizWeight = resolveAiQuotaFeatureWeight('quiz');
  const answerWeight = resolveAiQuotaFeatureWeight('answer');

  assert.equal(summaryWeight, 1.2);
  assert.equal(quizWeight, 1.1);
  assert.equal(answerWeight, 1);
  assert.equal(resolveAiQuotaBaseLimit('STUDENT'), 100);
}

testRoleSpecificDefaults();
testUserOverrideBeatsRoleDefault();
testFeatureWeightsApplyPerFeature();

console.log('ai quota policy regressions passed');
