// src/ApolloProvider.js
import React from 'react';
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';
import { createUploadLink } from 'apollo-upload-client'; // For handling file uploads

// Create the Apollo Client with the upload link
const uploadLink = createUploadLink({
  uri: 'http://localhost:5373/graphql', 
});

const client = new ApolloClient({
  link: uploadLink,
  cache: new InMemoryCache(),
});

// ApolloProviderWrapper that wraps the entire app
const ApolloProviderWrapper = ({ children }) => {
  return <ApolloProvider client={client}>{children}</ApolloProvider>;
};

export default ApolloProviderWrapper;
