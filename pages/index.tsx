import React, { useEffect, useRef } from 'react';

import { NextPage } from 'next';
import { useRouter } from 'next/router';
// TODO: Try to use https://github.com/tc39/proposal-optional-chaining
import get from 'lodash/get';
import merge from 'lodash/merge';
import pick from 'lodash/pick';
import { useApolloClient } from '@apollo/react-hooks';

import Layout from '../components/Layout';
import { IssueItem } from '../components/Issue';
import { withApollo } from '../lib/withApollo';
import { useGetLanguageQuery } from '../graphql/language/getLanguage.generated';
import { useSetLanguageMutation } from '../graphql/language/setLanguage.generated';
import { useGetLabelsQuery } from '../graphql/label/getLabels.generated';
import { useAddLabelMutation } from '../graphql/label/addLabel.generated';
import {
  useFindIssuesQuery,
  FindIssuesQuery
} from '../graphql/issue/findIssues.generated';
import addLabelResolver from '../graphql/label/addLabel.resolver';
import getLanguageResolver from '../graphql/language/getLanguage.resolver';
import setLanguageResolver from '../graphql/language/setLanguage.resolver';

const resolvers = merge(
  addLabelResolver,
  getLanguageResolver,
  setLanguageResolver
);

const buildQuery = (language: string, labels: string[]): string => {
  const languageWithPrefix = `language:${language}`;
  const labelsWithPrefix = labels.map(label => `label:${label}`).join(' ');
  return `${languageWithPrefix} ${labelsWithPrefix}`;
};

const useFindIssues = (defaultLanguage: string, defaultLabels: string[]) => {
  const client = useApolloClient();

  useEffect(() => {
    client.addResolvers(resolvers as any);
  }, []);

  const { data: languagesData } = useGetLanguageQuery();
  let language = (languagesData && languagesData.language) || defaultLanguage;
  const [setLanguage] = useSetLanguageMutation();

  const { data: labelsData } = useGetLabelsQuery();
  let labels = (labelsData && labelsData.labels) || [];
  labels = labels.length ? labels : defaultLabels;
  const [addLabel] = useAddLabelMutation();

  const shouldRunQuery = language && labels.length > 0;
  const query = buildQuery(language, labels as string[]);
  const { fetchMore, ...issuesData } = useFindIssuesQuery({
    variables: { query },
    notifyOnNetworkStatusChange: true,
    skip: !shouldRunQuery
  });

  const fetchNextIssues = () => {
    const endCursor = get(
      issuesData.data,
      'search.pageInfo.endCursor',
      ''
    ) as string;
    fetchMore({
      variables: {
        query,
        after: endCursor
      },
      updateQuery: (prev, { fetchMoreResult }): FindIssuesQuery => {
        if (!fetchMoreResult) return prev;
        const prevEdges = get(prev, 'search.edges', []);

        fetchMoreResult.search.edges = [
          ...prevEdges,
          ...(fetchMoreResult.search.edges || [])
        ];

        return fetchMoreResult;
      }
    });
  };

  return [
    { labels, language, issuesData },
    { setLanguage, addLabel, fetchNextIssues }
  ] as const;
};

const queryStringLabelsToList = (labels: string) => {
  const parsedLabels = decodeURIComponent(labels)
    .split(',')
    .filter(Boolean)
    .map((str: string) => str.trim());
  return parsedLabels;
};

interface RouteParams {
  language?: string;
  labels?: string;
}

const IndexPage: NextPage = () => {
  const inputEl = useRef<HTMLInputElement | null>(null);
  const router = useRouter();
  const {
    language: defaultLanguage = '',
    labels: defaultLabels = ''
  }: RouteParams = router ? router.query : {};

  const [
    {
      language: updatedLanguage,
      labels,
      issuesData: { loading, data }
    },
    { setLanguage, addLabel, fetchNextIssues }
  ] = useFindIssues(defaultLanguage, queryStringLabelsToList(defaultLabels));

  const edges = get(data, 'search.edges', []);

  const handleLanguageSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const language = e.target.value;
    setLanguage({ variables: { language } });
    const href = {
      pathname: router.pathname,
      query: { ...router.query, language }
    };
    router.push(href, href);
  };

  const handleAddLabel = () => {
    if (!inputEl.current) return;
    const val = inputEl.current.value;
    if (val) {
      addLabel({ variables: { label: val } });
      const updatedLabels = router.query.labels
        ? `${router.query.labels},${val}`
        : val;
      const href = {
        pathname: router.pathname,
        query: { ...router.query, labels: updatedLabels }
      };
      router.push(href, href);
      inputEl.current.value = '';
    }
  };

  return (
    <Layout title="Issues finder" nav={[{ href: '/', label: 'Clear all' }]}>
      <style jsx>
        {`
          .controls-container {
            display: flex;
            align-items: center;
          }

          .labels-container {
            flex: 1;
          }

          .labels-list {
            padding-left: 15px;
            list-style-type: circle;
          }

          .fetch-more-container {
            text-align: center;
          }
        `}
      </style>
      <div>
        <div className="controls-container">
          <div className="labels-container">
            <strong>Labels:</strong>

            {labels.length > 0 && (
              <ul className="labels-list">
                {labels.map((label, i) => (
                  <li key={i}>{label}</li>
                ))}
              </ul>
            )}
          </div>

          <select
            value={updatedLanguage}
            name="languageSelect"
            id="languageSelect"
            className="language-select"
            onChange={handleLanguageSelect}
          >
            <option value="">Choose your language</option>
            <option value="javascript">JavaScript</option>
            <option value="java">Java</option>
          </select>
        </div>
        <input ref={inputEl} type="text" placeholder="Label" />
        <button type="button" onClick={handleAddLabel}>
          Add label
        </button>
      </div>
      {loading && edges.length === 0 ? <p>Loading...</p> : null}
      <ul>
        {edges.map((edge: any) => {
          return (
            <li key={edge.node.id}>
              <IssueItem
                {...pick(edge.node, [
                  'state',
                  'url',
                  'body',
                  'publishedAt',
                  'repository',
                  'id'
                ])}
                labels={get(edge.node, 'labels.nodes', [])}
              />
            </li>
          );
        })}
      </ul>
      {loading && edges.length > 0 ? <p>Loading...</p> : null}

      <div className="fetch-more-container">
        {edges.length > 0 && (
          <button type="button" onClick={fetchNextIssues}>
            Fetch {edges.length > 0 ? 'more' : ''}
          </button>
        )}
      </div>
    </Layout>
  );
};

export default withApollo(IndexPage);
