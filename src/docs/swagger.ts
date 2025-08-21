import fs from 'fs';
import path from 'node:path';
import yaml from 'js-yaml';

const yamlPath = path.resolve(process.cwd(), 'openapi.yaml');
const raw = fs.readFileSync(yamlPath, 'utf8');
const spec = yaml.load(raw) as object;
export default spec;
