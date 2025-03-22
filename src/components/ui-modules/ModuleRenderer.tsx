import React from 'react';
import { moduleRegistry } from './ModuleRegistry';
import { useModuleVisibility } from './ModuleVisibilityContext';

/**
 * Props for the ModuleRenderer component
 */
interface ModuleRendererProps {
  modules?: string[];
}

/**
 * Component that renders all visible modules
 */
export const ModuleRenderer: React.FC<ModuleRendererProps> = ({ modules }) => {
  const { isModuleVisible } = useModuleVisibility();
  
  // Get all available modules or filter by provided module list
  const availableModules = modules
    ? moduleRegistry.filterModules(modules)
    : moduleRegistry.getAllModules();
  
  // Filter to only visible modules
  const visibleModules = availableModules.filter(module => isModuleVisible(module.id));
  
  // Render each visible module
  return (
    <>
      {visibleModules.map(module => {
        const ModuleComponent = module.component;
        
        // Check if all dependencies are satisfied before rendering
        const dependenciesSatisfied = moduleRegistry.areDependenciesSatisfied(module.id);
        
        // Skip rendering if dependencies are not satisfied
        if (!dependenciesSatisfied) {
          console.warn(`Module ${module.id} has unsatisfied dependencies and will not be rendered.`);
          return null;
        }
        
        // Render the module
        return (
          <div key={module.id} className={`ui-module ui-module-${module.id}`}>
            <ModuleComponent />
          </div>
        );
      })}
    </>
  );
};