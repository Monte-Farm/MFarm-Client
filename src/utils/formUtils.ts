import React from 'react';

/**
 * Prevents form submission when the user presses Enter inside any input
 * (except textareas and submit/button elements).
 * Add this as onKeyDown on every <form> to avoid accidental submits.
 */
export const preventEnterSubmit = (e: React.KeyboardEvent<HTMLFormElement>) => {
  const target = e.target as HTMLElement;
  if (
    e.key === 'Enter' &&
    target.tagName !== 'TEXTAREA' &&
    target.tagName !== 'BUTTON' &&
    (target as HTMLInputElement).type !== 'submit'
  ) {
    e.preventDefault();
  }
};
