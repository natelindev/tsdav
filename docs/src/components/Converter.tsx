import React, { useId, useState } from 'react';
import styles from './Converter.module.css';
import { convertInput } from './ConverterBase';

type ConverterProps = {
  content: unknown;
  variant: 'prop' | 'filter' | 'xml' | 'xml-reverse';
};

export const Converter = ({ variant, content }: ConverterProps) => {
  const id = useId();
  const [input, setInput] = useState(
    typeof content === 'string' ? content : JSON.stringify(content, null, 2),
  );
  let output = '';
  let error = '';
  try {
    output = convertInput(variant, input);
  } catch (reason) {
    error = reason instanceof Error ? reason.message : 'Conversion failed';
  }
  return (
    <div className={styles.converter}>
      <label className={styles.title} htmlFor={`${id}-input`}>
        {variant === 'xml' ? 'XML input' : 'JSON input'}
      </label>
      <textarea
        id={`${id}-input`}
        className={styles.textarea}
        value={input}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        spellCheck={false}
        onChange={(event) => setInput(event.currentTarget.value)}
      />
      <p id={`${id}-error`} className={styles.error} role="status">
        {error}
      </p>
      <label className={styles.title} htmlFor={`${id}-output`}>
        Converted result
      </label>
      <textarea
        id={`${id}-output`}
        readOnly
        className={styles.textarea}
        value={output}
        spellCheck={false}
      />
    </div>
  );
};
