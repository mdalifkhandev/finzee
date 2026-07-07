import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { appConfig } from "@/config/app";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Share2, Copy, Check, Link2 } from "lucide-react";
import { toast } from "sonner";

type Persona = "jason" | "maya" | "ava" | "all";

interface ShareLinkGeneratorProps {
  defaultPersona?: Persona;
  trigger?: React.ReactNode;
}

export function ShareLinkGenerator({ defaultPersona = "all", trigger }: ShareLinkGeneratorProps) {
  const [persona, setPersona] = useState<Persona>(defaultPersona);
  const [ttlDays, setTtlDays] = useState("7");
  const [generatedLink, setGeneratedLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateLink = async () => {
    setLoading(true);
    try {
      const ttlSeconds = parseInt(ttlDays) * 24 * 60 * 60;
      
      const { data, error } = await supabase.functions.invoke("share-token", {
        body: { action: "sign", persona, ttlSeconds },
      });

      if (error) throw new Error(error.message);
      if (!data?.token) throw new Error("Failed to generate token");

      // For "all" personas, link to persona picker; otherwise direct to specific persona
      const baseUrl = appConfig.siteUrl;
      const path = persona === "all" ? "/share" : `/share/${persona}`;
      const link = `${baseUrl}${path}?token=${data.token}`;
      setGeneratedLink(link);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate link");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const getSimpleLink = () => {
    const path = persona === "all" ? "/d" : `/share/${persona}`;
    return persona === "all" 
      ? `${appConfig.siteUrl}${path}` 
      : `${appConfig.siteUrl}${path}?code=${encodeURIComponent(appConfig.viewerCode)}`;
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Persona Demo</DialogTitle>
          <DialogDescription>
            Generate a shareable link for investors to preview the demo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Persona</Label>
            <Select value={persona} onValueChange={(v) => setPersona(v as Persona)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Personas</SelectItem>
                <SelectItem value="jason">Jason (New Dad)</SelectItem>
                <SelectItem value="maya">Maya (Freelancer)</SelectItem>
                <SelectItem value="ava">Ava (Student)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Link expires in</Label>
            <Select value={ttlDays} onValueChange={setTtlDays}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 day</SelectItem>
                <SelectItem value="2">2 days</SelectItem>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={generateLink} disabled={loading} className="w-full">
            {loading ? "Generating..." : "Generate Signed Link"}
          </Button>

          {generatedLink && (
            <div className="space-y-2">
              <Label>Signed Link (expires)</Label>
              <div className="flex gap-2">
                <Input value={generatedLink} readOnly className="text-xs" />
                <Button size="icon" variant="outline" onClick={copyToClipboard}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}

          <div className="border-t pt-4">
            <Label className="text-muted-foreground">Simple Link (requires viewer code)</Label>
            <div className="flex gap-2 mt-2">
              <Input value={getSimpleLink()} readOnly className="text-xs" />
              <Button
                size="icon"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(getSimpleLink());
                  toast.success("Simple link copied");
                }}
              >
                <Link2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
