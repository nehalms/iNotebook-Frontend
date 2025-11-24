import { useState } from "react";
import { useSessionStore } from "@/store/sessionStore";
import PermissionDenied from "./permission-denied";
import { Lock, Unlock, Send, Copy, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { encryptMessage, decryptMessage } from "@/lib/api/messages";
import type { Message } from "@/types/schema";
import { format } from "date-fns";

export default function MessagesPage() {
  const { permissions } = useSessionStore();
  
  if (!permissions.includes("messages")) {
    return <PermissionDenied />;
  }

  const [mode, setMode] = useState<"encrypt" | "decrypt">("encrypt");
  
  // Encrypt state
  const [encryptData, setEncryptData] = useState({
    secretMsg: "",
    coverMsg: "",
    password: "",
  });
  const [encryptedMsg, setEncryptedMsg] = useState("");
  
  // Decrypt state
  const [decryptData, setDecryptData] = useState({
    msg: "",
    password: "",
  });
  const [decryptedMsg, setDecryptedMsg] = useState("");
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [messages] = useState<Message[]>([]);
  const [isLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (mode === "encrypt") {
      if (!encryptData.secretMsg.trim() || !encryptData.password.trim()) {
        toast({
          title: "Missing Fields",
          description: "Please enter both secret message and password",
          variant: "destructive",
        });
        return;
      }
      if (encryptData.password.length < 4) {
        toast({
          title: "Invalid Password",
          description: "Password should be at least 4 characters",
          variant: "destructive",
        });
        return;
      }

      setIsProcessing(true);
      try {
        const response = await encryptMessage({
          secretMsg: encryptData.secretMsg,
          coverMsg: encryptData.coverMsg || encryptData.secretMsg,
          password: encryptData.password,
        });
        
        if (response.success) {
          setEncryptedMsg(response.msg);
          toast({
            title: "Text Encrypted",
            description: "Your message has been encrypted successfully",
          });
        } else {
          throw new Error(response.msg || "Encryption failed");
        }
      } catch (error) {
        toast({
          title: "Encryption Failed",
          description: error instanceof Error ? error.message : "Failed to encrypt the message",
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
      }
    } else {
      if (!decryptData.msg.trim() || !decryptData.password.trim()) {
        toast({
          title: "Missing Fields",
          description: "Please enter both encrypted message and password",
          variant: "destructive",
        });
        return;
      }

      setIsProcessing(true);
      try {
        const response = await decryptMessage({
          msg: decryptData.msg,
          password: decryptData.password,
        });
        
        if (response.success) {
          setDecryptedMsg(response.msg);
          toast({
            title: "Text Decrypted",
            description: "Your message has been decrypted successfully",
          });
        } else {
          let errorMsg = response.msg || "Decryption failed";
          if (errorMsg === 'Invisible stream not detected! Please copy and paste the StegCloak text sent by the sender.') {
            errorMsg = "No hidden message found";
          }
          throw new Error(errorMsg);
        }
      } catch (error) {
        toast({
          title: "Decryption Failed",
          description: error instanceof Error ? error.message : "Failed to decrypt the message",
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
      }
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
          Secure your messages with encryption using Steganography
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-serif">
              Encrypt / Decrypt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={mode} onValueChange={(v) => setMode(v as "encrypt" | "decrypt")} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="encrypt" className="gap-2">
                  <Lock className="h-4 w-4" />
                  Encrypt
                </TabsTrigger>
                <TabsTrigger value="decrypt" className="gap-2">
                  <Unlock className="h-4 w-4" />
                  Decrypt
                </TabsTrigger>
              </TabsList>

              <TabsContent value="encrypt" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cover Message</label>
                  <Input
                    value={encryptData.coverMsg}
                    onChange={(e) => setEncryptData({ ...encryptData, coverMsg: e.target.value })}
                    placeholder="Message that hides the secret message (optional)"
                    className="h-12"
                    data-testid="input-cover-message"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Secret Message</label>
                  <Textarea
                    value={encryptData.secretMsg}
                    onChange={(e) => setEncryptData({ ...encryptData, secretMsg: e.target.value })}
                    placeholder="Message to send"
                    className="min-h-24 resize-y font-mono text-sm"
                    data-testid="input-secret-message"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Password</label>
                  <Input
                    type="password"
                    value={encryptData.password}
                    onChange={(e) => setEncryptData({ ...encryptData, password: e.target.value })}
                    placeholder="Password to encrypt the message"
                    className="h-12"
                    data-testid="input-encrypt-password"
                  />
                </div>
              </TabsContent>

              <TabsContent value="decrypt" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Encrypted Message</label>
                  <Textarea
                    value={decryptData.msg}
                    onChange={(e) => setDecryptData({ ...decryptData, msg: e.target.value })}
                    placeholder="Message to decrypt"
                    className="min-h-32 resize-y font-mono text-sm"
                    data-testid="input-encrypted-message"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Password</label>
                  <Input
                    type="password"
                    value={decryptData.password}
                    onChange={(e) => setDecryptData({ ...decryptData, password: e.target.value })}
                    placeholder="Password to decrypt the message"
                    className="h-12"
                    data-testid="input-decrypt-password"
                  />
                </div>
              </TabsContent>

              <div className="mt-6">
                <Button
                  onClick={handleSubmit}
                  disabled={isProcessing}
                  className="w-full h-12 gap-2"
                  data-testid={`button-${mode}`}
                >
                  {mode === "encrypt" ? (
                    <>
                      <Lock className="h-5 w-5" />
                      {isProcessing ? "Encrypting..." : "Encrypt"}
                    </>
                  ) : (
                    <>
                      <Unlock className="h-5 w-5" />
                      {isProcessing ? "Decrypting..." : "Decrypt"}
                    </>
                  )}
                </Button>
              </div>

              {mode === "encrypt" && encryptedMsg && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium">Encrypted Output</label>
                      <div className="flex items-center">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="absolute"
                          onClick={() => copyToClipboard(encryptedMsg, "encrypted")}
                        >
                          {copiedId === "encrypted" ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                        <p className="text-xs text-muted-foreground">* Click this to copy message</p>
                      </div>
                    </div>
                    <Badge variant="default" className="gap-1">
                      <Lock className="h-3 w-3" />
                      Encrypted
                    </Badge>
                  </div>
                  <div className="relative">
                    <Textarea
                      value={encryptedMsg}
                      readOnly
                      className="min-h-32 resize-y font-mono text-sm bg-secondary/50"
                      data-testid="output-encrypted-message"
                    />
                    
                  </div>
                </div>
              )}

              {mode === "decrypt" && decryptedMsg && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium">Decrypted Output</label>
                      <div className="flex items-center">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="absolute"
                          onClick={() => copyToClipboard(decryptedMsg, "decrypted")}
                        >
                          {copiedId === "decrypted" ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                        <p className="text-xs text-muted-foreground">* Click this to copy message</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="gap-1">
                      <Unlock className="h-3 w-3" />
                      Decrypted
                    </Badge>
                  </div>
                  <div className="relative">
                    <Textarea
                      value={decryptedMsg}
                      readOnly
                      className="min-h-32 resize-y font-mono text-sm bg-secondary/50"
                      data-testid="output-decrypted-message"
                    />
                  </div>
                </div>
              )}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
