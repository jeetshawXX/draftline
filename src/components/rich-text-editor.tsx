"use client";

import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Underline from "@tiptap/extension-underline";
import { Bold, Code, Heading2, ImagePlus, Italic, Link2, List, ListOrdered, Minus, Quote, Underline as UnderlineIcon } from "lucide-react";

type Props = { value: string; onChange: (value: string) => void };

export function RichTextEditor({ value, onChange }: Props) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { rel: "nofollow noopener noreferrer", target: "_blank" } }),
      Image.configure({ allowBase64: false, HTMLAttributes: { class: "editor-image" } })
    ],
    content: value || "",
    editorProps: { attributes: { class: "tiptap-content", "aria-label": "Post content editor" } },
    onUpdate: ({ editor: activeEditor }) => onChange(activeEditor.getHTML())
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) editor.commands.setContent(value || "", { emitUpdate: false });
  }, [editor, value]);

  if (!editor) return <div className="editor-loading">Loading editor…</div>;

  const addLink = () => {
    const current = editor.getAttributes("link").href as string | undefined;
    const href = window.prompt("Paste a link", current || "https://");
    if (href === null) return;
    if (href.trim()) editor.chain().focus().extendMarkRange("link").setLink({ href: href.trim() }).run();
    else editor.chain().focus().unsetLink().run();
  };
  const addImage = () => {
    const src = window.prompt("Paste an image URL (uploaded files are available in Media library)");
    if (src?.trim()) editor.chain().focus().setImage({ src: src.trim(), alt: "" }).run();
  };

  return <div className="rich-editor">
    <div className="editor-toolbar" role="toolbar" aria-label="Text formatting">
      <button type="button" title="Bold" onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive("bold") ? "active" : ""}><Bold size={16} /></button>
      <button type="button" title="Italic" onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive("italic") ? "active" : ""}><Italic size={16} /></button>
      <button type="button" title="Underline" onClick={() => editor.chain().focus().toggleUnderline().run()} className={editor.isActive("underline") ? "active" : ""}><UnderlineIcon size={16} /></button>
      <span className="toolbar-divider" />
      <button type="button" title="Heading 2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={editor.isActive("heading", { level: 2 }) ? "active" : ""}><Heading2 size={16} /></button>
      <button type="button" title="Bulleted list" onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive("bulletList") ? "active" : ""}><List size={16} /></button>
      <button type="button" title="Numbered list" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive("orderedList") ? "active" : ""}><ListOrdered size={16} /></button>
      <button type="button" title="Quote" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={editor.isActive("blockquote") ? "active" : ""}><Quote size={16} /></button>
      <button type="button" title="Code block" onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={editor.isActive("codeBlock") ? "active" : ""}><Code size={16} /></button>
      <button type="button" title="Insert link" onClick={addLink}><Link2 size={16} /></button>
      <button type="button" title="Insert image URL" onClick={addImage}><ImagePlus size={16} /></button>
      <button type="button" title="Horizontal divider" onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus size={16} /></button>
    </div>
    <EditorContent editor={editor} />
    <div className="editor-footnote">Rich text · HTML is sanitized before saving · Use Media library for uploaded images</div>
  </div>;
}
