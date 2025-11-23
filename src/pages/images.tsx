import { useState, useEffect } from "react";
import {
  Upload,
  Wand2,
  RotateCw,
  Maximize,
  Focus,
  Sparkles,
  Download,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { enhanceImage, roundCorners, rotateImage, sharpenImage, generativeBackground } from "@/lib/api/images";
import { saveAs } from "file-saver";

type ToolType = "enhance" | "corners" | "rotate" | "sharpen" | "background" | null;

export default function ImagesPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [selectedTool, setSelectedTool] = useState<ToolType>(null);

  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [cornerRadius, setCornerRadius] = useState(20);
  const [rotation, setRotation] = useState(0);
  const [sharpenAmount, setSharpenAmount] = useState(50);
  const [backgroundPrompt, setBackgroundPrompt] = useState("");

  const { toast } = useToast();

  // Set loading state when processedUrl changes
  useEffect(() => {
    if (processedUrl && !isProcessing) {
      setIsImageLoading(true);
    }
  }, [processedUrl, isProcessing]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const type = file.type.split('/')[1];
      const allowedTypes = ['jpg', 'jpeg', 'png'];
      if (!allowedTypes.includes(type)) {
        toast({
          title: "Unsupported file type",
          description: "Please upload a .jpg, .jpeg, or .png file",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setProcessedUrl(null);
      setSelectedTool(null);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      toast({
        title: "No Image",
        description: "Please upload an image first",
        variant: "destructive",
      });
      return;
    }

    if (!selectedTool) {
      toast({
        title: "No Tool Selected",
        description: "Please select an image editing tool",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setProcessedUrl(null);

    try {
      let result;
      switch (selectedTool) {
        case "enhance":
          result = await enhanceImage(selectedFile, brightness, contrast);
          break;
        case "corners":
          result = await roundCorners(selectedFile, cornerRadius);
          break;
        case "rotate":
          result = await rotateImage(selectedFile, rotation);
          break;
        case "sharpen":
          result = await sharpenImage(selectedFile, sharpenAmount);
          break;
        case "background":
          if (!backgroundPrompt.trim()) {
            toast({
              title: "Missing Prompt",
              description: "Please enter a background prompt",
              variant: "destructive",
            });
            setIsProcessing(false);
            return;
          }
          result = await generativeBackground(selectedFile, backgroundPrompt);
          break;
        default:
          return;
      }

      if (result.success && result.data?.url) {
        setProcessedUrl(result.data.url);
        setIsImageLoading(true);
        toast({
          title: "Success",
          description: "Image processed successfully",
        });
      } else {
        const errorMsg = result.error || result.msg || "Failed to process image";
        toast({
          title: "Processing Failed",
          description: errorMsg,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process image",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!processedUrl || !selectedFile) return;
    saveAs(processedUrl, `processed-${selectedFile.name}`);
    toast({
      title: "Download Started",
      description: "Image download has started",
    });
  };

  const tools = [
    {
      id: "enhance" as ToolType,
      name: "Enhance",
      icon: Wand2,
      description: "Adjust brightness and contrast",
    },
    {
      id: "corners" as ToolType,
      name: "Round Corners",
      icon: Maximize,
      description: "Add rounded corners",
    },
    {
      id: "rotate" as ToolType,
      name: "Rotate",
      icon: RotateCw,
      description: "Rotate image by degrees",
    },
    {
      id: "sharpen" as ToolType,
      name: "Sharpen",
      icon: Focus,
      description: "Increase image sharpness",
    },
    {
      id: "background" as ToolType,
      name: "AI Background",
      icon: Sparkles,
      description: "Generate creative backgrounds",
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
                    <div className="aspect-square rounded-lg bg-neutral-100 dark:bg-neutral-800 overflow-hidden flex items-center justify-center p-4">
                      <img
                        src={previewUrl}
                        alt="Original"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Processed</Label>
                    <div className="aspect-square rounded-lg bg-neutral-100 dark:bg-neutral-800 overflow-hidden flex items-center justify-center p-4">
                      {isProcessing || isImageLoading ? (
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          <p className="text-sm text-muted-foreground">
                            {isProcessing ? "Processing..." : "Loading image..."}
                          </p>
                        </div>
                      ) : processedUrl ? (
                        <img
                          src={processedUrl}
                          alt="Processed"
                          className="w-full h-full object-contain"
                          onLoad={() => setIsImageLoading(false)}
                          onError={() => setIsImageLoading(false)}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          Apply a tool to see results
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {processedUrl && !isProcessing && !isImageLoading && (
                  <Button
                    variant="outline"
                    className="w-full h-12 gap-2"
                    onClick={handleDownload}
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
          <CardContent className="space-y-4">
            {!selectedFile ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Upload an image to access editing tools
              </p>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Select Image Editing Tool</Label>
                  <Select
                    value={selectedTool || ""}
                    onValueChange={(value) => setSelectedTool(value as ToolType)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose a tool..." />
                    </SelectTrigger>
                    <SelectContent>
                      {tools.map((tool) => {
                        const Icon = tool.icon;
                        return (
                          <SelectItem key={tool.id || ""} value={tool.id || ""}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              <span>{tool.name}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {selectedTool === "enhance" && (
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
                  </>
                )}

                {selectedTool === "corners" && (
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
                )}

                {selectedTool === "rotate" && (
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
                )}

                {selectedTool === "sharpen" && (
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
                )}

                {selectedTool === "background" && (
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
                )}

                <Button
                  onClick={handleSubmit}
                  disabled={isProcessing || !selectedTool}
                  className="w-full h-12 gap-2"
                  data-testid="button-apply-tool"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Apply Tool"
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
