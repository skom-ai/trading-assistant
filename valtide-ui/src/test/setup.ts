/**
 * File: src/test/setup.ts
 * Author: Sunil+Ai Assistant
 * Date: 2026-09-07
 * Description:
 *   Vitest global setup — registers @testing-library/jest-dom matchers so
 *   component assertions like toBeInTheDocument() are available, and clears
 *   mocks between tests.
 */
import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';

afterEach(() => {
  vi.clearAllMocks();
});
