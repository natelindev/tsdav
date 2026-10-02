import React, { useId, useState } from 'react';
import styles from './Converter.module.css';
import { convertInput } from './ConverterBase';

type ConverterVariant = 'prop' | 'filter' | 'xml' | 'xml-reverse';

type ConverterProps = {
  content?: unknown;
  variant?: ConverterVariant;
};

const PRESETS: Record<ConverterVariant, string> = {
  xml: `<d:propfind xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
  <d:prop>
    <d:displayname />
    <d:getetag />
    <c:calendar-color />
  </d:prop>
</d:propfind>`,
  'xml-reverse': JSON.stringify(
    {
      'd:prop': {
        _attributes: { 'xmlns:d': 'DAV:' },
        'd:displayname': { _text: 'Personal Calendar' },
      },
    },
    null,
    2,
  ),
  prop: JSON.stringify(
    [
      { name: 'displayname', namespace: 'DAV:' },
      { name: 'calendar-color', namespace: 'urn:ietf:params:xml:ns:caldav' },
    ],
    null,
    2,
  ),
  filter: JSON.stringify(
    [
      {
        type: 'comp-filter',
        attributes: { name: 'VCALENDAR' },
        children: [
          {
            type: 'comp-filter',
            attributes: { name: 'VEVENT' },
          },
        ],
      },
    ],
    null,
    2,
  ),
};

export const Converter = ({ variant: initialVariant = 'xml', content }: ConverterProps) => {
  const id = useId();
  const [variant, setVariant] = useState<ConverterVariant>(initialVariant);
  const [input, setInput] = useState<string>(() => {
    if (typeof content === 'string') return content;
    if (content !== undefined) return JSON.stringify(content, null, 2);
    return PRESETS[initialVariant];
  });
  const [copied, setCopied] = useState(false);

  let output = '';
  let error = '';
  try {
    output = convertInput(variant, input);
  } catch (reason) {
    error = reason instanceof Error ? reason.message : 'Conversion failed';
  }

  const handleCopy = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleVariantChange = (newVariant: ConverterVariant) => {
    setVariant(newVariant);
    setInput(PRESETS[newVariant]);
  };

  return (
    <div className={styles.converterCard}>
      <div className={styles.header}>
        <div className={styles.tabs}>
          <button
            type="button"
            className={`${styles.tab} ${variant === 'xml' ? styles.tabActive : ''}`}
            onClick={() => handleVariantChange('xml')}
          >
            XML → JSON
          </button>
          <button
            type="button"
            className={`${styles.tab} ${variant === 'xml-reverse' ? styles.tabActive : ''}`}
            onClick={() => handleVariantChange('xml-reverse')}
          >
            JSON → XML
          </button>
          <button
            type="button"
            className={`${styles.tab} ${variant === 'prop' ? styles.tabActive : ''}`}
            onClick={() => handleVariantChange('prop')}
          >
            DAV Prop
          </button>
          <button
            type="button"
            className={`${styles.tab} ${variant === 'filter' ? styles.tabActive : ''}`}
            onClick={() => handleVariantChange('filter')}
          >
            DAV Filter
          </button>
        </div>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.copyBtn}
            onClick={handleCopy}
            disabled={!output || Boolean(error)}
          >
            {copied ? '✓ Copied' : 'Copy Result'}
          </button>
        </div>
      </div>

      <div className={styles.body}>
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <label htmlFor={`${id}-input`} className={styles.label}>
              {variant === 'xml' ? 'XML Input' : 'JSON Input'}
            </label>
            <span className={styles.badge}>Live Input</span>
          </div>
          <textarea
            id={`${id}-input`}
            className={styles.textarea}
            value={input}
            spellCheck={false}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste your XML or JSON here..."
          />
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <label htmlFor={`${id}-output`} className={styles.label}>
              {variant === 'xml-reverse' ? 'XML Output' : 'Normalized JSON Output'}
            </label>
            <span className={styles.badgeSuccess}>Parsed Output</span>
          </div>
          <textarea
            id={`${id}-output`}
            readOnly
            className={`${styles.textarea} ${styles.textareaOutput}`}
            value={error ? `Error: ${error}` : output}
            spellCheck={false}
          />
        </div>
      </div>

      {error && (
        <div className={styles.errorBanner} role="alert">
          <span className={styles.errorIcon}>⚠️</span>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
