import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useAuth() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        // Here you would fetch or set the user's data from your `empresas` table
        // For now, we'll mock it
        setCurrentUser({ 
          id: session.user.id,
          email: session.user.email,
          empresaId: "d2111847-f0ed-467d-a0b4-4ca31feaa7b4" // Mocked empresaId
        });
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return { currentUser, loading };
}
