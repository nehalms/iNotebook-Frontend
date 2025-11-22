import { useState } from "react";
import {
  Upload,
  Wand2,
  RotateCw,
  Maximize,
  Focus,
  Sparkles,
  Download,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

interface ImagesPageProps {
  onEnhance?: (file: File, brightness: number, contrast: number) => Promise<string>;
  onRoundCorners?: (file: File, radius: number) => Promise<string>;
  onRotate?: (file: File, degrees: number) => Promise<string>;
  onSharpen?: (file: File, amount: number) => Promise<string>;
  onGenerativeBackground?: (file: File, prompt: string) => Promise<string>;
}

export default function ImagesPage({
  onEnhance,
  onRoundCorners,
  onRotate,
  onSharpen,
  onGenerativeBackground,
}: ImagesPageProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [cornerRadius, setCornerRadius] = useState(20);
  const [rotation, setRotation] = useState(0);
  const [sharpenAmount, setSharpenAmount] = useState(50);

  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setProcessedUrl(null);
    }
  };

  const handleEnhance = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    try {
      const result = await onEnhance?.(selectedFile, brightness, contrast);
      setProcessedUrl(result || null);
      toast({
        title: "Image Enhanced",
        description: "Your image has been enhanced successfully",
      });
    } catch (error) {
      toast({
        title: "Enhancement Failed",
        description: "Failed to enhance the image",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRoundCorners = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    try {
      const result = await onRoundCorners?.(selectedFile, cornerRadius);
      setProcessedUrl(result || null);
      toast({
        title: "Corners Rounded",
        description: "Image corners have been rounded successfully",
      });
    } catch (error) {
      toast({
        title: "Operation Failed",
        description: "Failed to round corners",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRotate = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    try {
      const result = await onRotate?.(selectedFile, rotation);
      setProcessedUrl(result || null);
      toast({
        title: "Image Rotated",
        description: "Your image has been rotated successfully",
      });
    } catch (error) {
      toast({
        title: "Rotation Failed",
        description: "Failed to rotate the image",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSharpen = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    try {
      const result = await onSharpen?.(selectedFile, sharpenAmount);
      setProcessedUrl(result || null);
      toast({
        title: "Image Sharpened",
        description: "Your image has been sharpened successfully",
      });
    } catch (error) {
      toast({
        title: "Sharpen Failed",
        description: "Failed to sharpen the image",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-4xl font-bold font-serif mb-2">Image Editor</h1>
        <p className="text-muted-foreground text-lg">
          Edit and enhance your images with powerful tools
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 rounded-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-serif">Canvas</CardTitle>
          </CardHeader>
          <CardContent>
            {previewUrl ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Original</Label>
                    <div className="aspect-square rounded-lg bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                      <img
                        src={previewUrl}
                        alt="Original"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Processed</Label>
                    <div className="aspect-square rounded-lg bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                      {processedUrl ? (
                        <img
                          src={processedUrl}
                          alt="Processed"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          Apply a tool to see results
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {processedUrl && (
                  <Button
                    variant="outline"
                    className="w-full h-12 gap-2"
                    data-testid="button-download-image"
                  >
                    <Download className="h-5 w-5" />
                    Download Processed Image
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed rounded-lg">
                <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  Upload an Image
                </h3>
                <p className="text-muted-foreground mb-6 max-w-sm">
                  Select an image file to start editing
                </p>
                <Button asChild>
                  <label htmlFor="file-upload" className="cursor-pointer">
                    Choose File
                    <input
                      id="file-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="sr-only"
                      data-testid="input-upload-image"
                    />
                  </label>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-serif">Tools</CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedFile ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Upload an image to access editing tools
              </p>
            ) : (
              <Tabs defaultValue="enhance" className="w-full">
                <TabsList className="w-full grid grid-cols-2">
                  <TabsTrigger value="enhance">
                    <Wand2 className="h-4 w-4 mr-2" />
                    Enhance
                  </TabsTrigger>
                  <TabsTrigger value="corners">
                    <Maximize className="h-4 w-4 mr-2" />
                    Round
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="enhance" className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Brightness: {brightness}</Label>
                      <Slider
                        value={[brightness]}
                        onValueChange={([v]) => setBrightness(v)}
                        min={-100}
                        max={100}
                        step={1}
                        data-testid="slider-brightness"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Contrast: {contrast}</Label>
                      <Slider
                        value={[contrast]}
                        onValueChange={([v]) => setContrast(v)}
                        min={-100}
                        max={100}
                        step={1}
                        data-testid="slider-contrast"
                      />
                    </div>

                    <Button
                      onClick={handleEnhance}
                      disabled={isProcessing}
                      className="w-full h-12 gap-2"
                      data-testid="button-apply-enhance"
                    >
                      <Wand2 className="h-5 w-5" />
                      {isProcessing ? "Processing..." : "Apply Enhancement"}
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="corners" className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Corner Radius: {cornerRadius}px</Label>
                      <Slider
                        value={[cornerRadius]}
                        onValueChange={([v]) => setCornerRadius(v)}
                        min={0}
                        max={100}
                        step={5}
                        data-testid="slider-corner-radius"
                      />
                    </div>

                    <Button
                      onClick={handleRoundCorners}
                      disabled={isProcessing}
                      className="w-full h-12 gap-2"
                      data-testid="button-apply-round-corners"
                    >
                      <Maximize className="h-5 w-5" />
                      {isProcessing ? "Processing..." : "Round Corners"}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
