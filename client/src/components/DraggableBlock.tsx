import { GripVertical } from 'lucide-react';

interface DraggableBlockProps {
  type: string;
  name: string;
  category: string;
}

export function DraggableBlock({ type, name, category }: DraggableBlockProps) {
  const handleDragStart = (e: React.DragEvent) => {
    const blockData = { type, name, category };
    e.dataTransfer.setData('application/json', JSON.stringify(blockData));
    e.dataTransfer.effectAllowed = 'copy';
    
    // Create a custom drag image to remove the white outline
    const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
    dragImage.style.transform = 'rotate(0deg)';
    dragImage.style.opacity = '0.8';
    dragImage.style.border = 'none';
    dragImage.style.outline = 'none';
    
    document.body.appendChild(dragImage);
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    
    e.dataTransfer.setDragImage(dragImage, (e.currentTarget as HTMLElement).offsetWidth / 2, (e.currentTarget as HTMLElement).offsetHeight / 2);
    
    setTimeout(() => {
      document.body.removeChild(dragImage);
    }, 0);
  };

  const getBlockColorClass = (blockType: string) => {
    switch (blockType) {
      case 'zk': return 'block-zk';
      case 'crypto': return 'block-crypto';
      case 'curve': return 'block-curve';
      case 'verification': return 'block-verification';
      case 'mechanism': return 'block-mechanism';
      case 'input': return 'block-input';
      case 'output': return 'block-output';
      default: return 'bg-gray-500';
    }
  };

  const getBlockShape = (blockType: string) => {
    if (blockType === 'input') return 'rounded-lg border-2 border-dashed border-white/50';
    if (blockType === 'output') return 'rounded-lg border-2 border-solid border-white/50';
    return 'rounded-full';
  };

  const getBlockContent = (blockType: string, blockName: string) => {
    return (
      <span className="text-sm font-medium">{blockName}</span>
    );
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className={`${getBlockColorClass(type)} ${getBlockShape(type)} px-6 py-2 shadow-sm cursor-move hover:shadow-md transition-shadow select-none min-w-[100px] text-center relative`}
    >
      <div className="flex items-center justify-center">
        {getBlockContent(type, name)}
      </div>
    </div>
  );
}