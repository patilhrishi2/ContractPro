import React, { createContext, useContext, ReactNode } from 'react';
import { useBlockchainState } from '../hooks/useBlockchainState';

type BlockchainContextType = ReturnType<typeof useBlockchainState>;

const BlockchainContext = createContext<BlockchainContextType | undefined>(undefined);

export const BlockchainProvider = ({ children }: { children: ReactNode }) => {
  const blockchainState = useBlockchainState();
  return (
    <BlockchainContext.Provider value={blockchainState}>
      {children}
    </BlockchainContext.Provider>
  );
};

export const useBlockchain = () => {
  const context = useContext(BlockchainContext);
  if (context === undefined) {
    throw new Error('useBlockchain must be used within a BlockchainProvider');
  }
  return context;
};
