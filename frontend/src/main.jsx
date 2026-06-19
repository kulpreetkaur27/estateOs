import React from 'react';
import ReactDOM from 'react-dom';
import App from './App.jsx';
import ApolloProviderWrapper from './ApolloProvider';
import './index.css';


ReactDOM.render(
  <React.StrictMode>

      <ApolloProviderWrapper>
        <App />
      </ApolloProviderWrapper>

  </React.StrictMode>,
  document.getElementById('root')
);
