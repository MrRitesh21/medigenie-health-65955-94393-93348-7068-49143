import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { MobileHeader } from '@/components/MobileHeader';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { useUserRole } from '@/hooks/useUserRole';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Heart, Share2, Clock, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

type Category = 'All' | 'Nutrition' | 'Exercise' | 'Wellness' | 'Mental';

interface Article {
  id: string;
  title: string;
  description: string;
  category: string;
  readTime: string;
  likes: number;
  isLiked: boolean;
  content: string;
}

const HealthFeed = () => {
  const navigate = useNavigate();
  const { role, loading: roleLoading } = useUserRole();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category>('All');
  const [articles, setArticles] = useState<Article[]>([]);
  const [dailyProgress, setDailyProgress] = useState(65);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  useEffect(() => {
    checkAuth();
    loadArticles();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/auth');
    }
  };

  const loadArticles = () => {
    // Simulated articles - in production, these would come from database
    const sampleArticles: Article[] = [
      {
        id: '1',
        title: '10 Heart-Healthy Foods to Add to Your Diet',
        description: 'Discover the best foods for cardiovascular health including salmon, nuts, and berries.',
        category: 'Nutrition',
        readTime: '5 min read',
        likes: 245,
        isLiked: false,
        content: `Your heart is one of the most important organs in your body, and what you eat plays a crucial role in maintaining its health. Here are 10 heart-healthy foods you should consider adding to your diet:

1. **Salmon and Fatty Fish**: Rich in omega-3 fatty acids, salmon helps reduce inflammation and lower the risk of heart disease. Aim for 2-3 servings per week.

2. **Walnuts and Almonds**: These nuts are packed with healthy fats, fiber, and antioxidants that support cardiovascular health.

3. **Berries**: Blueberries, strawberries, and raspberries are loaded with antioxidants that protect your heart from oxidative stress.

4. **Dark Leafy Greens**: Spinach, kale, and collard greens provide vitamins, minerals, and antioxidants that benefit heart health.

5. **Whole Grains**: Oats, brown rice, and quinoa are excellent sources of fiber that help lower cholesterol levels.

6. **Avocados**: Rich in monounsaturated fats, avocados help reduce bad cholesterol and increase good cholesterol.

7. **Olive Oil**: Extra virgin olive oil is a cornerstone of the Mediterranean diet and provides heart-protective antioxidants.

8. **Legumes**: Beans, lentils, and chickpeas are high in fiber and protein while being low in fat.

9. **Tomatoes**: Rich in lycopene, tomatoes help reduce the risk of heart disease and stroke.

10. **Dark Chocolate**: In moderation, dark chocolate (70% cocoa or higher) can improve heart health thanks to its flavonoids.

Remember, a balanced diet combined with regular exercise is key to maintaining optimal heart health. Consult with your healthcare provider before making significant dietary changes.`
      },
      {
        id: '2',
        title: 'Benefits of Daily Walking for Mental Health',
        description: 'Learn how a simple 30-minute walk can improve your mood and reduce stress.',
        category: 'Exercise',
        readTime: '4 min read',
        likes: 189,
        isLiked: false,
        content: `Walking is one of the simplest yet most effective exercises for improving mental health. Here's why you should make it a daily habit:

**Reduces Stress and Anxiety**: Walking releases endorphins, your body's natural mood boosters. A 30-minute walk can significantly reduce stress hormone levels.

**Improves Mood**: Regular walking has been shown to reduce symptoms of depression and anxiety. The combination of physical activity and fresh air creates a powerful antidepressant effect.

**Boosts Creativity**: Studies show that walking can increase creative output by up to 60%. Many great thinkers have used walking as a tool for problem-solving.

**Enhances Sleep Quality**: Daily walking helps regulate your circadian rhythm, leading to better sleep quality and duration.

**Social Connection**: Walking with friends or joining a walking group provides social interaction, which is crucial for mental wellbeing.

**Mindfulness Practice**: Walking can be a form of moving meditation, helping you stay present and reduce rumination.

**Getting Started**: Start with just 10 minutes a day and gradually increase. Walk in nature when possible for added mental health benefits. Make it a non-negotiable part of your daily routine.`
      },
      {
        id: '3',
        title: 'Sleep Better: 7 Science-Backed Tips',
        description: 'Improve your sleep quality with these evidence-based strategies.',
        category: 'Wellness',
        readTime: '6 min read',
        likes: 312,
        isLiked: false,
        content: `Quality sleep is essential for physical and mental health. Here are 7 science-backed strategies to improve your sleep:

1. **Maintain a Consistent Sleep Schedule**: Go to bed and wake up at the same time every day, even on weekends. This helps regulate your body's internal clock.

2. **Create a Relaxing Bedtime Routine**: Develop a calming pre-sleep ritual such as reading, gentle stretching, or meditation. Avoid screens for at least an hour before bed.

3. **Optimize Your Sleep Environment**: Keep your bedroom cool (60-67°F), dark, and quiet. Invest in comfortable bedding and consider blackout curtains or a white noise machine.

4. **Limit Caffeine and Alcohol**: Avoid caffeine after 2 PM and limit alcohol consumption, especially close to bedtime. Both can significantly disrupt sleep quality.

5. **Exercise Regularly**: Regular physical activity can help you fall asleep faster and enjoy deeper sleep. However, avoid vigorous exercise close to bedtime.

6. **Manage Exposure to Light**: Get bright light exposure during the day, especially morning sunlight. Reduce blue light exposure in the evening by using blue light filters.

7. **Watch Your Diet**: Avoid large meals, spicy foods, and excessive fluids close to bedtime. If you're hungry, have a light, sleep-promoting snack like a banana or warm milk.

If sleep problems persist despite trying these strategies, consult a healthcare professional to rule out sleep disorders.`
      },
      {
        id: '4',
        title: 'Understanding Stress and How to Manage It',
        description: 'Effective techniques to reduce stress and improve your overall wellbeing.',
        category: 'Mental',
        readTime: '7 min read',
        likes: 278,
        isLiked: false,
        content: `Stress is a natural response to challenging situations, but chronic stress can take a serious toll on your health. Here's how to understand and manage it effectively:

**Understanding Stress**: Stress triggers your body's "fight or flight" response, releasing hormones like cortisol and adrenaline. While helpful in short bursts, prolonged stress can lead to health problems.

**Physical Symptoms**: Headaches, muscle tension, fatigue, digestive issues, and sleep problems are common physical manifestations of stress.

**Emotional Impact**: Anxiety, irritability, depression, and difficulty concentrating are typical emotional responses to chronic stress.

**Effective Management Techniques**:

1. **Deep Breathing**: Practice diaphragmatic breathing for 5-10 minutes daily. It activates your parasympathetic nervous system, promoting relaxation.

2. **Regular Exercise**: Physical activity reduces stress hormones and stimulates endorphin production.

3. **Mindfulness Meditation**: Even 10 minutes daily can significantly reduce stress levels and improve emotional regulation.

4. **Time Management**: Prioritize tasks, set realistic goals, and learn to say no to prevent overwhelm.

5. **Social Support**: Connect with friends and family. Strong social connections are one of the best stress buffers.

6. **Professional Help**: Don't hesitate to seek therapy or counseling if stress becomes overwhelming.

Remember, managing stress is a skill that improves with practice. Be patient with yourself as you develop healthier coping mechanisms.`
      },
      {
        id: '5',
        title: 'Mediterranean Diet: A Complete Guide',
        description: 'Everything you need to know about the Mediterranean diet and its health benefits.',
        category: 'Nutrition',
        readTime: '8 min read',
        likes: 421,
        isLiked: false,
        content: `The Mediterranean diet is consistently ranked as one of the healthiest eating patterns in the world. Here's your complete guide:

**What Is It?**: Based on traditional eating habits of countries bordering the Mediterranean Sea, this diet emphasizes whole foods, healthy fats, and plant-based meals.

**Core Components**:

- **Abundant**: Vegetables, fruits, whole grains, legumes, nuts, seeds, herbs, and spices
- **Moderate**: Fish, seafood, poultry, eggs, cheese, and yogurt
- **Limited**: Red meat, sweets, and processed foods
- **Key Fat**: Extra virgin olive oil as the primary fat source

**Health Benefits**:

1. **Heart Health**: Reduces risk of heart disease and stroke by up to 30%
2. **Weight Management**: Promotes sustainable weight loss without restrictive dieting
3. **Brain Health**: May reduce risk of Alzheimer's and cognitive decline
4. **Diabetes Prevention**: Improves blood sugar control and insulin sensitivity
5. **Longevity**: Associated with increased lifespan and better quality of life

**Getting Started**:

- Cook with olive oil instead of butter
- Eat fish at least twice weekly
- Fill half your plate with vegetables
- Choose whole grains over refined grains
- Snack on nuts and fruits
- Use herbs and spices instead of salt
- Enjoy meals with family and friends

**Sample Day**: Breakfast - Greek yogurt with berries and nuts; Lunch - Mediterranean salad with grilled chicken; Dinner - Baked salmon with roasted vegetables and quinoa.

The Mediterranean diet isn't just about food—it's a lifestyle that includes regular physical activity, sharing meals with others, and savoring your food.`
      },
      {
        id: '6',
        title: 'Yoga for Beginners: Getting Started',
        description: 'Simple yoga poses and routines to improve flexibility and reduce tension.',
        category: 'Exercise',
        readTime: '5 min read',
        likes: 356,
        isLiked: false,
        content: `Yoga is an ancient practice that combines physical postures, breathing techniques, and meditation. Here's your beginner's guide:

**Benefits of Yoga**:
- Improves flexibility and balance
- Builds strength and muscle tone
- Reduces stress and anxiety
- Enhances body awareness
- Improves sleep quality
- Supports mental clarity

**Essential Beginner Poses**:

1. **Mountain Pose (Tadasana)**: The foundation of all standing poses. Stand tall with feet together, arms at sides, weight evenly distributed.

2. **Child's Pose (Balasana)**: A resting pose. Kneel, sit back on heels, and fold forward with arms extended.

3. **Downward Dog (Adho Mukha Svanasana)**: An inversion that strengthens and stretches the entire body.

4. **Cat-Cow (Marjaryasana-Bitilasana)**: Gentle flow to warm up the spine and improve flexibility.

5. **Warrior I (Virabhadrasana I)**: A powerful standing pose that builds strength and stability.

**Getting Started Tips**:

- Start with 10-15 minutes daily
- Use props (blocks, straps) to make poses accessible
- Focus on breath - inhale and exhale through your nose
- Don't force poses; work within your comfortable range
- Consider taking a beginner class or using video tutorials
- Practice on an empty stomach
- Wear comfortable, stretchy clothing

**Creating a Routine**: Begin with 5 minutes of breathing exercises, practice 3-5 poses for 20 minutes, and end with 5 minutes in Savasana (final relaxation).

Remember, yoga is a personal practice. Progress at your own pace and listen to your body. Consistency is more important than perfection.`
      }
    ];
    setArticles(sampleArticles);
  };

  const handleLike = (articleId: string) => {
    setArticles(articles.map(article => {
      if (article.id === articleId) {
        return {
          ...article,
          isLiked: !article.isLiked,
          likes: article.isLiked ? article.likes - 1 : article.likes + 1
        };
      }
      return article;
    }));
  };

  const handleShare = (article: Article) => {
    toast.success('Article link copied to clipboard!');
  };

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories: Category[] = ['All', 'Nutrition', 'Exercise', 'Wellness', 'Mental'];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Nutrition':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'Exercise':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'Wellness':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'Mental':
        return 'bg-pink-500/10 text-pink-500 border-pink-500/20';
      default:
        return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <MobileHeader title="Health Feed" />

      <div className="p-4 space-y-6">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search health tips..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 glass border-primary/20"
          />
        </div>

        {/* Daily Challenge */}
        <Card className="glass-light border-primary/20 shadow-glow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-lg">Daily Challenge</h3>
                </div>
                <p className="text-2xl font-bold mb-1">Walk 10,000 steps today</p>
                <p className="text-sm text-muted-foreground">Keep moving for better health</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-semibold text-primary">{dailyProgress}%</span>
              </div>
              <Progress value={dailyProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Category Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className={selectedCategory === category ? "shadow-glow" : ""}
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Articles Grid */}
        <div className="space-y-4">
          {filteredArticles.map((article) => (
            <Card 
              key={article.id} 
              className="glass-light border-primary/10 hover:shadow-md transition-smooth overflow-hidden group cursor-pointer"
              onClick={() => setSelectedArticle(article)}
            >
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Category and Read Time */}
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className={getCategoryColor(article.category)}>
                      {article.category}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{article.readTime}</span>
                    </div>
                  </div>

                  {/* Title and Description */}
                  <div>
                    <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-smooth">
                      {article.title}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {article.description}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLike(article.id)}
                      className={article.isLiked ? "text-red-500" : ""}
                    >
                      <Heart
                        className={`h-4 w-4 mr-2 ${article.isLiked ? "fill-current" : ""}`}
                      />
                      {article.likes}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleShare(article)}
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredArticles.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No articles found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Article Detail Dialog */}
      <Dialog open={!!selectedArticle} onOpenChange={() => setSelectedArticle(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className={selectedArticle ? getCategoryColor(selectedArticle.category) : ''}>
                {selectedArticle?.category}
              </Badge>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{selectedArticle?.readTime}</span>
              </div>
            </div>
            <DialogTitle className="text-2xl">{selectedArticle?.title}</DialogTitle>
          </DialogHeader>
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <p className="text-muted-foreground text-base mb-6">{selectedArticle?.description}</p>
            <div className="whitespace-pre-line text-foreground leading-relaxed">
              {selectedArticle?.content}
            </div>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-border/50 mt-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                if (selectedArticle) handleLike(selectedArticle.id);
              }}
              className={selectedArticle?.isLiked ? "text-red-500" : ""}
            >
              <Heart
                className={`h-4 w-4 mr-2 ${selectedArticle?.isLiked ? "fill-current" : ""}`}
              />
              {selectedArticle?.likes}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                if (selectedArticle) handleShare(selectedArticle);
              }}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <MobileBottomNav role={role} />
    </div>
  );
};

export default HealthFeed;