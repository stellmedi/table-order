import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EmbedCodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restaurantSlug: string;
  restaurantName: string;
}

export function EmbedCodeModal({
  open,
  onOpenChange,
  restaurantSlug,
  restaurantName,
}: EmbedCodeModalProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [buttonColor, setButtonColor] = useState('#E07A5F');
  const [buttonPosition, setButtonPosition] = useState('bottom-right');
  const [buttonText, setButtonText] = useState('Order Now');

  const widgetUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/widget.js`
    : 'https://your-app.lovable.app/widget.js';

  const embedCode = `<script 
  src="${widgetUrl}"
  data-restaurant-slug="${restaurantSlug}"
  data-button-color="${buttonColor}"
  data-button-position="${buttonPosition}"
  data-button-text="${buttonText}">
</script>`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      toast({
        title: 'Copied!',
        description: 'Embed code copied to clipboard.',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: 'Failed to copy',
        description: 'Please select and copy the code manually.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Embed Ordering Widget</DialogTitle>
          <DialogDescription>
            Add this code to your website to let customers order from {restaurantName}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Customization Options */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="buttonColor">Button Color</Label>
              <div className="flex gap-2">
                <Input
                  id="buttonColor"
                  type="color"
                  value={buttonColor}
                  onChange={(e) => setButtonColor(e.target.value)}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={buttonColor}
                  onChange={(e) => setButtonColor(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="buttonPosition">Position</Label>
              <Select value={buttonPosition} onValueChange={setButtonPosition}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bottom-right">Bottom Right</SelectItem>
                  <SelectItem value="bottom-left">Bottom Left</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="buttonText">Button Text</Label>
              <Input
                id="buttonText"
                value={buttonText}
                onChange={(e) => setButtonText(e.target.value)}
                placeholder="Order Now"
              />
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="relative h-32 rounded-lg border bg-muted/30 overflow-hidden">
              <div
                className={`absolute ${buttonPosition === 'bottom-left' ? 'left-4' : 'right-4'} bottom-4`}
              >
                <button
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-white text-sm font-semibold shadow-lg"
                  style={{ backgroundColor: buttonColor }}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                    <path d="m1 1 4 4 2.5 13h13l2-8H5.5"/>
                  </svg>
                  {buttonText}
                </button>
              </div>
              <div className="absolute top-2 left-2 text-xs text-muted-foreground">
                Your website
              </div>
            </div>
          </div>

          {/* Embed Code */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Embed Code</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="gap-2"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy Code
                  </>
                )}
              </Button>
            </div>
            <pre className="p-4 rounded-lg bg-muted text-sm overflow-x-auto font-mono">
              {embedCode}
            </pre>
          </div>

          {/* Instructions */}
          <div className="rounded-lg border p-4 bg-muted/30">
            <h4 className="font-semibold mb-2">Installation Instructions</h4>
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
              <li>Copy the embed code above</li>
              <li>Paste it just before the closing <code className="bg-muted px-1 rounded">&lt;/body&gt;</code> tag on your website</li>
              <li>Save and publish your website</li>
              <li>A floating "Order Now" button will appear for your visitors</li>
            </ol>
          </div>

          {/* Test Links */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" asChild className="gap-2">
              <a href={`/r/${restaurantSlug}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                View Menu Page
              </a>
            </Button>
            <Button asChild className="gap-2">
              <a 
                href={`/widget-test?slug=${restaurantSlug}&color=${encodeURIComponent(buttonColor)}&position=${buttonPosition}&text=${encodeURIComponent(buttonText)}`} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4" />
                Test Widget
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
