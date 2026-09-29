import React from 'react';

const renderInline = (text) => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};

const AssistantMessage = ({ text }) => {
  const lines = text.split('\n');

  return (
    <div className="space-y-1">
      {lines.map((line, index) => {
        const trimmedLine = line.trim();
        const bulletMatch = trimmedLine.match(/^[-•]\s+(.*)$/);
        const numberedMatch = trimmedLine.match(/^\d+\.\s+(.*)$/);
        const content = bulletMatch?.[1] || numberedMatch?.[1] || trimmedLine;

        if (!content) {
          return <div key={index} className="h-2" />;
        }

        if (bulletMatch || numberedMatch) {
          return (
            <div key={index} className="flex gap-2">
              <span aria-hidden="true">•</span>
              <span>{renderInline(content)}</span>
            </div>
          );
        }

        return <div key={index}>{renderInline(content)}</div>;
      })}
    </div>
  );
};

export default AssistantMessage;
