import * as Types from '../../types/types';

import gql from 'graphql-tag';
import * as ApolloReactCommon from '@apollo/react-common';
import * as ApolloReactHooks from '@apollo/react-hooks';
export type GetLabelsQueryVariables = {};

export type GetLabelsQuery = { __typename?: 'Query' } & Pick<
  Types.Query,
  'labels'
>;

export const GetLabelsDocument = gql`
  query GetLabels {
    labels @client
  }
`;

export function useGetLabelsQuery(
  baseOptions?: ApolloReactHooks.QueryHookOptions<
    GetLabelsQuery,
    GetLabelsQueryVariables
  >
) {
  return ApolloReactHooks.useQuery<GetLabelsQuery, GetLabelsQueryVariables>(
    GetLabelsDocument,
    baseOptions
  );
}
export function useGetLabelsLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    GetLabelsQuery,
    GetLabelsQueryVariables
  >
) {
  return ApolloReactHooks.useLazyQuery<GetLabelsQuery, GetLabelsQueryVariables>(
    GetLabelsDocument,
    baseOptions
  );
}

export type GetLabelsQueryHookResult = ReturnType<typeof useGetLabelsQuery>;
export type GetLabelsQueryResult = ApolloReactCommon.QueryResult<
  GetLabelsQuery,
  GetLabelsQueryVariables
>;
