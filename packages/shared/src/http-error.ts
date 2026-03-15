import type { ErrorCode } from '@code-play/contracts'
import { DEFAULT_HTTP_ERROR_MESSAGES } from '@code-play/contracts'

export function getDefaultHttpErrorMessage(code: string): string | undefined {
  return DEFAULT_HTTP_ERROR_MESSAGES[code as ErrorCode]
}
