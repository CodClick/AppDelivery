import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import { useToast } from '../hooks/use-toast';

interface MultiSelectProps {
  children: React.ReactNode;
  value: string[];
  onChange: (value: string[]) => void;
  className?: string;
}

const MultiSelect = ({ children, value, onChange, className }: MultiSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleItem = (itemValue: string) => {
    if (value.includes(itemValue)) {
      onChange(value.filter(v => v !== itemValue));
    } else {
      onChange([...value, itemValue]);
    }
  };

  const selectedLabels = React.Children.map(children, child => {
    if (React.isValidElement(child) && child.type === MultiSelectItem) {
      if (value.includes(child.props.value)) {
        return child.props.children;
      }
    }
    return null;
  }).filter(Boolean);

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <button
        type="button"
        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>
          {selectedLabels.length > 0 ? selectedLabels.join(', ') : "Selecione..."}
        </span>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </button>
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 border rounded-md shadow-lg bg-background">
          {React.Children.map(children, child => {
            if (React.isValidElement(child) && child.type === MultiSelectItem) {
              const isSelected = value.includes(child.props.value);
              return (
                <div
                  key={child.props.value}
                  className="relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                  onClick={() => toggleItem(child.props.value)}
                >
                  <span
                    className={cn(
                      "absolute left-2 flex h-3.5 w-3.5 items-center justify-center rounded-sm border border-primary",
                      isSelected ? "bg-primary text-primary-foreground" : "opacity-0"
                    )}
                  >
                    <Check className="h-4 w-4" />
                  </span>
                  {child.props.children}
                </div>
              );
            }
            return child;
          })}
        </div>
      )}
    </div>
  );
};

interface MultiSelectItemProps {
  value: string;
  children: React.ReactNode;
}

const MultiSelectItem = ({ value, children }: MultiSelectItemProps) => {
  return <>{children}</>;
};

const MultiSelectLabel = ({ children }: { children: React.ReactNode }) => {
  return <div className="p-2 font-semibold">{children}</div>;
};

export { MultiSelect, MultiSelectItem, MultiSelectLabel };
