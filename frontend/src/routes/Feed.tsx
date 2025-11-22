import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FullScreenLayout } from '../components/FullScreenLayout';
import { CommunityFeed } from '../components/CommunityFeed';
import { CreatePostModal } from '../components/CreatePostModal';
import { useAuth } from '../hooks/useAuth';

export const Feed = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
  }, [isAuthenticated, navigate]);

  const handleCreatePost = () => {
    setShowCreateModal(true);
  };

  const handlePostCreated = () => {
    // Trigger feed refresh
    setRefreshTrigger(prev => prev + 1);
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
        refreshTrigger={refreshTrigger}
      />

      <CreatePostModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onPostCreated={handlePostCreated}
      />
    </FullScreenLayout>
  );
};




