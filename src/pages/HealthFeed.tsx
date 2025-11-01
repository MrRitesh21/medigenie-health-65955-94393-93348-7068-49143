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
}

const HealthFeed = () => {
  const navigate = useNavigate();
  const { role, loading: roleLoading } = useUserRole();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category>('All');
  const [articles, setArticles] = useState<Article[]>([]);
  const [dailyProgress, setDailyProgress] = useState(65);

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
        isLiked: false
      },
      {
        id: '2',
        title: 'Benefits of Daily Walking for Mental Health',
        description: 'Learn how a simple 30-minute walk can improve your mood and reduce stress.',
        category: 'Exercise',
        readTime: '4 min read',
        likes: 189,
        isLiked: false
      },
      {
        id: '3',
        title: 'Sleep Better: 7 Science-Backed Tips',
        description: 'Improve your sleep quality with these evidence-based strategies.',
        category: 'Wellness',
        readTime: '6 min read',
        likes: 312,
        isLiked: false
      },
      {
        id: '4',
        title: 'Understanding Stress and How to Manage It',
        description: 'Effective techniques to reduce stress and improve your overall wellbeing.',
        category: 'Mental',
        readTime: '7 min read',
        likes: 278,
        isLiked: false
      },
      {
        id: '5',
        title: 'Mediterranean Diet: A Complete Guide',
        description: 'Everything you need to know about the Mediterranean diet and its health benefits.',
        category: 'Nutrition',
        readTime: '8 min read',
        likes: 421,
        isLiked: false
      },
      {
        id: '6',
        title: 'Yoga for Beginners: Getting Started',
        description: 'Simple yoga poses and routines to improve flexibility and reduce tension.',
        category: 'Exercise',
        readTime: '5 min read',
        likes: 356,
        isLiked: false
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
            <Card key={article.id} className="glass-light border-primary/10 hover:shadow-md transition-smooth overflow-hidden group">
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

      <MobileBottomNav role={role} />
    </div>
  );
};

export default HealthFeed;