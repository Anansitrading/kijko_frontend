// Integration Search Component
// Setting Sprint 6: Integrations

import React from 'react';
import { Search } from 'lucide-react';
import type { IntegrationSearchProps, IntegrationCategory } from '../../../types/settings';
import { INTEGRATION_CATEGORIES } from '../../../types/settings';
import { tw } from '../../../styles/settings';

const categories: { value: IntegrationCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All Categories' },
  ...Object.entries(INTEGRATION_CATEGORIES).map(([value, label]) => ({
    value: value as IntegrationCategory,
    label,
  })),
];

export function IntegrationSearch({
  searchQuery,
  selectedCategory,
  onSearchChange,
  onCategoryChange,
}: IntegrationSearchProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search integrations..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className={`${tw.input} pl-10`}
        />
      </div>

      {/* Category Filter */}
      <select
        value={selectedCategory}
        onChange={(e) => onCategoryChange(e.target.value as IntegrationCategory | 'all')}
        className={`${tw.dropdown} min-w-[180px]`}
      >
        {categories.map((category) => (
          <option key={category.value} value={category.value} className={tw.dropdownOption}>
            {category.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default IntegrationSearch;
