import { useContext, type Context } from 'react';

export function useRequiredContext<T>(context: Context<T | undefined>, contextName: string): T {
  const value = useContext(context);
  if (value === undefined) {
    throw new Error(`${contextName} must be used within its provider.`);
  }
  return value;
}
