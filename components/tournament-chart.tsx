"use client"

import { useEffect, useRef } from 'react';
import { TournamentProgress } from '@/lib/tournament-service';

interface TournamentChartProps {
  progress: TournamentProgress | null;
  hostBet: 'LONG' | 'SHORT';
  guestBet: 'LONG' | 'SHORT';
  timeRemaining: number;
  duration: number;
}

export function TournamentChart({ 
  progress, 
  hostBet, 
  guestBet, 
  timeRemaining, 
  duration 
}: TournamentChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progressHistoryRef = useRef<TournamentProgress[]>([]);

  // Add current progress to history
  useEffect(() => {
    if (progress) {
      progressHistoryRef.current.push(progress);
      
      // Keep only last 60 data points (1 minute at 1-second intervals)
      if (progressHistoryRef.current.length > 60) {
        progressHistoryRef.current.shift();
      }
    }
  }, [progress]);

  // Draw chart
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || progressHistoryRef.current.length === 0) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Find min and max values for scaling (using percentage changes)
    let minValue = Infinity;
    let maxValue = -Infinity;

    progressHistoryRef.current.forEach(p => {
      minValue = Math.min(minValue, p.hostSquad.percentageChange, p.guestSquad.percentageChange);
      maxValue = Math.max(maxValue, p.hostSquad.percentageChange, p.guestSquad.percentageChange);
    });

    // Add some padding to the range
    const range = maxValue - minValue;
    const paddingValue = range * 0.1;
    minValue -= paddingValue;
    maxValue += paddingValue;

    // Helper function to convert percentage change to y coordinate
    const valueToY = (percentageChange: number) => {
      return height - padding - ((percentageChange - minValue) / (maxValue - minValue)) * (height - 2 * padding);
    };

    // Helper function to convert time to x coordinate
    const timeToX = (timestamp: number) => {
      const startTime = progressHistoryRef.current[0].timestamp;
      const endTime = progressHistoryRef.current[progressHistoryRef.current.length - 1].timestamp;
      const timeRange = endTime - startTime;
      return padding + ((timestamp - startTime) / timeRange) * (width - 2 * padding);
    };

    // Draw grid lines
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);

    // Horizontal grid lines
    const gridLines = 5;
    for (let i = 0; i <= gridLines; i++) {
      const y = padding + (i / gridLines) * (height - 2 * padding);
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Vertical grid lines
    for (let i = 0; i <= gridLines; i++) {
      const x = padding + (i / gridLines) * (width - 2 * padding);
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      ctx.stroke();
    }

    ctx.setLineDash([]);

    // Draw host squad line
    if (progressHistoryRef.current.length > 1) {
      ctx.strokeStyle = hostBet === 'LONG' ? '#10B981' : '#EF4444';
      ctx.lineWidth = 3;
      ctx.beginPath();

      progressHistoryRef.current.forEach((p, index) => {
        const x = timeToX(p.timestamp);
        const y = valueToY(p.hostSquad.percentageChange);
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();

      // Draw host squad points
      ctx.fillStyle = hostBet === 'LONG' ? '#10B981' : '#EF4444';
      progressHistoryRef.current.forEach(p => {
        const x = timeToX(p.timestamp);
        const y = valueToY(p.hostSquad.percentageChange);
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
      });
    }

    // Draw guest squad line
    if (progressHistoryRef.current.length > 1) {
      ctx.strokeStyle = guestBet === 'LONG' ? '#3B82F6' : '#F59E0B';
      ctx.lineWidth = 3;
      ctx.beginPath();

      progressHistoryRef.current.forEach((p, index) => {
        const x = timeToX(p.timestamp);
        const y = valueToY(p.guestSquad.percentageChange);
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();

      // Draw guest squad points
      ctx.fillStyle = guestBet === 'LONG' ? '#3B82F6' : '#F59E0B';
      progressHistoryRef.current.forEach(p => {
        const x = timeToX(p.timestamp);
        const y = valueToY(p.guestSquad.percentageChange);
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
      });
    }

    // Draw current values
    if (progress) {
      ctx.font = '14px Arial';
      ctx.textAlign = 'left';
      
      // Host percentage change
      ctx.fillStyle = hostBet === 'LONG' ? '#10B981' : '#EF4444';
      ctx.fillText(
        `Host (${hostBet}): ${progress.hostSquad.percentageChange.toFixed(3)}%`,
        10,
        25
      );
      
      // Guest percentage change
      ctx.fillStyle = guestBet === 'LONG' ? '#3B82F6' : '#F59E0B';
      ctx.fillText(
        `Guest (${guestBet}): ${progress.guestSquad.percentageChange.toFixed(3)}%`,
        10,
        45
      );

      // Time remaining
      ctx.fillStyle = '#FFFFFF';
      const timeRemainingSeconds = Math.ceil(timeRemaining / 1000);
      ctx.fillText(
        `Time: ${timeRemainingSeconds}s`,
        10,
        65
      );
    }

  }, [progress, hostBet, guestBet, timeRemaining, duration]);

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h3 className="text-white font-semibold mb-4 text-center">Squad Value Progress</h3>
      <canvas
        ref={canvasRef}
        width={600}
        height={300}
        className="w-full h-auto bg-gray-900 rounded border border-gray-600"
      />
      <div className="mt-4 flex justify-center space-x-8 text-sm">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${hostBet === 'LONG' ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-gray-300">Host ({hostBet})</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${guestBet === 'LONG' ? 'bg-blue-500' : 'bg-yellow-500'}`}></div>
          <span className="text-gray-300">Guest ({guestBet})</span>
        </div>
      </div>
    </div>
  );
} 