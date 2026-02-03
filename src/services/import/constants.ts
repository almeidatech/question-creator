/**
 * BOM (Byte Order Mark) characters for different encodings
 * These characters are sometimes added at the beginning of files
 * and need to be removed for proper parsing
 */
export const BOM_CHARACTERS = [
  '\ufeff', // UTF-8 BOM
  '\ufffe', // UTF-16 LE BOM
];

/**
 * Deduplication similarity threshold (0-100)
 * Questions with similarity >= this threshold are considered duplicates
 */
export const DEDUPLICATION_THRESHOLD = 85;

/**
 * Maximum rows to process in a single database transaction
 * Larger batches are more efficient but use more memory
 */
export const BATCH_SIZE = 100;

/**
 * Maximum number of retries for failed rows
 */
export const MAX_RETRIES = 3;

/**
 * Timeout for semantic mapping API calls (in seconds)
 */
export const SEMANTIC_MAPPING_TIMEOUT = 30;

/**
 * Delay between retries (in milliseconds)
 */
export const RETRY_DELAY = 1000;

