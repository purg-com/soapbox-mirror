import { useEffect } from 'react';
import { FormattedMessage, defineMessages, useIntl } from 'react-intl';

import { HTTPError } from 'soapbox/api/HTTPError.ts';
import { useGroup, useGroupMembers, useGroupMembershipRequests } from 'soapbox/api/hooks/index.ts';
import Account from 'soapbox/components/account.tsx';
import { AuthorizeRejectButtons } from 'soapbox/components/authorize-reject-buttons.tsx';
import ScrollableList from 'soapbox/components/scrollable-list.tsx';
import { Column } from 'soapbox/components/ui/column.tsx';
import HStack from 'soapbox/components/ui/hstack.tsx';
import Spinner from 'soapbox/components/ui/spinner.tsx';
import { GroupRoles } from 'soapbox/schemas/group-member.ts';
import toast from 'soapbox/toast.tsx';

import ColumnForbidden from '../ui/components/column-forbidden.tsx';

import type { Account as AccountEntity } from 'soapbox/schemas/index.ts';

type RouteParams = { groupId: string };

const messages = defineMessages({
  heading: { id: 'column.group_pending_requests', defaultMessage: 'Pending requests' },
  authorizeFail: { id: 'group.group_mod_authorize.fail', defaultMessage: 'Failed to approve @{name}' },
  rejectFail: { id: 'group.group_mod_reject.fail', defaultMessage: 'Failed to reject @{name}' },
});

interface IMembershipRequest {
  account: AccountEntity;
  onAuthorize(account: AccountEntity): Promise<unknown>;
  onReject(account: AccountEntity): Promise<unknown>;
}

const MembershipRequest: React.FC<IMembershipRequest> = ({ account, onAuthorize, onReject }) => {
  if (!account) return null;

  const handleAuthorize = () => onAuthorize(account);
  const handleReject = () => onReject(account);

  return (
    <HStack space={1} alignItems='center' justifyContent='between' className='p-2.5'>
      <div className='w-full'>
        <Account account={account} withRelationship={false} />
      </div>

      <AuthorizeRejectButtons
        onAuthorize={handleAuthorize}
        onReject={handleReject}
        countdown={3000}
      />
    </HStack>
  );
};

interface IGroupMembershipRequests {
  params: RouteParams;
}

const GroupMembershipRequests: React.FC<IGroupMembershipRequests> = ({ params }) => {
  const id = params?.groupId;
  const intl = useIntl();

  const { group } = useGroup(id);

  const { accounts, authorize, reject, refetch, isLoading } = useGroupMembershipRequests(id);
  const { invalidate } = useGroupMembers(id, GroupRoles.USER);

  useEffect(() => {
    return () => {
      invalidate();
    };
  }, []);

  if (!group || !group.relationship || isLoading) {
    return (
      <Column label={intl.formatMessage(messages.heading)}>
        <Spinner />
      </Column>
    );
  }

  if (!group.relationship.role || !['owner', 'admin', 'moderator'].includes(group.relationship.role)) {
    return <ColumnForbidden />;
  }

  async function handleAuthorize(account: AccountEntity) {
    return authorize(account.id)
      .then(() => Promise.resolve())
      .catch(async (error: unknown) => {
        refetch();

        const message = intl.formatMessage(messages.authorizeFail, { name: account.username });

        if (error instanceof HTTPError && error.response.status === 409) {
          const data = await error.response.error();
          toast.error(data?.error || message);
        } else {
          toast.error(message);
        }

        return Promise.reject();
      });
  }

  async function handleReject(account: AccountEntity) {
    return reject(account.id)
      .then(() => Promise.resolve())
      .catch(async (error: unknown) => {
        refetch();

        const message = intl.formatMessage(messages.rejectFail, { name: account.username });

        if (error instanceof HTTPError && error.response.status === 409) {
          const data = await error.response.error();
          toast.error(data?.error || message);
        } else {
          toast.error(message);
        }

        return Promise.reject();
      });
  }

  return (
    <Column label={intl.formatMessage(messages.heading)}>
      <ScrollableList
        scrollKey='group_membership_requests'
        emptyMessage={<FormattedMessage id='empty_column.group_membership_requests' defaultMessage='There are no pending membership requests for this group.' />}
      >
        {accounts.map((account) => (
          <MembershipRequest
            key={account.id}
            account={account}
            onAuthorize={handleAuthorize}
            onReject={handleReject}
          />
        ))}
      </ScrollableList>
    </Column>
  );
};

export default GroupMembershipRequests;
