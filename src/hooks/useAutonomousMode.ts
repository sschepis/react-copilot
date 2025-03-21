import { useState, useEffect, useCallback } from 'react';
import { nanoid } from 'nanoid';
import { AutonomousTask, UseAutonomousModeReturn } from '../utils/types';
import { useLLMContext } from '../context/LLMContext';
import { useComponentContext } from '../context/ComponentContext';
import { useLLM } from './useLLM';

/**
 * Hook for managing autonomous mode
 * 
 * @param requirements - Optional array of requirements to override context
 * @returns Object with autonomous mode state and control methods
 */
export function useAutonomousMode(
  requirements?: string | string[]
): UseAutonomousModeReturn {
  const { autonomousConfig } = useLLMContext();
  const { components } = useComponentContext();
  const { sendMessage } = useLLM();
  
  // State for autonomous mode
  const [isEnabled, setIsEnabled] = useState<boolean>(autonomousConfig.enabled);
  const [status, setStatus] = useState<'idle' | 'running' | 'paused' | 'completed'>('idle');
  const [tasks, setTasks] = useState<AutonomousTask[]>([]);
  
  // Use provided requirements or fall back to config
  const effectiveRequirements = requirements || autonomousConfig.requirements;
  
  // Parse requirements into tasks
  useEffect(() => {
    if (effectiveRequirements && effectiveRequirements.length > 0) {
      const requirementsArray = Array.isArray(effectiveRequirements) 
        ? effectiveRequirements 
        : effectiveRequirements.split('\n').filter(line => line.trim().length > 0);
      
      const newTasks: AutonomousTask[] = requirementsArray.map(req => ({
        id: nanoid(),
        description: req.trim(),
        status: 'pending'
      }));
      
      setTasks(newTasks);
    }
  }, [effectiveRequirements]);
  
  // Auto-start if configured to do so
  useEffect(() => {
    if (isEnabled && autonomousConfig.schedule === 'onMount' && status === 'idle' && tasks.length > 0) {
      setStatus('running');
      processNextTask();
    }
  }, [isEnabled, status, tasks, autonomousConfig.schedule]);
  
  // Process the next pending task
  const processNextTask = useCallback(async () => {
    // Find the next pending task
    const nextTask = tasks.find(task => task.status === 'pending');
    if (!nextTask) {
      setStatus('completed');
      return;
    }
    
    // Update task status to in progress
    setTasks(prev => prev.map(task => 
      task.id === nextTask.id ? { ...task, status: 'inProgress' } : task
    ));
    
    try {
      // Create a prompt for the LLM with context about the app
      const componentsList = Object.values(components).map(c => ({
        id: c.id,
        name: c.name,
      }));
      
      const prompt = `Autonomous mode task: ${nextTask.description}
        
Available components: ${JSON.stringify(componentsList)}

Please implement this change. Respond with:
1. A description of what you're going to change
2. The code changes needed
3. An explanation of how the changes address the requirement`;
      
      // Send the task to the LLM
      const response = await sendMessage(prompt);
      
      // Mark task as completed
      setTasks(prev => prev.map(task => 
        task.id === nextTask.id 
          ? { ...task, status: 'completed', result: response.content } 
          : task
      ));
      
      // Process the next task
      processNextTask();
    } catch (error) {
      console.error('Error processing autonomous task:', error);
      
      // Mark task as failed
      setTasks(prev => prev.map(task => 
        task.id === nextTask.id 
          ? { 
              ...task, 
              status: 'failed', 
              error: error instanceof Error ? error.message : 'Unknown error' 
            } 
          : task
      ));
      
      // Pause autonomous mode
      setStatus('paused');
    }
  }, [tasks, components, sendMessage]);
  
  // Start autonomous mode
  const startAutonomousMode = useCallback(async () => {
    setIsEnabled(true);
    setStatus('running');
    processNextTask();
  }, [processNextTask]);
  
  // Stop autonomous mode
  const stopAutonomousMode = useCallback(() => {
    setStatus('paused');
  }, []);
  
  return {
    isEnabled,
    tasks,
    startAutonomousMode,
    stopAutonomousMode,
    status
  };
}
