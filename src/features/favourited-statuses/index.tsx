import { debounce } from 'es-toolkit';
import { OrderedSet as ImmutableOrderedSet } from 'immutable';
import { useCallback, useEffect } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { fetchAccount, fetchAccountByUsername } from 'soapbox/actions/accounts.ts';
import { fetchFavouritedStatuses, expandFavouritedStatuses, fetchAccountFavouritedStatuses, expandAccountFavouritedStatuses } from 'soapbox/actions/favourites.ts';
import { useAccountLookup } from 'soapbox/api/hooks/index.ts';
import MissingIndicator from 'soapbox/components/missing-indicator.tsx';
import StatusList from 'soapbox/components/status-list.tsx';
import { Column } from 'soapbox/components/ui/column.tsx';
import { useAppDispatch } from 'soapbox/hooks/useAppDispatch.ts';
import { useAppSelector } from 'soapbox/hooks/useAppSelector.ts';
import { useOwnAccount } from 'soapbox/hooks/useOwnAccount.ts';

const messages = defineMessages({
  heading: { id: 'column.favourited_statuses', defaultMessage: 'Liked posts' },
});

interface IFavourites {
  params?: {
    username?: string;
  };
}

/** Timeline displaying a user's favourited statuses. */
const Favourites: React.FC<IFavourites> = ({ params }) => {
  const intl = useIntl();
  const dispatch = useAppDispatch();
  const { account: ownAccount } = useOwnAccount();
  const { account, isUnavailable } = useAccountLookup(params?.username, { withRelationship: true });

  const username = params?.username || '';
  const isOwnAccount = username.toLowerCase() === ownAccount?.acct?.toLowerCase();

  const timelineKey = isOwnAccount ? 'favourites' : `favourites:${account?.id}`;
  const statusIds = useAppSelector(state => state.status_lists.get(timelineKey)?.items || ImmutableOrderedSet<string>());
  const isLoading = useAppSelector(state => state.status_lists.get(timelineKey)?.isLoading === true);
  const hasMore = useAppSelector(state => !!state.status_lists.get(timelineKey)?.next);

  const handleLoadMore = useCallback(debounce(() => {
    if (isOwnAccount) {
      dispatch(expandFavouritedStatuses());
    } else if (account) {
      dispatch(expandAccountFavouritedStatuses(account.id));
    }
  }, 300, { edges: ['leading'] }), [account?.id]);

  useEffect(() => {
    if (isOwnAccount)
      dispatch(fetchFavouritedStatuses());
    else {
      if (account) {
        dispatch(fetchAccount(account.id));
        dispatch(fetchAccountFavouritedStatuses(account.id));
      } else {
        dispatch(fetchAccountByUsername(username));
      }
    }
  }, []);

  useEffect(() => {
    if (account && !isOwnAccount) {
      dispatch(fetchAccount(account.id));
      dispatch(fetchAccountFavouritedStatuses(account.id));
    }
  }, [account?.id]);

  if (isUnavailable) {
    return (
      <Column>
        <div className='flex min-h-[160px] flex-1 items-center justify-center rounded-lg bg-primary-50 p-10 text-center text-gray-900 dark:bg-gray-700 dark:text-gray-300'>
          <FormattedMessage id='empty_column.account_unavailable' defaultMessage='Profile unavailable' />
        </div>
      </Column>
    );
  }

  if (!account) {
    return (
      <MissingIndicator />
    );
  }

  const emptyMessage = isOwnAccount
    ? <FormattedMessage id='empty_column.favourited_statuses' defaultMessage="You don't have any liked posts yet. When you like one, it will show up here." />
    : <FormattedMessage id='empty_column.account_favourited_statuses' defaultMessage="This user doesn't have any liked posts yet." />;

  return (
    <Column label={intl.formatMessage(messages.heading)} withHeader={false} transparent>
      <StatusList
        statusIds={statusIds}
        scrollKey='favourited_statuses'
        hasMore={hasMore}
        isLoading={isLoading}
        onLoadMore={handleLoadMore}
        emptyMessage={emptyMessage}
      />
    </Column>
  );
};

export default Favourites;