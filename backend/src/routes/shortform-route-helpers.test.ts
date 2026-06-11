import { buildShortformExportFallbackUpdate } from './shortform-route-helpers';

const fallback = buildShortformExportFallbackUpdate();

if (fallback.export_status !== 'COMPLETED') {
  throw new Error(`expected COMPLETED export_status, got ${fallback.export_status}`);
}

if (fallback.export_result_url !== '/static/shortforms/demo-export.mp4') {
  throw new Error(`expected demo export url, got ${fallback.export_result_url}`);
}

if (fallback.video_url !== '/static/shortforms/demo-export.mp4') {
  throw new Error(`expected demo video url, got ${fallback.video_url}`);
}
