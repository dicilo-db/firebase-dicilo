// src/components/TiptapEditor.tsx
'use client';

import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useController } from 'react-hook-form';
import TextAlign from '@tiptap/extension-text-align';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';

// Componente para la barra de herramientas del editor
const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 border-b border-gray-200 bg-gray-50 p-2">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`rounded p-2 hover:bg-gray-200 ${editor.isActive('bold') ? 'bg-gray-300' : ''}`}
        aria-label="Bold"
      >
        <span className="font-bold">B</span>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`rounded p-2 hover:bg-gray-200 ${editor.isActive('italic') ? 'bg-gray-300' : ''}`}
        aria-label="Italic"
      >
        <span className="italic">I</span>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setParagraph().run()}
        className={`rounded p-2 hover:bg-gray-200 ${editor.isActive('paragraph') ? 'bg-gray-300' : ''}`}
        aria-label="Paragraph"
      >
        P
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`rounded p-2 hover:bg-gray-200 ${editor.isActive('heading', { level: 1 }) ? 'bg-gray-300' : ''}`}
      >
        H1
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`rounded p-2 hover:bg-gray-200 ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-300' : ''}`}
      >
        H2
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`rounded p-2 hover:bg-gray-200 ${editor.isActive('bulletList') ? 'bg-gray-300' : ''}`}
      >
        List
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        className={`rounded p-2 hover:bg-gray-200 ${editor.isActive({ textAlign: 'left' }) ? 'bg-gray-300' : ''}`}
        aria-label="Align left"
      >
        Left
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        className={`rounded p-2 hover:bg-gray-200 ${editor.isActive({ textAlign: 'center' }) ? 'bg-gray-300' : ''}`}
        aria-label="Align center"
      >
        Center
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        className={`rounded p-2 hover:bg-gray-200 ${editor.isActive({ textAlign: 'right' }) ? 'bg-gray-300' : ''}`}
        aria-label="Align right"
      >
        Right
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
        className={`rounded p-2 hover:bg-gray-200 ${editor.isActive({ textAlign: 'justify' }) ? 'bg-gray-300' : ''}`}
        aria-label="Align justify"
      >
        Justify
      </button>
      <input
        type="color"
        onInput={(event) =>
          editor
            .chain()
            .focus()
            .setColor((event.target as HTMLInputElement).value)
            .run()
        }
        value={editor.getAttributes('textStyle').color || '#000000'}
        className="h-8 w-8 cursor-pointer border-none bg-transparent p-1"
        data-testid="color-picker"
        aria-label="Text color"
      />
    </div>
  );
};

// El componente principal del editor que se integra con React Hook Form
const TiptapEditor = ({ name, control }: { name: string; control: any }) => {
  const { field } = useController({ name, control });

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
      }),
      TextStyle,
      Color,
    ],
    content: field.value || '',
    onUpdate: ({ editor }) => {
      field.onChange(editor.getHTML());
    },
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          'prose dark:prose-invert max-w-none p-4 focus:outline-none min-h-[150px]',
      },
    },
  });

  return (
    <div className="rounded-md border border-gray-300 bg-white">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
};

export default TiptapEditor;
