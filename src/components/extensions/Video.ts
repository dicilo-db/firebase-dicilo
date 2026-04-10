import { Node, mergeAttributes } from '@tiptap/core';

export const Video = Node.create({
    name: 'video',
    group: 'block',
    selectable: true,
    draggable: true,
    atom: true,

    addAttributes() {
        return {
            src: {
                default: null,
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'video',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['video', mergeAttributes(HTMLAttributes, { controls: 'true', class: 'w-full rounded-md border border-gray-200' }), 0];
    },

    addNodeView() {
        return ({ node }) => {
            const dom = document.createElement('video');
            dom.src = node.attrs.src;
            dom.controls = true;
            dom.className = 'w-full rounded-md border border-gray-200';
            return { dom };
        };
    },
});
