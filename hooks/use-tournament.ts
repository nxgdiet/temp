import { useState, useEffect, useRef, useCallback } from 'react';
import { tournamentService, TournamentProgress, TournamentResult, SquadValue } from '@/lib/tournament-service';

interface UseTournamentProps {
  hostPlayers: any[];
  guestPlayers: any[];
  roomBet: 'LONG' | 'SHORT'; // The bet type for the entire room (both players bet the same)
  duration: number; // in milliseconds
  onComplete: (result: TournamentResult) => void;
}

interface UseTournamentReturn {
  isRunning: boolean;
  timeRemaining: number;
  progress: TournamentProgress | null;
  result: TournamentResult | null;
  startTournament: () => void;
  stopTournament: () => void;
}

export function useTournament({
  hostPlayers,
  guestPlayers,
  roomBet,
  duration,
  onComplete
}: UseTournamentProps): UseTournamentReturn {
  const [isRunning, setIsRunning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const [progress, setProgress] = useState<TournamentProgress | null>(null);
  const [result, setResult] = useState<TournamentResult | null>(null);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const initialHostValueRef = useRef<number>(0);
  const initialGuestValueRef = useRef<number>(0);
  const progressHistoryRef = useRef<TournamentProgress[]>([]);

  const log = useCallback((message: string, type: 'INFO' | 'ERROR' | 'WARN' = 'INFO') => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${type}] [Tournament] ${message}`);
  }, []);

  const updateProgress = useCallback(async () => {
    try {
      // Fetch current prices
      const prices = await tournamentService.fetchCurrentPrices();
      
      // Set initial prices on first update (T0)
      if (initialHostValueRef.current === 0) {
        tournamentService.setInitialPrices(prices);
        log('Initial prices set for tournament');
      }
      
      // Calculate current squad values and percentage changes
      const hostSquad = tournamentService.calculateSquadValue(hostPlayers, prices);
      const guestSquad = tournamentService.calculateSquadValue(guestPlayers, prices);
      
      // Store initial values on first update
      if (initialHostValueRef.current === 0) {
        initialHostValueRef.current = hostSquad.totalValue;
        initialGuestValueRef.current = guestSquad.totalValue;
        log(`Initial values - Host: $${initialHostValueRef.current.toFixed(2)}, Guest: $${initialGuestValueRef.current.toFixed(2)}`);
      }

      const currentProgress: TournamentProgress = {
        hostSquad,
        guestSquad,
        timestamp: Date.now(),
        timeRemaining: Math.max(0, duration - (Date.now() - startTimeRef.current))
      };

      setProgress(currentProgress);
      progressHistoryRef.current.push(currentProgress);
      
      log(`Progress update - Host: ${hostSquad.percentageChange.toFixed(3)}%, Guest: ${guestSquad.percentageChange.toFixed(3)}%, Time: ${currentProgress.timeRemaining}ms`);
    } catch (error) {
      log(`Error updating progress: ${error}`, 'ERROR');
    }
  }, [hostPlayers, guestPlayers, duration, log]);

  const calculateFinalResult = useCallback((): TournamentResult => {
    const finalProgress = progressHistoryRef.current[progressHistoryRef.current.length - 1];
    if (!finalProgress) {
      throw new Error('No progress data available for result calculation');
    }

    // Use the percentage changes calculated by the tournament service
    const hostPercentageChange = finalProgress.hostSquad.percentageChange;
    const guestPercentageChange = finalProgress.guestSquad.percentageChange;

    const result = tournamentService.determineWinner(
      roomBet,
      hostPercentageChange,
      guestPercentageChange
    );

    // Set final values
    result.finalHostValue = finalProgress.hostSquad.totalValue;
    result.finalGuestValue = finalProgress.guestSquad.totalValue;

    log(`Tournament complete - Host: ${hostPercentageChange.toFixed(3)}%, Guest: ${guestPercentageChange.toFixed(3)}%, Winner: ${result.winner}`);
    
    return result;
  }, [roomBet, log]);

  const startTournament = useCallback(() => {
    log('Starting tournament...');
    
    // Reset state
    setIsRunning(true);
    setTimeRemaining(duration);
    setProgress(null);
    setResult(null);
    progressHistoryRef.current = [];
    initialHostValueRef.current = 0;
    initialGuestValueRef.current = 0;
    startTimeRef.current = Date.now();

    // Start progress updates every second
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, duration - elapsed);
      
      setTimeRemaining(remaining);
      
      // Update progress
      updateProgress();
      
      // Check if tournament is complete
      if (remaining <= 0) {
        stopTournament();
      }
    }, 1000);

    // Initial progress update
    updateProgress();
  }, [duration, updateProgress, log]);

  const stopTournament = useCallback(() => {
    log('Stopping tournament...');
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    setIsRunning(false);
    
    // Calculate final result
    try {
      const finalResult = calculateFinalResult();
      setResult(finalResult);
      onComplete(finalResult);
    } catch (error) {
      log(`Error calculating final result: ${error}`, 'ERROR');
    }
  }, [calculateFinalResult, onComplete, log]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    isRunning,
    timeRemaining,
    progress,
    result,
    startTournament,
    stopTournament
  };
} 