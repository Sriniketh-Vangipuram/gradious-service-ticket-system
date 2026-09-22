import type { PropsWithChildren } from "react";
import { Provider as ReduxProvider } from "react-redux";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";

import { store } from "../store/store";
import { queryClient } from "../../lib/query/query-client";

export function AppProviders({
  children,
}: PropsWithChildren) {
  return (
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </QueryClientProvider>
    </ReduxProvider>
  );
}