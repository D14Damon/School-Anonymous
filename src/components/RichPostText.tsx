import React from 'react';

const renderInlineText = (text: string, lineIndex: number): React.ReactNode[] => {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={`${lineIndex}-bold-${index}`} className="font-bold text-white">{part.slice(2, -2)}</strong>;
    }
    return <React.Fragment key={`${lineIndex}-text-${index}`}>{part}</React.Fragment>;
  });
};

export const RichPostText: React.FC<{ text: string; className?: string }> = ({ text, className = '' }) => {
  const lines = text.split('\n');

  return (
    <div className={className}>
      {lines.map((line, index) => {
        const headingMatch = line.match(/^# (.+)$/);
        if (headingMatch) {
          return (
            <h2 key={`heading-${index}`} className="text-2xl sm:text-3xl font-bold font-gothic text-slate-100 leading-tight my-1">
              {renderInlineText(headingMatch[1], index)}
            </h2>
          );
        }

        return (
          <div key={`line-${index}`} className="min-h-[1em]">
            {renderInlineText(line, index)}
          </div>
        );
      })}
    </div>
  );
};