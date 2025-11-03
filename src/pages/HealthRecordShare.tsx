import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, QrCode, Clock, Users, Shield, Copy, CheckCircle2, XCircle } from "lucide-react";
import { MobileHeader } from "@/components/MobileHeader";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { useUserRole } from "@/hooks/useUserRole";
import { Badge } from "@/components/ui/badge";

export default function HealthRecordShare() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { role } = useUserRole();
  const [isGenerating, setIsGenerating] = useState(false);
  const [expiryHours, setExpiryHours] = useState("24");
  const [maxUses, setMaxUses] = useState("");
  const [qrCode, setQrCode] = useState<any>(null);
  const [activeTokens, setActiveTokens] = useState<any[]>([]);
  const [loadingTokens, setLoadingTokens] = useState(true);

  useEffect(() => {
    checkAuth();
    loadActiveTokens();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const loadActiveTokens = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: patient } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!patient) return;

      const { data: tokens } = await supabase
        .from('health_record_tokens')
        .select('*')
        .eq('patient_id', patient.id)
        .order('created_at', { ascending: false });

      setActiveTokens(tokens || []);
    } catch (error) {
      console.error('Error loading tokens:', error);
    } finally {
      setLoadingTokens(false);
    }
  };

  const generateQR = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-health-qr', {
        body: {
          expiryHours: parseInt(expiryHours),
          maxUses: maxUses ? parseInt(maxUses) : null
        }
      });

      if (error) throw error;

      setQrCode(data);
      await loadActiveTokens();
      
      toast({
        title: "QR Code Generated!",
        description: "Your secure health record QR code is ready"
      });

    } catch (error: any) {
      console.error('Error generating QR:', error);
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    toast({
      title: "Copied!",
      description: "Token copied to clipboard"
    });
  };

  const revokeToken = async (tokenId: string) => {
    try {
      const { error } = await supabase
        .from('health_record_tokens')
        .update({ is_active: false })
        .eq('id', tokenId);

      if (error) throw error;

      await loadActiveTokens();
      toast({
        title: "Token Revoked",
        description: "Access has been revoked successfully"
      });
    } catch (error: any) {
      toast({
        title: "Revocation Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date();

  return (
    <div className="min-h-screen bg-background pb-20">
      <MobileHeader title="Health Record Sharing" />
      
      <div className="container mx-auto p-4 max-w-4xl my-[50px]">
        <Card className="mb-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <QrCode className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl">Share Health Records Securely</CardTitle>
            </div>
            <CardDescription>
              Generate time-limited QR codes for doctors to access your medical history
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Generate New QR */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Generate New QR Code</CardTitle>
            <CardDescription>Create a secure access link for healthcare providers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="expiry">Expiry Time (hours)</Label>
              <Input
                id="expiry"
                type="number"
                min="1"
                max="168"
                value={expiryHours}
                onChange={(e) => setExpiryHours(e.target.value)}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Default: 24 hours, Max: 7 days (168 hours)
              </p>
            </div>

            <div>
              <Label htmlFor="maxUses">Maximum Uses (Optional)</Label>
              <Input
                id="maxUses"
                type="number"
                min="1"
                placeholder="Unlimited"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty for unlimited access within time limit
              </p>
            </div>

            <Button 
              onClick={generateQR} 
              disabled={isGenerating}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <QrCode className="mr-2 h-4 w-4" />
                  Generate QR Code
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Display Generated QR */}
        {qrCode && (
          <Card className="mb-6 border-2 border-primary">
            <CardHeader>
              <CardTitle className="text-green-600 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                QR Code Generated Successfully
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center">
                <img src={qrCode.qrCodeUrl} alt="Health Record QR Code" className="rounded-lg shadow-lg" />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-muted rounded">
                  <span className="text-sm font-mono">{qrCode.token}</span>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => copyToken(qrCode.token)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>Expires: {new Date(qrCode.expiresAt).toLocaleString()}</span>
                  </div>
                  {qrCode.maxUses && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>Max uses: {qrCode.maxUses}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Active Tokens List */}
        <Card>
          <CardHeader>
            <CardTitle>Active Access Tokens</CardTitle>
            <CardDescription>Manage your shared health record access</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingTokens ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : activeTokens.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>No active tokens</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeTokens.map((token) => (
                  <Card key={token.id} className={`${!token.is_active || isExpired(token.expires_at) ? 'opacity-60' : ''}`}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-sm">{token.token}</span>
                            {token.is_active && !isExpired(token.expires_at) ? (
                              <Badge variant="default" className="bg-green-500">Active</Badge>
                            ) : (
                              <Badge variant="secondary">
                                {isExpired(token.expires_at) ? 'Expired' : 'Revoked'}
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground space-y-1">
                            <div>Created: {new Date(token.created_at).toLocaleString()}</div>
                            <div>Expires: {new Date(token.expires_at).toLocaleString()}</div>
                            <div>Uses: {token.access_count}{token.max_uses ? `/${token.max_uses}` : ''}</div>
                          </div>
                        </div>
                        {token.is_active && !isExpired(token.expires_at) && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => revokeToken(token.id)}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <MobileBottomNav role={role} />
    </div>
  );
}