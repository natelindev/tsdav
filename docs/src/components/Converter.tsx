/* eslint-disable no-eval */
/* eslint-disable no-nested-ternary */
import React, { useState } from 'react';

import ErrorBoundary from '@docusaurus/ErrorBoundary';

import styles from './Converter.module.css';
import {
  DAVNamespaceString,
  formatFilters,
  formatProps,
  safeGuard,
  xml2js,
  js2xml,
} from './ConverterBase';

type ConverterProps = {
  content: any;
  variant: 'prop' | 'filter' | 'xml' | 'xml-reverse';
};

export const Converter = (props: ConverterProps) => {
  const { variant, content } = props;
  const [input, setInput] = useState<any>(
    typeof content === 'string' ? content : JSON.stringify(content, null, 2)
  );

  return (
    <ErrorBoundary
      fallback={({ error, tryAgain }) => (
        <div>
          <p>conversion failed, reason: {error.message}.</p>
          <button onClick={tryAgain}>try again!</button>
        </div>
      )}
    >
      <div className={styles.converter}>
        <h2 className={styles.title}>{variant}:</h2>
        <textarea
          className={styles.textarea}
          defaultValue={input}
          onChange={(e) => {
            setInput(e.currentTarget.value);
          }}
        />
        <h2 className={styles.title}>converted:</h2>
        <textarea
          readOnly
          className={styles.textarea}
          value={
            variant === 'prop'
              ? safeGuard(() =>
                  JSON.stringify(formatProps(eval(`${DAVNamespaceString} (${input})`)), null, 2)
                )
              : variant === 'filter'
              ? safeGuard(() =>
                  JSON.stringify(formatFilters(eval(`${DAVNamespaceString} (${input})`)), null, 2)
                )
              : variant === 'xml'
              ? safeGuard(() => JSON.stringify(xml2js(input), null, 2))
              : variant === 'xml-reverse'
              ? safeGuard(() => js2xml(eval(`(${input})`)))
              : () => 'unknown variant'
          }
        />
      </div>
    </ErrorBoundary>
  );
};
