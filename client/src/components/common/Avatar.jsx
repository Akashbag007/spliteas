import React from 'react';

export const Avatar = ({
  src,
  name = 'User',
  size = 'md',
  className = '',
}) => {
  const sizes = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  const getInitials = (n) => {
    if (!n) return 'U';
    const parts = n.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return n.slice(0, 2).toUpperCase();
  };

  // Generate deterministic gentle background color based on name
  const colors = [
    'bg-emerald-600 text-white',
    'bg-blue-600 text-white',
    'bg-indigo-600 text-white',
    'bg-violet-600 text-white',
    'bg-amber-600 text-white',
    'bg-rose-600 text-white',
    'bg-teal-600 text-white',
  ];
  let charSum = 0;
  for (let i = 0; i < (name || '').length; i++) {
    charSum += name.charCodeAt(i);
  }
  const colorClass = colors[charSum % colors.length];

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`rounded-full object-cover ring-2 ring-white shadow-xs ${sizes[size] || sizes.md} ${className}`}
        onError={(e) => {
          e.target.style.display = 'none';
        }}
      />
    );
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center font-bold tracking-tight shadow-xs select-none ${
        sizes[size] || sizes.md
      } ${colorClass} ${className}`}
      title={name}
    >
      {getInitials(name)}
    </div>
  );
};
