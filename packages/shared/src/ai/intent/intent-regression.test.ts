import assert from 'node:assert/strict';
import { buildSmartChatOverview } from '../smart';
import { classifyAIIntent } from './pipeline';

async function main() {
  const summaryIntent = classifyAIIntent({
    message: '숏폼으로 요약해줘',
    lecture_id: 'lec_java_01',
  });
  assert.equal(summaryIntent.intent, 'request_summary');
  assert.equal(summaryIntent.action, 'DIRECT_ANSWER');
  assert.equal(summaryIntent.needs_clarification, false);

  const compareIntent = classifyAIIntent({
    message: '이 두 개념 차이 설명해줘',
    lecture_id: 'lec_java_01',
  });
  assert.equal(compareIntent.intent, 'compare');
  assert.equal(compareIntent.action, 'DECOMPOSE');
  assert.equal(compareIntent.needs_clarification, false);

  const smartSummary = await buildSmartChatOverview({
    message: '숏폼으로 요약해줘',
    lecture_id: 'lec_java_01',
  });
  assert.equal(smartSummary.route, 'summary');
  assert.equal(smartSummary.intent.intent, 'request_summary');

  const smartCompare = await buildSmartChatOverview({
    message: '이 두 개념 차이 설명해줘',
    lecture_id: 'lec_java_01',
  });
  assert.equal(smartCompare.route, 'compare');
  assert.equal(smartCompare.intent.intent, 'compare');
}

await main();
