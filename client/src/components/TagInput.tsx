import { useState, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
}

export function TagInput({ tags, onChange, placeholder = 'Add tags...', maxTags = 10 }: TagInputProps) {
  const [inputValue, setInputValue] = useState('');

  const handleAddTag = () => {
    const tag = inputValue.trim().toLowerCase();
    if (tag && !tags.includes(tag) && tags.length < maxTags) {
      onChange([...tags, tag]);
      setInputValue('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onChange(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      handleRemoveTag(tags[tags.length - 1]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 min-h-10 p-2 border rounded-lg">
        {tags.map(tag => (
          <Badge
            key={tag}
            variant="secondary"
            className="px-3 py-1.5 flex items-center gap-1.5"
          >
            {tag}
            <button
              type="button"
              onClick={() => handleRemoveTag(tag)}
              className="ml-1 hover:bg-muted rounded-full p-0.5 cursor-pointer"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleAddTag}
          placeholder={tags.length === 0 ? placeholder : 'Add another tag...'}
          className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 flex-1 min-w-[120px]"
        />
      </div>
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>Press Enter to add tags</span>
        <span>{tags.length}/{maxTags}</span>
      </div>
    </div>
  );
}