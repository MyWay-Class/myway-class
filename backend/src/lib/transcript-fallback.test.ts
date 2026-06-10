import assert from 'node:assert/strict';
import { getLectureDetail } from '@myway/shared';
import { buildFallbackLectureTranscript } from './transcript-fallback';

const lecture = getLectureDetail('lec_react_01', 'usr_std_001');
const transcript = buildFallbackLectureTranscript(lecture);

assert.ok(transcript);
assert.equal(transcript?.lecture_id, 'lec_react_01');
assert.ok((transcript?.segments?.length ?? 0) > 0);
assert.ok((transcript?.segments?.[0]?.start_ms ?? -1) >= 0);
assert.ok((transcript?.segments?.[0]?.end_ms ?? 0) > (transcript?.segments?.[0]?.start_ms ?? 0));
assert.ok((transcript?.full_text ?? '').length > 0);

console.log('transcript fallback regression passed');
