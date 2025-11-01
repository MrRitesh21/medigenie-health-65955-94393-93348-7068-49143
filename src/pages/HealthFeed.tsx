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
  image: string;
  content: React.ReactNode;
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
        image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800',
        content: (
          <div className="space-y-6">
            <img src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800" alt="Heart-healthy foods" className="w-full h-64 object-cover rounded-lg" />
            <p className="text-lg">Your heart is one of the most important organs in your body, and what you eat plays a crucial role in maintaining its health. Here are 10 heart-healthy foods you should consider adding to your diet:</p>
            
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">1. Salmon and Fatty Fish</h3>
              <p>Rich in omega-3 fatty acids, salmon helps reduce inflammation and lower the risk of heart disease. Aim for 2-3 servings per week.</p>
              
              <h3 className="text-xl font-semibold">2. Walnuts and Almonds</h3>
              <p>These nuts are packed with healthy fats, fiber, and antioxidants that support cardiovascular health.</p>
              
              <h3 className="text-xl font-semibold">3. Berries</h3>
              <p>Blueberries, strawberries, and raspberries are loaded with antioxidants that protect your heart from oxidative stress.</p>
              
              <h3 className="text-xl font-semibold">4. Dark Leafy Greens</h3>
              <p>Spinach, kale, and collard greens provide vitamins, minerals, and antioxidants that benefit heart health.</p>
              
              <h3 className="text-xl font-semibold">5. Whole Grains</h3>
              <p>Oats, brown rice, and quinoa are excellent sources of fiber that help lower cholesterol levels.</p>
              
              <h3 className="text-xl font-semibold">6. Avocados</h3>
              <p>Rich in monounsaturated fats, avocados help reduce bad cholesterol and increase good cholesterol.</p>
              
              <h3 className="text-xl font-semibold">7. Olive Oil</h3>
              <p>Extra virgin olive oil is a cornerstone of the Mediterranean diet and provides heart-protective antioxidants.</p>
              
              <h3 className="text-xl font-semibold">8. Legumes</h3>
              <p>Beans, lentils, and chickpeas are high in fiber and protein while being low in fat.</p>
              
              <h3 className="text-xl font-semibold">9. Tomatoes</h3>
              <p>Rich in lycopene, tomatoes help reduce the risk of heart disease and stroke.</p>
              
              <h3 className="text-xl font-semibold">10. Dark Chocolate</h3>
              <p>In moderation, dark chocolate (70% cocoa or higher) can improve heart health thanks to its flavonoids.</p>
              
              <div className="bg-primary/5 p-4 rounded-lg border-l-4 border-primary">
                <p className="font-semibold">Remember: A balanced diet combined with regular exercise is key to maintaining optimal heart health. Consult with your healthcare provider before making significant dietary changes.</p>
              </div>
            </div>
          </div>
        )
      },
      {
        id: '2',
        title: 'Benefits of Daily Walking for Mental Health',
        description: 'Learn how a simple 30-minute walk can improve your mood and reduce stress.',
        category: 'Exercise',
        readTime: '4 min read',
        likes: 189,
        isLiked: false,
        image: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800',
        content: (
          <div className="space-y-6">
            <img src="https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800" alt="Person walking outdoors" className="w-full h-64 object-cover rounded-lg" />
            <p className="text-lg">Walking is one of the simplest yet most effective exercises for improving mental health. Here's why you should make it a daily habit:</p>
            
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Reduces Stress and Anxiety</h3>
              <p>Walking releases endorphins, your body's natural mood boosters. A 30-minute walk can significantly reduce stress hormone levels.</p>
              
              <h3 className="text-xl font-semibold">Improves Mood</h3>
              <p>Regular walking has been shown to reduce symptoms of depression and anxiety. The combination of physical activity and fresh air creates a powerful antidepressant effect.</p>
              
              <h3 className="text-xl font-semibold">Boosts Creativity</h3>
              <p>Studies show that walking can increase creative output by up to 60%. Many great thinkers have used walking as a tool for problem-solving.</p>
              
              <h3 className="text-xl font-semibold">Enhances Sleep Quality</h3>
              <p>Daily walking helps regulate your circadian rhythm, leading to better sleep quality and duration.</p>
              
              <h3 className="text-xl font-semibold">Social Connection</h3>
              <p>Walking with friends or joining a walking group provides social interaction, which is crucial for mental wellbeing.</p>
              
              <h3 className="text-xl font-semibold">Mindfulness Practice</h3>
              <p>Walking can be a form of moving meditation, helping you stay present and reduce rumination.</p>
              
              <div className="bg-primary/5 p-4 rounded-lg border-l-4 border-primary">
                <h4 className="font-semibold mb-2">Getting Started</h4>
                <p>Start with just 10 minutes a day and gradually increase. Walk in nature when possible for added mental health benefits. Make it a non-negotiable part of your daily routine.</p>
              </div>
            </div>
          </div>
        )
      },
      {
        id: '3',
        title: 'Sleep Better: 7 Science-Backed Tips',
        description: 'Improve your sleep quality with these evidence-based strategies.',
        category: 'Wellness',
        readTime: '6 min read',
        likes: 312,
        isLiked: false,
        image: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=800',
        content: (
          <div className="space-y-6">
            <img src="https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=800" alt="Peaceful bedroom" className="w-full h-64 object-cover rounded-lg" />
            <p className="text-lg">Quality sleep is essential for physical and mental health. Here are 7 science-backed strategies to improve your sleep:</p>
            
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">1. Maintain a Consistent Sleep Schedule</h3>
              <p>Go to bed and wake up at the same time every day, even on weekends. This helps regulate your body's internal clock.</p>
              
              <h3 className="text-xl font-semibold">2. Create a Relaxing Bedtime Routine</h3>
              <p>Develop a calming pre-sleep ritual such as reading, gentle stretching, or meditation. Avoid screens for at least an hour before bed.</p>
              
              <h3 className="text-xl font-semibold">3. Optimize Your Sleep Environment</h3>
              <p>Keep your bedroom cool (60-67°F), dark, and quiet. Invest in comfortable bedding and consider blackout curtains or a white noise machine.</p>
              
              <h3 className="text-xl font-semibold">4. Limit Caffeine and Alcohol</h3>
              <p>Avoid caffeine after 2 PM and limit alcohol consumption, especially close to bedtime. Both can significantly disrupt sleep quality.</p>
              
              <h3 className="text-xl font-semibold">5. Exercise Regularly</h3>
              <p>Regular physical activity can help you fall asleep faster and enjoy deeper sleep. However, avoid vigorous exercise close to bedtime.</p>
              
              <h3 className="text-xl font-semibold">6. Manage Exposure to Light</h3>
              <p>Get bright light exposure during the day, especially morning sunlight. Reduce blue light exposure in the evening by using blue light filters.</p>
              
              <h3 className="text-xl font-semibold">7. Watch Your Diet</h3>
              <p>Avoid large meals, spicy foods, and excessive fluids close to bedtime. If you're hungry, have a light, sleep-promoting snack like a banana or warm milk.</p>
              
              <div className="bg-amber-500/10 p-4 rounded-lg border-l-4 border-amber-500">
                <p className="font-semibold">If sleep problems persist despite trying these strategies, consult a healthcare professional to rule out sleep disorders.</p>
              </div>
            </div>
          </div>
        )
      },
      {
        id: '4',
        title: 'Understanding Stress and How to Manage It',
        description: 'Effective techniques to reduce stress and improve your overall wellbeing.',
        category: 'Mental',
        readTime: '7 min read',
        likes: 278,
        isLiked: false,
        image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800',
        content: (
          <div className="space-y-6">
            <img src="https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800" alt="Meditation and relaxation" className="w-full h-64 object-cover rounded-lg" />
            <p className="text-lg">Stress is a natural response to challenging situations, but chronic stress can take a serious toll on your health. Here's how to understand and manage it effectively:</p>
            
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Understanding Stress</h3>
              <p>Stress triggers your body's "fight or flight" response, releasing hormones like cortisol and adrenaline. While helpful in short bursts, prolonged stress can lead to health problems.</p>
              
              <h3 className="text-xl font-semibold">Physical Symptoms</h3>
              <p>Headaches, muscle tension, fatigue, digestive issues, and sleep problems are common physical manifestations of stress.</p>
              
              <h3 className="text-xl font-semibold">Emotional Impact</h3>
              <p>Anxiety, irritability, depression, and difficulty concentrating are typical emotional responses to chronic stress.</p>
              
              <h2 className="text-2xl font-bold mt-8">Effective Management Techniques</h2>
              
              <h3 className="text-xl font-semibold">1. Deep Breathing</h3>
              <p>Practice diaphragmatic breathing for 5-10 minutes daily. It activates your parasympathetic nervous system, promoting relaxation.</p>
              
              <h3 className="text-xl font-semibold">2. Regular Exercise</h3>
              <p>Physical activity reduces stress hormones and stimulates endorphin production.</p>
              
              <h3 className="text-xl font-semibold">3. Mindfulness Meditation</h3>
              <p>Even 10 minutes daily can significantly reduce stress levels and improve emotional regulation.</p>
              
              <h3 className="text-xl font-semibold">4. Time Management</h3>
              <p>Prioritize tasks, set realistic goals, and learn to say no to prevent overwhelm.</p>
              
              <h3 className="text-xl font-semibold">5. Social Support</h3>
              <p>Connect with friends and family. Strong social connections are one of the best stress buffers.</p>
              
              <h3 className="text-xl font-semibold">6. Professional Help</h3>
              <p>Don't hesitate to seek therapy or counseling if stress becomes overwhelming.</p>
              
              <div className="bg-primary/5 p-4 rounded-lg border-l-4 border-primary">
                <p className="font-semibold">Remember: Managing stress is a skill that improves with practice. Be patient with yourself as you develop healthier coping mechanisms.</p>
              </div>
            </div>
          </div>
        )
      },
      {
        id: '5',
        title: 'Mediterranean Diet: A Complete Guide',
        description: 'Everything you need to know about the Mediterranean diet and its health benefits.',
        category: 'Nutrition',
        readTime: '8 min read',
        likes: 421,
        isLiked: false,
        image: 'https://images.unsplash.com/photo-1543364195-bfe6e4932397?w=800',
        content: (
          <div className="space-y-6">
            <img src="https://images.unsplash.com/photo-1543364195-bfe6e4932397?w=800" alt="Mediterranean diet foods" className="w-full h-64 object-cover rounded-lg" />
            <p className="text-lg">The Mediterranean diet is consistently ranked as one of the healthiest eating patterns in the world. Here's your complete guide:</p>
            
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">What Is It?</h3>
              <p>Based on traditional eating habits of countries bordering the Mediterranean Sea, this diet emphasizes whole foods, healthy fats, and plant-based meals.</p>
              
              <h2 className="text-2xl font-bold mt-8">Core Components</h2>
              
              <div className="grid md:grid-cols-3 gap-4 my-6">
                <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/20">
                  <h4 className="font-semibold text-green-600 mb-2">Abundant</h4>
                  <p className="text-sm">Vegetables, fruits, whole grains, legumes, nuts, seeds, herbs, and spices</p>
                </div>
                <div className="bg-blue-500/10 p-4 rounded-lg border border-blue-500/20">
                  <h4 className="font-semibold text-blue-600 mb-2">Moderate</h4>
                  <p className="text-sm">Fish, seafood, poultry, eggs, cheese, and yogurt</p>
                </div>
                <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/20">
                  <h4 className="font-semibold text-red-600 mb-2">Limited</h4>
                  <p className="text-sm">Red meat, sweets, and processed foods</p>
                </div>
              </div>
              
              <p className="font-semibold">Key Fat: Extra virgin olive oil as the primary fat source</p>
              
              <h2 className="text-2xl font-bold mt-8">Health Benefits</h2>
              
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Heart Health:</strong> Reduces risk of heart disease and stroke by up to 30%</li>
                <li><strong>Weight Management:</strong> Promotes sustainable weight loss without restrictive dieting</li>
                <li><strong>Brain Health:</strong> May reduce risk of Alzheimer's and cognitive decline</li>
                <li><strong>Diabetes Prevention:</strong> Improves blood sugar control and insulin sensitivity</li>
                <li><strong>Longevity:</strong> Associated with increased lifespan and better quality of life</li>
              </ul>
              
              <h2 className="text-2xl font-bold mt-8">Getting Started</h2>
              
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Cook with olive oil instead of butter</li>
                <li>Eat fish at least twice weekly</li>
                <li>Fill half your plate with vegetables</li>
                <li>Choose whole grains over refined grains</li>
                <li>Snack on nuts and fruits</li>
                <li>Use herbs and spices instead of salt</li>
                <li>Enjoy meals with family and friends</li>
              </ul>
              
              <div className="bg-primary/5 p-4 rounded-lg border-l-4 border-primary">
                <h4 className="font-semibold mb-2">Sample Day</h4>
                <p><strong>Breakfast:</strong> Greek yogurt with berries and nuts</p>
                <p><strong>Lunch:</strong> Mediterranean salad with grilled chicken</p>
                <p><strong>Dinner:</strong> Baked salmon with roasted vegetables and quinoa</p>
              </div>
              
              <p className="italic">The Mediterranean diet isn't just about food—it's a lifestyle that includes regular physical activity, sharing meals with others, and savoring your food.</p>
            </div>
          </div>
        )
      },
      {
        id: '6',
        title: 'Yoga for Beginners: Getting Started',
        description: 'Simple yoga poses and routines to improve flexibility and reduce tension.',
        category: 'Exercise',
        readTime: '5 min read',
        likes: 356,
        isLiked: false,
        image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800',
        content: (
          <div className="space-y-6">
            <img src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800" alt="Woman practicing yoga" className="w-full h-64 object-cover rounded-lg" />
            <p className="text-lg">Yoga is an ancient practice that combines physical postures, breathing techniques, and meditation. Here's your beginner's guide:</p>
            
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Benefits of Yoga</h2>
              
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Improves flexibility and balance</li>
                <li>Builds strength and muscle tone</li>
                <li>Reduces stress and anxiety</li>
                <li>Enhances body awareness</li>
                <li>Improves sleep quality</li>
                <li>Supports mental clarity</li>
              </ul>
              
              <h2 className="text-2xl font-bold mt-8">Essential Beginner Poses</h2>
              
              <h3 className="text-xl font-semibold">1. Mountain Pose (Tadasana)</h3>
              <p>The foundation of all standing poses. Stand tall with feet together, arms at sides, weight evenly distributed.</p>
              
              <h3 className="text-xl font-semibold">2. Child's Pose (Balasana)</h3>
              <p>A resting pose. Kneel, sit back on heels, and fold forward with arms extended.</p>
              
              <h3 className="text-xl font-semibold">3. Downward Dog (Adho Mukha Svanasana)</h3>
              <p>An inversion that strengthens and stretches the entire body.</p>
              
              <h3 className="text-xl font-semibold">4. Cat-Cow (Marjaryasana-Bitilasana)</h3>
              <p>Gentle flow to warm up the spine and improve flexibility.</p>
              
              <h3 className="text-xl font-semibold">5. Warrior I (Virabhadrasana I)</h3>
              <p>A powerful standing pose that builds strength and stability.</p>
              
              <h2 className="text-2xl font-bold mt-8">Getting Started Tips</h2>
              
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Start with 10-15 minutes daily</li>
                <li>Use props (blocks, straps) to make poses accessible</li>
                <li>Focus on breath - inhale and exhale through your nose</li>
                <li>Don't force poses; work within your comfortable range</li>
                <li>Consider taking a beginner class or using video tutorials</li>
                <li>Practice on an empty stomach</li>
                <li>Wear comfortable, stretchy clothing</li>
              </ul>
              
              <div className="bg-primary/5 p-4 rounded-lg border-l-4 border-primary">
                <h4 className="font-semibold mb-2">Creating a Routine</h4>
                <p>Begin with 5 minutes of breathing exercises, practice 3-5 poses for 20 minutes, and end with 5 minutes in Savasana (final relaxation).</p>
              </div>
              
              <p className="italic">Remember: Yoga is a personal practice. Progress at your own pace and listen to your body. Consistency is more important than perfection.</p>
            </div>
          </div>
        )
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
            <DialogTitle className="text-3xl font-bold mb-4">{selectedArticle?.title}</DialogTitle>
            <div className="flex items-center gap-4 mb-2">
              <Badge variant="outline" className={selectedArticle ? getCategoryColor(selectedArticle.category) : ''}>
                {selectedArticle?.category}
              </Badge>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{selectedArticle?.readTime}</span>
              </div>
            </div>
            <p className="text-muted-foreground text-lg mb-6">{selectedArticle?.description}</p>
          </DialogHeader>
          <div className="mt-6">
            {selectedArticle?.content}
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