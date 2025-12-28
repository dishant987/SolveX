import { useEffect, useRef } from 'react';
import * as Monaco from 'monaco-editor';
import Editor, { type OnMount } from '@monaco-editor/react';
import { useTheme } from '@/hooks/use-theme';

interface MonacoEditorProps {
    language: string;
    value: string;
    onChange: (value: string) => void;
    height?: string;
    className?: string;
    readOnly?: boolean;
}

export function MonacoEditor({
    language,
    value,
    onChange,
    height = '400px',
    className = '',
    readOnly = false,
}: MonacoEditorProps) {
    const { theme } = useTheme();
    const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);

    const handleEditorDidMount: OnMount = (editor) => {
        editorRef.current = editor;

        // Configure editor options
        editor.updateOptions({
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 14,
            lineNumbers: 'on',
            roundedSelection: false,
            scrollbar: {
                vertical: 'auto',
                horizontal: 'auto',
            },
            lineNumbersMinChars: 3,
            wordWrap: 'on',
            wrappingIndent: 'indent',
            autoIndent: 'full',
            formatOnPaste: true,
            formatOnType: true,
        });

        // Add keyboard shortcuts
        editor.addCommand(Monaco.KeyMod.CtrlCmd | Monaco.KeyCode.KeyS, () => {
            // Save functionality
        });
    };

    // Configure Monaco for supported languages
    useEffect(() => {
        if (typeof window !== 'undefined') {
            // Configure JavaScript/TypeScript
            Monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
                target: Monaco.languages.typescript.ScriptTarget.ES2020,
                allowNonTsExtensions: true,
            });

            // Configure Python (basic support)
            Monaco.languages.register({ id: 'python' });
            Monaco.languages.setMonarchTokensProvider('python', {
                keywords: [
                    'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await',
                    'break', 'class', 'continue', 'def', 'del', 'elif', 'else',
                    'except', 'finally', 'for', 'from', 'global', 'if', 'import',
                    'in', 'is', 'lambda', 'nonlocal', 'not', 'or', 'pass',
                    'raise', 'return', 'try', 'while', 'with', 'yield'
                ],
                tokenizer: {
                    root: [
                        [/[a-zA-Z_]\w*/, {
                            cases: {
                                '@keywords': 'keyword',
                                '@default': 'identifier'
                            }
                        }],
                        [/[{}()\[\]]/, '@brackets'],
                        [/@?[a-zA-Z_]\w*/, 'type.identifier'],
                        [/\d*\.\d+([eE][\-+]?\d+)?/, 'number.float'],
                        [/\d+/, 'number'],
                        [/"/, 'string', '@string_double'],
                        [/'/, 'string', '@string_single'],
                        [/[;,]/, 'delimiter'],
                    ],
                    string_double: [
                        [/[^\\"]+/, 'string'],
                        [/\\./, 'string.escape'],
                        [/"/, 'string', '@pop']
                    ],
                    string_single: [
                        [/[^\\']+/, 'string'],
                        [/\\./, 'string.escape'],
                        [/'/, 'string', '@pop']
                    ]
                }
            });

            // Configure Java
            Monaco.languages.register({ id: 'java' });
        }
    }, []);

    return (
        <div className={`relative ${className}`}>
           
            <Editor
                height={height}
                language={language}
                value={value}
                onChange={(value) => onChange(value || '')}
                theme={theme === 'dark' ? 'vs-dark' : 'light'}
                onMount={handleEditorDidMount}
                options={{
                    readOnly,
                    wordWrap: 'on',
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    fontSize: 14,
                    lineNumbers: 'on',
                    roundedSelection: false,
                    scrollbar: {
                        vertical: 'auto',
                        horizontal: 'auto',
                    },
                    lineNumbersMinChars: 3,
                    autoIndent: 'full',
                    formatOnPaste: true,
                    formatOnType: true,
                    suggestOnTriggerCharacters: true,
                    acceptSuggestionOnEnter: 'on',
                    snippetSuggestions: 'inline',
                    parameterHints: { enabled: true },
                }}
            />
        </div>
    );
}