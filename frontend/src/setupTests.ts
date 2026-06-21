import '@testing-library/jest-dom';
import { vi } from 'vitest';

class MockEventSource {
  onmessage: any = null;
  close = vi.fn();
  constructor(url: string) {}
}

global.EventSource = MockEventSource as any;
