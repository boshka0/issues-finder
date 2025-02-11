import * as React from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import pick from 'lodash/pick';
import get from 'lodash/get';

import Layout from '../components/Layout';
import { useFindOneIssueQuery } from '../graphql/issue/findIssues.generated';
import { withApollo } from '../lib/withApollo';
import { IssueItem } from '../components/Issue';

const IssuePage: NextPage = () => {
  let {
    query: { id }
  } = useRouter();
  id = typeof id === 'string' ? id : id[0];
  const { data, loading } = useFindOneIssueQuery({
    skip: !id,
    variables: { id }
  });

  return (
    <Layout title="Issue" nav={[{ href: '/', label: 'Home' }]}>
      {loading && <p>Loading...</p>}
      {data && (
        <IssueItem
          {...pick(data.node as any, [
            'state',
            'url',
            'body',
            'publishedAt',
            'repository'
          ])}
          labels={get(data.node, 'labels.nodes', [])}
        />
      )}
    </Layout>
  );
};

export default withApollo(IssuePage);
