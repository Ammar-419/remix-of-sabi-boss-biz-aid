import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Link } from 'react-router-dom';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

const signupSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').max(15),
  email: z.string().email('Invalid email address'),
  businessName: z.string().min(2, 'Business name must be at least 2 characters').max(100),
  businessType: z.enum(['Trader', 'Shop Owner', 'Service Provider', 'Farmer', 'Other'], {
    errorMap: () => ({ message: 'Please select a business type' })
  }),
  businessLocation: z.string().min(2, 'Business location must be at least 2 characters').max(100),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  preferredLanguage: z.enum(['en', 'pidgin', 'ha', 'yo', 'ig']).optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupFormData = z.infer<typeof signupSchema>;

const Signup = () => {
  const [formData, setFormData] = useState<Partial<SignupFormData>>({
    fullName: '',
    phone: '',
    email: '',
    businessName: '',
    businessType: undefined,
    businessLocation: '',
    password: '',
    confirmPassword: '',
    preferredLanguage: 'en',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { signUp } = useAuth();
  const { t } = useLanguage();

  const handleChange = (field: keyof SignupFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    try {
      signupSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);
    try {
      await signUp(
        formData.email!,
        formData.password!,
        formData.fullName!,
        formData.phone!,
        formData.businessName,
        formData.businessType,
        formData.businessLocation,
        formData.preferredLanguage
      );
    } catch (error: any) {
      toast.error(error.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const businessTypes = [
    { value: 'Trader', label: 'Trader' },
    { value: 'Shop Owner', label: 'Shop Owner' },
    { value: 'Service Provider', label: 'Service Provider' },
    { value: 'Farmer', label: 'Farmer' },
    { value: 'Other', label: 'Other' },
  ];

  const languages = [
    { value: 'en', label: 'English' },
    { value: 'pidgin', label: 'Pidgin' },
    { value: 'ha', label: 'Hausa' },
    { value: 'yo', label: 'Yoruba' },
    { value: 'ig', label: 'Igbo' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-secondary to-accent p-4">
      <Card className="w-full max-w-md p-8 shadow-elevated max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-primary mb-2">SabiBoss</h1>
          <p className="text-muted-foreground">{t('signup')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <Label htmlFor="fullName">{t('fullName')} *</Label>
            <Input
              id="fullName"
              placeholder="Enter your full name"
              value={formData.fullName}
              onChange={(e) => handleChange('fullName', e.target.value)}
              className={errors.fullName ? 'border-destructive' : ''}
            />
            {errors.fullName && (
              <p className="text-sm text-destructive mt-1">{errors.fullName}</p>
            )}
          </div>

          {/* Phone Number */}
          <div>
            <Label htmlFor="phone">{t('phone')} *</Label>
            <Input
              id="phone"
              placeholder="Enter phone number"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className={errors.phone ? 'border-destructive' : ''}
            />
            {errors.phone && (
              <p className="text-sm text-destructive mt-1">{errors.phone}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter email address"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className={errors.email ? 'border-destructive' : ''}
            />
            {errors.email && (
              <p className="text-sm text-destructive mt-1">{errors.email}</p>
            )}
          </div>

          {/* Business Name */}
          <div>
            <Label htmlFor="businessName">{t('businessName')} *</Label>
            <Input
              id="businessName"
              placeholder="Enter your business name"
              value={formData.businessName}
              onChange={(e) => handleChange('businessName', e.target.value)}
              className={errors.businessName ? 'border-destructive' : ''}
            />
            {errors.businessName && (
              <p className="text-sm text-destructive mt-1">{errors.businessName}</p>
            )}
          </div>

          {/* Business Type */}
          <div>
            <Label htmlFor="businessType">Business Type *</Label>
            <Select
              value={formData.businessType}
              onValueChange={(value) => handleChange('businessType', value)}
            >
              <SelectTrigger className={errors.businessType ? 'border-destructive' : ''}>
                <SelectValue placeholder="Select business type" />
              </SelectTrigger>
              <SelectContent>
                {businessTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.businessType && (
              <p className="text-sm text-destructive mt-1">{errors.businessType}</p>
            )}
          </div>

          {/* Business Location */}
          <div>
            <Label htmlFor="businessLocation">Business Location (City/Market) *</Label>
            <Input
              id="businessLocation"
              placeholder="e.g., Lagos, Onitsha Main Market"
              value={formData.businessLocation}
              onChange={(e) => handleChange('businessLocation', e.target.value)}
              className={errors.businessLocation ? 'border-destructive' : ''}
            />
            {errors.businessLocation && (
              <p className="text-sm text-destructive mt-1">{errors.businessLocation}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <Label htmlFor="password">{t('password')} *</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password (min 6 characters)"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-destructive mt-1">{errors.password}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <Label htmlFor="confirmPassword">Confirm Password *</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                className={errors.confirmPassword ? 'border-destructive pr-10' : 'pr-10'}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-destructive mt-1">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Preferred Language (Optional) */}
          <div>
            <Label htmlFor="preferredLanguage">Preferred Language ({t('optional')})</Label>
            <Select
              value={formData.preferredLanguage}
              onValueChange={(value) => handleChange('preferredLanguage', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('signup')}...
              </>
            ) : (
              t('signup')
            )}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">
              {t('login')}
            </Link>
          </p>
        </form>
      </Card>
    </div>
  );
};

export default Signup;
