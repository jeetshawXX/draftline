"use client";

import { useMemo, useState } from "react";
import { DndContext, DragEndEvent, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowDown, ArrowUp, Eye, GripVertical, Image as ImageIcon, LayoutTemplate, Plus, Quote, Trash2, Type, WandSparkles } from "lucide-react";
import type { BlockType, PageBlock } from "@/types/cms";

const templates: { type: BlockType; label: string; description: string; icon: typeof Type; data: Record<string, unknown> }[] = [
  { type: "hero", label: "Hero section", description: "A strong title and primary link", icon: LayoutTemplate, data: { eyebrow: "A little space for big ideas", title: "A page worth exploring.", subtitle: "Add a clear supporting sentence to guide your visitors.", buttonText: "Explore more", buttonLink: "/#latest", align: "left" } },
  { type: "text", label: "Text section", description: "A heading with supporting copy", icon: Type, data: { title: "A thoughtful headline.", body: "Use this section to explain an idea, share context, or introduce a new part of your website." } },
  { type: "image", label: "Image + caption", description: "An image with optional caption", icon: ImageIcon, data: { src: "", alt: "", caption: "" } },
  { type: "features", label: "Feature grid", description: "A simple three-item feature section", icon: WandSparkles, data: { title: "Built for the way you work.", items: "Thoughtful design\nFlexible publishing\nSimple workflows" } },
  { type: "cta", label: "Call to action", description: "A closing prompt and button", icon: Quote, data: { title: "Ready to make something?", subtitle: "Your next idea starts here.", buttonText: "Get started", buttonLink: "/admin/login" } }
];

function Field({ label, value, onChange, multiline = false, hint }: { label: string; value: string; onChange: (value: string) => void; multiline?: boolean; hint?: string }) {
  return <label className="builder-field"><span>{label}</span>{multiline ? <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={3} /> : <input value={value} onChange={(event) => onChange(event.target.value)} />}{hint && <small>{hint}</small>}</label>;
}

function BlockFields({ block, onUpdate }: { block: PageBlock; onUpdate: (data: Record<string, unknown>) => void }) {
  const data = block.data || {};
  const get = (key: string, fallback = "") => typeof data[key] === "string" ? data[key] as string : fallback;
  const set = (key: string, value: string) => onUpdate({ ...data, [key]: value });
  if (block.type === "hero") return <div className="builder-fields">
    <Field label="Eyebrow" value={get("eyebrow")} onChange={(v) => set("eyebrow", v)} />
    <Field label="Headline" value={get("title")} onChange={(v) => set("title", v)} />
    <Field label="Supporting text" value={get("subtitle")} onChange={(v) => set("subtitle", v)} multiline />
    <div className="builder-field-row"><Field label="Button label" value={get("buttonText")} onChange={(v) => set("buttonText", v)} /><Field label="Button link" value={get("buttonLink")} onChange={(v) => set("buttonLink", v)} /></div>
    <label className="builder-field"><span>Alignment</span><select value={get("align", "left")} onChange={(e) => set("align", e.target.value)}><option value="left">Left aligned</option><option value="center">Centered</option></select></label>
  </div>;
  if (block.type === "text") return <div className="builder-fields"><Field label="Heading" value={get("title")} onChange={(v) => set("title", v)} /><Field label="Body copy" value={get("body")} onChange={(v) => set("body", v)} multiline /></div>;
  if (block.type === "image") return <div className="builder-fields"><Field label="Image URL" value={get("src")} onChange={(v) => set("src", v)} hint="Upload an image in Media, then paste its /uploads/... URL." /><Field label="Alternative text" value={get("alt")} onChange={(v) => set("alt", v)} /><Field label="Caption" value={get("caption")} onChange={(v) => set("caption", v)} /></div>;
  if (block.type === "features") return <div className="builder-fields"><Field label="Section heading" value={get("title")} onChange={(v) => set("title", v)} /><Field label="Feature names (one per line)" value={get("items")} onChange={(v) => set("items", v)} multiline hint="The renderer displays up to the lines you add." /></div>;
  return <div className="builder-fields"><Field label="Headline" value={get("title")} onChange={(v) => set("title", v)} /><Field label="Supporting text" value={get("subtitle")} onChange={(v) => set("subtitle", v)} multiline /><div className="builder-field-row"><Field label="Button label" value={get("buttonText")} onChange={(v) => set("buttonText", v)} /><Field label="Button link" value={get("buttonLink")} onChange={(v) => set("buttonLink", v)} /></div></div>;
}

function SortableBlock({ block, index, total, onUpdate, onRemove, onMove }: { block: PageBlock; index: number; total: number; onUpdate: (data: Record<string, unknown>) => void; onRemove: () => void; onMove: (direction: -1 | 1) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const info = templates.find((template) => template.type === block.type)!;
  const Icon = info.icon;
  return <article ref={setNodeRef} style={style} className={`builder-block ${isDragging ? "is-dragging" : ""}`}>
    <div className="builder-block-head">
      <button className="drag-handle" type="button" aria-label={`Drag ${info.label}`} {...attributes} {...listeners}><GripVertical size={17} /></button>
      <span className="block-type-icon"><Icon size={16} /></span>
      <div className="block-heading"><strong>{info.label}</strong><small>Section {index + 1}</small></div>
      <div className="block-actions">
        <button type="button" title="Move up" disabled={index === 0} onClick={() => onMove(-1)}><ArrowUp size={15} /></button>
        <button type="button" title="Move down" disabled={index === total - 1} onClick={() => onMove(1)}><ArrowDown size={15} /></button>
        <button type="button" title="Remove block" className="danger-icon" onClick={onRemove}><Trash2 size={15} /></button>
      </div>
    </div>
    <BlockFields block={block} onUpdate={onUpdate} />
  </article>;
}

export function PageBuilder({ value, onChange }: { value: PageBlock[]; onChange: (blocks: PageBlock[]) => void }) {
  const [showPicker, setShowPicker] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const blocks = useMemo(() => value || [], [value]);
  const addBlock = (template: typeof templates[number]) => {
    const newBlock: PageBlock = { id: `${template.type}-${crypto.randomUUID()}`, type: template.type, data: { ...template.data } };
    onChange([...blocks, newBlock]);
    setShowPicker(false);
  };
  const dragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = blocks.findIndex((block) => block.id === active.id);
    const newIndex = blocks.findIndex((block) => block.id === over.id);
    if (oldIndex >= 0 && newIndex >= 0) onChange(arrayMove(blocks, oldIndex, newIndex));
  };
  const updateBlock = (id: string, data: Record<string, unknown>) => onChange(blocks.map((block) => block.id === id ? { ...block, data } : block));
  const removeBlock = (id: string) => onChange(blocks.filter((block) => block.id !== id));
  const moveBlock = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= blocks.length) return;
    onChange(arrayMove(blocks, index, target));
  };

  return <div className="page-builder">
    <div className="builder-intro"><div><span className="eyebrow">VISUAL EDITOR</span><h3>Build your page</h3><p>Add sections, edit their content, then drag to change the order.</p></div><span className="builder-count">{blocks.length} sections</span></div>
    {blocks.length === 0 ? <div className="builder-empty"><div className="empty-icon"><LayoutTemplate size={22} /></div><h4>Your canvas is empty</h4><p>Add a section to start shaping the page.</p></div> : <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={dragEnd}><SortableContext items={blocks.map((block) => block.id)} strategy={verticalListSortingStrategy}><div className="builder-stack">{blocks.map((block, index) => <SortableBlock key={block.id} block={block} index={index} total={blocks.length} onUpdate={(data) => updateBlock(block.id, data)} onRemove={() => removeBlock(block.id)} onMove={(direction) => moveBlock(index, direction)} />)}</div></SortableContext></DndContext>}
    <div className="builder-add-wrap">
      <button type="button" className="builder-add-button" onClick={() => setShowPicker((show) => !show)}><Plus size={17} /> Add a section</button>
      {showPicker && <div className="block-picker">{templates.map((template) => { const Icon = template.icon; return <button type="button" key={template.type} className="block-picker-option" onClick={() => addBlock(template)}><span className="block-type-icon"><Icon size={17} /></span><span><strong>{template.label}</strong><small>{template.description}</small></span><Plus size={16} /></button>; })}</div>}
    </div>
    <div className="builder-tip"><Eye size={15} /><span>Check the public page after saving to preview how visitors will see these sections.</span></div>
  </div>;
}
