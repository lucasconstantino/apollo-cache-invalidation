# Apollo Cache

A library to simplify cache invalidation for [Apollo clients](https://github.com/apollographql/apollo-client).

![Build status](https://travis-ci.org/lucasconstantino/apollo-cache.svg?branch=master)

## Installation

```
yarn add apollo-cache
```

> Or `npm install --save apollo-cache`, if you are still in the old days.

## Motivation

Cache control - and most of invalidation - is still a [discussing issue](https://github.com/apollographql/apollo-client/search?utf8=%E2%9C%93&q=cache+invalidation&type=Issues) for the Apollo Client team and the community involved. While participating in [one of those issues](https://github.com/apollographql/apollo-client/issues/621#issuecomment-281809084), I've proposed a way to do field-based cache invalidation. This projects aims to fulfil this need, while something like this isn't implemented in core.

## How does it work

This project exposes *invalidateFields*: a higher-order [`mutate.options.update`](http://dev.apollodata.com/react/api.html#graphql-mutation-options.update) implementation specialized in invalidating cache based on field paths.

In some cases after a mutation you want to invalidate cache on other queries that might have become outdated, but you can't really update their results from the data provided by the mutation. The *refetchQueries* is often the tool of choice, but it allows no deep field invalidation, meaning you'll have to invalidate the exact and very specific performed queries. *invalidateFields* is an alternative.

## Usage

```js
import { invalidateFields } from 'apollo-cache'
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
  'ROOT_QUERY', 'happyPeople'
])

client.mutate({ mutation, update, variables: { user: 1 } })
```

The function provided to *invalidateFields* will receive a *[DataProxy](http://dev.apollodata.com/core/apollo-client-api.html#DataProxy)* instance and the result for the mutation. It must return an array of field paths to invalidate. Each field path consist of an array of keys. Each key can be one of:

- **String:** string equality test;
- **RegExp:** regex match test;
- **Function:** custom matching test.

Each path will be compared individually to the whole cached data, invalidating any matched (possibly multiple) along the way.

The first key in a field path will test against either an object id (as resolved by the [`dataIdFromObject`](http://dev.apollodata.com/core/apollo-client-api.html#apollo-client) Apollo client config) or the *ROOT_QUERY*.

### Regex matching sample

Imagine you wan't to invalite field *father* for every user after a given mutation. Having a `dataIdFromObject` as such:

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
const update = invalidateFields(() => [[/^User[0-9]+$/, 'father']])

client.mutate({ mutation, update })
```

### Function matching

Similar to the Regex matching, you can do any customized field matching as so:

```js
const randomKeyMatch = key => Math.random() >= 0.5

const update = invalidateFields(() => [
  [randomKeyMatch, 'father']
])

client.mutate({ mutation, update })
```
