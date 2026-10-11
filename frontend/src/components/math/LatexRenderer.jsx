import React from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

/**
 * LatexRenderer Component
 * Parses mixed text containing LaTeX delimiters:
 * - Block math: $$ ... $$ or \[ ... \]
 * - Inline math: $ ... $ or \( ... \)
 */
export default function LatexRenderer({ content, inline = false, className = '' }) {
  if (!content) return null;

  if (typeof content !== 'string') {
    return <span className={className}>{String(content)}</span>;
  }

  // If inline prop is forced and content doesn't contain delimiters, render directly
  if (inline && !content.includes('$') && !content.includes('\\(')) {
    try {
      return <InlineMath math={content} />;
    } catch (e) {
      return <span className={className}>{content}</span>;
    }
  }

  // Regex to match math expressions
  const parts = [];
  const regex = /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\$[^\$\n]+?\$|\\\([\s\S]+?\\\))/g;

  let lastIndex = 0;
  let match;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        value: content.substring(lastIndex, match.index)
      });
    }

    const rawMatch = match[0];
    if (rawMatch.startsWith('$$') && rawMatch.endsWith('$$')) {
      parts.push({ type: 'block', value: rawMatch.slice(2, -2).trim() });
    } else if (rawMatch.startsWith('\\[') && rawMatch.endsWith('\\]')) {
      parts.push({ type: 'block', value: rawMatch.slice(2, -2).trim() });
    } else if (rawMatch.startsWith('$') && rawMatch.endsWith('$')) {
      parts.push({ type: 'inline', value: rawMatch.slice(1, -1).trim() });
    } else if (rawMatch.startsWith('\\(') && rawMatch.endsWith('\\)')) {
      parts.push({ type: 'inline', value: rawMatch.slice(2, -2).trim() });
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < content.length) {
    parts.push({
      type: 'text',
      value: content.substring(lastIndex)
    });
  }

  if (parts.length === 0) {
    return <span className={className}>{content}</span>;
  }

  return (
    <span className={`latex-container ${className}`}>
      {parts.map((part, idx) => {
        if (part.type === 'text') {
          return <span key={idx}>{part.value}</span>;
        } else if (part.type === 'block') {
          return (
            <span key={idx} className="block my-2">
              <BlockMath math={part.value} />
            </span>
          );
        } else {
          return <InlineMath key={idx} math={part.value} />;
        }
      })}
    </span>
  );
}
