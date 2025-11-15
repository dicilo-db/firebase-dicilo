'use client';

import { useState, useCallback, useTransition } from 'react';

// T es el tipo del payload, U es el tipo del retorno
type ServerAction<T, U> = (payload: T) => Promise<U>;

export function useServerAction<T, U>(serverAction: ServerAction<T, U>) {
  const [isPending, startTransition] = useTransition();

  const runAction = useCallback(
    (payload: T): Promise<U> => {
      return new Promise((resolve, reject) => {
        startTransition(async () => {
          try {
            const response = await serverAction(payload);
            resolve(response);
          } catch (e) {
            const err =
              e instanceof Error ? e : new Error('An unknown error occurred.');
            reject(err);
          }
        });
      });
    },
    [serverAction]
  );

  return { isPending, runAction };
}
