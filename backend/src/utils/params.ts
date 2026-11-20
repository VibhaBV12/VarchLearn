import { AppError } from '../middleware/errorHandler';

/**
 * Safely extracts and validates a required Express route parameter.
 * Handles Express v5 typing where req.params[key] can be string | string[].
 */
export function getRequiredParam(
  value: string | string[] | undefined,
  paramName: string
): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new AppError(`Invalid or missing route parameter: ${paramName}`, 400);
  }
  return value.trim();
}

/**
 * Safely extracts an optional Express route parameter.
 */
export function getOptionalParam(
  value: string | string[] | undefined
): string | undefined {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }
  return undefined;
}
