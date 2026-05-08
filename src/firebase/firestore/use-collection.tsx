'use client';

import { useState, useEffect } from 'react';
import {
  Query,
  onSnapshot,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  CollectionReference,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/** Utility type to add an 'id' field to a given type T. */
export type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useCollection hook.
 * @template T Type of the document data.
 */
export interface UseCollectionResult<T> {
  data: WithId<T>[] | null; // Document data with ID, or null.
  isLoading: boolean;       // True if loading.
  error: FirestoreError | Error | null; // Error object, or null.
}

/* Internal implementation of Query:
  https://github.com/firebase/firebase-js-sdk/blob/c5f08a9bc5da0d2b0207802c972d53724ccef055/packages/firestore/src/lite-api/reference.ts#L143
*/
export interface InternalQuery extends Query<DocumentData> {
  _query: {
    path: {
      canonicalString(): string;
      toString(): string;
    }
    allDescendants?: boolean;
    collectionGroup?: string;
  }
}

/**
 * React hook to subscribe to a Firestore collection or query in real-time.
 * Handles nullable references/queries.
 * 
 *
 * IMPORTANT! YOU MUST MEMOIZE the inputted memoizedTargetRefOrQuery or BAD THINGS WILL HAPPEN
 * use useMemo to memoize it per React guidence.  Also make sure that it's dependencies are stable
 * references
 *  
 * @template T Optional type for document data. Defaults to any.
 * @param {CollectionReference<DocumentData> | Query<DocumentData> | null | undefined} targetRefOrQuery -
 * The Firestore CollectionReference or Query. Waits if null/undefined.
 * @returns {UseCollectionResult<T>} Object with data, isLoading, error.
 */
export function useCollection<T = any>(
    memoizedTargetRefOrQuery: ((CollectionReference<DocumentData> | Query<DocumentData>) & {__memo?: boolean})  | null | undefined,
): UseCollectionResult<T> {
  type ResultItemType = WithId<T>;
  type StateDataType = ResultItemType[] | null;

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  useEffect(() => {
    const isValidTarget = memoizedTargetRefOrQuery && (memoizedTargetRefOrQuery.type === 'query' || memoizedTargetRefOrQuery.type === 'collection');

    if (!isValidTarget) {
      setData(null);
      setError(null);
      setIsLoading(false); // If no target, we are not loading.
      return; 
    }
    
    // A valid target is present, ensure loading is true before starting.
    setIsLoading(true); 
    setError(null);

    const internalQuery = (memoizedTargetRefOrQuery as InternalQuery)._query;
    const isCollectionGroupQuery = internalQuery?.collectionGroup !== undefined;
    
    const queryPath: string | undefined =
      memoizedTargetRefOrQuery.type === 'collection'
        ? (memoizedTargetRefOrQuery as CollectionReference).path
        : internalQuery?.path?.toString();

    if (!isCollectionGroupQuery && (!queryPath || queryPath.trim() === '' || queryPath.trim() === '/')) {
        setData(null);
        setError(new Error("Invalid query path provided to useCollection. Queries to the database root are not allowed."));
        setIsLoading(false);
        return;
    }

    const unsubscribe = onSnapshot(
      memoizedTargetRefOrQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const results: ResultItemType[] = [];
        for (const doc of snapshot.docs) {
          results.push({ ...(doc.data() as T), id: doc.id });
        }
        setData(results);
        setError(null);
        setIsLoading(false);
      },
      (err: FirestoreError) => {
        let errorPathForContext: string | undefined = queryPath;
        if (isCollectionGroupQuery && internalQuery.collectionGroup) {
          errorPathForContext = `**/${internalQuery.collectionGroup}`;
        }

        if (!errorPathForContext) {
          console.error("useCollection: Could not determine path for permission error reporting.", err);
          setError(err);
          setData(null);
          setIsLoading(false);
          return;
        }

        const contextualError = new FirestorePermissionError({
          operation: 'list',
          path: errorPathForContext,
        })

        setError(contextualError)
        setData(null)
        setIsLoading(false)

        errorEmitter.emit('permission-error', contextualError);
      }
    );

    return () => unsubscribe();
  }, [memoizedTargetRefOrQuery]);
  
  if(memoizedTargetRefOrQuery && !memoizedTargetRefOrQuery.__memo) {
    throw new Error('useCollection query was not properly memoized using useMemoFirebase. This will cause performance issues and potential infinite loops.');
  }
  return { data, isLoading, error };
}
