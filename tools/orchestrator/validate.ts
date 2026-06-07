import { readFileSync } from "node:fs";
import Ajv2020 from "ajv/dist/2020";
import addFormats from "ajv-formats";

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);

function readJson(path: string): unknown {
  let raw = readFileSync(path, "utf-8");
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
  return JSON.parse(raw);
}

export function validateOrThrow(schemaPath: string, payload: unknown, label: string): void {
  const schema = readJson(schemaPath);
  const validate = ajv.compile(schema);
  const valid = validate(payload);
  if (!valid) {
    const details = (validate.errors ?? []).map((err) => `${err.instancePath} ${err.message}`).join("; ");
    throw new Error(`${label} schema validation failed: ${details}`);
  }
}
