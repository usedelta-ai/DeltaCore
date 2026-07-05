import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';

interface EditorWrapperProps {
  itemKey: string | number;
  initialValue: string;
  onChange: (val: string) => void;
  language?: string;
}

export const EditorWrapper: React.FC<EditorWrapperProps> = ({
  itemKey,
  initialValue,
  onChange,
  language = 'json',
}) => {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [itemKey, initialValue]);

  const handleChange = (newValue: string | undefined) => {
    const val = newValue || '';
    setValue(val);
    onChange(val);
  };

  return (
    <Editor
      height="100%"
      language={language}
      theme="vs-light"
      value={value}
      onChange={handleChange}
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        wordWrap: 'on',
        padding: { top: 12, bottom: 12 },
        lineNumbers: 'on',
      }}
    />
  );
};
