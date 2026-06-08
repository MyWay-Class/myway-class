import assert from 'node:assert/strict';
import { classifyAIIntent } from './intent/pipeline';

function testDomainIntentRouting(): void {
  const summary = classifyAIIntent({ message: '이 강의 요약해줘', lecture_id: 'lec_java_01' });
  assert.equal(summary.intent, 'request_summary');
  assert.equal(summary.action, 'DIRECT_ANSWER');
  assert.equal(summary.needs_clarification, false);

  const search = classifyAIIntent({ message: '핵심 개념 찾아줘', lecture_id: 'lec_java_01' });
  assert.equal(search.intent, 'search_content');
  assert.equal(search.action, 'SEARCH');
  assert.equal(search.needs_clarification, false);

  const compare = classifyAIIntent({ message: 'A와 B 차이 비교해줘', lecture_id: 'lec_java_01' });
  assert.equal(compare.intent, 'compare');
  assert.equal(compare.action, 'DECOMPOSE');
  assert.equal(compare.needs_clarification, false);

  const shortform = classifyAIIntent({ message: '이 강의 숏폼 만들어줘', lecture_id: 'lec_java_01' });
  assert.equal(shortform.intent, 'create_shortform');
  assert.equal(shortform.action, 'DECOMPOSE');
  assert.equal(shortform.needs_clarification, false);
}

function testGeneralChatDoesNotFallbackToSummary(): void {
  const generalChat = classifyAIIntent({ message: '그냥 오늘 날씨 어때' });

  assert.equal(generalChat.intent, 'general_chat');
  assert.equal(generalChat.action, 'DIRECT_ANSWER');
  assert.equal(generalChat.needs_clarification, false);
}

function testDeeperExplanationKeepsDirectAnswer(): void {
  const deeper = classifyAIIntent({ message: '이 내용 자세히 설명해줘', lecture_id: 'lec_java_01' });

  assert.equal(deeper.intent, 'explain_deeper');
  assert.equal(deeper.action, 'DIRECT_ANSWER');
  assert.equal(deeper.needs_clarification, false);
}

function testRecommendationRouting(): void {
  const recommendation = classifyAIIntent({ message: '관련 강의 추천해줘', lecture_id: 'lec_java_01' });

  assert.equal(recommendation.intent, 'ask_recommendation');
  assert.equal(recommendation.action, 'SEARCH');
  assert.equal(recommendation.needs_clarification, false);
}

testDomainIntentRouting();
testGeneralChatDoesNotFallbackToSummary();
testDeeperExplanationKeepsDirectAnswer();
testRecommendationRouting();

console.log('intent regressions passed');
