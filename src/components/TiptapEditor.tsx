// src/components/TiptapEditor.tsx
'use client';

import React, { useState, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useController } from 'react-hook-form';
import TextAlign from '@tiptap/extension-text-align';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Youtube from '@tiptap/extension-youtube';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import { Video } from '@/components/extensions/Video'; // Custom extension for MP4

import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Undo2,
  Redo2,
  Heading1,
  Heading2,
  Pilcrow,
  Link as LinkIcon,
  Image as ImageIcon,
  Youtube as YoutubeIcon,
  Video as VideoIcon,
  Code2,
  FileCode,
  Unlink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
// import { Textarea } from '@/components/ui/textarea'; // We can use standard textarea or this one
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

const lowlight = createLowlight(common);

interface MenuBarProps {
  editor: any;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onVideoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isHtmlView: boolean;
  toggleHtmlView: () => void;
  isUploading: boolean;
}

const MenuBar = ({
  editor,
  onImageUpload,
  onVideoUpload,
  isHtmlView,
  toggleHtmlView,
  isUploading,
}: MenuBarProps) => {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  if (!editor && !isHtmlView) {
    return null;
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    // cancelled
    if (url === null) {
      return;
    }

    // empty
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    // update
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const addYoutubeVideo = () => {
    const url = prompt('Enter YouTube URL');

    if (url) {
      editor.commands.setYoutubeVideo({
        src: url,
      });
    }
  };

  const getButtonClass = (isActive: boolean) => {
    return isActive ? 'bg-muted' : '';
  };

  if (isHtmlView) {
    return (
      <div className="flex flex-wrap items-center gap-1 border-b border-gray-200 bg-gray-50 p-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={toggleHtmlView}
          className="gap-2"
        >
          <FileCode className="h-4 w-4" />
          Back to Editor
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-gray-200 bg-gray-50 p-2">
      {/* History */}
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
          className="h-8 w-8 p-0"
        >
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
          className="h-8 w-8 p-0"
        >
          <Redo2 className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Headings */}
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={cn("h-8 w-8 p-0", getButtonClass(editor.isActive('heading', { level: 1 })))}
          aria-label="H1"
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={cn("h-8 w-8 p-0", getButtonClass(editor.isActive('heading', { level: 2 })))}
          aria-label="H2"
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setParagraph().run()}
          className={cn("h-8 w-8 p-0", getButtonClass(editor.isActive('paragraph')))}
          aria-label="Paragraph"
        >
          <Pilcrow className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Formatting */}
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn("h-8 w-8 p-0", getButtonClass(editor.isActive('bold')))}
          aria-label="Bold"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn("h-8 w-8 p-0", getButtonClass(editor.isActive('italic')))}
          aria-label="Italic"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={cn("h-8 w-8 p-0", getButtonClass(editor.isActive('codeBlock')))}
          aria-label="Code Block"
        >
          <Code2 className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Lists */}
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn("h-8 w-8 p-0", getButtonClass(editor.isActive('bulletList')))}
          aria-label="Bullet List"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn("h-8 w-8 p-0", getButtonClass(editor.isActive('orderedList')))}
          aria-label="Ordered List"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={cn("h-8 w-8 p-0", getButtonClass(editor.isActive('blockquote')))}
          aria-label="Blockquote"
        >
          <Quote className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Alignment */}
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={cn("h-8 w-8 p-0", getButtonClass(editor.isActive({ textAlign: 'left' })))}
          aria-label="Align Left"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={cn("h-8 w-8 p-0", getButtonClass(editor.isActive({ textAlign: 'center' })))}
          aria-label="Align Center"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={cn("h-8 w-8 p-0", getButtonClass(editor.isActive({ textAlign: 'right' })))}
          aria-label="Align Right"
        >
          <AlignRight className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          className={cn("h-8 w-8 p-0", getButtonClass(editor.isActive({ textAlign: 'justify' })))}
          aria-label="Justify"
        >
          <AlignJustify className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Advanced Features */}
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={setLink}
          className={cn("h-8 w-8 p-0", getButtonClass(editor.isActive('link')))}
          aria-label="Link"
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().unsetLink().run()}
          disabled={!editor.isActive('link')}
          className="h-8 w-8 p-0"
          aria-label="Unlink"
        >
          <Unlink className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="mx-1 h-4" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => imageInputRef.current?.click()}
          className="h-8 w-8 p-0"
          aria-label="Image"
          disabled={isUploading}
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
        <input
          type="file"
          ref={imageInputRef}
          className="hidden"
          accept="image/*"
          onChange={onImageUpload}
        />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={addYoutubeVideo}
          className="h-8 w-8 p-0"
          aria-label="YouTube"
        >
          <YoutubeIcon className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => videoInputRef.current?.click()}
          className="h-8 w-8 p-0"
          aria-label="Upload Video"
          disabled={isUploading}
        >
          <VideoIcon className="h-4 w-4" />
        </Button>
        <input
          type="file"
          ref={videoInputRef}
          className="hidden"
          accept="video/mp4,video/webm"
          onChange={onVideoUpload}
        />
      </div>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* HTML / Color */}
      <div className="flex items-center gap-1">
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
          className="h-8 w-8 cursor-pointer rounded border border-gray-200 bg-transparent p-1"
          title="Text Color"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={toggleHtmlView}
          className="h-8 w-8 p-0"
          title="Source Code"
        >
          <FileCode className="h-4 w-4" />
        </Button>
      </div>

      {isUploading && <span className="ml-2 text-xs text-blue-500 animate-pulse">Uploading...</span>}
    </div>
  );
};

const TiptapEditor = ({ name, control }: { name: string; control: any }) => {
  const { field } = useController({ name, control });
  const [isHtmlView, setIsHtmlView] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Initialize editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // disable default codeBlock to use Lowlight
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
      }),
      TextStyle,
      Color,
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
      Image,
      Youtube.configure({
        controls: true,
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
      Video, // Custom extension
    ],
    content: field.value || '',
    onUpdate: ({ editor }) => {
      if (!isHtmlView) {
        const html = editor.getHTML();
        field.onChange(html === '<p></p>' ? '' : html);
      }
    },
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          'prose dark:prose-invert max-w-none p-4 focus:outline-none min-h-[150px] leading-normal',
      },
    },
  });

  // Handle File Uploads
  const handleFileUpload = async (file: File, type: 'image' | 'video') => {
    if (!file) return;

    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const storageRef = ref(storage, `editor-uploads/${fileName}`);

      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      if (type === 'image') {
        editor?.chain().focus().setImage({ src: downloadURL }).run();
      } else {
        // For video, we use our customized node or just insert HTML if we wanted, 
        // but here we use the custom 'video' node
        editor?.chain().focus().insertContent({
          type: 'video',
          attrs: {
            src: downloadURL
          }
        }).run();
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Error uploading file. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const onImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      handleFileUpload(e.target.files[0], 'image');
    }
    // reset
    e.target.value = '';
  };

  const onVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      handleFileUpload(e.target.files[0], 'video');
    }
    e.target.value = '';
  };

  // Toggle HTML View
  const toggleHtmlView = () => {
    if (isHtmlView) {
      // Switch back to Rich Text
      // The content is already updated via textarea onChange updating field.value
      // We need to set editor content to field.value
      editor?.commands.setContent(field.value);
    }
    setIsHtmlView(!isHtmlView);
  };

  const handleHtmlChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    field.onChange(e.target.value);
  };

  // Sync content if field value changes externally (and not in HTML view editing)
  React.useEffect(() => {
    if (editor && !isHtmlView && field.value !== editor.getHTML()) {
      if (editor.isEmpty && !field.value) return;
      if (!field.value) {
        editor.commands.setContent('');
      }
      // If external change happens (rare in this form), we could sync, but avoid loops
      // Generally relying on onUpdate is enough for one-way, but for reset:
    }
  }, [field.value, editor, isHtmlView]);

  return (
    <div className="rounded-md border border-gray-300 bg-white overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
      <MenuBar
        editor={editor}
        onImageUpload={onImageUpload}
        onVideoUpload={onVideoUpload}
        isHtmlView={isHtmlView}
        toggleHtmlView={toggleHtmlView}
        isUploading={isUploading}
      />

      {isHtmlView ? (
        <textarea
          className="w-full h-[300px] p-4 font-mono text-sm focus:outline-none"
          value={field.value || ''}
          onChange={handleHtmlChange}
        />
      ) : (
        <EditorContent editor={editor} />
      )}
    </div>
  );
};

export default TiptapEditor;
