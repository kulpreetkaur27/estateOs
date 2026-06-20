// src/ApolloProvider.js
import React from 'react';
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';
import { createUploadLink } from 'apollo-upload-client';

const uploadLink = createUploadLink({
  uri: import.meta.env.VITE_API_URL || 'http://localhost:5000/graphql',
});

const client = new ApolloClient({
  link: uploadLink,
  cache: new InMemoryCache(),
});

const ApolloProviderWrapper = ({ children }) => {
  return <ApolloProvider client={client}>{children}</ApolloProvider>;
};

export default ApolloProviderWrapper;