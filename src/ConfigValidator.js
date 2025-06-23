import fs from 'fs';

class ConfigValidator {
  static validateJsonFile(path) {
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

  static validate(config) {
    if (!config || typeof config !== 'object' || !config.pwd) return false;
    // Add more validations if required (check dirs, array types, user/group validity)
    return true;
  }
}

export default ConfigValidator;
