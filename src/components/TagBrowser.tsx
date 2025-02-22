"use client";

import { useState, useCallback, useMemo } from 'react';
import { Search } from 'lucide-react';
import { ACDTag } from '@/lib/types/acd';

interface TagBrowserProps {
  tags: ACDTag[];
  onTagSelect?: (tag: ACDTag) => void;
}

export const TagBrowser = ({ tags, onTagSelect }: TagBrowserProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedScope, setSelectedScope] = useState<'All' | 'Local' | 'Global'>('All');
  const [selectedType, setSelectedType] = useState<string>('All');

  // Get unique types from tags
  const tagTypes = useMemo(() => {
    const types = new Set(tags.map(tag => tag.type));
    return ['All', ...Array.from(types)];
  }, [tags]);

  // Filter tags based on search query and filters
  const filteredTags = useMemo(() => {
    return tags.filter(tag => {
      const matchesSearch = tag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          tag.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesScope = selectedScope === 'All' || tag.scope === selectedScope;
      const matchesType = selectedType === 'All' || tag.type === selectedType;
      return matchesSearch && matchesScope && matchesType;
    });
  }, [tags, searchQuery, selectedScope, selectedType]);

  const handleTagClick = useCallback((tag: ACDTag) => {
    onTagSelect?.(tag);
  }, [onTagSelect]);

  return (
    <div className="flex flex-col gap-4 p-4 border rounded-lg bg-white dark:bg-gray-800">
      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-semibold">Tag Browser</h3>
        
        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <select
            value={selectedScope}
            onChange={(e) => setSelectedScope(e.target.value as 'All' | 'Local' | 'Global')}
            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Scopes</option>
            <option value="Local">Local</option>
            <option value="Global">Global</option>
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {tagTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tag list */}
      <div className="flex flex-col gap-2 mt-4">
        {filteredTags.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No tags found</p>
        ) : (
          filteredTags.map(tag => (
            <button
              key={tag.name}
              onClick={() => handleTagClick(tag)}
              className="flex items-center justify-between p-3 text-left border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex flex-col">
                <span className="font-medium">{tag.name}</span>
                <span className="text-sm text-gray-500">{tag.description}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {tag.type}
                </span>
                <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                  {tag.scope}
                </span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}; 