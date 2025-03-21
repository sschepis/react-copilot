import React, { useState } from 'react';
import { LLMProvider } from '../../../src/components/LLMProvider';
import { ModifiableApp } from '../../../src/components/ModifiableApp';
import { ModifiableComponent } from '../../../src/components/ModifiableComponent';
import './DebugExample.css';

// Define a few simple components to demonstrate the debug panel
const Counter: React.FC = () => {
  const [count, setCount] = useState(0);
  
  return (
    <div className="counter">
      <h2>Counter Component</h2>
      <p>Current count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      <button onClick={() => setCount(count - 1)}>Decrement</button>
    </div>
  );
};

const UserProfile: React.FC<{ name: string; role: string; avatar?: string }> = ({ 
  name, 
  role, 
  avatar 
}) => {
  return (
    <div className="user-profile">
      <h2>User Profile Component</h2>
      {avatar && <img src={avatar} alt={`${name}'s avatar`} className="avatar" />}
      <div className="user-info">
        <h3>{name}</h3>
        <p>Role: {role}</p>
      </div>
    </div>
  );
};

const TodoItem: React.FC<{ text: string; completed: boolean; onToggle: () => void }> = ({ 
  text, 
  completed, 
  onToggle 
}) => {
  return (
    <div className={`todo-item ${completed ? 'completed' : ''}`} onClick={onToggle}>
      <input type="checkbox" checked={completed} readOnly />
      <span>{text}</span>
    </div>
  );
};

const TodoList: React.FC = () => {
  const [todos, setTodos] = useState([
    { id: 1, text: 'Learn React', completed: true },
    { id: 2, text: 'Build an app', completed: false },
    { id: 3, text: 'Deploy to production', completed: false },
  ]);
  
  const toggleTodo = (id: number) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };
  
  return (
    <div className="todo-list">
      <h2>Todo List Component</h2>
      {todos.map(todo => (
        <TodoItem 
          key={todo.id}
          text={todo.text}
          completed={todo.completed}
          onToggle={() => toggleTodo(todo.id)}
        />
      ))}
    </div>
  );
};

// Main example component
export const DebugExample: React.FC = () => {
  return (
    <LLMProvider config={{ provider: 'openai', model: 'gpt-3.5-turbo' }}>
      <ModifiableApp debug={{ initialVisible: true, position: 'bottom-right' }}>
        <div className="debug-example">
          <h1>Debug Panel Example</h1>
          <p>Inspect components using the debug panel in the bottom right corner (or press Alt+D)</p>
          
          <div className="components-grid">
            <ModifiableComponent name="CounterComponent">
              <Counter />
            </ModifiableComponent>
            
            <ModifiableComponent name="UserProfileComponent">
              <UserProfile 
                name="Jane Smith" 
                role="Software Engineer"
                avatar="https://i.pravatar.cc/100?u=jane" 
              />
            </ModifiableComponent>
            
            <ModifiableComponent name="TodoListComponent">
              <TodoList />
            </ModifiableComponent>
          </div>
        </div>
      </ModifiableApp>
    </LLMProvider>
  );
};