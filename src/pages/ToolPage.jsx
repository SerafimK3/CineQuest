import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Sparkles, Dice5, Film, ArrowRight, Shuffle, Heart, Clock, Moon } from 'lucide-react';

// Tool configurations
const TOOLS = {
  'random-movie-generator': {
    title: 'Free Random Movie Generator',
    description: 'Can\'t decide what to watch? Let fate choose! Our random movie generator picks from thousands of highly-rated films.',
    prompt: '',
    icon: Dice5,
    color: 'from-purple-500 to-pink-600',
  },
  'movie-picker-wheel': {
    title: 'Movie Picker Wheel',
    description: 'Spin the wheel and let AI pick your next movie. No more endless scrolling through streaming apps.',
    prompt: '',
    icon: Shuffle,
    color: 'from-cyan-500 to-blue-600',
  },
  'what-to-watch-tonight': {
    title: 'What Should I Watch Tonight?',
    description: 'Tell us your mood, and we\'ll find the perfect movie for your evening. Quick, easy, and personalized.',
    prompt: 'Suggest something easy to watch tonight',
    icon: Moon,
    color: 'from-indigo-500 to-purple-600',
  },
  'date-night-picker': {
    title: 'Date Night Movie Picker',
    description: 'Find the perfect movie for date night. Romantic but not too cheesy, engaging but not too intense.',
    prompt: 'Perfect date night movie - romantic but not too cheesy',
    icon: Heart,
    color: 'from-pink-500 to-red-600',
  },
  'quick-movie-picker': {
    title: 'Quick Movie Picker',
    description: 'Short on time? Get a movie recommendation in seconds. No sign-up, no ads, just answers.',
    prompt: '',
    icon: Clock,
    color: 'from-green-500 to-teal-600',
  },
};

// Parse slug to get tool config
const getToolConfig = (slug) => {
  return TOOLS[slug] || {
    title: 'Movie Picker Tool',
    description: 'Let AI help you decide what to watch next.',
    prompt: '',
    icon: Film,
    color: 'from-gray-500 to-gray-700',
  };
};

const ToolPage = () => {
  const { slug } = useParams();
  const tool = getToolConfig(slug);
  const IconComponent = tool.icon;
  
  const metaDescription = tool.description;

  return (
    <>
      <Helmet>
        <title>{tool.title} | CineQuest AI</title>
        <meta name="description" content={metaDescription} />
        <meta property="og:title" content={tool.title} />
        <meta property="og:description" content={metaDescription} />
        <link rel="canonical" href={`https://cinequest.app/tools/${slug}`} />
      </Helmet>

      <div className="min-h-screen bg-black text-white font-sans flex flex-col">
        {/* Hero Section */}
        <div className="flex-1 flex items-center justify-center p-4 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 z-0">
            <div className={`absolute top-1/4 left-1/4 w-96 h-96 bg-linear-to-br ${tool.color} rounded-full blur-[120px] opacity-30`} />
            <div className={`absolute bottom-1/4 right-1/4 w-80 h-80 bg-linear-to-br ${tool.color} rounded-full blur-[100px] opacity-20`} />
          </div>

          <div className="relative z-10 text-center max-w-2xl mx-auto">
            {/* Icon */}
            <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full bg-linear-to-br ${tool.color} mb-8 shadow-2xl`}>
              <IconComponent size={48} className="text-white" />
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-6xl font-black mb-6 text-transparent bg-clip-text bg-linear-to-r from-white to-gray-400">
              {tool.title}
            </h1>

            {/* Description */}
            <p className="text-gray-400 text-lg md:text-xl mb-10 leading-relaxed">
              {tool.description}
            </p>

            {/* CTA Button */}
            <Link 
              to="/"
              state={{ prefilledPrompt: tool.prompt }}
              className={`inline-flex items-center gap-3 bg-linear-to-r ${tool.color} text-white font-black text-xl px-10 py-5 rounded-full hover:scale-105 transition-transform shadow-2xl`}
            >
              <Sparkles size={28} />
              Start Picking
              <ArrowRight size={24} />
            </Link>

            {/* Trust indicators */}
            <div className="mt-12 flex flex-wrap justify-center gap-6 text-gray-500 text-sm">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                No sign-up required
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                100% free
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                AI-powered
              </span>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="container mx-auto px-4 py-16 border-t border-gray-800">
          <h2 className="text-2xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-accent">
                1
              </div>
              <h3 className="font-bold mb-2">Tell Us Your Vibe</h3>
              <p className="text-gray-500 text-sm">Select your mood, preferred era, and how much time you have.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-accent">
                2
              </div>
              <h3 className="font-bold mb-2">AI Finds Your Match</h3>
              <p className="text-gray-500 text-sm">Our AI analyzes thousands of movies to find your perfect pick.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-accent">
                3
              </div>
              <h3 className="font-bold mb-2">Start Watching</h3>
              <p className="text-gray-500 text-sm">See where it's streaming in your region and start watching.</p>
            </div>
          </div>
        </div>

        {/* SEO Content */}
        <div className="container mx-auto px-4 py-12 border-t border-gray-800">
          <div className="max-w-3xl mx-auto text-gray-400 text-sm leading-relaxed">
            <h2 className="text-xl font-bold text-white mb-4">Why Use a Movie Picker?</h2>
            <p className="mb-4">
              The average person spends 23 minutes deciding what to watch. That's almost half a sitcom episode wasted on scrolling! 
              Our {tool.title.toLowerCase()} eliminates decision fatigue by using AI to match your mood with the perfect movie.
            </p>
            <p>
              Unlike generic recommendation engines, CineQuest considers your current mood, available time, and streaming 
              services to give you one perfect recommendation—not a list of 50 options.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default ToolPage;
