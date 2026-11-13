'use client';

import { useEffect } from 'react';

/**
 * Defensive DOM patch to prevent browser translation extensions (e.g. Google Translate)
 * from crashing React with: "NotFoundError: Failed to execute 'removeChild' on 'Node'"
 */
if (typeof window !== 'undefined') {
  try {
    const origRemove = Node.prototype.removeChild;
    Node.prototype.removeChild = function <T extends Node>(child: T): T {
      if (child && child.parentNode !== this) {
        return child;
      }
      return origRemove.apply(this, [child]) as T;
    };

    const origInsert = Node.prototype.insertBefore;
    Node.prototype.insertBefore = function <T extends Node>(newNode: T, refNode: Node | null): T {
      if (refNode && refNode.parentNode !== this) {
        return newNode;
      }
      return origInsert.apply(this, [newNode, refNode]) as T;
    };

    const origReplace = Node.prototype.replaceChild;
    Node.prototype.replaceChild = function <T extends Node>(newChild: Node, oldChild: T): T {
      if (oldChild && oldChild.parentNode !== this) {
        return oldChild;
      }
      return origReplace.apply(this, [newChild, oldChild]) as T;
    };
  } catch (err) {
    // Silent fail-safe
  }
}

export function GoogleTranslateFix() {
  useEffect(() => {
    // Ensure translate="no" on root document
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('translate', 'no');
      document.documentElement.classList.add('notranslate');
      document.body?.setAttribute('translate', 'no');
      document.body?.classList.add('notranslate');
    }
  }, []);

  return null;
}
