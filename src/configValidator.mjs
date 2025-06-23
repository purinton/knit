import fs from 'fs';

/**
 * Validates a JSON configuration file.
 * @param {Object} params
 * @param {string} params.path - The path to the JSON file.
 * @returns {Object} The parsed JSON object.
 * @throws {Error} If the file does not exist or is invalid JSON.
 */
export function validateJsonFile({ path }) {
  if (!fs.existsSync(path)) {
    throw new Error(`Config file not found: ${path}`);
  }
  const content = fs.readFileSync(path, 'utf-8');
  let data;
  try {
    data = JSON.parse(content);
  } catch (e) {
    throw new Error(`Invalid JSON in ${path}: ${e.message}`);
  }
  return data;
}

/**
 * Validates a configuration object.
 * @param {Object} params
 * @param {Object} params.config - The configuration object.
 * @returns {boolean} True if valid, false otherwise.
 */
export function validate({ config }) {
  if (!config || typeof config !== 'object' || !config.pwd) return false;
  // Add more validations if required (check dirs, array types, user/group validity)
  return true;
}
