import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, QrCode, Clock, Users, Copy, CheckCircle2, XCircle, Download } from "lucide-react";
import { MobileHeader } from "@/components/MobileHeader";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { useUserRole } from "@/hooks/useUserRole";
import { Badge } from "@/components/ui/badge";

export default function DoctorQRCode() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { role } = useUserRole();
  const [isGenerating, setIsGenerating] = useState(false);
  const [expiryHours, setExpiryHours] = useState("168"); // Default 7 days
  const [neverExpires, setNeverExpires] = useState(false);
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
      return;
    }

    // Check if user is a doctor
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profile?.role !== 'doctor') {
      toast({
        title: "Access Denied",
        description: "This page is only for doctors",
        variant: "destructive"
      });
      navigate("/dashboard");
    }
  };

  const loadActiveTokens = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: doctor } = await supabase
        .from('doctors')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!doctor) return;

      const { data: tokens, error } = await supabase
        .from('doctor_booking_tokens')
        .select('*')
        .eq('doctor_id', doctor.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: doctor } = await supabase
        .from('doctors')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!doctor) {
        toast({
          title: "Profile Required",
          description: "Please complete your doctor profile first",
          variant: "destructive"
        });
        navigate('/doctor-registration');
        return;
      }

      const { data, error } = await supabase.functions.invoke('generate-doctor-booking-qr', {
        body: {
          expiryHours: neverExpires ? 876000 : parseInt(expiryHours), // 100 years if never expires
          maxUses: maxUses ? parseInt(maxUses) : null,
          neverExpires
        }
      });

      if (error) throw error;
      if (!data) throw new Error('No data returned');

      setQrCode(data);
      await loadActiveTokens();
      
      toast({
        title: "QR Code Generated!",
        description: "Your booking QR code is ready"
      });

    } catch (error: any) {
      toast({
        title: "Generation Failed",
        description: error.message || 'An unexpected error occurred',
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadQR = () => {
    if (!qrCode) return;
    const link = document.createElement('a');
    link.href = qrCode.qrCodeUrl;
    link.download = `doctor-booking-qr-${qrCode.token}.png`;
    link.click();
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
        .from('doctor_booking_tokens')
        .update({ is_active: false })
        .eq('id', tokenId);

      if (error) throw error;

      await loadActiveTokens();
      toast({
        title: "Token Revoked",
        description: "QR code has been deactivated"
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

  const showTokenQR = (token: any) => {
    if (token.is_active && !isExpired(token.expires_at)) {
      const qrData = JSON.stringify({
        token: token.token,
        type: 'doctor_booking',
        doctor_id: token.doctor_id,
        expires: token.expires_at
      });
      
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;
      
      setQrCode({
        token: token.token,
        qrCodeUrl,
        expiresAt: token.expires_at,
        maxUses: token.max_uses,
        tokenData: token
      });

      toast({
        title: "QR Code Ready",
        description: "Scroll up to view your QR code"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <MobileHeader title="My Booking QR Code" />
      
      <div className="container mx-auto p-4 max-w-4xl my-[50px]">
        <Card className="mb-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <QrCode className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl">Patient Booking QR Code</CardTitle>
            </div>
            <CardDescription>
              Generate QR codes for patients to book appointments directly by scanning
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Generate New QR Code</CardTitle>
            <CardDescription>Create a booking link for your patients</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <Label htmlFor="neverExpires" className="font-medium">Never Expires</Label>
                <p className="text-xs text-muted-foreground">QR code will always be active</p>
              </div>
              <Switch
                id="neverExpires"
                checked={neverExpires}
                onCheckedChange={setNeverExpires}
              />
            </div>

            {!neverExpires && (
              <div>
                <Label htmlFor="expiry">Expiry Time (hours)</Label>
                <Input
                  id="expiry"
                  type="number"
                  min="1"
                  max="8760"
                  value={expiryHours}
                  onChange={(e) => setExpiryHours(e.target.value)}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Default: 168 hours (7 days), Max: 1 year
                </p>
              </div>
            )}

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
                Leave empty for unlimited bookings
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
                <img src={qrCode.qrCodeUrl} alt="Booking QR Code" className="rounded-lg shadow-lg" />
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

                <Button onClick={downloadQR} variant="outline" className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Download QR Code
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Active QR Codes</CardTitle>
            <CardDescription>Manage your booking QR codes</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingTokens ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : activeTokens.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <QrCode className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>No active QR codes</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeTokens.map((token) => {
                  const isActive = token.is_active && !isExpired(token.expires_at);
                  return (
                    <Card 
                      key={token.id} 
                      className={`${!isActive ? 'opacity-60' : 'cursor-pointer hover:border-primary/50 transition-colors'}`}
                      onClick={() => showTokenQR(token)}
                    >
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono text-sm">{token.token}</span>
                              {isActive ? (
                                <Badge variant="default" className="bg-green-500">Active</Badge>
                              ) : (
                                <Badge variant="secondary">
                                  {isExpired(token.expires_at) ? 'Expired' : 'Revoked'}
                                </Badge>
                              )}
                              {isActive && (
                                <Badge variant="outline" className="text-xs">Click to view QR</Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground space-y-1">
                              <div>Created: {new Date(token.created_at).toLocaleString()}</div>
                              <div>Expires: {new Date(token.expires_at).toLocaleString()}</div>
                              <div>Uses: {token.access_count}{token.max_uses ? `/${token.max_uses}` : ''}</div>
                            </div>
                          </div>
                          {isActive && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                revokeToken(token.id);
                              }}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <MobileBottomNav role={role} />
    </div>
  );
}