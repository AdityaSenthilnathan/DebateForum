// components/DropdownMenu.tsx
import React, { useState, ReactNode } from 'react';

export const DropdownMenu = ({ children }: { children: React.ReactElement | React.ReactElement[] }) => {
  const [show, setShow] = useState(false);

  const handleToggle = () => {
    setShow(!show);
  };

  return (
    <div className="relative inline-block text-left">
      {React.Children.map(children, (child: React.ReactElement) => {
        if (React.isValidElement(child) && child.type === DropdownMenuTrigger) {
          return React.cloneElement(child as React.ReactElement<DropdownMenuTriggerProps>, { onClick: handleToggle });
        }
        if (React.isValidElement(child) && child.type === DropdownMenuContent) {
          return React.cloneElement(child as React.ReactElement<DropdownMenuContentProps>, { show });
        }
        return child;
      })}
    </div>
  );
};

interface DropdownMenuTriggerProps {
  children: ReactNode;
  onClick: () => void;
}

export const DropdownMenuTrigger = ({ children, onClick }: DropdownMenuTriggerProps) => {
  return (
    <button onClick={onClick} className="inline-flex justify-center rounded-md p-1 text-gray-700 hover:bg-gray-100 focus:outline-none">
      {children}
    </button>
  );
};

interface DropdownMenuContentProps {
  children: ReactNode;
  show: boolean;
}

export const DropdownMenuContent = ({ children, show }: DropdownMenuContentProps) => {
  return (
    show && (
      <div className="origin-top-right absolute right-0 mt-2 w-32 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
        <div className="py-1">
          {children}
        </div>
      </div>
    )
  );
};

interface DropdownMenuItemProps {
  children: ReactNode;
  onClick: () => void;
}

export const DropdownMenuItem = ({ children, onClick }: DropdownMenuItemProps) => {
  return (
    <button onClick={onClick} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left">
      {children}
    </button>
  );
};