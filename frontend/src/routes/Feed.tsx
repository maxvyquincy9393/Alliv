import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FullScreenLayout } from '../components/FullScreenLayout';
import { CommunityFeed } from '../components/CommunityFeed';
import { useAuth } from '../hooks/useAuth';

export const Feed = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
  }, [isAuthenticated, navigate]);

  const handleCreatePost = () => {
    // Navigate to post creation or open modal
    console.log('Create post');
  };

  const handleEngagement = (postId: string, type: string) => {
    // Handle post engagement
    console.log(`Engagement: ${type} on post ${postId}`);
  };

  return (
    <FullScreenLayout>
      <CommunityFeed 
        onCreatePost={handleCreatePost}
        onEngagement={handleEngagement}
      />
    </FullScreenLayout>
  );
};




