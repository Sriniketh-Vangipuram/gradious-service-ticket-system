export type CursorPaginationMeta= {
    nextCursor: string | null;
    hasNextPage: boolean;
};

export type CursorPaginatedData<T>={
    items:T[];
    pagination:CursorPaginationMeta;
}