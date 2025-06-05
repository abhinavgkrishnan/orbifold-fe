import { Download, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ProtocolData } from '@/lib/protocol-types';

interface ActionButtonsProps {
  protocolData: ProtocolData;
  onClearCanvas: () => void;
}

export function ActionButtons({ protocolData, onClearCanvas }: ActionButtonsProps) {
  const { toast } = useToast();

  const handleExport = () => {
    if (protocolData.blocks.length === 0) {
      toast({
        title: "Nothing to Export",
        description: "Add some blocks to your protocol before exporting.",
        variant: "destructive",
      });
      return;
    }

    const exportData = {
      ...protocolData,
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${protocolData.name.replace(/\s+/g, '_').toLowerCase()}_protocol.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Protocol Exported",
      description: "Your protocol has been downloaded as a JSON file.",
    });
  };

  const handleVerify = () => {
    if (protocolData.blocks.length === 0) {
      toast({
        title: "Nothing to Verify",
        description: "Add some blocks to your protocol before verifying.",
        variant: "destructive",
      });
      return;
    }

    // Basic protocol validation
    const zkBlocks = protocolData.blocks.filter(b => b.type === 'zk');
    const cryptoBlocks = protocolData.blocks.filter(b => b.type === 'crypto');
    const verificationBlocks = protocolData.blocks.filter(b => b.type === 'verification');
    
    const issues: string[] = [];
    
    if (zkBlocks.length === 0 && cryptoBlocks.length === 0) {
      issues.push("Protocol should contain at least one cryptographic primitive");
    }
    
    if (protocolData.connections.length === 0 && protocolData.blocks.length > 1) {
      issues.push("Multiple blocks should be connected to show data flow");
    }
    
    if (verificationBlocks.length === 0) {
      issues.push("Consider adding verification components for security");
    }

    if (issues.length > 0) {
      toast({
        title: "Verification Issues Found",
        description: issues.join(". "),
        variant: "destructive",
      });
    } else {
      toast({
        title: "Protocol Verified",
        description: "Your protocol appears to be well-structured and secure.",
      });
    }
  };

  return (
    <div className="fixed bottom-4 right-4 flex flex-col space-y-3">
      <Button
        onClick={handleExport}
        variant="outline"
        className="shadow-lg"
      >
        <Download className="w-4 h-4 mr-2" />
        Export
      </Button>
      
      <Button
        onClick={handleVerify}
        className="bg-green-500 text-white hover:bg-green-600 shadow-lg"
      >
        <CheckCircle className="w-4 h-4 mr-2" />
        Verify
      </Button>
    </div>
  );
}
