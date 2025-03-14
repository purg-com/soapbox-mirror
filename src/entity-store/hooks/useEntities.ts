import LinkHeader from 'http-link-header';
import { useEffect } from 'react';
import z from 'zod';

import { useApi } from 'soapbox/hooks/useApi.ts';
import { useAppDispatch } from 'soapbox/hooks/useAppDispatch.ts';
import { useAppSelector } from 'soapbox/hooks/useAppSelector.ts';
import { useGetState } from 'soapbox/hooks/useGetState.ts';
import { filteredArray } from 'soapbox/schemas/utils.ts';
import { realNumberSchema } from 'soapbox/utils/numbers.tsx';

import { entitiesFetchFail, entitiesFetchRequest, entitiesFetchSuccess, invalidateEntityList } from '../actions.ts';
import { selectEntities, selectListState, useListState } from '../selectors.ts';

import { parseEntitiesPath } from './utils.ts';

import type { EntityFn, EntitySchema, ExpandedEntitiesPath } from './types.ts';
import type { Entity } from '../types.ts';

/** Additional options for the hook. */
interface UseEntitiesOpts<TEntity extends Entity> {
  /** A zod schema to parse the API entities. */
  schema?: EntitySchema<TEntity>;
  /**
   * Time (milliseconds) until this query becomes stale and should be refetched.
   * It is 1 minute by default, and can be set to `Infinity` to opt-out of automatic fetching.
   */
  staleTime?: number;
  /** A flag to potentially disable sending requests to the API. */
  enabled?: boolean;
}

/** A hook for fetching and displaying API entities. */
function useEntities<TEntity extends Entity>(
  /** Tells us where to find/store the entity in the cache. */
  expandedPath: ExpandedEntitiesPath,
  /** API route to GET, eg `'/api/v1/notifications'`. If undefined, nothing will be fetched. */
  entityFn: EntityFn<void>,
  /** Additional options for the hook. */
  opts: UseEntitiesOpts<TEntity> = {},
) {
  const api = useApi();
  const dispatch = useAppDispatch();
  const getState = useGetState();

  const { entityType, listKey, path } = parseEntitiesPath(expandedPath);
  const entities = useAppSelector(state => selectEntities<TEntity>(state, path));
  const schema = opts.schema || z.custom<TEntity>();

  const isEnabled = opts.enabled ?? true;
  const isFetching = useListState(path, 'fetching');
  const lastFetchedAt = useListState(path, 'lastFetchedAt');
  const isFetched = useListState(path, 'fetched');
  const isError = !!useListState(path, 'error');
  const totalCount = useListState(path, 'totalCount');
  const isInvalid = useListState(path, 'invalid');

  const next = useListState(path, 'next');
  const prev = useListState(path, 'prev');

  const fetchPage = async(req: EntityFn<void>, pos: 'start' | 'end', overwrite = false): Promise<void> => {
    // Get `isFetching` state from the store again to prevent race conditions.
    const isFetching = selectListState(getState(), path, 'fetching');
    if (isFetching) return;

    dispatch(entitiesFetchRequest(entityType, listKey));
    try {
      const response = await req();
      const json = await response.json();
      const entities = filteredArray(schema).parse(json);
      const parsedCount = realNumberSchema.safeParse(response.headers.get('x-total-count'));
      const totalCount = parsedCount.success ? parsedCount.data : undefined;
      const linkHeader = response.headers.get('link');
      const links = linkHeader ? new LinkHeader(linkHeader) : undefined;

      dispatch(entitiesFetchSuccess(entities, entityType, listKey, pos, {
        next: links?.refs.find((link) => link.rel === 'next')?.uri,
        prev: links?.refs.find((link) => link.rel === 'prev')?.uri,
        totalCount: Number(totalCount) >= entities.length ? totalCount : undefined,
        fetching: false,
        fetched: true,
        error: null,
        lastFetchedAt: new Date(),
        invalid: false,
      }, overwrite));
    } catch (error) {
      dispatch(entitiesFetchFail(entityType, listKey, error));
    }
  };

  const fetchEntities = async(): Promise<void> => {
    await fetchPage(entityFn, 'end', true);
  };

  const fetchNextPage = async(): Promise<void> => {
    if (next) {
      await fetchPage(() => api.get(next), 'end');
    }
  };

  const fetchPreviousPage = async(): Promise<void> => {
    if (prev) {
      await fetchPage(() => api.get(prev), 'start');
    }
  };

  const invalidate = () => {
    dispatch(invalidateEntityList(entityType, listKey));
  };

  const staleTime = opts.staleTime ?? 60000;

  useEffect(() => {
    if (!isEnabled) return;
    if (isFetching) return;
    const isUnset = !lastFetchedAt;
    const isStale = lastFetchedAt ? Date.now() >= lastFetchedAt.getTime() + staleTime : false;

    if (isInvalid || isUnset || isStale) {
      fetchEntities();
    }
  }, [isEnabled, ...path]);

  return {
    entities,
    fetchEntities,
    fetchNextPage,
    fetchPreviousPage,
    hasNextPage: !!next,
    hasPreviousPage: !!prev,
    totalCount,
    isError,
    isFetched,
    isFetching,
    isLoading: isFetching && entities.length === 0,
    invalidate,
    /** The `X-Total-Count` from the API if available, or the length of items in the store. */
    count: typeof totalCount === 'number' ? totalCount : entities.length,
  };
}

export {
  useEntities,
};