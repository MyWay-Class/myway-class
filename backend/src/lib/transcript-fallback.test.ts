import { getLectureDetail } from '@myway/shared';
import { buildFallbackLectureTranscript } from './transcript-fallback';

const lecture = getLectureDetail('lec_react_01', 'usr_std_001');
const transcript = buildFallbackLectureTranscript(lecture);

if (!transcript) throw new Error('Transcript fallback was not generated');
if (transcript.lecture_id !== 'lec_react_01') throw new Error('Unexpected lecture id');
if ((transcript.segments?.length ?? 0) <= 0) throw new Error('Expected transcript segments');
if ((transcript.segments?.[0]?.start_ms ?? -1) < 0) throw new Error('Invalid segment start');
if ((transcript.segments?.[0]?.end_ms ?? 0) <= (transcript.segments?.[0]?.start_ms ?? 0)) throw new Error('Invalid segment range');
if ((transcript.full_text ?? '').length <= 0) throw new Error('Expected transcript text');

console.log('transcript fallback regression passed');
