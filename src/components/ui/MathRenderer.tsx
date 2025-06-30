import React from 'react';
import 'katex/dist/katex.min.css';
import katex from 'katex';

interface MathRendererProps {
  content: string;
}

const MathRenderer: React.FC<MathRendererProps> = ({ content }) => {
  // Split by $$...$$ for display math
  const renderContent = () => {
    return content.split(/(\$\$.*?\$\$)/gs).map((part, i) => {
      if (part.startsWith('$$') && part.endsWith('$$')) {
        const latex = part.slice(2, -2);
        try {
          return (
            <span
              key={i}
              className="block max-w-full overflow-x-auto"
              style={{ display: 'block', width: '100%' }}
              dangerouslySetInnerHTML={{
                __html: katex.renderToString(latex, { displayMode: true }),
              }}
            />
          );
        } catch (e) {
          return <span key={i}>{part}</span>;
        }
      }
      return <span key={i}>{part}</span>;
    });
  };

  return <div className="overflow-x-auto w-full break-words">{renderContent()}</div>;
};

export default MathRenderer; 