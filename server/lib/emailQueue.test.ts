import { describe, expect, it } from 'vitest';
import { render } from './emailQueue';

describe('email template rendering', () => {
  it('escapes user-controlled HTML values', () => {
    expect(render('<p>{{name}}</p>', { name: '<script>alert(1)</script>' })).toBe('<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>');
  });

  it('supports nested payload values', () => {
    expect(render('Hello {{user.name}}', { user: { name: 'Amina' } })).toBe('Hello Amina');
  });
});
