import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GripVertical, Plus, Trash2, Image as ImageIcon, MapPin, Video, Star, List } from 'lucide-react';

interface LayoutBlock {
    id: string;
    type: 'hero' | 'text' | 'products' | 'contact' | 'gallery' | 'map' | 'video' | 'reviews' | 'amenities';
    content: any;
}

interface LayoutEditorProps {
    initialLayout?: LayoutBlock[];
    onChange: (layout: LayoutBlock[]) => void;
}

const AVAILABLE_BLOCKS = [
    { type: 'hero', label: 'Hero Section (Banner)', icon: ImageIcon },
    { type: 'gallery', label: 'Photo Gallery', icon: ImageIcon },
    { type: 'text', label: 'Text Block', icon: List },
    { type: 'amenities', label: 'Amenities / Features', icon: List },
    { type: 'video', label: 'Video Player', icon: Video },
    { type: 'map', label: 'Location Map', icon: MapPin },
    { type: 'reviews', label: 'Reviews Section', icon: Star },
    { type: 'products', label: 'Product Grid', icon: List },
    { type: 'contact', label: 'Contact / Booking', icon: List },
];

export default function LayoutEditor({ initialLayout = [], onChange }: LayoutEditorProps) {
    const [blocks, setBlocks] = useState<LayoutBlock[]>(initialLayout || []);

    const addBlock = (type: string) => {
        const newBlock: LayoutBlock = {
            id: `block-${Date.now()}`,
            type: type as any,
            content: {},
        };
        const newBlocks = [...blocks, newBlock];
        setBlocks(newBlocks);
        onChange(newBlocks);
    };

    const removeBlock = (id: string) => {
        const newBlocks = blocks.filter((b) => b.id !== id);
        setBlocks(newBlocks);
        onChange(newBlocks);
    };

    const updateBlockContent = (id: string, content: any) => {
        const newBlocks = blocks.map((b) => (b.id === id ? { ...b, content: { ...b.content, ...content } } : b));
        setBlocks(newBlocks);
        onChange(newBlocks);
    };

    const onDragEnd = (result: any) => {
        if (!result.destination) return;

        const items = Array.from(blocks);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        setBlocks(items);
        onChange(items);
    };

    return (
        <div className="space-y-6">
            <div className="flex gap-2">
                <Select onValueChange={addBlock}>
                    <SelectTrigger className="w-[250px]">
                        <SelectValue placeholder="Add Content Block..." />
                    </SelectTrigger>
                    <SelectContent>
                        {AVAILABLE_BLOCKS.map((block) => (
                            <SelectItem key={block.type} value={block.type}>
                                <div className="flex items-center gap-2">
                                    <block.icon className="h-4 w-4" />
                                    {block.label}
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="layout-editor">
                    {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                            {blocks.map((block, index) => (
                                <Draggable key={block.id} draggableId={block.id} index={index}>
                                    {(provided) => (
                                        <Card
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            className="relative bg-card"
                                        >
                                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                                <div className="flex items-center gap-2">
                                                    <div {...provided.dragHandleProps} className="cursor-grab text-muted-foreground">
                                                        <GripVertical className="h-5 w-5" />
                                                    </div>
                                                    <CardTitle className="text-sm font-medium uppercase text-muted-foreground">
                                                        {AVAILABLE_BLOCKS.find(b => b.type === block.type)?.label || block.type}
                                                    </CardTitle>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeBlock(block.id)}
                                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </CardHeader>
                                            <CardContent>
                                                {block.type === 'hero' && (
                                                    <div className="space-y-2">
                                                        <Label>Title</Label>
                                                        <Input
                                                            value={block.content.title || ''}
                                                            onChange={(e) => updateBlockContent(block.id, { title: e.target.value })}
                                                            placeholder="Welcome to our store"
                                                        />
                                                        <Label>Subtitle</Label>
                                                        <Input
                                                            value={block.content.subtitle || ''}
                                                            onChange={(e) => updateBlockContent(block.id, { subtitle: e.target.value })}
                                                            placeholder="Best products in town"
                                                        />
                                                    </div>
                                                )}
                                                {block.type === 'text' && (
                                                    <div className="space-y-2">
                                                        <Label>Content</Label>
                                                        <Textarea
                                                            value={block.content.text || ''}
                                                            onChange={(e) => updateBlockContent(block.id, { text: e.target.value })}
                                                            placeholder="Write something..."
                                                        />
                                                    </div>
                                                )}
                                                {block.type === 'video' && (
                                                    <div className="space-y-2">
                                                        <Label>Video URL (YouTube/Vimeo)</Label>
                                                        <Input
                                                            value={block.content.videoUrl || ''}
                                                            onChange={(e) => updateBlockContent(block.id, { videoUrl: e.target.value })}
                                                            placeholder="https://youtube.com/..."
                                                        />
                                                    </div>
                                                )}
                                                {block.type === 'amenities' && (
                                                    <div className="space-y-2">
                                                        <Label>Amenities (comma separated)</Label>
                                                        <Input
                                                            value={block.content.items || ''}
                                                            onChange={(e) => updateBlockContent(block.id, { items: e.target.value })}
                                                            placeholder="Wifi, Parking, Pool..."
                                                        />
                                                    </div>
                                                )}
                                                {['products', 'contact', 'map', 'reviews', 'gallery'].includes(block.type) && (
                                                    <div className="p-4 text-center text-sm text-muted-foreground border border-dashed rounded bg-muted/50">
                                                        This block will be automatically populated with your data.
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>
        </div>
    );
}
