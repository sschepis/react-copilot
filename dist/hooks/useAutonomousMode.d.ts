import { UseAutonomousModeReturn } from '../utils/types';
/**
 * Hook for managing autonomous mode
 *
 * @param requirements - Optional array of requirements to override context
 * @returns Object with autonomous mode state and control methods
 */
export declare function useAutonomousMode(requirements?: string | string[]): UseAutonomousModeReturn;
