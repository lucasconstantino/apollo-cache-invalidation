# Apollo Cache Invalidation

A library to simplify cache invalidation for [Apollo clients](https://github.com/apollographql/apollo-client).

![Build status](https://travis-ci.org/lucasconstantino/apollo-cache-invalidation.svg?branch=master)
[![sponsored by Taller](https://raw.githubusercontent.com/TallerWebSolutions/tallerwebsolutions.github.io/master/sponsored-by-taller.png)](https://taller.net.br/en/)

## Installation

```
yarn add apollo-cache-invalidation
```

> Or `npm install --save apollo-cache-invalidation`, if you are still in the old days.

## Motivation

Cache control - and most of invalidation - is still a [discussing issue](https://github.com/apollographql/apollo-client/search?utf8=%E2%9C%93&q=cache+invalidation&type=Issues) for the Apollo Client team and the community involved. While participating in [one of those issues](https://github.com/apollographql/apollo-client/issues/621#issuecomment-281809084), I've proposed a way to do field-based cache invalidation. This projects aims to fulfil this need, while something like this isn't implemented in core.

## How does it work

This project exposes *invalidateFields*: a generator for a mutation [`update function`](https://www.apollographql.com/docs/react/advanced/caching.html#after-mutations) implementation specialized in invalidating cache based on field paths.

In some cases after a mutation you want to invalidate cache on other queries that might have become outdated, but you can't really update their results from the data provided by the mutation. The *refetchQueries* is often the tool of choice, but it allows no deep field invalidation, meaning you'll have to invalidate the exact and very specific performed queries. *invalidateFields* is an alternative.

## Usage

```js
import { invalidateFields, ROOT } from 'apollo-cache-invalidation'
import gql from 'graphql-tag'

import { client } from './client' // Apollo Client instance.

const mutation = gql`
  mutation MakeUserHappy($user: ID!) {
    makeUserHappy(user: $user) {
      id
    }
  }
`

// Invalidate happyPeople field on the Root Query. Force it to run again.
const update = invalidateFields((proxy, result) => [
  [ROOT, 'happyPeople']
])

client.mutate({ mutation, update, variables: { user: 1 } })
```

The function provided to *invalidateFields* will receive a *[DataProxy](http://dev.apollodata.com/core/apollo-client-api.html#DataProxy)* instance and the result for the mutation as arguments. It must then return an array of field paths to invalidate. Each field path consist of an array of keys. Each key can be one of:

- **String:** the key to invalidate;
- **RegExp:** regex to match keys to invalidate;
- **Function:** custom matching function to match keys to invalidate.

Each path will be compared individually to the whole cached data, invalidating any matched fields (possibly multiple) along the way.

The first key in a field path will test against either an object id (as resolved by the [`dataIdFromObject`](http://dev.apollodata.com/core/apollo-client-api.html#apollo-client) Apollo client config) or the *ROOT_QUERY* special key. In that case, you can provide the string `'ROOT_QUERY'`, or better, use the exported `ROOT` constant, as shown above.

### Regex matching sample

Imagine you wan't to invalidate field *happy* for every user after a given mutation. Having a `dataIdFromObject` as such:

```js
// Concatenate "__typename" and "id" field values to find identification.
// Do not uniquely identify resource if one of the fields is not provided
// (will use queried field name and variables, by default).
const dataIdFromObject = ({ __typename, id }) => {
  if (__typename && id) return __typename + id
  return null
}
```

you can invalidate a given field on all User type cached object with the following:

```js
const update = invalidateFields(() => [[/^User[0-9]+$/, 'happy']])

client.mutate({ mutation, update })
```

### Function matching

Similar to the Regex matching, you can do any customized field matching as so:

```js
const randomKeyMatch = key => Math.random() >= 0.5

const update = invalidateFields(() => [
  [randomKeyMatch, 'happy']
])

client.mutate({ mutation, update })
```

## This package should be temporary

I believe something similar to what is accomplished by this package should be soon added to the [Apollo Client](https://github.com/apollographql/apollo-client) core. If someday that happens, this package will either be deprecated or hold other experimental functionality on the subject of caching and invalidation.
