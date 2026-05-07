
import React from 'react';
import { GamePhase } from '@/utils/gameLogic';

interface PhaseIndicatorProps {
  currentPhase: GamePhase;
}

const PhaseIndicator: React.FC<PhaseIndicatorProps> = ({ currentPhase }) => {
  return (
    <div className="flex items-center justify-center mb-4">
      <div className="flex items-center bg-secondary px-3 py-1 rounded-full">
        <span className="text-xs mr-2">Fase:</span>
        <div className={`phase-indicator ${currentPhase > GamePhase.PHASE_1 ? 'phase-completed' : currentPhase === GamePhase.PHASE_1 ? 'phase-active' : 'phase-pending'}`}></div>
        <div className={`phase-indicator ${currentPhase > GamePhase.PHASE_2 ? 'phase-completed' : currentPhase === GamePhase.PHASE_2 ? 'phase-active' : 'phase-pending'}`}></div>
        <div className={`phase-indicator ${currentPhase > GamePhase.PHASE_3 ? 'phase-completed' : currentPhase === GamePhase.PHASE_3 ? 'phase-active' : 'phase-pending'}`}></div>
      </div>
    </div>
  );
};

export default PhaseIndicator;
