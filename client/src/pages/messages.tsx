import { useState } from "react";
import { Lock, Unlock, Send, Copy, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import type { Message } from "@shared/schema";
import { format } from "date-fns";

interface MessagesPageProps {
  messages?: Message[];
  isLoading?: boolean;
  onEncrypt?: (text: string) => Promise<string>;
  onDecrypt?: (text: string) => Promise<string>;
  onSaveMessage?: (content: string, isEncrypted: boolean) => Promise<void>;
}

export default function MessagesPage({
  messages = [],
  isLoading,
  onEncrypt,
  onDecrypt,
  onSaveMessage,
}: MessagesPageProps) {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleEncrypt = async () => {
    if (!inputText.trim()) return;

    setIsProcessing(true);
    try {
      const encrypted = await onEncrypt?.(inputText);
      setOutputText(encrypted || "");
      setIsEncrypted(true);
      toast({
        title: "Text Encrypted",
        description: "Your message has been encrypted successfully",
      });
    } catch (error) {
      toast({
        title: "Encryption Failed",
        description: "Failed to encrypt the message",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecrypt = async () => {
    if (!inputText.trim()) return;

    setIsProcessing(true);
    try {
      const decrypted = await onDecrypt?.(inputText);
      setOutputText(decrypted || "");
      setIsEncrypted(false);
      toast({
        title: "Text Decrypted",
        description: "Your message has been decrypted successfully",
      });
    } catch (error) {
      toast({
        title: "Decryption Failed",
        description: "Failed to decrypt the message",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = async () => {
    if (!outputText.trim()) return;

    try {
      await onSaveMessage?.(outputText, isEncrypted);
      setInputText("");
      setOutputText("");
      toast({
        title: "Message Saved",
        description: "Your message has been saved successfully",
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save the message",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      toast({
        title: "Copied!",
        description: "Message copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy message",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-4xl font-bold font-serif mb-2">
          Encrypted Messages
        </h1>
        <p className="text-muted-foreground text-lg">
          Secure your messages with encryption
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-serif">
              Encrypt / Decrypt
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Input Message</label>
              <Textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Enter your message here..."
                className="min-h-32 resize-y font-mono text-sm"
                data-testid="input-message-text"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleEncrypt}
                disabled={!inputText.trim() || isProcessing}
                className="flex-1 h-12 gap-2"
                data-testid="button-encrypt"
              >
                <Lock className="h-5 w-5" />
                {isProcessing ? "Encrypting..." : "Encrypt"}
              </Button>
              <Button
                onClick={handleDecrypt}
                disabled={!inputText.trim() || isProcessing}
                variant="secondary"
                className="flex-1 h-12 gap-2"
                data-testid="button-decrypt"
              >
                <Unlock className="h-5 w-5" />
                {isProcessing ? "Decrypting..." : "Decrypt"}
              </Button>
            </div>

            {outputText && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Output</label>
                  <Badge
                    variant={isEncrypted ? "default" : "secondary"}
                    className="gap-1"
                  >
                    {isEncrypted ? (
                      <>
                        <Lock className="h-3 w-3" />
                        Encrypted
                      </>
                    ) : (
                      <>
                        <Unlock className="h-3 w-3" />
                        Decrypted
                      </>
                    )}
                  </Badge>
                </div>
                <div className="relative">
                  <Textarea
                    value={outputText}
                    readOnly
                    className="min-h-32 resize-y font-mono text-sm"
                    data-testid="output-message-text"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(outputText, "output")}
                  >
                    {copiedId === "output" ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <Button
                  onClick={handleSave}
                  variant="outline"
                  className="w-full h-12 gap-2"
                  data-testid="button-save-message"
                >
                  <Send className="h-5 w-5" />
                  Save Message
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-serif">
              Saved Messages
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : messages.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {messages.map((message) => (
                  <Card
                    key={message.id}
                    className={`p-4 ${
                      message.isEncrypted
                        ? "bg-primary/5 border-primary/20"
                        : "bg-muted/50"
                    }`}
                    data-testid={`message-${message.id}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Badge
                        variant={message.isEncrypted ? "default" : "secondary"}
                        className="gap-1"
                      >
                        {message.isEncrypted ? (
                          <>
                            <Lock className="h-3 w-3" />
                            Encrypted
                          </>
                        ) : (
                          <>
                            <Unlock className="h-3 w-3" />
                            Plain
                          </>
                        )}
                      </Badge>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() =>
                          copyToClipboard(message.content, message.id)
                        }
                      >
                        {copiedId === message.id ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                    <p className="text-sm font-mono break-all line-clamp-3 mb-2">
                      {message.content}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(message.createdAt), "MMM d, yyyy h:mm a")}
                    </p>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Lock className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No saved messages yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Encrypt and save messages to see them here
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
