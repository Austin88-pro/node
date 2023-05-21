'use strict';

const {
  JSONParse,
  JSONStringify,
  SafeMap,
} = primordials;
const { internalModuleReadJSON } = internalBinding('fs');
const { pathToFileURL } = require('url');
const { toNamespacedPath } = require('path');

const cache = new SafeMap();

let manifest;

/**
 * Returns undefined for all failure cases.
 * @param {string} jsonPath
 */
function read(jsonPath) {
  if (cache.has(jsonPath)) {
    return cache.get(jsonPath);
  }

  const {
    0: includesKeys,
    1: name,
    2: main,
    3: exports,
    4: imports,
    5: type,
    6: parseExports,
    7: parseImports,
  } = internalModuleReadJSON(
    toNamespacedPath(jsonPath),
  );

  let result;

  if (includesKeys !== undefined) {
    result = {
      __proto__: null,
      name,
      main,
      exports,
      imports,
      type,
    };

    // Execute JSONParse on demand for improved performance
    if (parseExports) {
      result.exports = JSONParse(exports);
    }

    if (parseImports) {
      result.imports = JSONParse(imports);
    }
  }

  const { getOptionValue } = require('internal/options');
  if (name !== undefined) {
    if (manifest === undefined) {
      manifest = getOptionValue('--experimental-policy') ?
        require('internal/process/policy').manifest :
        null;
    }
    if (manifest !== null) {
      const jsonURL = pathToFileURL(jsonPath);
      manifest.assertIntegrity(jsonURL, JSONStringify(result));
    }
  }

  cache.set(jsonPath, result);
  return result;
}

module.exports = { read };
