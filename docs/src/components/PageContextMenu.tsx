import React, { useState, useRef, useEffect } from 'react';
import styles from './PageContextMenu.module.css';

interface PageContextMenuProps {
  title: string;
  markdown?: string;
}

export default function PageContextMenu({ title, markdown = '' }: PageContextMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const getPageMarkdown = (): string => {
    if (markdown && markdown.trim().length > 0) {
      return `# ${title}\n\n${markdown}`;
    }
    // Fallback: extract from document
    const contentEl = document.querySelector('.sl-markdown-content');
    if (contentEl) {
      return `# ${title}\n\n${(contentEl as HTMLElement).innerText || ''}`;
    }
    return `# ${title}\n\n${window.location.href}`;
  };

  const handleCopy = async () => {
    try {
      const textToCopy = getPageMarkdown();
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setIsOpen(false);
    } catch (err) {
      console.error('Failed to copy page markdown:', err);
    }
  };

  const handleViewMarkdown = () => {
    const text = getPageMarkdown();
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setIsOpen(false);
  };

  const handleOpenChatGPT = () => {
    const currentUrl = window.location.href;
    const prompt = `Please answer questions about the following documentation: ${currentUrl}`;
    window.open(`https://chatgpt.com/?hints=search&q=${encodeURIComponent(prompt)}`, '_blank');
    setIsOpen(false);
  };

  const handleOpenClaude = () => {
    const currentUrl = window.location.href;
    const prompt = `Please answer questions about the following documentation: ${currentUrl}`;
    window.open(`https://claude.ai/new?q=${encodeURIComponent(prompt)}`, '_blank');
    setIsOpen(false);
  };

  const handleOpenPerplexity = () => {
    const currentUrl = window.location.href;
    const prompt = `Explain the documentation at ${currentUrl}`;
    window.open(`https://www.perplexity.ai/search?q=${encodeURIComponent(prompt)}`, '_blank');
    setIsOpen(false);
  };

  return (
    <div className={styles.container} ref={containerRef}>
      <div className={`${styles.buttonGroup} ${isOpen ? styles.buttonGroupOpen : ''}`}>
        <button
          type="button"
          className={`${styles.copyButton} ${copied ? styles.copiedText : ''}`}
          onClick={handleCopy}
          aria-label={copied ? 'Copied to clipboard' : 'Copy page'}
        >
          {copied ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>Copied!</span>
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              <span>Copy page</span>
            </>
          )}
        </button>

        <button
          type="button"
          className={`${styles.dropdownToggle} ${isOpen ? styles.dropdownToggleActive : ''}`}
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-label="More options for this page"
        >
          <svg
            className={`${styles.chevronIcon} ${isOpen ? styles.chevronOpen : ''}`}
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
      </div>

      {isOpen && (
        <div className={styles.menu} role="menu">
          <button type="button" className={styles.menuItem} onClick={handleCopy} role="menuitem">
            <div className={styles.itemIconWrapper}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </div>
            <div className={styles.itemText}>
              <span className={styles.itemTitle}>Copy page</span>
              <span className={styles.itemSubtitle}>Copy page as Markdown for LLMs</span>
            </div>
          </button>

          <button type="button" className={styles.menuItem} onClick={handleViewMarkdown} role="menuitem">
            <div className={styles.itemIconWrapper}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="5" width="18" height="14" rx="2"></rect>
                <path d="M7 15V9l3 3 3-3v6"></path>
                <path d="M17 9v6"></path>
                <path d="M15 13l2 2 2-2"></path>
              </svg>
            </div>
            <div className={styles.itemText}>
              <span className={styles.itemTitle}>
                View as Markdown <span className={styles.externalIcon}>↗</span>
              </span>
              <span className={styles.itemSubtitle}>View this page as plain text</span>
            </div>
          </button>

          <button type="button" className={styles.menuItem} onClick={handleOpenChatGPT} role="menuitem">
            <div className={styles.itemIconWrapper}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.5045 4.5045 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.6669zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"/>
              </svg>
            </div>
            <div className={styles.itemText}>
              <span className={styles.itemTitle}>
                Open in ChatGPT <span className={styles.externalIcon}>↗</span>
              </span>
              <span className={styles.itemSubtitle}>Ask questions about this page</span>
            </div>
          </button>

          <button type="button" className={styles.menuItem} onClick={handleOpenClaude} role="menuitem">
            <div className={styles.itemIconWrapper}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2a1 1 0 0 1 1 1v7.586l5.364-5.364a1 1 0 1 1 1.414 1.414L14.414 12l5.364 5.364a1 1 0 0 1-1.414 1.414L13 13.414V21a1 1 0 1 1-2 0v-7.586l-5.364 5.364a1 1 0 0 1-1.414-1.414L9.586 12 4.222 6.636a1 1 0 0 1 1.414-1.414L11 10.586V3a1 1 0 0 1 1-1z"/>
              </svg>
            </div>
            <div className={styles.itemText}>
              <span className={styles.itemTitle}>
                Open in Claude <span className={styles.externalIcon}>↗</span>
              </span>
              <span className={styles.itemSubtitle}>Ask questions about this page</span>
            </div>
          </button>

          <button type="button" className={styles.menuItem} onClick={handleOpenPerplexity} role="menuitem">
            <div className={styles.itemIconWrapper}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L4 7v10l8 5 8-5V7l-8-5zm0 2.5L18 8v8l-6 3.75L6 16V8l6-3.5zm-1 3.5v4H7v2h4v4h2v-4h4v-2h-4V8h-2z"/>
              </svg>
            </div>
            <div className={styles.itemText}>
              <span className={styles.itemTitle}>
                Open in Perplexity <span className={styles.externalIcon}>↗</span>
              </span>
              <span className={styles.itemSubtitle}>Ask questions about this page</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
