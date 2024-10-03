import React from 'react';
import { QueryInput, QueryMap } from '@/types/queries';
import { sha256 } from 'js-sha256';
import { useEventBus } from '@/hooks/use-event-bus';
import { NeuronId } from '@/lib/id';

export const useInfiniteQuery = <T extends QueryInput>({
  initialPageInput,
  getNextPageInput,
}: {
  initialPageInput: T;
  getNextPageInput: (
    page: number,
    pages: Array<QueryMap[T['type']]['output']>,
  ) => T | undefined;
}) => {
  const eventBus = useEventBus();

  const [pages, setPages] = React.useState<
    Array<QueryMap[T['type']]['output']>
  >([]);
  const [isPending, setIsPending] = React.useState(true);
  const [isFetchingNextPage, setIsFetchingNextPage] = React.useState(false);
  const [hasNextPage, setHasNextPage] = React.useState(true);

  const subscriberIdsRef = React.useRef<
    Array<{ queryId: string; subscriberId: string }>
  >([]);

  const initialInputHash = sha256(JSON.stringify(initialPageInput));

  // Function to clean up existing subscriptions
  const cleanupSubscriptions = React.useCallback(() => {
    subscriberIdsRef.current.forEach(({ queryId, subscriberId }) => {
      window.neuron.unsubscribeQuery(queryId);
      eventBus.unsubscribe(subscriberId);
    });
    subscriberIdsRef.current = [];
  }, []);

  // Function to subscribe to query result updates
  const subscribeToQueryResult = React.useCallback(
    (queryId: string, pageIndex: number) => {
      const subscriberId = eventBus.subscribe((event) => {
        if (
          event.event === 'query_result_updated' &&
          event.payload?.id === queryId &&
          event.payload?.result
        ) {
          setPages((prevPages) => {
            const newPages = [...prevPages];
            newPages[pageIndex] = event.payload.result;
            return newPages;
          });
        }
      });
      subscriberIdsRef.current.push({ queryId, subscriberId });
    },
    [eventBus],
  );

  // Function to fetch a page
  const fetchPage = React.useCallback(
    async (input: T, pageIndex: number) => {
      const queryId = NeuronId.generate(NeuronId.Type.Query);

      try {
        const result = await window.neuron.executeQuery(queryId, input);

        // Update pages state
        setPages((prevPages) => {
          const newPages = [...prevPages];
          newPages[pageIndex] = result;
          return newPages;
        });

        // Check for the next page
        const futureNextPageInput = getNextPageInput(pageIndex + 1, [
          ...pages,
          result,
        ]);
        setHasNextPage(!!futureNextPageInput);

        // Subscribe to updates for this query
        subscribeToQueryResult(queryId, pageIndex);
      } catch (error) {
        console.error('Error executing query:', error);
      }
    },
    [pages, getNextPageInput, subscribeToQueryResult],
  );

  // Fetch the initial page
  const fetchInitialPage = React.useCallback(async () => {
    setPages([]);
    setIsPending(true);
    setHasNextPage(false);

    cleanupSubscriptions();

    await fetchPage(initialPageInput, 0);

    setIsPending(false);
  }, [initialPageInput, fetchPage]);

  React.useEffect(() => {
    fetchInitialPage();

    return () => {
      cleanupSubscriptions();
    };
  }, [initialInputHash]);

  // Function to fetch the next page
  const fetchNextPage = React.useCallback(async () => {
    if (!hasNextPage || isFetchingNextPage) return;

    setIsFetchingNextPage(true);

    const nextPageNumber = pages.length;
    const nextPageInput = getNextPageInput(nextPageNumber, pages);

    if (!nextPageInput) {
      setIsFetchingNextPage(false);
      setHasNextPage(false);
      return;
    }

    await fetchPage(nextPageInput, nextPageNumber);

    setIsFetchingNextPage(false);
  }, [pages, hasNextPage, isFetchingNextPage, getNextPageInput, fetchPage]);

  return {
    data: pages,
    isPending,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  };
};
