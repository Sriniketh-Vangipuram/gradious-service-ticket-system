import {
  keepPreviousData,
  useInfiniteQuery,
} from "@tanstack/react-query";

import {
  getUsers,
  type ListUsersParams,
} from "../api/userService";

import { USER_QUERY_KEYS } from "../api/user.keys";

export function useUsers(
  params?: Omit<ListUsersParams, "cursor">,
) {
  return useInfiniteQuery({
    queryKey: USER_QUERY_KEYS.list(params),

    queryFn: ({ pageParam }) =>
      getUsers({
        ...params,
        cursor: pageParam,
      }),

    initialPageParam: undefined as number | undefined,

    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination.hasNextPage) {
        return undefined;
      }

      return lastPage.pagination.nextCursor ?? undefined;
    },

    placeholderData: keepPreviousData,
  });
}