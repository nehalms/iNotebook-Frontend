import { useState } from "react";
import {
  Upload,
  Wand2,
  RotateCw,
  Maximize,
  Focus,
  Sparkles,
  Download,
  Palette,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

type ToolType = "enhance" | "corners" | "rotate" | "sharpen" | "background" | null;

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
  const [activeTool, setActiveTool] = useState<ToolType>(null);

  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [cornerRadius, setCornerRadius] = useState(20);
  const [rotation, setRotation] = useState(0);
  const [sharpenAmount, setSharpenAmount] = useState(50);
  const [backgroundPrompt, setBackgroundPrompt] = useState("");

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

  const handleGenerativeBackground = async () => {
    if (!selectedFile || !backgroundPrompt.trim()) return;

    setIsProcessing(true);
    try {
      const result = await onGenerativeBackground?.(selectedFile, backgroundPrompt);
      setProcessedUrl(result || null);
      toast({
        title: "Background Generated",
        description: "Your image background has been generated successfully",
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate background",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const tools = [
    {
      id: "enhance" as ToolType,
      name: "Enhance",
      icon: Wand2,
      description: "Adjust brightness and contrast",
      color: "text-primary",
    },
    {
      id: "corners" as ToolType,
      name: "Round Corners",
      icon: Maximize,
      description: "Add rounded corners",
      color: "text-chart-2",
    },
    {
      id: "rotate" as ToolType,
      name: "Rotate",
      icon: RotateCw,
      description: "Rotate image by degrees",
      color: "text-chart-3",
    },
    {
      id: "sharpen" as ToolType,
      name: "Sharpen",
      icon: Focus,
      description: "Increase image sharpness",
      color: "text-chart-4",
    },
    {
      id: "background" as ToolType,
      name: "AI Background",
      icon: Sparkles,
      description: "Generate creative backgrounds",
      color: "text-chart-5",
    },
  ];

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
            ) : !activeTool ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground mb-4">
                  Select a tool to get started
                </p>
                {tools.map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <button
                      key={tool.id}
                      onClick={() => setActiveTool(tool.id)}
                      className="w-full p-4 rounded-lg border-2 border-border hover:border-primary hover-elevate active-elevate-2 text-left transition-all"
                      data-testid={`button-select-tool-${tool.id}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg bg-muted ${tool.color}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold mb-1">{tool.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {tool.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">
                    {tools.find((t) => t.id === activeTool)?.name}
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTool(null)}
                    data-testid="button-back-to-tools"
                  >
                    ← Back
                  </Button>
                </div>

                {activeTool === "enhance" && (
                  <>
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
                  </>
                )}

                {activeTool === "corners" && (
                  <>
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
                  </>
                )}

                {activeTool === "rotate" && (
                  <>
                    <div className="space-y-2">
                      <Label>Rotation: {rotation}°</Label>
                      <Slider
                        value={[rotation]}
                        onValueChange={([v]) => setRotation(v)}
                        min={0}
                        max={360}
                        step={15}
                        data-testid="slider-rotation"
                      />
                    </div>
                    <Button
                      onClick={handleRotate}
                      disabled={isProcessing}
                      className="w-full h-12 gap-2"
                      data-testid="button-apply-rotate"
                    >
                      <RotateCw className="h-5 w-5" />
                      {isProcessing ? "Processing..." : "Rotate Image"}
                    </Button>
                  </>
                )}

                {activeTool === "sharpen" && (
                  <>
                    <div className="space-y-2">
                      <Label>Sharpen Amount: {sharpenAmount}%</Label>
                      <Slider
                        value={[sharpenAmount]}
                        onValueChange={([v]) => setSharpenAmount(v)}
                        min={0}
                        max={100}
                        step={5}
                        data-testid="slider-sharpen"
                      />
                    </div>
                    <Button
                      onClick={handleSharpen}
                      disabled={isProcessing}
                      className="w-full h-12 gap-2"
                      data-testid="button-apply-sharpen"
                    >
                      <Focus className="h-5 w-5" />
                      {isProcessing ? "Processing..." : "Sharpen Image"}
                    </Button>
                  </>
                )}

                {activeTool === "background" && (
                  <>
                    <div className="space-y-2">
                      <Label>Background Prompt</Label>
                      <Textarea
                        value={backgroundPrompt}
                        onChange={(e) => setBackgroundPrompt(e.target.value)}
                        placeholder="Describe the background you want to generate..."
                        className="min-h-24"
                        data-testid="input-background-prompt"
                      />
                    </div>
                    <Button
                      onClick={handleGenerativeBackground}
                      disabled={isProcessing || !backgroundPrompt.trim()}
                      className="w-full h-12 gap-2"
                      data-testid="button-apply-background"
                    >
                      <Sparkles className="h-5 w-5" />
                      {isProcessing ? "Generating..." : "Generate Background"}
                    </Button>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
