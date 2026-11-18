import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
// Translate presentation copy only; never input values, hrefs or stored statuses.
export default function WorkforceCopy({
  children
}) {
  const {
    tr
  } = useLanguage();
  const walk = node => {
    if (typeof node === 'string') return tr(node);
    if (Array.isArray(node)) return React.Children.map(node, walk);
    if (!React.isValidElement(node)) return node;
    const props = {};
    for (const key of ['label', 'title', 'placeholder', 'aria-label', 'data-label', 'error']) if (typeof node.props[key] === 'string') props[key] = tr(node.props[key]);
    if (node.props.children !== undefined) props.children = walk(node.props.children);
    return React.cloneElement(node, props);
  };
  return <>{walk(children)}</>;
}
