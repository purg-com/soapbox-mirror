import { describe, expect, it } from 'vitest';

import { render, screen, rootState } from 'soapbox/jest/test-helpers.tsx';
import { normalizeStatus, normalizeAccount } from 'soapbox/normalizers/index.ts';

import QuotedStatus from './quoted-status.tsx';

import type { ReducerStatus } from 'soapbox/reducers/statuses.ts';

describe('<QuotedStatus />', () => {
  it('renders content', () => {
    const account = normalizeAccount({
      id: '1',
      acct: 'alex',
      url: 'https://soapbox.test/users/alex',
    });

    const status = normalizeStatus({
      id: '1',
      account,
      content: 'hello world',
      contentHtml: 'hello world',
    }) as ReducerStatus;

    const state = rootState/*.accounts.set('1', account)*/;

    render(<QuotedStatus status={status} />, undefined, state);
    screen.getByText(/hello world/i);
    expect(screen.getByTestId('quoted-status')).toHaveTextContent(/hello world/i);
  });
});
