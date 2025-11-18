import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FullScreenLayout } from '../components/FullScreenLayout';
import { ConnectionHub } from '../components/ConnectionHub';
import { useAuth } from '../hooks/useAuth';

export const Connections = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
  }, [isAuthenticated, navigate]);

  return (
    <FullScreenLayout>
      <ConnectionHub />
    </FullScreenLayout>
  );
};




