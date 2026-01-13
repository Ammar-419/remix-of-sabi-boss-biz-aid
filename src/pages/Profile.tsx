import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Store, Mail, Phone, MapPin, Crown } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Profile = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [profile, setProfile] = useState({
    full_name: "",
    business_name: "",
    phone: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      if (data) {
        setProfile({
          full_name: data.full_name || "",
          business_name: data.business_name || "",
          phone: data.phone || "",
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update(profile)
        .eq('user_id', user.id);

      if (error) throw error;
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 flex items-center justify-center min-h-screen">
        <p className="text-lg">{t('loading')}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold">{t('profile')}</h1>
        <p className="text-muted-foreground">{t('manageInfo')}</p>
      </div>

      {/* Premium Upgrade Card */}
      <Card className="p-6 shadow-elevated bg-gradient-to-br from-primary via-secondary to-accent text-primary-foreground">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Crown className="h-6 w-6" />
              <h3 className="text-xl font-bold">{t('upgradeToPremium')}</h3>
            </div>
            <p className="text-sm opacity-90 mb-4">
              {t('premiumDescription')}
            </p>
            <Button variant="secondary" size="lg">
              {t('upgradePlan')}
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-6 shadow-card">
        <div className="flex flex-col items-center mb-6">
          <div className="w-24 h-24 rounded-full bg-gradient-primary flex items-center justify-center mb-4">
            <span className="text-4xl font-bold text-primary-foreground">
              {profile.full_name ? profile.full_name.charAt(0) : 'U'}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="flex items-center space-x-2 mb-2">
              <User className="h-4 w-4" />
              <span>{t('fullName')}</span>
            </Label>
            <Input
              value={profile.full_name}
              onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
              placeholder={t('fullName')}
            />
          </div>

          <div>
            <Label className="flex items-center space-x-2 mb-2">
              <Store className="h-4 w-4" />
              <span>{t('businessName')}</span>
            </Label>
            <Input
              value={profile.business_name}
              onChange={(e) => setProfile({ ...profile, business_name: e.target.value })}
              placeholder={t('businessName')}
            />
          </div>

          <div>
            <Label className="flex items-center space-x-2 mb-2">
              <Mail className="h-4 w-4" />
              <span>Email</span>
            </Label>
            <Input
              type="email"
              value={user?.email || ""}
              placeholder={t('email')}
              disabled
            />
          </div>

          <div>
            <Label className="flex items-center space-x-2 mb-2">
              <Phone className="h-4 w-4" />
              <span>{t('phone')}</span>
            </Label>
            <Input
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              placeholder={t('phone')}
            />
          </div>
        </div>

        <Button className="w-full mt-6 bg-gradient-primary" onClick={handleSave}>
          {t('save')}
        </Button>
      </Card>
    </div>
  );
};

export default Profile;
