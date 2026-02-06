// components/BlocksRenderer.tsx
// Renders Strapi Blocks (Rich Text) content
"use client";

import React from "react";

interface Block {
  type: string;
  children?: Block[];
  text?: string;
  level?: number;
  url?: string;
  alt?: string;
  language?: string;
  [key: string]: any;
}

interface BlocksRendererProps {
  blocks: Block[];
  className?: string;
}

const BlocksRenderer: React.FC<BlocksRendererProps> = ({ blocks, className = "" }) => {
  if (!blocks || !Array.isArray(blocks)) {
    console.warn("BlocksRenderer: blocks is not an array", blocks);
    return <div className={className}>No content available</div>;
  }

  return (
    <div className={className}>
      {blocks.map((block, index) => (
        <BlockComponent key={index} block={block} />
      ))}
    </div>
  );
};

const BlockComponent: React.FC<{ block: Block }> = ({ block }) => {
  if (!block || typeof block !== "object") {
    return null;
  }

  const { type, children, text, level, url, alt, language } = block;

  // Text node - leaf node
  if (type === "text") {
    return <>{text || ""}</>;
  }

  // Paragraph
  if (type === "paragraph") {
    if (!children || !Array.isArray(children)) {
      return <br />;
    }
    const content = children.map((child, idx) => (
      <BlockComponent key={idx} block={child} />
    ));
    return <p className="mb-4">{content}</p>;
  }

  // Headings
  if (type === "heading") {
    if (!children || !Array.isArray(children)) {
      return null;
    }
    const headingLevel = Math.min(level || 1, 6);
    const HeadingTag = `h${headingLevel}` as keyof JSX.IntrinsicElements;
    const content = children.map((child, idx) => (
      <BlockComponent key={idx} block={child} />
    ));
    return (
      <HeadingTag className={`mb-4 mt-6 font-bold ${getHeadingClass(headingLevel)}`}>
        {content}
      </HeadingTag>
    );
  }

  // Lists
  if (type === "list") {
    if (!children || !Array.isArray(children)) {
      return null;
    }
    const ListTag = block.format === "ordered" ? "ol" : "ul";
    const listItems = children.map((item, idx) => (
      <li key={idx} className="mb-2 ml-4">
        {item.children && item.children.map((child, cIdx) => (
          <BlockComponent key={cIdx} block={child} />
        ))}
      </li>
    ));
    return <ListTag className="mb-4 list-disc">{listItems}</ListTag>;
  }

  // List item
  if (type === "list-item") {
    if (!children || !Array.isArray(children)) {
      return null;
    }
    return (
      <>
        {children.map((child, idx) => (
          <BlockComponent key={idx} block={child} />
        ))}
      </>
    );
  }

  // Links
  if (type === "link") {
    if (!children || !Array.isArray(children)) {
      return null;
    }
    const content = children.map((child, idx) => (
      <BlockComponent key={idx} block={child} />
    ));
    return (
      <a
        href={url || "#"}
        target={url?.startsWith("http") ? "_blank" : undefined}
        rel={url?.startsWith("http") ? "noopener noreferrer" : undefined}
        className="text-purple-400 hover:underline"
      >
        {content}
      </a>
    );
  }

  // Bold
  if (type === "bold" || type === "strong") {
    if (!children || !Array.isArray(children)) {
      return null;
    }
    const content = children.map((child, idx) => (
      <BlockComponent key={idx} block={child} />
    ));
    return <strong>{content}</strong>;
  }

  // Italic
  if (type === "italic" || type === "emphasis") {
    if (!children || !Array.isArray(children)) {
      return null;
    }
    const content = children.map((child, idx) => (
      <BlockComponent key={idx} block={child} />
    ));
    return <em>{content}</em>;
  }

  // Blockquote
  if (type === "blockquote" || type === "quote") {
    if (!children || !Array.isArray(children)) {
      return null;
    }
    const content = children.map((child, idx) => (
      <BlockComponent key={idx} block={child} />
    ));
    return (
      <blockquote className="border-l-4 border-purple-500 pl-4 my-4 italic">
        {content}
      </blockquote>
    );
  }

  // Code blocks
  if (type === "code") {
    if (!children || !Array.isArray(children)) {
      return null;
    }
    const codeText = children
      .map((child) => (child.type === "text" ? child.text : ""))
      .join("");
    return (
      <pre className="bg-gray-800 p-4 rounded my-4 overflow-x-auto">
        <code className={language ? `language-${language}` : ""}>{codeText}</code>
      </pre>
    );
  }

  // Inline code
  if (type === "code-inline" || type === "inlineCode") {
    if (!children || !Array.isArray(children)) {
      return null;
    }
    const codeText = children
      .map((child) => (child.type === "text" ? child.text : ""))
      .join("");
    return <code className="bg-gray-800 px-2 py-1 rounded">{codeText}</code>;
  }

  // Images
  if (type === "image") {
    return (
      <img
        src={url || ""}
        alt={alt || ""}
        className="max-w-full h-auto my-4 rounded"
      />
    );
  }

  // Horizontal rule
  if (type === "hr" || type === "horizontal-rule") {
    return <hr className="my-6 border-gray-700" />;
  }

  // Default: try to render children if they exist
  if (children && Array.isArray(children)) {
    return (
      <>
        {children.map((child, idx) => (
          <BlockComponent key={idx} block={child} />
        ))}
      </>
    );
  }

  // Unknown block type - log and return nothing
  console.warn("BlocksRenderer: Unknown block type:", type, block);
  return null;
};

function getHeadingClass(level: number): string {
  const classes: Record<number, string> = {
    1: "text-4xl",
    2: "text-3xl",
    3: "text-2xl",
    4: "text-xl",
    5: "text-lg",
    6: "text-base",
  };
  return classes[level] || "text-xl";
}

export default BlocksRenderer;
