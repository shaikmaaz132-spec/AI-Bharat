'use client';

import { useEffect } from 'react';

/**
 * Defensive DOM patch to prevent browser translation extensions (e.g. Google Translate)
 * from crashing React with: "NotFoundError: Failed to execute 'removeChild' on 'Node'"
 */
if (typeof window !== 'undefined' && typeof Node !== 'undefined') {
    try {
        const origRemove = Node.prototype.removeChild;
        Node.prototype.removeChild = function <T extends Node>(child: T): T {
            if (!child) return child;
            if (child.parentNode !== this) {
                try {
                    if (child.parentNode) {
                        return child.parentNode.removeChild(child) as T;
                    }
                } catch {
                    // ignore
                }
                return child;
            }
            try {
                return origRemove.apply(this, [child]) as T;
            } catch {
                return child;
            }
        };

        const origInsert = Node.prototype.insertBefore;
        Node.prototype.insertBefore = function <T extends Node>(newNode: T, refNode: Node | null): T {
            if (refNode && refNode.parentNode !== this) {
                try {
                    if (refNode.parentNode) {
                        return refNode.parentNode.insertBefore(newNode, refNode) as T;
                    }
                } catch {
                    // ignore
                }
                return newNode;
            }
            try {
                return origInsert.apply(this, [newNode, refNode]) as T;
            } catch {
                return newNode;
            }
        };

        const origReplace = Node.prototype.replaceChild;
        Node.prototype.replaceChild = function <T extends Node>(newChild: Node, oldChild: T): T {
            if (oldChild && oldChild.parentNode !== this) {
                try {
                    if (oldChild.parentNode) {
                        return oldChild.parentNode.replaceChild(newChild, oldChild) as T;
                    }
                } catch {
                    // ignore
                }
                return oldChild;
            }
            try {
                return origReplace.apply(this, [newChild, oldChild]) as T;
            } catch {
                return oldChild;
            }
        };
    } catch {
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

export function resetToEnglish() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    const expire = 'expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    const host = window.location.hostname;
    document.cookie = `googtrans=; ${expire}`;
    document.cookie = `googtrans=; ${expire} domain=${host};`;
    document.cookie = `googtrans=; ${expire} domain=.${host};`;
    window.location.reload();
}

