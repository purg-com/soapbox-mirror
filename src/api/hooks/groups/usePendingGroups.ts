import { Entities } from 'soapbox/entity-store/entities.ts';
import { useEntities } from 'soapbox/entity-store/hooks/index.ts';
import { useApi } from 'soapbox/hooks/useApi.ts';
import { useFeatures } from 'soapbox/hooks/useFeatures.ts';
import { useOwnAccount } from 'soapbox/hooks/useOwnAccount.ts';
import { Group, groupSchema } from 'soapbox/schemas/index.ts';

function usePendingGroups() {
  const api = useApi();
  const { account } = useOwnAccount();
  const features = useFeatures();

  const { entities, ...result } = useEntities<Group>(
    [Entities.GROUPS, account?.id!, 'pending'],
    () => api.get('/api/v1/groups', {
      searchParams: {
        pending: true,
      },
    }),
    {
      schema: groupSchema,
      enabled: !!account && features.groupsPending,
    },
  );

  return {
    ...result,
    groups: entities,
  };
}

export { usePendingGroups };