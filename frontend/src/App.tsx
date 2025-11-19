import { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const response = await axios.get(`${apiUrl}/api/health`);
        if (response.data.status === 'ok' && response.data.database === 'connected') {
          setIsConnected(true);
        }
      } catch (error) {
        console.error('Connection check failed:', error);
        setIsConnected(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkConnection();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-800 mb-8">
          Hello World
        </h1>
        {!isLoading && isConnected && (
          <p className="text-2xl font-semibold text-green-600">
            Connected
          </p>
        )}
        {!isLoading && !isConnected && (
          <p className="text-2xl font-semibold text-red-600">
            Not Connected
          </p>
        )}
        {isLoading && (
          <p className="text-2xl font-semibold text-gray-500">
            Checking connection...
          </p>
        )}
      </div>
    </div>
  );
}

export default App;
