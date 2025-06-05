import { GripVertical } from 'lucide-react';

interface DraggableBlockProps {
  type: string;
  name: string;
  category: string;
}

export function DraggableBlock({ type, name, category }: DraggableBlockProps) {
  const handleDragStart = (e: React.DragEvent) => {
    const blockData = { type, name, category };
    
    // Set the data immediately with multiple formats for maximum compatibility
    e.dataTransfer.setData('application/json', JSON.stringify(blockData));
    e.dataTransfer.setData('text/plain', JSON.stringify(blockData));
    // Also set a custom type for internal use
    e.dataTransfer.setData('application/x-orbifold-block', JSON.stringify(blockData));
    e.dataTransfer.effectAllowed = 'copy';
    
    // Immediate visual feedback
    const element = e.currentTarget as HTMLElement;
    element.style.opacity = '0.6';
    element.style.transform = 'scale(0.95)';
    
    // Create enhanced drag image
    const dragImage = element.cloneNode(true) as HTMLElement;
    dragImage.style.opacity = '0.9';
    dragImage.style.transform = 'scale(1.1)';
    dragImage.style.border = '2px solid #14B8A6';
    dragImage.style.borderRadius = '8px';
    dragImage.style.boxShadow = '0 4px 12px rgba(20, 184, 166, 0.3)';
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    dragImage.style.left = '-1000px';
    dragImage.style.pointerEvents = 'none';
    dragImage.style.zIndex = '9999';
    
    document.body.appendChild(dragImage);
    
    const rect = element.getBoundingClientRect();
    e.dataTransfer.setDragImage(dragImage, rect.width / 2, rect.height / 2);
    
    // Clean up drag image immediately
    setTimeout(() => {
      if (document.body.contains(dragImage)) {
        document.body.removeChild(dragImage);
      }
    }, 1);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    // Reset styles immediately
    const element = e.currentTarget as HTMLElement;
    element.style.opacity = '1';
    element.style.transform = 'scale(1)';
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
      onDragEnd={handleDragEnd}
      className={`${getBlockColorClass(type)} ${getBlockShape(type)} px-6 py-2 shadow-sm cursor-grab hover:cursor-grabbing hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-150 select-none min-w-[100px] text-center relative`}
      style={{
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
        willChange: 'transform, opacity'
      }}
    >
      <div className="flex items-center justify-center">
        {getBlockContent(type, name)}
      </div>
    </div>
  );
}