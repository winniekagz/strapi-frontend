// Helper function to convert Strapi rich text format to markdown string
export function convertStrapiContentToMarkdown(content: any): string {
  console.log('🔍 convertStrapiContentToMarkdown called with:', {
    type: typeof content,
    isArray: Array.isArray(content),
    value: content,
  });

  // If content is already a string, return it
  if (typeof content === 'string') {
    console.log('✅ Content is already a string, returning as-is');
    return content;
  }

  // If content is an array (Strapi rich text format), convert it
  if (Array.isArray(content)) {
    console.log('🔄 Converting array with', content.length, 'items');
    const convertedBlocks = content.map((block, index) => {
      console.log(`  Processing block ${index}:`, block);
      const converted = convertBlockToMarkdown(block);
      console.log(`  Block ${index} converted to:`, converted, 'Type:', typeof converted);
      return converted;
    });
    
    console.log('🔄 All blocks converted. Results:', convertedBlocks);
    console.log('🔄 Results are all strings?', convertedBlocks.every(r => typeof r === 'string'));
    
    const result = convertedBlocks
      .filter(text => text && typeof text === 'string' && text.trim().length > 0) // Filter out empty paragraphs and ensure strings
      .join('\n\n');
    
    console.log('✅ Final converted markdown type:', typeof result);
    console.log('✅ Final converted markdown is array?', Array.isArray(result));
    console.log('✅ Final converted markdown length:', result.length);
    console.log('✅ Final converted markdown preview:', result.substring(0, 100));
    
    // CRITICAL: Ensure we return a string, never an array
    if (Array.isArray(result)) {
      console.error('❌ CRITICAL: Result is still an array! Converting to string...');
      return result.join('\n\n');
    }
    
    return result || ''; // Ensure we always return a string, never undefined
  }

  // Fallback: try to stringify if it's an object
  console.warn('⚠️ Content is neither string nor array, stringifying:', content);
  return JSON.stringify(content);
}

function convertBlockToMarkdown(block: any): string {
  console.log('  convertBlockToMarkdown called with block:', block);
  
  if (!block || typeof block !== 'object') {
    console.log('  ⚠️ Block is not an object, returning empty string');
    return '';
  }

  const { type, children, level, text } = block;
  console.log('  Block properties:', { type, hasChildren: !!children, level, text });

  // Handle text nodes - these are leaf nodes
  if (type === 'text') {
    const textValue = text || '';
    console.log('  ✅ Text node, returning:', textValue);
    return textValue;
  }

  // Handle paragraphs - most common block type
  if (type === 'paragraph') {
    if (children && Array.isArray(children)) {
      const paragraphText = children
        .map((child) => {
          const converted = convertBlockToMarkdown(child);
          return converted;
        })
        .filter(text => text.trim().length > 0) // Filter out empty text
        .join(''); // Join without spaces since text nodes handle spacing
      console.log('  ✅ Paragraph converted to:', paragraphText);
      // Return empty string if paragraph has no content (handles empty paragraphs)
      return paragraphText || '';
    }
    console.log('  ⚠️ Paragraph has no children, returning empty');
    return '';
  }

  // Handle headings
  if (type === 'heading' && level) {
    const headingLevel = '#'.repeat(Math.min(level, 6));
    if (children && Array.isArray(children)) {
      const text = children.map(convertBlockToMarkdown).join('');
      return `${headingLevel} ${text}`;
    }
    return '';
  }

  // Handle lists (basic support)
  if (type === 'list') {
    if (children && Array.isArray(children)) {
      return children
        .map((item, index) => {
          const prefix = block.ordered ? `${index + 1}.` : '-';
          const itemText = item.children
            ? item.children.map(convertBlockToMarkdown).join('')
            : '';
          return `${prefix} ${itemText}`;
        })
        .join('\n');
    }
    return '';
  }

  // Handle list items
  if (type === 'list-item') {
    if (children && Array.isArray(children)) {
      return children.map(convertBlockToMarkdown).join('');
    }
    return '';
  }

  // Handle code blocks
  if (type === 'code') {
    const codeText = children
      ? children.map(convertBlockToMarkdown).join('')
      : '';
    const language = block.language || '';
    return `\`\`\`${language}\n${codeText}\n\`\`\``;
  }

  // Handle inline code
  if (type === 'code-inline') {
    const codeText = children
      ? children.map(convertBlockToMarkdown).join('')
      : '';
    return `\`${codeText}\``;
  }

  // Handle links
  if (type === 'link') {
    const linkText = children
      ? children.map(convertBlockToMarkdown).join('')
      : '';
    const url = block.url || '#';
    return `[${linkText}](${url})`;
  }

  // Handle bold
  if (type === 'bold' || type === 'strong') {
    const text = children
      ? children.map(convertBlockToMarkdown).join('')
      : '';
    return `**${text}**`;
  }

  // Handle italic
  if (type === 'italic' || type === 'emphasis') {
    const text = children
      ? children.map(convertBlockToMarkdown).join('')
      : '';
    return `*${text}*`;
  }

  // Handle blockquotes
  if (type === 'blockquote') {
    if (children && Array.isArray(children)) {
      const text = children.map(convertBlockToMarkdown).join('\n');
      return text
        .split('\n')
        .map((line) => `> ${line}`)
        .join('\n');
    }
    return '';
  }

  // Handle horizontal rules
  if (type === 'hr' || type === 'horizontal-rule') {
    return '---';
  }

  // Handle images
  if (type === 'image') {
    const alt = block.alt || '';
    const url = block.url || block.src || '';
    return `![${alt}](${url})`;
  }

  // Default: try to extract text from children
  if (children && Array.isArray(children)) {
    return children.map(convertBlockToMarkdown).join('');
  }

  // If block has direct text property
  if (text) {
    return text;
  }

  return '';
}
