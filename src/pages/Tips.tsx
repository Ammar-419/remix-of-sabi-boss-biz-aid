import { Card } from "@/components/ui/card";
import { Lightbulb, TrendingUp, Users, Target, DollarSign, Calendar } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const Tips = () => {
  const { t } = useLanguage();
  const tips = [
    {
      icon: TrendingUp,
      color: "primary",
      title: "Track Daily Sales",
      content: "Record every transaction immediately. Small sales add up to big profits!",
    },
    {
      icon: Users,
      color: "secondary",
      title: "Build Customer Relationships",
      content: "Remember customer names and preferences. Loyal customers bring more business.",
    },
    {
      icon: Target,
      color: "accent",
      title: "Set Weekly Goals",
      content: "Break down monthly targets into weekly goals. It makes success more achievable.",
    },
    {
      icon: DollarSign,
      color: "primary",
      title: "Separate Business & Personal Money",
      content: "Keep business funds separate from personal expenses to track profits accurately.",
    },
    {
      icon: Calendar,
      color: "secondary",
      title: "Plan Ahead for Expenses",
      content: "Anticipate recurring expenses like rent and utilities. Budget for them early.",
    },
  ];

  const quotes = [
    {
      text: "Success is not about how much you make, but how much you save and reinvest.",
      author: "Nigerian Proverb",
    },
    {
      text: "A small business that serves well can become a big business.",
      author: "Aliko Dangote",
    },
    {
      text: "Keep accurate records today, avoid wahala tomorrow.",
      author: "Business Wisdom",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('businessTips')}</h1>
        <p className="text-muted-foreground">{t('smartAdvice')}</p>
      </div>

      {/* Daily Tip */}
      <Card className="p-6 shadow-elevated bg-gradient-primary text-primary-foreground">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <Lightbulb className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold mb-2">{t('tipOfDay')}</h3>
            <p className="text-lg opacity-95">
              Always ask for customer feedback. It helps you improve your products and service quality.
              Happy customers become your best marketers!
            </p>
          </div>
        </div>
      </Card>

      {/* Tips Grid */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">{t('essentialTips')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tips.map((tip, index) => (
            <Card key={index} className="p-6 shadow-card hover:shadow-elevated transition-all">
              <div className="flex items-start space-x-4">
                <div className={`w-12 h-12 rounded-xl bg-${tip.color}-light flex items-center justify-center flex-shrink-0`}>
                  <tip.icon className={`h-6 w-6 text-${tip.color}`} />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">{tip.title}</h3>
                  <p className="text-muted-foreground">{tip.content}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Motivational Quotes */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">{t('wordsOfWisdom')}</h2>
        <div className="space-y-4">
          {quotes.map((quote, index) => (
            <Card key={index} className="p-6 shadow-card bg-muted/50">
              <p className="text-lg italic mb-2">&ldquo;{quote.text}&rdquo;</p>
              <p className="text-sm text-muted-foreground">— {quote.author}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Tips;
