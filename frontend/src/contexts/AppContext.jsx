import { createContext, useContext } from 'react';

const AppContext = createContext(null);

export function useApp() {
  return useContext(AppContext);
}

export default AppContext;
