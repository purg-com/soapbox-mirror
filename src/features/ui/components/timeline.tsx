import { debounce } from 'es-toolkit';
import { OrderedSet as ImmutableOrderedSet } from 'immutable';
import { useCallback, useEffect, useRef, useState } from 'react';

import { dequeueTimeline, scrollTopTimeline } from 'soapbox/actions/timelines.ts';
import StatusList, { IStatusList } from 'soapbox/components/status-list.tsx';
import { useAppDispatch } from 'soapbox/hooks/useAppDispatch.ts';
import { useAppSelector } from 'soapbox/hooks/useAppSelector.ts';
import { setNotification } from 'soapbox/reducers/notificationsSlice.ts';
import { makeGetStatusIds } from 'soapbox/selectors/index.ts';

interface ITimeline extends Omit<IStatusList, 'statusIds' | 'isLoading' | 'hasMore'> {
  /** ID of the timeline in Redux. */
  timelineId: string;
  /** Settings path to use instead of the timelineId. */
  prefix?: string;
}

/** Scrollable list of statuses from a timeline in the Redux store. */
const Timeline: React.FC<ITimeline> = ({
  timelineId,
  onLoadMore,
  prefix,
  ...rest
}) => {
  const dispatch = useAppDispatch();
  const getStatusIds = useCallback(makeGetStatusIds(), []);

  const lastStatusId = useAppSelector(state => (state.timelines.get(timelineId)?.items || ImmutableOrderedSet()).last() as string | undefined);
  const statusIds = useAppSelector(state => getStatusIds(state, { type: timelineId, prefix }));
  const isLoading = useAppSelector(state => (state.timelines.get(timelineId) || { isLoading: true }).isLoading === true);
  const isPartial = useAppSelector(state => (state.timelines.get(timelineId)?.isPartial || false) === true);
  const hasMore = useAppSelector(state => state.timelines.get(timelineId)?.hasMore === true);
  const hasQueuedItems = useAppSelector(state => state.timelines.get(timelineId)?.totalQueuedItemsCount || 0);

  const [isInTop, setIsInTop] = useState<boolean>(window.scrollY < 50);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);


  const handleDequeueTimeline = useCallback(() => {
    dispatch(dequeueTimeline(timelineId, onLoadMore));
  }, []);

  const handleScrollToTop = useCallback(debounce(() => {
    dispatch(scrollTopTimeline(timelineId, true));
  }, 100), [timelineId]);

  const handleScroll = useCallback(debounce(() => {
    setIsInTop(window.scrollY < 50);
    dispatch(scrollTopTimeline(timelineId, false));
  }, 100), [timelineId]);

  useEffect(() => {
    if (hasQueuedItems) {
      dispatch(setNotification({ timelineId: timelineId, value: hasQueuedItems > 0 }));
    }
  }, [hasQueuedItems, timelineId]);

  useEffect(() => {
    if (isInTop) {
      if (!intervalRef.current) {
        handleDequeueTimeline();
        const interval = setInterval(handleDequeueTimeline, 2000);
        intervalRef.current = interval;
        dispatch(setNotification({ timelineId: timelineId, value: false }));
      }
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isInTop, handleDequeueTimeline]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  return (
    <>
      <StatusList
        timelineId={timelineId}
        onScrollToTop={handleScrollToTop}
        onScroll={handleScroll}
        lastStatusId={lastStatusId}
        statusIds={statusIds}
        isLoading={isLoading}
        isPartial={isPartial}
        hasMore={hasMore}
        onLoadMore={onLoadMore}
        {...rest}
      />
    </>
  );
};

export default Timeline;
