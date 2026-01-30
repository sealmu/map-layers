import React, { createContext } from "react";
import type { MapApi } from "../../types";

export const ApiContext = createContext<MapApi | undefined>(undefined);

export interface ApiProviderProps {
  children: React.ReactNode;
  api?: MapApi;
}

export function ApiProvider({ children, api }: ApiProviderProps) {
  return (
    <ApiContext.Provider value={api}>
      {children}
    </ApiContext.Provider>
  );
}