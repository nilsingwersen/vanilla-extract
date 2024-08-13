import hash from '@emotion/hash';

import { getIdentOption } from './adapter';
import { getAndIncrementRefCounter, getFileScope } from './fileScope';

const DIR_FILE_REGEXP =
  /(?<dir>[^\/\\]*)?[\/\\]?(?<file>[^\/\\]*)\.css\.(?:ts|js|tsx|jsx|cjs|mjs)$/;

const WHITESPACE_REGEXP = /\s/g;

function getDevPrefix({
  debugId,
  debugFileName,
}: {
  debugId?: string;
  debugFileName: boolean;
}) {
  const parts = debugId ? [debugId.replace(WHITESPACE_REGEXP, '_')] : [];

  if (debugFileName) {
    const { filePath } = getFileScope();

    const matches = filePath.match(DIR_FILE_REGEXP);

    if (matches && matches.groups) {
      const { dir, file } = matches.groups;
      parts.unshift(file && file !== 'index' ? file : dir);
    }
  }

  return parts.join('_');
}

const NORMALIZE_REGEXP = /^[0-9]/;

function normalizeIdentifier(identifier: string) {
  return NORMALIZE_REGEXP.test(identifier) ? `_${identifier}` : identifier;
}

interface GenerateIdentifierOptions {
  debugId?: string;
  debugFileName?: boolean;
}

const IDENTIFIER_REGEXP = /^[A-Z_][0-9A-Z_-]+$/i;

export function generateIdentifier(debugId?: string): string;
export function generateIdentifier(options?: GenerateIdentifierOptions): string;
export function generateIdentifier(
  arg?: string | GenerateIdentifierOptions,
): string {
  const identOption = getIdentOption();
  const { debugId, debugFileName = true } = {
    ...(typeof arg === 'string' ? { debugId: arg } : null),
    ...(typeof arg === 'object' ? arg : null),
  };

  // Convert ref count to base 36 for optimal hash lengths
  const refCount = getAndIncrementRefCounter().toString(36);
  const { filePath, packageName } = getFileScope();

  const fileScopeHash = hash(
    packageName ? `${packageName}${filePath}` : filePath,
  );

  let identifier = `${fileScopeHash}${refCount}`;

  if (identOption === 'debug') {
    const devPrefix = getDevPrefix({ debugId, debugFileName });

    if (devPrefix) {
      identifier = `${devPrefix}__${identifier}`;
    }

    return normalizeIdentifier(identifier);
  }
  if (typeof identOption === 'function') {
    identifier = identOption({
      hash: identifier,
      debugId,
      filePath,
      packageName,
    });

    if (!identifier.match(IDENTIFIER_REGEXP)) {
      throw new Error(
        `Identifier function returned invalid indentifier: "${identifier}"`,
      );
    }

    return identifier;
  }

  return normalizeIdentifier(identifier);
}
