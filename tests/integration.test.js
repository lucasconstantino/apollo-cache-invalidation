import ApolloClient from 'apollo-client'
import { ApolloLink, Observable } from 'apollo-link'
import { InMemoryCache } from 'apollo-cache-inmemory'
import gql from 'graphql-tag'

import { invalidateFields } from 'apollo-cache-invalidation'

const dataIdFromObject = ({ __typename, id }) =>
  !id || !__typename ? null : __typename + id

const mockLink = resolver => new ApolloLink((operation, forward) => {
  const resultPromise = resolver(operation)
  return new Observable(observer => resultPromise.then(result => {
    observer.next(result)
    observer.complete()
    return result
  }, err => {
    observer.error(err)
  }))
})

const mockedClient = query => new ApolloClient({
  ssrMode: true,
  dataIdFromObject,
  cache: new InMemoryCache(),
  link: mockLink(query),
})

/*
Reference schema:

type Person {
  id: ID!
  name: String!
  happy: Boolean
}

type Query {
  happyPeople: [Person]
}

type Mutation {
  winWorldCup: Boolean
}

schema {
  query: Query
  mutation: Mutation
}
 */

describe('integration', () => {
  it('should clear cache on a real apollo-client', async () => {
    const results = {
      HappyPeople: {
        happyPeople: [
          { __typename: 'Person', id: 1, happy: true },
          { __typename: 'Person', id: 2, happy: false },
        ]
      },
      WinWorldCup: {
        winWorldCup: true
      }
    }

    const resolver = jest.fn(
      async ({ operationName }) => ({ data: results[operationName] })
    )

    const client = mockedClient(resolver)
    const query = gql`query HappyPeople { happyPeople { id, happy } }`
    const mutation = gql`mutation WinWorldCup { winWorldCup }`
    const update = invalidateFields((proxy) => [['ROOT_QUERY', 'happyPeople']])

    await client.query({ query })
    await client.mutate({ mutation })
    await client.query({ query })

    // // Second query should have been cached, therefore not called.
    expect(resolver).toHaveBeenCalledTimes(2)

    await client.mutate({ mutation, update })
    await client.query({ query })

    // Second query now should have been called.
    expect(resolver).toHaveBeenCalledTimes(4)
  })

  it('should clear whole cache when ROOT_QUERY is provided as key', async () => {
    const results = {
      HappyPeople: {
        happyPeople: [
          { __typename: 'Person', id: 1, happy: true },
          { __typename: 'Person', id: 2, happy: false },
        ]
      },
      WinWorldCup: {
        winWorldCup: true
      }
    }

    const resolver = jest.fn(
      async ({ operationName }) => ({ data: results[operationName] })
    )

    const client = mockedClient(resolver)
    const query = gql`query HappyPeople { happyPeople { id, happy } }`
    const mutation = gql`mutation WinWorldCup { winWorldCup }`
    const update = invalidateFields((proxy) => [['ROOT_QUERY']])

    await client.query({ query })
    await client.mutate({ mutation })
    await client.query({ query })

    // // Second query should have been cached, therefore not called.
    expect(resolver).toHaveBeenCalledTimes(2)

    await client.mutate({ mutation, update })
    await client.query({ query })

    // Second query now should have been called.
    expect(resolver).toHaveBeenCalledTimes(4)
  })
})
